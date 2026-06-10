import os
import pandas as pd
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# One vector store per session
STORES: dict = {}

PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are DocRAG, a professional document analysis assistant.

Answer using ONLY the context provided.

Rules:
- Include ALL relevant items.
- ALWAYS include URLs exactly as they appear.
- Do not summarize away names, dates, links, or figures.
- Do NOT use markdown.
- Use plain text only.
- If the answer is not in the context, say:
"I couldn't find that in the uploaded documents."

Context:
{context}

Question:
{question}

Answer:
"""
)

# GLOBAL PROMPT FOR CHAT HISTORY
PROMPT_WITH_HISTORY = PromptTemplate(
    input_variables=["context", "history", "question"],
    template="""
You are DocRAG, a professional document analysis assistant.

Answer using ONLY the context provided.

Rules:
- Include ALL relevant items.
- ALWAYS include URLs exactly as they appear.
- Do not summarize away names, dates, links, or figures.
- Do NOT use markdown.
- Use plain text only.
- Use conversation history to understand follow-up questions.
- If the answer is not in the context, say:
"I couldn't find that in the uploaded documents."

Previous conversation:
{history}

Context from document:
{context}

Question:
{question}

Answer:
"""
)


def _format_context(docs: list[Document]) -> tuple[str, list[str]]:
    sources = []
    blocks = []

    for d in docs:
        raw_source = d.metadata.get("source", "")
        name = Path(raw_source).name if raw_source else "Unknown source"

        sources.append(name)
        blocks.append(
            f"Source: {name}\n{d.page_content}"
        )

    unique_sources = sorted(set(sources))

    return "\n\n".join(blocks), unique_sources


def _tabular_to_text(df: pd.DataFrame) -> str:
    df = df.fillna("")

    rows = []

    for _, row in df.iterrows():
        rows.append(
            ", ".join(
                f"{col}: {row[col]}"
                for col in df.columns
            )
        )

    return "\n\n".join(rows)


def load_file(file_path: str) -> list[Document]:
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        return PyPDFLoader(file_path).load()

    elif ext == ".csv":
        df = pd.read_csv(file_path)
        text = _tabular_to_text(df)

        return [
            Document(
                page_content=text,
                metadata={"source": file_path}
            )
        ]

    elif ext in [".xlsx", ".xls"]:

        engine = "openpyxl" if ext == ".xlsx" else "xlrd"

        try:
            sheets = pd.read_excel(
                file_path,
                sheet_name=None,
                engine=engine
            )
        except Exception:
            sheets = pd.read_excel(
                file_path,
                sheet_name=None
            )

        docs = []

        for sheet_name, sheet_df in sheets.items():
            text = _tabular_to_text(sheet_df)

            docs.append(
                Document(
                    page_content=f"Sheet: {sheet_name}\n{text}",
                    metadata={
                        "source": file_path,
                        "sheet": sheet_name,
                    },
                )
            )

        return docs

    elif ext in [".docx", ".doc"]:
        return UnstructuredWordDocumentLoader(file_path).load()

    elif ext == ".txt":
        return TextLoader(file_path).load()

    raise ValueError(f"Unsupported file type: {ext}")


def build_store(session_id: str, file_paths: list[str]) -> str:
    all_docs = []
    skipped = []

    for fp in file_paths:
        try:
            all_docs.extend(load_file(fp))
        except Exception:
            skipped.append(Path(fp).name)

    if not all_docs:
        raise ValueError("No documents could be loaded.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
    )

    chunks = splitter.split_documents(all_docs)

    STORES[session_id] = Chroma.from_documents(
        chunks,
        embedding=EMBEDDINGS,
    )

    names = [Path(fp).name for fp in file_paths]

    msg = (
        f"Loaded {len(chunks)} chunks "
        f"from {len(names)} file(s)."
    )

    if skipped:
        msg += f" Skipped: {', '.join(skipped)}"

    return msg


def answer_question(
    session_id: str,
    question: str,
    history: list = None,
) -> tuple[str, list[str]]:

    if session_id not in STORES:
        raise ValueError(
            "No documents loaded for this session. "
            "Please upload files first."
        )

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        api_key=api_key,
    )

    retriever = STORES[session_id].as_retriever(
        search_kwargs={"k": 10}
    )

    docs = retriever.invoke(question)

    context, sources = _format_context(docs)

    history_text = ""

    if history:
        for msg in history[-6:]:
            role = (
                "User"
                if msg["role"] == "user"
                else "Assistant"
            )

            history_text += (
                f"{role}: "
                f"{msg['content']}\n"
            )

    chain = (
        PROMPT_WITH_HISTORY
        | llm
        | StrOutputParser()
    )

    answer = chain.invoke(
        {
            "context": context,
            "history": history_text,
            "question": question,
        }
    )

    return answer, sources
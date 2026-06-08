import os, pandas as pd
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

EMBEDDINGS = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# One vector store per session_id
STORES: dict = {}

# REPLACE the PROMPT block with this:
PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are DocRAG, a professional document analysis assistant.
Answer using ONLY the context provided. Be structured and accurate.

Rules:
- Include ALL relevant items (e.g. if there are 3 projects, list all 3).
- ALWAYS include URLs, links, and live demo links exactly as they appear in the context.
- Do not summarize away specific details like links, dates, or names.
- Do NOT use markdown — no **, no ##, no ---, no backticks.
- For lists of items (like projects, skills, experience), format each item like this:
    HEADING: <main title or name>
    - detail one
    - detail two
- Use plain text only. Use newlines to separate items.
- If the answer is not in the context, say: "I couldn't find that in the uploaded documents."

Context:
{context}

Question:
{question}

Answer:"""
)

def _format_context(docs: list[Document]) -> tuple[str, list[str]]:
    sources = []
    blocks = []
    for d in docs:
        raw_source = d.metadata.get("source", "")
        name = Path(raw_source).name if raw_source else "Unknown source"
        sources.append(name)
        blocks.append(f"Source: {name}\n{d.page_content}")
    unique_sources = sorted({s for s in sources if s})
    return "\n\n".join(blocks), unique_sources


def _tabular_to_text(df: pd.DataFrame) -> str:
    df = df.fillna("")
    return "\n\n".join([
        ", ".join([f"{col}: {row[col]}" for col in df.columns])
        for _, row in df.iterrows()
    ])


def load_file(file_path: str) -> list[Document]:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path).load()
    elif ext == ".csv":
        df = pd.read_csv(file_path)
        text = _tabular_to_text(df)
        return [Document(page_content=text, metadata={"source": file_path})]
    elif ext in [".xlsx", ".xls"]:
        engine = "openpyxl" if ext == ".xlsx" else "xlrd"
        try:
            sheets = pd.read_excel(file_path, sheet_name=None, engine=engine)
        except Exception:
            sheets = pd.read_excel(file_path, sheet_name=None)
        docs = []
        for name, sheet_df in sheets.items():
            text = _tabular_to_text(sheet_df)
            docs.append(Document(
                page_content=f"Sheet: {name}\n{text}",
                metadata={"source": file_path, "sheet": name}
            ))
        return docs
    elif ext in [".docx", ".doc"]:
        return UnstructuredWordDocumentLoader(file_path).load()
    elif ext == ".txt":
        return TextLoader(file_path).load()
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def build_store(session_id: str, file_paths: list[str]) -> str:
    all_docs = []
    skipped = []

    for fp in file_paths:
        try:
            all_docs.extend(load_file(fp))
        except Exception as e:
            skipped.append(Path(fp).name)

    if not all_docs:
        raise ValueError("No documents could be loaded.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    chunks = splitter.split_documents(all_docs)

    STORES[session_id] = Chroma.from_documents(chunks, embedding=EMBEDDINGS)

    names = [Path(fp).name for fp in file_paths]
    msg = f"Loaded {len(chunks)} chunks from {len(names)} file(s)."
    if skipped:
        msg += f" Skipped: {', '.join(skipped)}"
    return msg


def answer_question(session_id: str, question: str) -> tuple[str, list[str]]:
    if session_id not in STORES:
        raise ValueError("No documents loaded for this session. Please upload files first.")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Please configure it in your environment.")

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        api_key=api_key
    )
    chain = PROMPT | llm | StrOutputParser()

    retriever = STORES[session_id].as_retriever(search_kwargs={"k": 10})
    docs = retriever.invoke(question) if hasattr(retriever, "invoke") else retriever.get_relevant_documents(question)
    context, sources = _format_context(docs)

    answer = chain.invoke({"context": context, "question": question})
    return answer, sources

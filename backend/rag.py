import os
import uuid
import re
import pandas as pd
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

# Lazy-loaded — not imported at startup
EMBEDDINGS = None
STORES: dict = {}
STORE_FILES: dict = {}  # store_key -> { file_id: [chroma_ids] }


def _collection_name(store_key: str) -> str:
    """Create a Chroma collection name that is unique per analyzer session."""
    safe_key = re.sub(r"[^a-zA-Z0-9_-]+", "_", store_key).strip("_")
    return f"docrag_{safe_key}"[:63]

PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are DocRAG, a professional document analysis assistant.

Answer using ONLY the context provided.

Rules:
- Include ALL relevant items.
- ALWAYS include URLs exactly as they appear.
- Do not summarize away names, dates, links, or figures.
- Never invent images, figures, URLs, tables, or content not present in the context.
- Never output placeholder values such as "404 Not Found".
- Do NOT use markdown.
- Use plain text only.

If the answer is not present in the context, say exactly:
"I couldn't find that in the uploaded documents."

If the user asks about images, figures, diagrams, charts, screenshots, logos, or pictures and none are present in the context, say exactly:
"No images found in the uploaded document."

Context:
{context}

Question:
{question}

Answer:
"""
)

PROMPT_WITH_HISTORY = PromptTemplate(
    input_variables=["context", "history", "question"],
    template="""
You are DocRAG, a professional document analysis assistant.

Answer using ONLY the context provided.

Rules:
- Include ALL relevant items.
- ALWAYS include URLs exactly as they appear.
- Do not summarize away names, dates, links, or figures.
- Never invent images, figures, URLs, tables, or content not present in the context.
- Never output placeholder values such as "404 Not Found".
- Do NOT use markdown.
- Use plain text only.
- Use conversation history to understand follow-up questions.

If the answer is not present in the context, say exactly:
"I couldn't find that in the uploaded documents."

If the user asks about images, figures, diagrams, charts, screenshots, logos, or pictures and none are present in the context, say exactly:
"No images found in the uploaded document."

Previous conversation:
{history}

Context from document:
{context}

Question:
{question}

Answer:
"""
)


def get_embeddings():
    """Lazy-load embeddings only when first needed, not at import time."""
    global EMBEDDINGS
    if EMBEDDINGS is None:
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
        EMBEDDINGS = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return EMBEDDINGS


def _format_context(docs: list[Document]) -> tuple[str, list[str]]:
    sources = []
    blocks = []

    for d in docs:
        raw_source = d.metadata.get("source", "")
        name = Path(raw_source).name if raw_source else "Unknown source"
        sources.append(name)
        blocks.append(f"Source: {name}\n{d.page_content}")

    unique_sources = sorted(set(sources))
    return "\n\n".join(blocks), unique_sources


def _tabular_to_text(df: pd.DataFrame) -> str:
    df = df.fillna("")
    rows = []
    for _, row in df.iterrows():
        rows.append(", ".join(f"{col}: {row[col]}" for col in df.columns))
    return "\n\n".join(rows)


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
        for sheet_name, sheet_df in sheets.items():
            text = _tabular_to_text(sheet_df)
            docs.append(Document(
                page_content=f"Sheet: {sheet_name}\n{text}",
                metadata={"source": file_path, "sheet": sheet_name},
            ))
        return docs

    elif ext in [".docx", ".doc"]:
        return UnstructuredWordDocumentLoader(file_path).load()

    elif ext == ".txt":
        return TextLoader(file_path).load()

    raise ValueError(f"Unsupported file type: {ext}")


def build_store(session_id: str, file_paths: list[str], file_id: str = None) -> str:
    all_docs = []
    skipped = []

    for fp in file_paths:
        try:
            docs = load_file(fp)
            for d in docs:
                d.metadata["source"] = fp
                if file_id:
                    d.metadata["file_id"] = file_id
            all_docs.extend(docs)
        except Exception:
            skipped.append(Path(fp).name)

    if not all_docs:
        raise ValueError("No documents could be loaded.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
    )
    chunks = splitter.split_documents(all_docs)

    # get_embeddings() triggers lazy load here, not at startup
    if session_id not in STORES:
        STORES[session_id] = Chroma.from_documents(
            chunks,
            embedding=get_embeddings(),
            collection_name=_collection_name(session_id),
        )
        ids = STORES[session_id].get()["ids"]
    else:
        ids = [str(uuid.uuid4()) for _ in chunks]
        STORES[session_id].add_documents(chunks, ids=ids)

    if file_id:
        STORE_FILES.setdefault(session_id, {})[file_id] = ids

    names = [Path(fp).name for fp in file_paths]
    msg = f"Loaded {len(chunks)} chunks from {len(names)} file(s)."
    if skipped:
        msg += f" Skipped: {', '.join(skipped)}"
    return msg


def remove_file(session_id: str, file_id: str) -> bool:
    if session_id not in STORES or session_id not in STORE_FILES:
        return False
    ids = STORE_FILES[session_id].pop(file_id, None)
    if not ids:
        return False
    STORES[session_id].delete(ids=ids)
    if not STORE_FILES[session_id]:
        del STORES[session_id]
        del STORE_FILES[session_id]
    return True


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

    retriever = STORES[session_id].as_retriever(search_kwargs={"k": 10})
    docs = retriever.invoke(question)
    context, sources = _format_context(docs)
    image_keywords = [
        "image",
        "images",
        "picture",
        "pictures",
        "photo",
        "photos",
        "figure",
        "figures",
        "diagram",
        "diagrams",
        "chart",
        "charts",
        "logo",
        "logos",
    ]

    if any(word in question.lower() for word in image_keywords):
        if (
            "image" not in context.lower()
            and "figure" not in context.lower()
            and "diagram" not in context.lower()
            and "chart" not in context.lower()
            and "logo" not in context.lower()
        ):
            return "No images found in the uploaded document.", []

    history_text = ""
    if history:
        for msg in history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

    chain = PROMPT_WITH_HISTORY | llm | StrOutputParser()

    answer = chain.invoke({
        "context": context,
        "history": history_text,
        "question": question,
    })

    return answer, sources

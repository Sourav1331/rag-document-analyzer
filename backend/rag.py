import os, pandas as pd
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader,
    UnstructuredWordDocumentLoader, UnstructuredExcelLoader,
)
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

EMBEDDINGS = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# One vector store per session_id
STORES: dict = {}

PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are a helpful assistant analyzing uploaded documents.
Use the context below to answer the question accurately.

Context:
{context}

Question:
{question}

Answer clearly and accurately. If the answer isn't in the context, say:
"I couldn't find that in the uploaded documents."
"""
)


def load_file(file_path: str) -> list[Document]:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path).load()
    elif ext == ".csv":
        df = pd.read_csv(file_path)
        text = "\n\n".join([
            ", ".join([f"{col}: {row[col]}" for col in df.columns])
            for _, row in df.iterrows()
        ])
        return [Document(page_content=text, metadata={"source": file_path})]
    elif ext in [".xlsx", ".xls"]:
        return UnstructuredExcelLoader(file_path).load()
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

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(all_docs)

    STORES[session_id] = Chroma.from_documents(chunks, embedding=EMBEDDINGS)

    names = [Path(fp).name for fp in file_paths]
    msg = f"Loaded {len(chunks)} chunks from {len(names)} file(s)."
    if skipped:
        msg += f" Skipped: {', '.join(skipped)}"
    return msg


def answer_question(session_id: str, question: str) -> str:
    if session_id not in STORES:
        raise ValueError("No documents loaded for this session. Please upload files first.")

    llm = ChatGroq(
        model="llama3-70b-8192",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )
    chain = PROMPT | llm | StrOutputParser()

    retriever = STORES[session_id].as_retriever(search_kwargs={"k": 4})
    docs = retriever.get_relevant_documents(question)
    context = "\n\n".join([d.page_content for d in docs])

    return chain.invoke({"context": context, "question": question})
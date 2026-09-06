import gc
import logging
import re
from pathlib import Path
from typing import Any

import pandas as pd
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings
from services.errors import FileTooLargeError, ProcessingError
from services.models import Chunk, FileRecord, utc_now_iso
from services.vector_store_service import stable_point_id

logger = logging.getLogger(__name__)


ALLOWED_EXTENSIONS = {".pdf", ".csv", ".docx", ".doc", ".txt", ".xlsx", ".xls"}


def validate_filename(filename: str, allowed_exts: set[str] | None = None) -> str:
    if not filename:
        raise ProcessingError("Invalid filename.")
    safe_name = Path(filename).name
    ext = Path(safe_name).suffix.lower()
    allowed = allowed_exts or ALLOWED_EXTENSIONS
    if ext not in allowed:
        raise ProcessingError(
            f"Wrong file type: '{ext}'. This endpoint only accepts: {', '.join(sorted(allowed))}."
        )
    return safe_name


def validate_size(size: int) -> None:
    if size > settings.max_file_size_bytes:
        raise FileTooLargeError(f"File too large. Max size is {settings.max_file_size_mb}MB.")


def load_documents(file_path: str) -> list[Document]:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        docs = PyPDFLoader(file_path).load()
        for doc in docs:
            if "page" in doc.metadata:
                doc.metadata["page_number"] = int(doc.metadata["page"]) + 1
        return docs
    if ext == ".csv":
        df = pd.read_csv(file_path)
        return [_table_doc(df, file_path, source_type="csv")]
    if ext in {".xlsx", ".xls"}:
        try:
            sheets = pd.read_excel(file_path, sheet_name=None, engine="openpyxl" if ext == ".xlsx" else "xlrd")
        except Exception:
            sheets = pd.read_excel(file_path, sheet_name=None)
        return [
            _table_doc(df, file_path, source_type="excel", extra={"sheet": sheet_name})
            for sheet_name, df in sheets.items()
        ]
    if ext in {".docx", ".doc"}:
        return UnstructuredWordDocumentLoader(file_path).load()
    if ext == ".txt":
        return TextLoader(file_path, encoding="utf-8").load()
    raise ProcessingError(f"Unsupported file type: {ext}")


def _table_doc(
    df: pd.DataFrame,
    file_path: str,
    *,
    source_type: str,
    extra: dict[str, Any] | None = None,
) -> Document:
    df = df.fillna("")
    rows = []
    columns = [str(col) for col in df.columns]
    for row_index, (_, row) in enumerate(df.iterrows(), start=1):
        rows.append(
            f"Row {row_index}: "
            + ", ".join(f"{col}: {row[col]}" for col in df.columns)
        )
    prefix = f"Columns: {', '.join(columns)}"
    metadata = {"source": file_path, "source_type": source_type, "columns": columns}
    if extra:
        metadata.update(extra)
        if extra.get("sheet"):
            prefix = f"Sheet: {extra['sheet']}\n{prefix}"
    return Document(page_content=f"{prefix}\n\n" + "\n\n".join(rows), metadata=metadata)


def split_documents(docs: list[Document], record: FileRecord) -> list[Chunk]:
    text_length = sum(len(doc.page_content or "") for doc in docs)
    if text_length == 0 or not any(_has_readable_text(doc.page_content) for doc in docs):
        raise ProcessingError("No readable text found in this document.")
    if text_length > settings.max_text_characters:
        raise FileTooLargeError(
            f"Extracted text is too large. Max characters: {settings.max_text_characters}."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    raw_chunks = splitter.split_documents(docs)
    chunks: list[Chunk] = []
    for chunk in raw_chunks:
        text = (chunk.page_content or "").strip()
        if not _has_readable_text(text):
            continue
        chunk_index = len(chunks)
        chunk_id = stable_chunk_id(record.session_id, record.analyzer_type, record.id, chunk_index)
        metadata = {
            **chunk.metadata,
            "user_id": record.user_id,
            "session_id": record.session_id,
            "analyzer_type": record.analyzer_type,
            "file_id": record.id,
            "filename": record.original_filename,
            "chunk_id": chunk_id,
            "chunk_index": chunk_index,
            "point_id": stable_point_id(
                record.session_id, record.analyzer_type, record.id, chunk_index
            ),
            "source_type": Path(record.original_filename).suffix.lower().lstrip("."),
            "uploaded_at": record.created_at,
            "updated_at": utc_now_iso(),
        }
        chunks.append(Chunk(text=text, metadata=metadata))

    if not chunks:
        raise ProcessingError("No readable text found in this document.")
    if len(chunks) > settings.max_chunks_per_file:
        raise FileTooLargeError(
            f"Document produced {len(chunks)} chunks; max is {settings.max_chunks_per_file}."
        )
    return chunks


def stable_chunk_id(session_id: str, analyzer_type: str, file_id: str, chunk_index: int) -> str:
    return stable_point_id(session_id, analyzer_type, file_id, chunk_index)


def release_documents(*objects: object) -> None:
    for obj in objects:
        del obj
    gc.collect()


def _has_readable_text(text: str | None) -> bool:
    return bool(text and re.search(r"[A-Za-z0-9]", text))

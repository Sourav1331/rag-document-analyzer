import tempfile
from pathlib import Path
from types import SimpleNamespace

import pytest
from langchain_core.documents import Document

from services.document_service import split_documents, stable_chunk_id, validate_filename
from services.errors import FileTooLargeError, NotFoundError, NotReadyError, ProcessingError
from services.ingestion_service import IngestionService
from services.metadata_service import InMemoryMetadataService
from services.models import FileRecord
from services.rag_service import RagService
from services.storage_service import LocalStorageService
from services.vector_store_service import InMemoryVectorStoreService, stable_point_id, strict_filter


class FakeEmbeddings:
    def __init__(self):
        self.document_calls = 0
        self.query_calls = 0

    def embed_documents(self, texts):
        self.document_calls += 1
        return [[float(len(text)), 1.0, 0.0] for text in texts]

    def embed_query(self, text):
        self.query_calls += 1
        return [float(len(text)), 1.0, 0.0]


def record(**overrides):
    data = {
        "id": "file-1",
        "session_id": "session-1",
        "analyzer_type": "pdf",
        "original_filename": "sample.pdf",
        "mime_type": "application/pdf",
        "file_size": 10,
        "status": "uploaded",
    }
    data.update(overrides)
    return FileRecord(**data)


def test_validate_filename_blocks_path_traversal_and_wrong_type():
    assert validate_filename("../x.pdf", {".pdf"}) == "x.pdf"
    with pytest.raises(ProcessingError):
        validate_filename("x.exe", {".pdf"})


def test_deterministic_ids_are_stable():
    first = stable_point_id("s", "pdf", "f", 3)
    second = stable_point_id("s", "pdf", "f", 3)
    assert first == second
    assert stable_chunk_id("s", "pdf", "f", 3) == first


def test_split_documents_adds_isolation_metadata(monkeypatch):
    monkeypatch.setattr(
        "services.document_service.settings",
        SimpleNamespace(
            chunk_size=40,
            chunk_overlap=5,
            max_text_characters=1_500_000,
            max_chunks_per_file=1_000,
        ),
    )
    chunks = split_documents(
        [Document(page_content="Alpha beta gamma " * 10, metadata={"page_number": 2})],
        record(status="processing"),
    )
    assert chunks
    metadata = chunks[0].metadata
    assert metadata["session_id"] == "session-1"
    assert metadata["analyzer_type"] == "pdf"
    assert metadata["file_id"] == "file-1"
    assert metadata["page_number"] == 2
    assert metadata["point_id"]


def test_chunk_count_limit_rejects_without_truncating(monkeypatch):
    monkeypatch.setattr(
        "services.document_service.settings",
        SimpleNamespace(
            chunk_size=20,
            chunk_overlap=0,
            max_text_characters=1_500_000,
            max_chunks_per_file=1,
        ),
    )
    with pytest.raises(FileTooLargeError):
        split_documents([Document(page_content="Alpha beta gamma " * 20)], record())


def test_vector_store_filters_session_analyzer_and_file():
    store = InMemoryVectorStoreService()
    store.upsert_chunks(
        texts=["correct", "wrong file", "wrong session", "wrong analyzer"],
        vectors=[[1, 0], [1, 0], [1, 0], [1, 0]],
        metadatas=[
            {"point_id": "1", **strict_filter("s1", "pdf", "f1"), "chunk_id": "c1"},
            {"point_id": "2", **strict_filter("s1", "pdf", "f2"), "chunk_id": "c2"},
            {"point_id": "3", **strict_filter("s2", "pdf", "f1"), "chunk_id": "c3"},
            {"point_id": "4", **strict_filter("s1", "csv", "f1"), "chunk_id": "c4"},
        ],
    )
    results = store.search(query_vector=[1, 0], filters=strict_filter("s1", "pdf", "f1"), limit=10)
    assert [result.text for result in results] == ["correct"]


def test_delete_file_is_isolated_and_idempotent():
    store = InMemoryVectorStoreService()
    store.upsert_chunks(
        texts=["a", "b"],
        vectors=[[1], [1]],
        metadatas=[
            {"point_id": "1", **strict_filter("s", "pdf", "f1")},
            {"point_id": "2", **strict_filter("s", "pdf", "f2")},
        ],
    )
    store.delete_file(strict_filter("s", "pdf", "f1"))
    store.delete_file(strict_filter("s", "pdf", "f1"))
    assert [r.text for r in store.search(query_vector=[1], filters=strict_filter("s", "pdf", "f2"), limit=10)] == ["b"]


def test_ask_rejects_processing_and_does_not_embed_documents():
    metadata = InMemoryMetadataService()
    metadata.create_file(record(status="processing"))
    embeddings = FakeEmbeddings()
    rag = RagService(metadata=metadata, vector_store=InMemoryVectorStoreService(), embeddings=embeddings)
    with pytest.raises(NotReadyError):
        rag.retrieve(
            session_id="session-1",
            analyzer_type="pdf",
            file_id="file-1",
            question="What?",
        )
    assert embeddings.document_calls == 0


def test_ask_uses_only_query_embedding_for_ready_file():
    metadata = InMemoryMetadataService()
    metadata.create_file(record(status="ready", chunk_count=1))
    store = InMemoryVectorStoreService()
    store.upsert_chunks(
        texts=["answer context"],
        vectors=[[4.0, 1.0, 0.0]],
        metadatas=[{"point_id": "1", **strict_filter("session-1", "pdf", "file-1"), "chunk_id": "c"}],
    )
    embeddings = FakeEmbeddings()
    rag = RagService(metadata=metadata, vector_store=store, embeddings=embeddings)
    results = rag.retrieve(
        session_id="session-1",
        analyzer_type="pdf",
        file_id="file-1",
        question="What?",
    )
    assert results[0].text == "answer context"
    assert embeddings.query_calls == 1
    assert embeddings.document_calls == 0


def test_ingestion_updates_failed_status_and_removes_temp_download(monkeypatch, tmp_path):
    metadata = InMemoryMetadataService()
    storage = LocalStorageService(str(tmp_path / "storage"))
    storage.upload("file.txt", b"not used")
    metadata.create_file(record(id="file-2", original_filename="file.txt", storage_path="file.txt"))
    service = IngestionService(
        metadata=metadata,
        storage=storage,
        vector_store=InMemoryVectorStoreService(),
        embeddings=FakeEmbeddings(),
    )
    created_temp_paths = []
    original_mkstemp = tempfile.mkstemp

    def fake_mkstemp(*args, **kwargs):
        fd, path = original_mkstemp(*args, **kwargs)
        created_temp_paths.append(path)
        return fd, path

    monkeypatch.setattr(tempfile, "mkstemp", fake_mkstemp)
    monkeypatch.setattr("services.ingestion_service.load_documents", lambda _: (_ for _ in ()).throw(RuntimeError("parse error")))

    with pytest.raises(ProcessingError):
        service.ingest_file("file-2")

    assert metadata.get_file("file-2").status == "failed"
    assert created_temp_paths
    assert all(not Path(path).exists() for path in created_temp_paths)

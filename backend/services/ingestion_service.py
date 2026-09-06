import logging
import os
import tempfile
import time
from pathlib import Path

from services.document_service import load_documents, release_documents, split_documents
from services.embedding_service import EmbeddingService
from services.errors import AppError, ProcessingError
from services.metadata_service import MetadataService
from services.models import FileRecord
from services.storage_service import StorageService
from services.vector_store_service import VectorStoreService, strict_filter

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(
        self,
        *,
        metadata: MetadataService,
        storage: StorageService,
        vector_store: VectorStoreService,
        embeddings: EmbeddingService,
    ) -> None:
        self.metadata = metadata
        self.storage = storage
        self.vector_store = vector_store
        self.embeddings = embeddings

    def ingest_file(self, file_id: str, local_path: str | None = None) -> FileRecord:
        record = self.metadata.get_file(file_id)
        if record is None:
            raise ProcessingError("File metadata record not found.")

        temp_path = None
        started = time.perf_counter()
        self.metadata.update_file(file_id, status="processing", error_message=None)
        try:
            if local_path:
                work_path = local_path
            elif record.storage_path:
                suffix = Path(record.original_filename).suffix
                fd, temp_path = tempfile.mkstemp(suffix=suffix)
                os.close(fd)
                Path(temp_path).write_bytes(self.storage.download(record.storage_path))
                work_path = temp_path
            else:
                raise ProcessingError("No source file is available for ingestion.")

            load_started = time.perf_counter()
            docs = load_documents(work_path)
            logger.info("document_extraction_seconds=%.3f file_id=%s", time.perf_counter() - load_started, file_id)

            chunk_started = time.perf_counter()
            chunks = split_documents(docs, record)
            logger.info("chunking_seconds=%.3f file_id=%s chunks=%s", time.perf_counter() - chunk_started, file_id, len(chunks))

            # Idempotency: remove previous vectors for this exact file before deterministic upsert.
            self.vector_store.delete_file(
                strict_filter(record.session_id, record.analyzer_type, record.id, record.user_id)
            )

            embed_started = time.perf_counter()
            texts = [chunk.text for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks]
            vectors = self.embeddings.embed_documents(texts)
            logger.info("embedding_seconds=%.3f file_id=%s", time.perf_counter() - embed_started, file_id)

            upsert_started = time.perf_counter()
            self.vector_store.upsert_chunks(texts=texts, vectors=vectors, metadatas=metadatas)
            logger.info("vector_upsert_seconds=%.3f file_id=%s", time.perf_counter() - upsert_started, file_id)

            updated = self.metadata.update_file(
                file_id,
                status="ready",
                chunk_count=len(chunks),
                error_message=None,
            )
            release_documents(docs, chunks, texts, metadatas, vectors)
            logger.info("ingestion_total_seconds=%.3f file_id=%s", time.perf_counter() - started, file_id)
            return updated or record
        except AppError as exc:
            self.metadata.update_file(file_id, status="failed", error_message=exc.message)
            raise
        except Exception as exc:
            logger.exception("ingestion_failed file_id=%s", file_id)
            message = "Document processing failed."
            self.metadata.update_file(file_id, status="failed", error_message=message)
            raise ProcessingError(message) from exc
        finally:
            if temp_path:
                Path(temp_path).unlink(missing_ok=True)

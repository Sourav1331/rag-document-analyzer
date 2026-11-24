import json
import sqlite3
from contextlib import closing, contextmanager
from pathlib import Path

import numpy as np

from services.metadata_service import MetadataService
from services.models import FileRecord, SearchResult, utc_now_iso
from services.vector_store_service import VectorStoreService


class LocalDatabase:
    def __init__(self, path: Path):
        self.path = path
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS files (
                    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, analyzer_type TEXT NOT NULL,
                    original_filename TEXT NOT NULL, mime_type TEXT, file_size INTEGER NOT NULL,
                    user_id TEXT, storage_path TEXT, status TEXT NOT NULL, chunk_count INTEGER NOT NULL,
                    error_message TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    last_accessed_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS chunks (
                    point_id TEXT PRIMARY KEY, file_id TEXT NOT NULL REFERENCES files(id),
                    model TEXT NOT NULL, embedding BLOB NOT NULL, text TEXT NOT NULL, metadata TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS chunks_by_file ON chunks(file_id);
            """)

    @contextmanager
    def connect(self):
        with closing(sqlite3.connect(self.path, timeout=15)) as db:
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA foreign_keys=ON")
            with db:
                yield db


class SQLiteMetadataService(MetadataService):
    def __init__(self, database: LocalDatabase):
        self.database = database

    def create_file(self, record: FileRecord) -> FileRecord:
        values = record.to_dict()
        columns = ", ".join(FileRecord.__dataclass_fields__)
        params = ", ".join(":" + key for key in FileRecord.__dataclass_fields__)
        with self.database.connect() as db:
            db.execute(f"INSERT INTO files ({columns}) VALUES ({params})", values)
        return record

    def get_file(self, file_id: str) -> FileRecord | None:
        with self.database.connect() as db:
            row = db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
        return FileRecord.from_dict(dict(row)) if row else None

    def update_file(self, file_id: str, **values) -> FileRecord | None:
        if set(values) - (FileRecord.__dataclass_fields__.keys() - {"id"}):
            raise ValueError("Unknown or immutable file field.")
        values["updated_at"] = utc_now_iso()
        assignments = ", ".join(f"{field} = :{field}" for field in values)
        # A still-running ingestion job must not revive a removed document.
        guard = "" if values.get("status") in {"deleting", "deleted"} else " AND status NOT IN ('deleting', 'deleted')"
        with self.database.connect() as db:
            db.execute(f"UPDATE files SET {assignments} WHERE id = :id{guard}", {**values, "id": file_id})
            row = db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
        return FileRecord.from_dict(dict(row)) if row else None

    def ping(self) -> bool:
        with self.database.connect() as db:
            db.execute("SELECT id FROM files LIMIT 1")
        return True


def _unit_vector(vector: list[float]) -> np.ndarray:
    data = np.asarray(vector, dtype="<f4")
    norm = np.linalg.norm(data)
    return data / norm if norm else data


class SQLiteVectorStoreService(VectorStoreService):
    # The file record binds every chunk to its session, analyzer and optional owner.
    _file_scope = """SELECT id FROM files WHERE id = :file_id AND session_id = :session_id
                     AND analyzer_type = :analyzer_type AND (:user_id IS NULL OR user_id = :user_id)"""

    def __init__(self, database: LocalDatabase, model: str):
        self.database = database
        self.model = model

    def upsert_chunks(self, *, texts, vectors, metadatas) -> None:
        rows = (
            (meta["point_id"], meta["file_id"], self.model, _unit_vector(vector).tobytes(),
             text, json.dumps(meta), meta["file_id"])
            for text, vector, meta in zip(texts, vectors, metadatas, strict=True)
        )
        with self.database.connect() as db:
            db.executemany("""
                INSERT OR REPLACE INTO chunks (point_id, file_id, model, embedding, text, metadata)
                SELECT ?, ?, ?, ?, ?, ? FROM files WHERE id = ? AND status NOT IN ('deleting', 'deleted')
            """, rows)

    def search(self, *, query_vector, filters, limit, score_threshold=None) -> list[SearchResult]:
        query = _unit_vector(query_vector)
        with self.database.connect() as db:
            db.create_function("cosine", 1, lambda blob: float(query @ np.frombuffer(blob, dtype="<f4")))
            rows = db.execute(f"""
                SELECT text, metadata, cosine(embedding) AS score FROM chunks
                WHERE file_id IN ({self._file_scope}) AND model = :model
                ORDER BY score DESC, point_id LIMIT :limit
            """, {"user_id": None, **filters, "model": self.model, "limit": limit}).fetchall()
        return [
            SearchResult(row["text"], row["score"], json.loads(row["metadata"]))
            for row in rows if score_threshold is None or row["score"] >= score_threshold
        ]

    def delete_file(self, filters) -> None:
        with self.database.connect() as db:
            db.execute(f"DELETE FROM chunks WHERE file_id IN ({self._file_scope})", {"user_id": None, **filters})

    def ping(self) -> bool:
        with self.database.connect() as db:
            db.execute("SELECT point_id FROM chunks LIMIT 1")
        return True

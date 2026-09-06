from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class FileRecord:
    id: str
    session_id: str
    analyzer_type: str
    original_filename: str
    mime_type: str | None = None
    file_size: int = 0
    user_id: str | None = None
    storage_path: str | None = None
    status: str = "uploaded"
    chunk_count: int = 0
    error_message: str | None = None
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)
    last_accessed_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "FileRecord":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class Chunk:
    text: str
    metadata: dict[str, Any]


@dataclass
class SearchResult:
    text: str
    score: float
    metadata: dict[str, Any]

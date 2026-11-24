import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


def _int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return int(value)


def _float_env(name: str, default: float | None) -> float | None:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return float(value)


@dataclass(frozen=True)
class Settings:
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    embedding_model: str = os.getenv(
        "EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"
    )
    # Safe defaults for Render's 512 MB free instance. Increase these only
    # after moving to a larger instance with more memory.
    embedding_batch_size: int = _int_env("EMBEDDING_BATCH_SIZE", 8)
    vector_upsert_batch_size: int = _int_env("VECTOR_UPSERT_BATCH_SIZE", 64)
    retrieval_k: int = _int_env("RETRIEVAL_K", 4)
    retrieval_score_threshold: float | None = _float_env(
        "RETRIEVAL_SCORE_THRESHOLD", None
    )

    redis_url: str | None = os.getenv("REDIS_URL")
    ingestion_mode: str = os.getenv("INGESTION_MODE", "sync").lower()
    local_storage_dir: str = str(BACKEND_DIR / os.getenv("LOCAL_STORAGE_DIR", "uploads"))

    allowed_origins: list[str] = None  # type: ignore[assignment]
    max_file_size_mb: int = _int_env("MAX_FILE_SIZE_MB", 10)
    max_text_characters: int = _int_env("MAX_TEXT_CHARACTERS", 1_500_000)
    max_chunks_per_file: int = _int_env("MAX_CHUNKS_PER_FILE", 1_000)
    chunk_size: int = _int_env("CHUNK_SIZE", 800)
    chunk_overlap: int = _int_env("CHUNK_OVERLAP", 120)
    session_expiry_hours: int = _int_env("SESSION_EXPIRY_HOURS", 72)
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    def __post_init__(self) -> None:
        origins = [
            origin.strip()
            for origin in os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
            ).split(",")
            if origin.strip()
        ]
        object.__setattr__(self, "allowed_origins", origins)

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()

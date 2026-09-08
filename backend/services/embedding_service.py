from functools import lru_cache
import logging
import time

from config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load the model lazily using FastEmbed's low-memory ONNX runtime."""
    started = time.perf_counter()
    logger.info("embedding_model_load_started model=%s", settings.embedding_model)
    from fastembed import TextEmbedding

    model = TextEmbedding(model_name=settings.embedding_model)
    logger.info(
        "embedding_model_load_completed model=%s duration_seconds=%.3f",
        settings.embedding_model,
        time.perf_counter() - started,
    )
    return model


class EmbeddingService:
    def __init__(self, batch_size: int | None = None) -> None:
        self.batch_size = batch_size or settings.embedding_batch_size

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        logger.info(
            "embedding_documents_started texts=%s batch_size=%s",
            len(texts),
            self.batch_size,
        )
        model = get_embedding_model()

        vectors = []

        for start in range(0, len(texts), self.batch_size):
            batch = texts[start:start + self.batch_size]

            batch_started = time.perf_counter()
            logger.info(
                "embedding_model_batch_started batch_start=%s batch_size=%s",
                start,
                len(batch),
            )
            try:
                batch_vectors = model.embed(
                    batch,
                    batch_size=self.batch_size,
                )
                logger.info(
                    "embedding_model_batch_completed batch_start=%s batch_size=%s duration_seconds=%.3f",
                    start,
                    len(batch),
                    time.perf_counter() - batch_started,
                )
            except Exception:
                logger.exception(
                    "embedding_model_batch_failed batch_start=%s batch_size=%s duration_seconds=%.3f",
                    start,
                    len(batch),
                    time.perf_counter() - batch_started,
                )
                raise

            vectors.extend(
                vector.tolist()
                for vector in batch_vectors
            )

        logger.info("embedding_documents_completed texts=%s", len(texts))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

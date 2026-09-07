from functools import lru_cache

from config import settings


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load the model lazily using FastEmbed's low-memory ONNX runtime."""
    from fastembed import TextEmbedding

    return TextEmbedding(model_name=settings.embedding_model)


class EmbeddingService:
    def __init__(self, batch_size: int | None = None) -> None:
        self.batch_size = batch_size or settings.embedding_batch_size

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = get_embedding_model()
        vectors = model.embed(texts, batch_size=self.batch_size)
        return [vector.tolist() for vector in vectors]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

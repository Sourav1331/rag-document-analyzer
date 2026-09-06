import math
import uuid
from threading import RLock
from typing import Any, Iterable

from config import settings
from services.models import SearchResult


def stable_point_id(session_id: str, analyzer_type: str, file_id: str, chunk_index: int) -> str:
    key = f"{session_id}:{analyzer_type}:{file_id}:{chunk_index}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def strict_filter(
    session_id: str,
    analyzer_type: str,
    file_id: str,
    user_id: str | None = None,
) -> dict[str, Any]:
    payload = {
        "session_id": session_id,
        "analyzer_type": analyzer_type,
        "file_id": file_id,
    }
    if user_id:
        payload["user_id"] = user_id
    return payload


class VectorStoreService:
    def ensure_collection(self) -> None:
        raise NotImplementedError

    def upsert_chunks(
        self,
        *,
        texts: list[str],
        vectors: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        raise NotImplementedError

    def search(
        self,
        *,
        query_vector: list[float],
        filters: dict[str, Any],
        limit: int,
        score_threshold: float | None = None,
    ) -> list[SearchResult]:
        raise NotImplementedError

    def delete_file(self, filters: dict[str, Any]) -> None:
        raise NotImplementedError

    def ping(self) -> bool:
        raise NotImplementedError


class InMemoryVectorStoreService(VectorStoreService):
    def __init__(self) -> None:
        self._points: dict[str, tuple[list[float], str, dict[str, Any]]] = {}
        self._lock = RLock()

    def ensure_collection(self) -> None:
        return None

    def upsert_chunks(
        self,
        *,
        texts: list[str],
        vectors: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        with self._lock:
            for text, vector, metadata in zip(texts, vectors, metadatas):
                self._points[metadata["point_id"]] = (vector, text, metadata)

    def search(
        self,
        *,
        query_vector: list[float],
        filters: dict[str, Any],
        limit: int,
        score_threshold: float | None = None,
    ) -> list[SearchResult]:
        matches: list[SearchResult] = []
        with self._lock:
            for vector, text, metadata in self._points.values():
                if any(metadata.get(key) != value for key, value in filters.items()):
                    continue
                score = _cosine(query_vector, vector)
                if score_threshold is None or score >= score_threshold:
                    matches.append(SearchResult(text=text, score=score, metadata=metadata))
        return sorted(matches, key=lambda item: item.score, reverse=True)[:limit]

    def delete_file(self, filters: dict[str, Any]) -> None:
        with self._lock:
            ids = [
                point_id
                for point_id, (_, _, metadata) in self._points.items()
                if all(metadata.get(key) == value for key, value in filters.items())
            ]
            for point_id in ids:
                self._points.pop(point_id, None)

    def ping(self) -> bool:
        return True


def _cosine(left: Iterable[float], right: Iterable[float]) -> float:
    pairs = list(zip(left, right))
    dot = sum(a * b for a, b in pairs)
    left_norm = math.sqrt(sum(a * a for a, _ in pairs))
    right_norm = math.sqrt(sum(b * b for _, b in pairs))
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


class QdrantVectorStoreService(VectorStoreService):
    def __init__(self, url: str, api_key: str, collection_name: str) -> None:
        from qdrant_client import QdrantClient

        self.client = QdrantClient(url=url, api_key=api_key)
        self.collection_name = collection_name

    def ensure_collection(self) -> None:
        from qdrant_client.models import Distance, PayloadSchemaType, VectorParams

        collections = self.client.get_collections().collections
        if not any(item.name == self.collection_name for item in collections):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=settings.vector_size, distance=Distance.COSINE),
            )
        for field_name in ("session_id", "analyzer_type", "file_id", "user_id"):
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=PayloadSchemaType.KEYWORD,
                )
            except Exception as exc:
                message = str(exc).lower()
                if "already exists" not in message and "conflict" not in message:
                    raise

    def upsert_chunks(
        self,
        *,
        texts: list[str],
        vectors: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        from qdrant_client.models import PointStruct

        self.ensure_collection()
        for start in range(0, len(texts), settings.vector_upsert_batch_size):
            batch_texts = texts[start : start + settings.vector_upsert_batch_size]
            batch_vectors = vectors[start : start + settings.vector_upsert_batch_size]
            batch_metadata = metadatas[start : start + settings.vector_upsert_batch_size]
            points = [
                PointStruct(
                    id=metadata["point_id"],
                    vector=vector,
                    payload={**metadata, "text": text},
                )
                for text, vector, metadata in zip(batch_texts, batch_vectors, batch_metadata)
            ]
            self.client.upsert(collection_name=self.collection_name, points=points)

    def search(
        self,
        *,
        query_vector: list[float],
        filters: dict[str, Any],
        limit: int,
        score_threshold: float | None = None,
    ) -> list[SearchResult]:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        qfilter = Filter(
            must=[
                FieldCondition(key=key, match=MatchValue(value=value))
                for key, value in filters.items()
            ]
        )
        if hasattr(self.client, "search"):
            hits = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=qfilter,
                limit=limit,
                score_threshold=score_threshold,
            )
        else:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=qfilter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
            hits = response.points
        return [
            SearchResult(
                text=hit.payload.get("text", ""),
                score=hit.score,
                metadata={k: v for k, v in hit.payload.items() if k != "text"},
            )
            for hit in hits
        ]

    def delete_file(self, filters: dict[str, Any]) -> None:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        qfilter = Filter(
            must=[
                FieldCondition(key=key, match=MatchValue(value=value))
                for key, value in filters.items()
            ]
        )
        self.client.delete(collection_name=self.collection_name, points_selector=qfilter)

    def ping(self) -> bool:
        self.client.get_collection(self.collection_name)
        return True

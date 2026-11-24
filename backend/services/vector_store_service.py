import math
import uuid
from threading import RLock
from typing import Any, Iterable

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

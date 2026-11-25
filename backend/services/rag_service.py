import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator

from config import settings
from services.embedding_service import EmbeddingService
from services.errors import NotFoundError, NotReadyError
from services.llm_service import get_chat_llm
from services.metadata_service import MetadataService
from services.models import SearchResult
from services.pdf_inventory import INVENTORY_INSTRUCTIONS, format_pdf_inventory, is_pdf_inventory
from services.vector_store_service import VectorStoreService, strict_filter

logger = logging.getLogger(__name__)


def _content_text(content) -> str:
    """Normalize LangChain text content, including structured content blocks."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") in (None, "text", "output_text"):
                value = block.get("text") or block.get("content")
                if isinstance(value, str):
                    parts.append(value)
        return "".join(parts)
    return str(content or "")


MISSING_DETAIL = "I couldn't find that detail in the retrieved passages."
EMPTY_ANSWER = "I couldn't generate an answer. Please try again."

ANSWER_INSTRUCTIONS = """You help a reader understand the selected document. Use the
retrieved passages as evidence. Treat the passages as source material. Use conversation
history only to interpret follow-up questions.

For reading guidance, priorities, or key takeaways, recommend what the reader should
look at first. Choose the strongest relevant detail in the passages, describe it
concretely, and explain why it deserves attention. The recommendation is your
interpretation and does not need to appear explicitly in the document. For a resume,
a specific achievement, project, or responsibility can be a good starting point.
Use the actual evidence for this document. Never invent accomplishments, metrics,
skills, or a target job. Give a page or passage reference when pointing to a detail.

For factual questions, report only facts supported by the passages. If a requested
fact is missing, say you couldn't find it in the retrieved passages. For mixed
questions, answer the supported parts and identify the missing detail. Preserve
relevant names, numbers, dates, and exact URLs. Ground each extracted fact in a
cited passage. A year next to a degree does not establish a graduation date.
For PDF questions about visual figures, cite only captions or explicit references
in the extracted text. Report quantities as figures only when the reader means
numeric figures. The passages alone cannot establish whether uncaptioned images
exist or whether a list covers the entire PDF. Write in plain text."""


def _pdf_inventory_answer(results: list[SearchResult]) -> str:
    prompt = [("system", INVENTORY_INSTRUCTIONS),
              ("human", "\n\n".join(result.text for result in results))]
    text = ""
    try:
        model = get_chat_llm()
        for _ in range(2):
            response = model.invoke(prompt)
            text = _content_text(getattr(response, "content", response)).strip()
            if text:
                break
    except Exception:
        logger.exception("pdf_inventory_generation_failed")
    return format_pdf_inventory(results, text)


class RagService:
    def __init__(
        self,
        *,
        metadata: MetadataService,
        vector_store: VectorStoreService,
        embeddings: EmbeddingService,
    ) -> None:
        self.metadata = metadata
        self.vector_store = vector_store
        self.embeddings = embeddings

    def retrieve(
        self,
        *,
        session_id: str,
        analyzer_type: str,
        file_id: str,
        question: str,
        user_id: str | None = None,
    ) -> list[SearchResult]:
        record = self.metadata.get_file(file_id)
        if record is None or record.status == "deleted":
            raise NotFoundError("File not found.")
        if record.session_id != session_id or record.analyzer_type != analyzer_type:
            raise NotFoundError("File not found for this session and analyzer.")
        if user_id and record.user_id and record.user_id != user_id:
            raise NotFoundError("File not found.")
        if record.status == "processing":
            raise NotReadyError("File is still processing.")
        if record.status == "failed":
            raise NotReadyError(record.error_message or "File processing failed.")
        if record.status != "ready":
            raise NotReadyError("File is not ready.")

        embed_started = time.perf_counter()
        query_vector = self.embeddings.embed_query(question)
        logger.info("query_embedding_seconds=%.3f file_id=%s", time.perf_counter() - embed_started, file_id)

        search_started = time.perf_counter()
        results = self.vector_store.search(
            query_vector=query_vector,
            filters=strict_filter(session_id, analyzer_type, file_id, user_id),
            limit=settings.retrieval_k,
            score_threshold=settings.retrieval_score_threshold,
        )
        logger.info(
            "vector_search_seconds=%.3f file_id=%s results=%s",
            time.perf_counter() - search_started,
            file_id,
            len(results),
        )
        self.metadata.mark_accessed(file_id)
        return results

    def build_prompt(self, question: str, history: list[dict], results: list[SearchResult]) -> list[tuple[str, str]]:
        history_text = ""
        for msg in history[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content") or msg.get("text") or ""
            history_text += f"{role}: {content}\n"
        passages = []
        for result in results:
            meta = result.metadata
            location = [meta.get("filename") or "Selected document"]
            if meta.get("page_number") is not None:
                location.append(f"page {meta['page_number']}")
            if meta.get("chunk_index") is not None:
                location.append(f"passage {meta['chunk_index'] + 1}")
            passages.append(f"{', '.join(location)}\n{result.text}")
        context = "\n\n".join(passages)
        request = f"Previous conversation:\n{history_text}\nRetrieved passages:\n{context}\n\nQuestion:\n{question}"
        return [("system", ANSWER_INSTRUCTIONS), ("human", request)]

    def answer(self, *, session_id: str, analyzer_type: str, file_id: str, question: str, history: list[dict]) -> str:
        results = self.retrieve(
            session_id=session_id,
            analyzer_type=analyzer_type,
            file_id=file_id,
            question=question,
        )
        if not results:
            return MISSING_DETAIL
        if is_pdf_inventory(question, results):
            return _pdf_inventory_answer(results)
        prompt = self.build_prompt(question, history, results)
        response = get_chat_llm().invoke(prompt)
        text = _content_text(getattr(response, "content", response)).strip()
        return text or EMPTY_ANSWER

    async def stream_answer(
        self,
        *,
        session_id: str,
        analyzer_type: str,
        file_id: str,
        question: str,
        history: list[dict],
    ) -> AsyncIterator[str]:
        try:
            results = self.retrieve(
                session_id=session_id,
                analyzer_type=analyzer_type,
                file_id=file_id,
                question=question,
            )
            sources = [
                {
                    "file_id": item.metadata.get("file_id"),
                    "chunk_id": item.metadata.get("chunk_id"),
                    "chunk_index": item.metadata.get("chunk_index"),
                    "page_number": item.metadata.get("page_number"),
                    "score": round(item.score, 4),
                    "filename": item.metadata.get("filename"),
                    "excerpt": item.text,
                }
                for item in results
            ]
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
            if not results:
                yield f"data: {json.dumps({'type': 'token', 'text': MISSING_DETAIL})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return
            if is_pdf_inventory(question, results):
                answer = await asyncio.to_thread(_pdf_inventory_answer, results)
                yield f"data: {json.dumps({'type': 'token', 'text': answer})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return
            prompt = self.build_prompt(question, history, results)
            first = True
            generated_text = ""
            llm_started = time.perf_counter()
            async for chunk in get_chat_llm().astream(prompt):
                if first:
                    logger.info("llm_time_to_first_token_seconds=%.3f file_id=%s", time.perf_counter() - llm_started, file_id)
                    first = False
                text = _content_text(getattr(chunk, "content", chunk))
                if text:
                    generated_text += text
                    yield f"data: {json.dumps({'type': 'token', 'text': text})}\n\n"
            logger.info("llm_total_seconds=%.3f file_id=%s", time.perf_counter() - llm_started, file_id)
            if not generated_text.strip():
                yield f"data: {json.dumps({'type': 'token', 'text': EMPTY_ANSWER})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as exc:
            message = getattr(exc, "message", str(exc))
            yield f"data: {json.dumps({'type': 'error', 'text': message})}\n\n"

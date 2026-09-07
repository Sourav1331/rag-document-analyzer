import asyncio
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

os.environ["ONNXRUNTIME_DISABLE_DEVICE_DISCOVERY"] = "1"
load_dotenv()

from config import settings  # noqa: E402
from services.document_service import validate_filename, validate_size  # noqa: E402
from services.errors import AppError, FileTooLargeError, ProcessingError, to_http_error  # noqa: E402
from services.factory import build_services  # noqa: E402
from services.models import FileRecord  # noqa: E402
from services.vector_store_service import strict_filter  # noqa: E402

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

UPLOAD_EXTENSIONS = {
    "default": {".pdf", ".csv", ".docx", ".doc", ".txt", ".xlsx", ".xls"},
    "csv": {".csv"},
    "pdf": {".pdf"},
    "excel": {".xlsx", ".xls"},
    "text": {".txt"},
    "docx": {".docx", ".doc"},
}
_recovery_in_progress: set[str] = set()


async def initialize_vector_store(vector_store) -> None:
    """Initialize remote vector storage without blocking Uvicorn port binding."""
    try:
        await asyncio.to_thread(vector_store.ensure_collection)
        logger.info("Vector collection initialized successfully.")
    except Exception:
        # The service should still start so Render can health-check it. The
        # dependency state is exposed through /ready and retried on ingestion.
        logger.exception("Vector collection setup failed during background initialization.")


async def process_file_in_background(svc: dict, file_id: str) -> None:
    """Run ingestion after the upload response has been sent to the client."""
    try:
        # Read from storage instead of the request's temporary file. The
        # temporary upload file is cleaned up as soon as this handler returns.
        # Redis is intentionally not used here: a paused/missing worker would
        # leave the document permanently stuck in "processing". A separate
        # worker can still be introduced later, but the web deployment must
        # remain functional without Redis.
        await asyncio.to_thread(
            svc["jobs"].enqueue_or_run, file_id, None, "sync"
        )
    except Exception:
        # IngestionService normally records failures itself; this also covers
        # queue/setup failures so the task never becomes an unhandled error.
        logger.exception("background_ingestion_failed file_id=%s", file_id)


async def recover_stale_file(svc: dict, file_id: str) -> None:
    """Retry records left in processing by an old worker or paused queue."""
    try:
        await process_file_in_background(svc, file_id)
    finally:
        _recovery_in_progress.discard(file_id)


@asynccontextmanager
async def lifespan(app: FastAPI):
    services = build_services()
    app.state.services = services
    vector_init_task = asyncio.create_task(
        initialize_vector_store(services["vector_store"])
    )
    yield
    vector_init_task.cancel()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allowed_origins == ["*"] else settings.allowed_origins,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    started = time.perf_counter()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed request_id=%s route=%s", request_id, request.url.path)
        raise
    duration = time.perf_counter() - started
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{duration:.4f}"
    logger.info(
        "request request_id=%s route=%s status=%s duration_seconds=%.4f",
        request_id,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": {"code": exc.code, "message": exc.message}},
    )


def services(request: Request):
    return request.app.state.services


def _storage_path(session_id: str, namespace: str, file_id: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return f"{session_id}/{namespace}/{file_id}{ext}"


async def _read_upload_with_limit(upload: UploadFile) -> bytes:
    size = 0
    chunks: list[bytes] = []
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        validate_size(size)
        chunks.append(chunk)
    return b"".join(chunks)


async def _handle_upload(
    request: Request,
    files: list[UploadFile],
    session_id: Optional[str],
    allowed_exts: set[str],
    namespace: str,
):
    sid = session_id or str(uuid.uuid4())
    svc = services(request)
    saved_files = []
    started = time.perf_counter()

    for upload in files:
        safe_name = validate_filename(upload.filename or "", allowed_exts)
        file_id = str(uuid.uuid4())
        data = await _read_upload_with_limit(upload)
        validate_size(len(data))
        storage_path = _storage_path(sid, namespace, file_id, safe_name)
        record = FileRecord(
            id=file_id,
            session_id=sid,
            analyzer_type=namespace,
            original_filename=safe_name,
            mime_type=upload.content_type,
            file_size=len(data),
            storage_path=storage_path,
            status="uploaded",
        )
        svc["metadata"].create_file(record)
        try:
            svc["storage"].upload(storage_path, data, upload.content_type)
            svc["metadata"].update_file(file_id, status="processing")
            asyncio.create_task(process_file_in_background(svc, file_id))
            current = svc["metadata"].get_file(file_id) or record
            saved_files.append(
                {
                    "name": safe_name,
                    "filename": safe_name,
                    "file_id": file_id,
                    "id": file_id,
                    "status": current.status,
                    "chunk_count": current.chunk_count,
                    "error": current.error_message,
                    "message": f"{current.status}: {safe_name}",
                }
            )
        except FileTooLargeError:
            svc["metadata"].update_file(file_id, status="failed", error_message="File exceeds configured limits.")
            raise
        except AppError:
            raise
        except Exception as exc:
            logger.exception("upload_failed file_id=%s", file_id)
            svc["metadata"].update_file(file_id, status="failed", error_message="Upload failed.")
            raise ProcessingError("Upload failed.") from exc
        finally:
            data = b""

    logger.info("upload_total_seconds=%.3f files=%s", time.perf_counter() - started, len(saved_files))
    return {
        "session_id": sid,
        "namespace": namespace,
        "message": f"Accepted {len(saved_files)} file(s).",
        "files": saved_files,
    }


@app.post("/upload")
async def upload(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["default"], "default")


@app.post("/upload/csv")
async def upload_csv(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["csv"], "csv")


@app.post("/upload/pdf")
async def upload_pdf(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["pdf"], "pdf")


@app.post("/upload/excel")
async def upload_excel(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["excel"], "excel")


@app.post("/upload/txt")
async def upload_txt(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["text"], "text")


@app.post("/upload/docx")
async def upload_docx(request: Request, files: list[UploadFile] = File(...), session_id: Optional[str] = Form(default=None)):
    return await _handle_upload(request, files, session_id, UPLOAD_EXTENSIONS["docx"], "docx")


class QuestionRequest(BaseModel):
    session_id: str
    namespace: str = "default"
    file_id: str
    question: str
    history: list[dict] = Field(default_factory=list)


class RemoveFileRequest(BaseModel):
    session_id: str
    namespace: str = "default"
    file_id: str


@app.get("/files/{file_id}/status")
async def file_status(request: Request, file_id: str):
    svc = services(request)
    record = svc["metadata"].get_file(file_id)
    if not record:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "File not found."})
    if record.status == "processing" and file_id not in _recovery_in_progress:
        try:
            updated_at = datetime.fromisoformat(record.updated_at.replace("Z", "+00:00"))
            is_stale = datetime.now(timezone.utc) - updated_at > timedelta(minutes=2)
        except (AttributeError, TypeError, ValueError):
            is_stale = False
        if is_stale:
            _recovery_in_progress.add(file_id)
            asyncio.create_task(recover_stale_file(svc, file_id))
            logger.warning("stale_processing_file_requeued file_id=%s", file_id)

    return {
        "file_id": record.id,
        "status": record.status,
        "chunk_count": record.chunk_count,
        "error": record.error_message,
        "filename": record.original_filename,
    }


@app.post("/remove-file")
async def remove_file_endpoint(request: Request, body: RemoveFileRequest):
    svc = services(request)
    record = svc["metadata"].get_file(body.file_id)
    if record is None or record.status == "deleted":
        return {"message": "File already deleted.", "status": "deleted"}
    if record.session_id != body.session_id or record.analyzer_type != body.namespace:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "File not found."})

    started = time.perf_counter()
    await asyncio.to_thread(svc["metadata"].update_file, body.file_id, status="deleting")
    await asyncio.to_thread(
        svc["vector_store"].delete_file,
        strict_filter(record.session_id, record.analyzer_type, record.id, record.user_id)
    )
    if record.storage_path:
        try:
            await asyncio.to_thread(svc["storage"].delete, record.storage_path)
        except Exception:
            logger.exception("storage_delete_failed file_id=%s", body.file_id)
    await asyncio.to_thread(svc["metadata"].update_file, body.file_id, status="deleted")
    logger.info("deletion_seconds=%.3f file_id=%s", time.perf_counter() - started, body.file_id)
    return {"message": "File removed.", "status": "deleted"}


@app.post("/ask")
async def ask(request: Request, body: QuestionRequest):
    try:
        answer = services(request)["rag"].answer(
            session_id=body.session_id,
            analyzer_type=body.namespace,
            file_id=body.file_id,
            question=body.question,
            history=body.history,
        )
        return {"answer": answer}
    except AppError as exc:
        raise to_http_error(exc)


@app.post("/ask-stream")
async def ask_stream(request: Request, body: QuestionRequest):
    stream = services(request)["rag"].stream_answer(
        session_id=body.session_id,
        analyzer_type=body.namespace,
        file_id=body.file_id,
        question=body.question,
        history=body.history,
    )
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ready")
def readiness(request: Request):
    svc = services(request)
    checks = {}
    status_code = 200
    for name in ("metadata", "storage", "vector_store"):
        try:
            checks[name] = bool(svc[name].ping())
        except Exception:
            logger.exception("readiness_check_failed dependency=%s", name)
            checks[name] = False
            status_code = 503
    checks["groq_configured"] = bool(settings.groq_api_key)
    if not checks["groq_configured"]:
        status_code = 503
    return JSONResponse(status_code=status_code, content={"status": "ready" if status_code == 200 else "not_ready", "checks": checks})


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, workers=1)

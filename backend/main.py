import uuid, os, shutil, tempfile
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import GroqError
from rag import build_store, answer_question, STORES, _format_context, PROMPT_WITH_HISTORY
from fastapi.responses import StreamingResponse as FastAPIStreamingResponse
import json
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI()

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".docx", ".doc", ".txt", ".xlsx", ".xls"}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOWED_ORIGINS == ["*"] else ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_filename(filename: str, allowed_exts: set = None) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    safe_name = os.path.basename(filename)
    ext = Path(safe_name).suffix.lower()
    check_exts = allowed_exts or ALLOWED_EXTENSIONS
    if ext not in check_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Wrong file type: '{ext}'. This endpoint only accepts: {', '.join(sorted(check_exts))}."
        )
    return safe_name


def _copy_with_limit(src, dest: str) -> None:
    size = 0
    with open(dest, "wb") as out:
        while True:
            chunk = src.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Max size is {MAX_FILE_SIZE_MB}MB."
                )
            out.write(chunk)


async def _handle_upload(files, session_id, allowed_exts=None):
    sid = session_id or str(uuid.uuid4())
    tmp_dir = tempfile.mkdtemp()
    saved = []
    try:
        for f in files:
            safe_name = _safe_filename(f.filename, allowed_exts)
            dest = os.path.join(tmp_dir, f"{uuid.uuid4()}-{safe_name}")
            _copy_with_limit(f.file, dest)
            saved.append(dest)
        try:
            msg = build_store(sid, saved)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return {"session_id": sid, "message": msg, "files": [f.filename for f in files]}
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# --- Generic upload (all types) ---
@app.post("/upload")
async def upload(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id)


# --- Type-specific upload endpoints ---
@app.post("/upload/csv")
async def upload_csv(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id, allowed_exts={".csv"})


@app.post("/upload/pdf")
async def upload_pdf(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id, allowed_exts={".pdf"})


@app.post("/upload/excel")
async def upload_excel(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id, allowed_exts={".xlsx", ".xls"})


@app.post("/upload/txt")
async def upload_txt(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id, allowed_exts={".txt"})


@app.post("/upload/docx")
async def upload_docx(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    return await _handle_upload(files, session_id, allowed_exts={".docx", ".doc"})


class QuestionRequest(BaseModel):
    session_id: str
    question: str
    history: list[dict] = Field(default_factory=list)

@app.post("/ask")
async def ask(body: QuestionRequest):
    try:
        answer, sources = answer_question(body.session_id, body.question, body.history)
        return {"answer": answer, "sources": sources}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GroqError as e:
        status = getattr(e, "status_code", None)
        code = status if isinstance(status, int) and 400 <= status <= 599 else 502
        raise HTTPException(status_code=code, detail=str(e))

@app.post("/ask-stream")
async def ask_stream(body: QuestionRequest):
    if body.session_id not in STORES:
        raise HTTPException(
            status_code=400,
            detail="No documents loaded for this session."
        )

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not set."
        )

    async def generate():
        try:
            from langchain_groq import ChatGroq
            from langchain_core.output_parsers import StrOutputParser

            retriever = STORES[body.session_id].as_retriever(
                search_kwargs={"k": 10}
            )

            docs = retriever.invoke(body.question)

            context, sources = _format_context(docs)

            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                temperature=0,
                api_key=api_key,
                streaming=True,
            )

            chain = (
                PROMPT_WITH_HISTORY
                | llm
                | StrOutputParser()
            )

            # Send sources first
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

            # Build history string
            history_text = ""

            if body.history:
                for msg in body.history[-6:]:
                    role = (
                        "User"
                        if msg.get("role") == "user"
                        else "Assistant"
                    )

                    content = (
                        msg.get("content")
                        or msg.get("text")
                        or ""
                    )

                    history_text += f"{role}: {content}\n"

            # Stream answer
            async for chunk in chain.astream(
                {
                    "context": context,
                    "history": history_text,
                    "question": body.question,
                }
            ):
                yield (
                    f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"
                )

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield (
                f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"
            )

    return FastAPIStreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

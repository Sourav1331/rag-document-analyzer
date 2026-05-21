import uuid, os, shutil, tempfile
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import GroqError
from rag import build_store, answer_question

load_dotenv()

app = FastAPI()

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".docx", ".doc", ".txt", ".xlsx", ".xls"}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOWED_ORIGINS == ["*"] else ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_filename(filename: str) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    safe_name = os.path.basename(filename)
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
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


@app.post("/upload")
async def upload(
    files: list[UploadFile] = File(...),
    session_id: Optional[str] = Form(default=None)
):
    sid = session_id or str(uuid.uuid4())
    tmp_dir = tempfile.mkdtemp()
    saved = []

    try:
        for f in files:
            safe_name = _safe_filename(f.filename)
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


class QuestionRequest(BaseModel):
    session_id: str
    question: str


@app.post("/ask")
async def ask(body: QuestionRequest):
    try:
        answer = answer_question(body.session_id, body.question)
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GroqError as e:
        status = getattr(e, "status_code", None)
        code = status if isinstance(status, int) and 400 <= status <= 599 else 502
        raise HTTPException(status_code=code, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}

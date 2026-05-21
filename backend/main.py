import uuid, os, shutil, tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from rag import build_store, answer_question

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload(
    files: list[UploadFile] = File(...),
    session_id: str = Form(default=None)
):
    sid = session_id or str(uuid.uuid4())
    tmp_dir = tempfile.mkdtemp()
    saved = []

    try:
        for f in files:
            dest = os.path.join(tmp_dir, f.filename)
            with open(dest, "wb") as out:
                shutil.copyfileobj(f.file, out)
            saved.append(dest)

        msg = build_store(sid, saved)
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


@app.get("/health")
def health():
    return {"status": "ok"}
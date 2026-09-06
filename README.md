# DocRAG Studio

An AI-powered document analysis tool built with React, FastAPI, Qdrant, Supabase, LangChain, and Groq. Upload documents, wait for processing, then ask questions grounded in the active file. Each analyzer tab keeps isolated state, and retrieval is filtered by session, analyzer type, and file ID.

---

## Features

- 4 dedicated analyzers: PDF, CSV, Excel, and Text/DOCX
- Per-tab isolation so switching analyzers does not reuse another tab's chat state
- Per-file retrieval so the newest upload becomes active and questions are scoped to that file
- File removal with an `x` button that deletes the stored chunks as well
- File type validation in both frontend and backend
- RAG pipeline with persistent Qdrant vectors and Supabase file metadata
- Groq LLaMA inference for fast answers
- Structured responses with clean rendering for headings, bullets, and links
- Suggested questions per file type
- Source citations that show which file the answer came from
- Light and dark theme toggle with persisted preference
- Custom DocRAG favicon and browser tab branding

---

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router   |
| Backend   | FastAPI, Python 3.10+                        |
| RAG       | LangChain, Qdrant Cloud, Supabase, all-MiniLM-L6-v2 |
| LLM       | Groq API (LLaMA 3.1 8B Instant)              |
| Parsing   | PyPDF, Pandas, openpyxl, Unstructured        |

---

## Project Structure

```
rag-document-analyzer/
|-- frontend/
|   |-- src/
|   |   |-- App.jsx                   # Routing and theme state
|   |   |-- main.jsx                  # React entry point
|   |   |-- index.css                # Global styles + light/dark theme
|   |   |-- pages/
|   |   |   |-- LandingPage.jsx      # Landing page with CTA and theme toggle
|   |   |   `-- AnalyzePage.jsx      # Tab bar with isolated analyzers
|   |   |-- components/
|   |   |   |-- AnalyzerShell.jsx    # Shared sidebar + chat layout
|   |   |   |-- FileDropzone.jsx     # Drag-drop with type validation
|   |   |   |-- AllDocsAnalyzer.jsx  # All file types
|   |   |   |-- CsvAnalyzer.jsx      # CSV only
|   |   |   |-- PdfAnalyzer.jsx      # PDF only
|   |   |   |-- ExcelAnalyzer.jsx    # Excel only
|   |   |   |-- TxtAnalyzer.jsx      # TXT / DOCX only
|   |   |   |-- ChatWindow.jsx       # Message list
|   |   |   |-- MessageBubble.jsx    # Single message with formatting
|   |   |   |-- FileList.jsx         # Uploaded files list with remove buttons
|   |   |   `-- ThemeToggle.jsx      # Light/dark theme switch
|   |   `-- hooks/
|   |       `-- useDocAnalysis.js    # API calls, per-tab state, active file handling
|   |-- public/
|   |   `-- docrag-icon.svg
|   |-- index.html
|   |-- package.json
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- vite.config.js
|-- backend/
|   |-- main.py                      # FastAPI routes
|   |-- services/                    # Embeddings, metadata, storage, vectors, ingestion, RAG
|   |-- migrations/                  # Supabase SQL schema
|   |-- worker.py                    # RQ ingestion job target
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- uploads/                     # Runtime upload storage for Docker/local use
|   `-- .env.example
|-- docker-compose.yaml
`-- README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add Groq, Qdrant, and Supabase configuration
```

Start the backend:

```bash
uvicorn main:app --reload --workers 1
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Docker Deployment

The project includes Docker files for both services:

- `backend/Dockerfile` runs FastAPI with Uvicorn on port `8000`
- `frontend/Dockerfile` builds the Vite app and serves it with Nginx on port `80`
- `docker-compose.yaml` runs both containers together

Before starting Docker, make sure `backend/.env` exists and contains your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the full app:

```bash
docker compose up --build
```

After startup:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

Stop the containers:

```bash
docker compose down
```

Rebuild after code changes:

```bash
docker compose up --build
```

---


## Environment Variables

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=docrag_chunks_v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=documents
REDIS_URL=redis://localhost:6379/0
INGESTION_MODE=sync
MAX_FILE_SIZE_MB=10
MAX_TEXT_CHARACTERS=1500000
MAX_CHUNKS_PER_FILE=1000
CHUNK_SIZE=800
CHUNK_OVERLAP=120
RETRIEVAL_K=4
EMBEDDING_BATCH_SIZE=8
VECTOR_UPSERT_BATCH_SIZE=64
SESSION_EXPIRY_HOURS=72
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Get your free API key at [https://console.groq.com](https://console.groq.com)

For the frontend, `frontend/.env.local` can define the backend URL:

```env
VITE_API_URL=http://localhost:8000
```

When deploying the frontend separately, set `VITE_API_URL` to the public backend URL.

---

## API Endpoints

| Method | Endpoint        | Description                         |
|--------|-----------------|-------------------------------------|
| POST   | `/upload`       | Upload any supported file           |
| POST   | `/upload/pdf`   | Upload PDF only (validates type)    |
| POST   | `/upload/csv`   | Upload CSV only (validates type)    |
| POST   | `/upload/excel` | Upload Excel only (validates type)  |
| POST   | `/upload/txt`   | Upload TXT/DOCX only                |
| POST   | `/remove-file`  | Remove a file and its stored chunks  |
| POST   | `/ask`          | Ask a question about the active file |
| POST   | `/ask-stream`   | Stream an answer for the active file |
| GET    | `/health`       | Health check                        |
| GET    | `/ready`        | Checks metadata, storage, vector DB, and Groq config |
| GET    | `/files/{file_id}/status` | File processing status |

---

## Supported File Types

| Type  | Extensions            |
|-------|-----------------------|
| PDF   | `.pdf`                |
| CSV   | `.csv`                |
| Excel | `.xlsx`, `.xls`       |
| Text  | `.txt`, `.docx`, `.doc` |

---

## How It Works

1. Upload validates extension, size, and filename.
2. File metadata is stored in Supabase with status `uploaded` then `processing`.
3. The original file is stored in Supabase Storage or local storage for development.
4. Ingestion extracts text, rejects empty or oversized documents, chunks text, embeds in batches, and upserts vectors into one Qdrant collection.
5. Each vector carries `session_id`, `analyzer_type`, `file_id`, `filename`, `chunk_id`, `chunk_index`, source metadata, and upload timestamps.
6. The frontend polls `/files/{file_id}/status` and disables questions until the active file is `ready`.
7. `/ask-stream` embeds only the query, searches Qdrant with strict filters, builds a grounded prompt, and streams Groq tokens.
8. Delete removes only points matching the selected session/analyzer/file filters, then marks metadata deleted.

The legacy in-memory Chroma implementation has been removed from request handling. Existing local Chroma data cannot be reused safely because the embedding model changed from FastEmbed `BAAI/bge-small-en-v1.5` to `sentence-transformers/all-MiniLM-L6-v2`; re-upload documents to create Qdrant vectors.

## Supabase Setup

1. Create a Supabase project.
2. Run `backend/migrations/001_document_files.sql` in the SQL editor.
3. Create a private Storage bucket named by `SUPABASE_STORAGE_BUCKET`, default `documents`.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the backend and worker services. Never expose the service-role key to Vercel.

## Qdrant Setup

1. Create a Qdrant Cloud cluster and API key.
2. Set `QDRANT_URL`, `QDRANT_API_KEY`, and `QDRANT_COLLECTION_NAME`.
3. The backend creates the collection if missing with vector size `384` and cosine distance. Do not delete the collection on deploys.

## Render Deployment

FastAPI web service:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

Optional ingestion worker when `INGESTION_MODE=redis`:

```bash
rq worker ingestion --url $REDIS_URL
```

Use a Redis instance for the worker queue. Keep one Uvicorn worker initially to avoid loading multiple embedding-model copies.

## Vercel Deployment

Set only:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

Backend secrets stay on Render.

## Tests and Evaluation

Backend unit tests:

```bash
cd backend
PYTHONPATH=. pytest tests -q
```

Frontend build:

```bash
cd frontend
npm run build
```

RAG evaluation after uploading fixture documents:

```bash
cd backend
python evaluate_rag.py
```

Edit `backend/eval_cases.json` with real uploaded `file_id` and `session_id` values first. The script checks retrieval grounding keywords and source-file isolation; it does not guarantee final answer accuracy.

## Production Checklist

- `/ready` returns success with Supabase, Qdrant, storage, and Groq configured.
- Upload returns a server-generated `file_id` and status.
- File status changes to `ready` with nonzero `chunk_count`.
- Ask is blocked while the file is processing or failed.
- `/ask-stream` logs query embedding, vector search, time to first token, and total LLM time.
- Qdrant payload filters include at least `session_id`, `analyzer_type`, and `file_id`.
- Removing one file does not remove another file in the same session.
- Render web command uses one Uvicorn worker.
- Worker service is configured if `INGESTION_MODE=redis`.
- Vercel has only `VITE_API_URL`; no backend service keys.

---

## UI Notes

- The landing page and analyzer page both include a light/dark theme toggle.
- The browser tab uses a custom DocRAG favicon.
- New uploads appear at the top of the file list and become the active file immediately.
- Each file has a remove button that deletes its stored chunks and clears its context.

---

## Troubleshooting

**Blank page on `/analyze`**
- Check browser console (F12) for errors
- Make sure `react-router-dom` is installed: `npm install react-router-dom`

**"Is the backend running?" error**
- Make sure backend is started: `uvicorn main:app --reload`
- Check CORS - frontend must run on `localhost:5173`

**Wrong document is being used**
- Uploading a new file makes it the active source in that analyzer
- Delete the file with the `x` button to remove its stored context completely
- Restart the backend if you changed retrieval or storage code

**Only partial answers (missing projects/details)**
- Chunking is already tuned with `chunk_size=1500`, `chunk_overlap=200`, and `k=10`
- If still happening, try asking more specific questions

**GROQ_API_KEY error**
- Make sure `.env` file exists in the `backend/` folder
- Restart the backend after editing `.env`

**"No readable text found in this document"**
- The file may be empty, scanned, image-only, or not extractable by the current parser
- Try selecting and copying text from the PDF; if text cannot be selected, OCR is required
- This is expected for scanned PDFs unless OCR support is added

**Docker upload files are missing**
- Make sure `backend/uploads/` exists
- Make sure Docker Compose includes `./backend/uploads:/app/uploads`
- Do not store important uploaded files only inside the container filesystem

**Frontend cannot reach backend in deployment**
- Set `VITE_API_URL` to the deployed backend URL before building the frontend
- Make sure `ALLOWED_ORIGINS` in `backend/.env` includes the frontend origin

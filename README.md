# DocRAG Studio

An AI-powered document analysis tool built with React, FastAPI, LangChain, and Groq. Upload a document, ask questions in plain English, and get answers grounded in the active file. Each analyzer keeps its own session, and the newest uploaded file becomes the active source until you switch or delete it.

---

## Features

- 4 dedicated analyzers: PDF, CSV, Excel, and Text/DOCX
- Per-tab isolation so switching analyzers does not reuse another tab's chat state
- Per-file retrieval so the newest upload becomes active and questions are scoped to that file
- File removal with an `x` button that deletes the stored chunks as well
- File type validation in both frontend and backend
- RAG pipeline with LangChain, ChromaDB, and HuggingFace embeddings
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
| RAG       | LangChain, ChromaDB, FastEmbed Embeddings    |
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
|   |-- rag.py                       # RAG pipeline
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
# Open .env and add your GROQ_API_KEY
```

Start the backend:

```bash
uvicorn main:app --reload
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
MAX_FILE_SIZE_MB=20
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

1. Upload - file is saved temporarily, parsed, and split into chunks
2. Validate - empty chunks and unreadable text are rejected before embedding
3. Embed - chunks are embedded using FastEmbed model `BAAI/bge-small-en-v1.5`
4. Store - embeddings are stored in ChromaDB using a unique collection per analyzer session
5. Activate - the newest uploaded file becomes the active source for the current analyzer
6. Retrieve - top chunks are fetched only from the active file
7. Generate - Groq LLaMA answers using only the retrieved context
8. Respond - answer and source file names are returned to the frontend

ChromaDB is currently in-memory. There is no `chroma_db/` folder in this project, and uploaded document embeddings disappear when the backend process restarts.

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

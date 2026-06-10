# DocRAG Studio

An AI-powered document analysis tool built with React + FastAPI + LangChain + Groq. Upload any document and ask questions in plain English — every answer is grounded in your document.

---

## Features

- **4 dedicated analyzers** — PDF, CSV, Excel and Text/DOCX
- **File type validation** — each section rejects wrong file types instantly (frontend + backend)
- **RAG pipeline** — LangChain + ChromaDB + HuggingFace embeddings for accurate retrieval
- **Groq LLaMA** — fast LLM inference via Groq API
- **Structured responses** — headings, bullets, links all rendered cleanly
- **Suggested questions** — pre-built prompts per file type
- **Source citations** — every answer shows which file it came from
- **Landing page** — feature overview with CTAs

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router      |
| Backend   | FastAPI, Python 3.10+                           |
| RAG       | LangChain, ChromaDB, HuggingFace Embeddings     |
| LLM       | Groq API (LLaMA 3.1 8B Instant)                 |
| Parsing   | PyPDF, Pandas, openpyxl, Unstructured           |

---

## Project Structure

```
rag-document-analyzer/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Routing (/ and /analyze)
│   │   ├── main.jsx                  # React entry point
│   │   ├── index.css                 # Global styles + Tailwind
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Hero, feature cards, CTA
│   │   │   └── AnalyzePage.jsx       # Tab bar with all analyzers
│   │   ├── components/
│   │   │   ├── AnalyzerShell.jsx     # Shared sidebar + chat layout
│   │   │   ├── FileDropzone.jsx      # Drag-drop with type validation
│   │   │   ├── AllDocsAnalyzer.jsx   # All file types
│   │   │   ├── CsvAnalyzer.jsx       # CSV only
│   │   │   ├── PdfAnalyzer.jsx       # PDF only
│   │   │   ├── ExcelAnalyzer.jsx     # Excel only
│   │   │   ├── TxtAnalyzer.jsx       # TXT / DOCX only
│   │   │   ├── ChatWindow.jsx        # Message list
│   │   │   ├── MessageBubble.jsx     # Single message with formatting
│   │   │   └── FileList.jsx          # Uploaded files list
│   │   └── hooks/
│   │       └── useDocAnalysis.js     # API calls + session state
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── main.py                       # FastAPI routes
│   ├── rag.py                        # RAG pipeline
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

---

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

---

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

## Environment Variables

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get your free API key at [https://console.groq.com](https://console.groq.com)

---

## API Endpoints

| Method | Endpoint        | Description                        |
|--------|-----------------|------------------------------------|
| POST   | `/upload`       | Upload any supported file          |
| POST   | `/upload/pdf`   | Upload PDF only (validates type)   |
| POST   | `/upload/csv`   | Upload CSV only (validates type)   |
| POST   | `/upload/excel` | Upload Excel only (validates type) |
| POST   | `/upload/txt`   | Upload TXT/DOCX only               |
| POST   | `/ask`          | Ask a question about uploaded docs |
| GET    | `/health`       | Health check                       |

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

1. **Upload** — file is saved temporarily, parsed, and split into chunks
2. **Embed** — chunks are embedded using `sentence-transformers/all-MiniLM-L6-v2`
3. **Store** — embeddings stored in ChromaDB (in-memory, per session)
4. **Retrieve** — top 10 most relevant chunks are fetched for each question
5. **Generate** — Groq LLaMA answers using only the retrieved context
6. **Respond** — answer + source file names returned to frontend

---

## Troubleshooting

**Blank page on `/analyze`**
- Check browser console (F12) for errors
- Make sure `react-router-dom` is installed: `npm install react-router-dom`

**"Is the backend running?" error**
- Make sure backend is started: `uvicorn main:app --reload`
- Check CORS — frontend must run on `localhost:5173`

**Only partial answers (missing projects/details)**
- Already fixed: `chunk_size=1500`, `chunk_overlap=200`, `k=10`
- If still happening, try asking more specific questions

**GROQ_API_KEY error**
- Make sure `.env` file exists in the `backend/` folder
- Restart the backend after editing `.env`
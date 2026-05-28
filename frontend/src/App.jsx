import { useState, useRef, useEffect, useMemo } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import UploadZone from './components/UploadZone'
import FileList from './components/FileList'
import ChatWindow from './components/ChatWindow'

const API_BASE_URL = 'http://localhost:8000'

const SUGGESTIONS = [
  'Summarize the uploaded documents in 5 bullet points.',
  'What are the key insights and takeaways?',
  'List any risks, anomalies, or inconsistencies.',
  'Extract important dates, names, and figures.',
  'What should I pay attention to first?',
  'Provide a concise executive summary.',
]

const InfoCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{label}</p>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
  </div>
)

export default function App() {
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [question, setQuestion] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')
  const inputRef = useRef()

  const shortSession = useMemo(() => `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`, [sessionId])
  const totalMessages = messages.length

  useEffect(() => {
    let cancelled = false
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 })
        if (!cancelled) setBackendStatus('online')
      } catch {
        if (!cancelled) setBackendStatus('offline')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const handleUpload = async (files) => {
    setUploading(true)
    setStatusMsg('')
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    form.append('session_id', sessionId)
    try {
      const { data } = await axios.post(`${API_BASE_URL}/upload`, form)
      setUploadedFiles(prev => [...prev, ...data.files])
      setStatusMsg(data.message)
      setBackendStatus('online')
    } catch (e) {
      let detail = 'Upload failed. Please try again.'
      if (axios.isAxiosError(e)) {
        if (e.response) {
          detail = e.response?.data?.detail || e.message || detail
          setBackendStatus('online')
        } else {
          detail = 'Upload failed. Is the backend running?'
          setBackendStatus('offline')
        }
      }
      setStatusMsg(detail)
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (q) => {
    const text = (q || question).trim()
    if (!text || !uploadedFiles.length) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setQuestion('')
    setThinking(true)
    try {
      const { data } = await axios.post(`${API_BASE_URL}/ask`, { session_id: sessionId, question: text })
      setMessages(prev => [...prev, { role: 'bot', text: data.answer, sources: data.sources || [] }])
      setBackendStatus('online')
    } catch (e) {
      let detail = 'Something went wrong. Please try again.'
      if (axios.isAxiosError(e)) {
        if (e.response) {
          detail = e.response?.data?.detail || e.message || detail
          setBackendStatus('online')
        } else {
          setBackendStatus('offline')
        }
      }
      setMessages(prev => [...prev, { role: 'bot', text: detail, sources: [] }])
    } finally {
      setThinking(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const handleNewSession = () => {
    setSessionId(uuidv4())
    setUploadedFiles([])
    setMessages([])
    setQuestion('')
    setStatusMsg('New session created. Upload fresh documents to begin.')
  }

  return (
    <div className="h-screen overflow-hidden text-gray-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
            R
          </div>
          <div>
            <h1 className="text-base font-semibold text-white brand">DocRAG Studio</h1>
            <span className="text-xs text-slate-400">Document intelligence workspace</span>
          </div>
          <div className={`ml-auto flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border
            ${backendStatus === 'online'
              ? 'text-emerald-300/90 bg-emerald-500/10 border-emerald-500/20'
              : backendStatus === 'offline'
                ? 'text-rose-300/90 bg-rose-500/10 border-rose-500/20'
                : 'text-slate-300/90 bg-slate-500/10 border-slate-500/20'}`}>
            <span className={`w-2 h-2 rounded-full inline-block shadow-[0_0_8px_rgba(52,211,153,0.5)]
              ${backendStatus === 'online'
                ? 'bg-emerald-400'
                : backendStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-slate-400'}`} />
            {backendStatus === 'online' ? 'Backend online' : backendStatus === 'offline' ? 'Backend offline' : 'Checking backend'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden px-6 pb-6 gap-6">
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-slate-950/40 lg:h-full lg:overflow-y-auto">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Session</p>
            <div className="text-sm text-slate-200 font-semibold">{shortSession}</div>
            <p className="text-xs text-slate-500 mt-1">Use a new session to isolate document sets.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleClearChat}
                className="flex-1 text-xs border border-slate-700/70 text-slate-300 hover:text-white hover:border-slate-500/80 px-2.5 py-1.5 rounded-lg transition"
              >
                Clear chat
              </button>
              <button
                onClick={handleNewSession}
                className="flex-1 text-xs bg-slate-800/70 hover:bg-slate-700/80 text-white px-2.5 py-1.5 rounded-lg transition"
              >
                New session
              </button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">Upload documents</p>
            <UploadZone onUpload={handleUpload} loading={uploading} />
            {statusMsg && <p className="text-xs text-indigo-300 mt-2">{statusMsg}</p>}
            <FileList files={uploadedFiles} />
          </div>

          <div className="mt-auto">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Suggested questions</p>
            <div className="space-y-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleAsk(s)}
                  disabled={!uploadedFiles.length}
                  className="w-full text-left text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">Answering style</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Responses are grounded in uploaded documents. If something isn’t in the files,
              the assistant will say so and avoid guessing.
            </p>
          </div>
        </aside>

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950/60 border border-slate-800/70 rounded-2xl shadow-xl shadow-slate-950/40">
          <div className="border-b border-slate-800/70 p-5 bg-slate-950/70">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">Workspace overview</h2>
                <p className="text-xs text-slate-400">Keep conversations focused on the current document set.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Files uploaded" value={uploadedFiles.length} helper="Supported: PDF, CSV, DOCX, XLSX, TXT" />
              <InfoCard label="Messages" value={totalMessages} helper="Grounded answers only" />
            </div>
          </div>
          <ChatWindow messages={messages} thinking={thinking} />

          <div className="border-t border-slate-800/70 p-4 bg-slate-950/70">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                placeholder={uploadedFiles.length ? 'Ask a question about your documents...' : 'Upload a document to get started'}
                disabled={!uploadedFiles.length || thinking}
                rows={1}
                className="flex-1 resize-none bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 transition"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!question.trim() || !uploadedFiles.length || thinking}
                className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/25"
              >
                Ask
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">Press Enter to send | Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  )
}



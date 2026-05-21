import { useState, useRef } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import UploadZone from './components/UploadZone'
import FileList from './components/FileList'
import ChatWindow from './components/ChatWindow'

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key insights?',
  'List any anomalies or issues',
  'What is the most important data point?',
]

export default function App() {
  const [sessionId] = useState(() => uuidv4())
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [question, setQuestion] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const inputRef = useRef()

  const handleUpload = async (files) => {
    setUploading(true)
    setStatusMsg('')
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    form.append('session_id', sessionId)
    try {
      const { data } = await axios.post('/upload', form)
      setUploadedFiles(prev => [...prev, ...data.files])
      setStatusMsg(data.message)
    } catch (e) {
      setStatusMsg('Upload failed. Is the backend running?')
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
      const { data } = await axios.post('/ask', { session_id: sessionId, question: text })
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }])
    } catch (e) {
      let detail = 'Something went wrong. Please try again.'
      if (axios.isAxiosError(e)) {
        detail = e.response?.data?.detail || e.message || detail
      }
      setMessages(prev => [...prev, { role: 'bot', text: detail }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
            R
          </div>
          <div>
            <h1 className="text-base font-semibold text-white brand">DocRAG Studio</h1>
            <span className="text-xs text-slate-400">Document intelligence workspace</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            Live
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden px-6 pb-6 gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-slate-950/40">
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
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950/60 border border-slate-800/70 rounded-2xl shadow-xl shadow-slate-950/40">
          <ChatWindow messages={messages} thinking={thinking} />

          {/* Input */}
          <div className="border-t border-slate-800/70 p-4 bg-slate-950/70">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                placeholder={uploadedFiles.length ? 'Ask a question about your documents…' : 'Upload a document to get started'}
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
            <p className="text-center text-xs text-slate-500 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  )
}

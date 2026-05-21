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
      setMessages(prev => [...prev, { role: 'bot', text: 'Something went wrong. Please try again.' }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">R</div>
        <h1 className="text-base font-semibold text-white">DocRAG</h1>
        <span className="text-xs text-gray-500 ml-1">powered by Groq</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Live
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-gray-800 flex flex-col p-4 gap-4 bg-gray-900">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Upload documents</p>
            <UploadZone onUpload={handleUpload} loading={uploading} />
            {statusMsg && <p className="text-xs text-indigo-400 mt-2">{statusMsg}</p>}
            <FileList files={uploadedFiles} />
          </div>

          <div className="mt-auto">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Suggested questions</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleAsk(s)}
                  disabled={!uploadedFiles.length}
                  className="w-full text-left text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {s} ↗
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} thinking={thinking} />

          {/* Input */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                placeholder={uploadedFiles.length ? 'Ask a question about your documents…' : 'Upload a document to get started'}
                disabled={!uploadedFiles.length || thinking}
                rows={1}
                className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40 transition"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!question.trim() || !uploadedFiles.length || thinking}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition"
              >
                Ask
              </button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  )
}
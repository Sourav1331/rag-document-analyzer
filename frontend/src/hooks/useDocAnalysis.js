import { useState } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const API_BASE_URL = 'http://localhost:8000'

const UPLOAD_ENDPOINTS = {
  csv:   '/upload/csv',
  pdf:   '/upload/pdf',
  excel: '/upload/excel',
  txt:   '/upload/txt',
  all:   '/upload',
}

export function useDocAnalysis(type = 'all') {
  const [sessionId] = useState(() => uuidv4())
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')

  const endpoint = UPLOAD_ENDPOINTS[type] || '/upload'

  const handleUpload = async (files) => {
    setUploading(true)
    setStatusMsg('')
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    form.append('session_id', sessionId)
    try {
      const { data } = await axios.post(`${API_BASE_URL}${endpoint}`, form)
      setUploadedFiles(prev => [...prev, ...data.files])
      setStatusMsg(data.message)
      setBackendStatus('online')
    } catch (e) {
      let detail = 'Upload failed. Is the backend running?'
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 400) detail = e.response.data?.detail || 'Wrong file type.'
        else if (e.response?.status === 413) detail = 'File too large. Max 20MB.'
        else if (e.response?.status === 500) detail = 'Server error. Check your GROQ_API_KEY.'
        else if (!e.response) detail = 'Cannot reach backend. Is it running on port 8000?'
        setBackendStatus(e.response ? 'online' : 'offline')
      }
      setStatusMsg(detail)
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (question) => {
    const text = question.trim()
    if (!text || !uploadedFiles.length) return

    // Build history from current messages (last 6)
    const history = messages.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    setMessages(prev => [...prev, { role: 'user', text }])
    setThinking(true)

    // Add empty bot message to stream into
    const botMsgId = Date.now()
    setMessages(prev => [...prev, { role: 'bot', text: '', sources: [], id: botMsgId, streaming: true }])

    try {
      const response = await fetch(`${API_BASE_URL}/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: text, history }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let sources = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'sources') {
              sources = data.sources
            } else if (data.type === 'token') {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, text: m.text + data.text, sources } : m
              ))
            } else if (data.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, streaming: false, sources } : m
              ))
            } else if (data.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, text: data.text, streaming: false } : m
              ))
            }
          } catch (_) {}
        }
      }
      setBackendStatus('online')
    } catch (e) {
      const detail = e.message || 'Something went wrong.'
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, text: detail, streaming: false } : m
      ))
      setBackendStatus('offline')
    } finally {
      setThinking(false)
    }
  }

  const clearChat = () => setMessages([])

  return {
    sessionId, uploadedFiles, uploading, messages,
    thinking, statusMsg, backendStatus,
    handleUpload, handleAsk, clearChat,
  }
}
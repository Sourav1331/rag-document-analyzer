import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? 'https://rag-document-analyzer.onrender.com'
  : 'http://localhost:8000'
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

const UPLOAD_ENDPOINTS = {
  csv: '/upload/csv',
  pdf: '/upload/pdf',
  excel: '/upload/excel',
  txt: '/upload/txt',
  docx: '/upload/docx',
  all: '/upload',
}

const NAMESPACES = {
  csv: 'csv',
  pdf: 'pdf',
  excel: 'excel',
  txt: 'text',
  docx: 'docx',
  all: 'default',
}

const PROCESSING_STATUSES = ['uploaded', 'processing']

export function useDocAnalysis(type = 'all') {
  const [sessionId] = useState(() => uuidv4())
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')
  const abortRef = useRef(null)

  const endpoint = UPLOAD_ENDPOINTS[type] || '/upload'
  const namespace = NAMESPACES[type] || 'default'
  const activeFile = useMemo(
    () => uploadedFiles.find(file => file.id === activeFileId) || null,
    [uploadedFiles, activeFileId]
  )
  const activeFileReady = !!activeFile && activeFile.status === 'ready'

  useEffect(() => {
    const processing = uploadedFiles.filter(file => PROCESSING_STATUSES.includes(file.status))
    if (!processing.length) return

    const poll = async () => {
      await Promise.all(processing.map(async file => {
        try {
          const { data } = await axios.get(`${API_BASE_URL}/files/${file.id}/status`)
          setUploadedFiles(prev => prev.map(item =>
            item.id === file.id
              ? { ...item, status: data.status, chunk_count: data.chunk_count, error: data.error }
              : item
          ))
          setBackendStatus('online')
        } catch (_) {
          setBackendStatus('offline')
        }
      }))
    }

    poll()
    const timer = setInterval(poll, 2500)
    return () => clearInterval(timer)
  }, [uploadedFiles])

  useEffect(() => () => abortRef.current?.abort(), [])

  const errorText = (error, fallback) => {
    if (!axios.isAxiosError(error)) return error?.message || fallback
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail?.message) return detail.message
    return fallback
  }

  const handleUpload = async (files) => {
    if (uploading) return
    setUploading(true)
    setStatusMsg('')
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    form.append('session_id', sessionId)
    try {
      const { data } = await axios.post(`${API_BASE_URL}${endpoint}`, form, { timeout: 120000 })
      const newFiles = (data.files || []).map(file => ({
        id: file.file_id || file.id,
        name: file.name || file.filename || '',
        status: file.status || 'processing',
        chunk_count: file.chunk_count || 0,
        error: file.error || null,
      })).filter(file => file.id && file.name)

      setUploadedFiles(prev => [...newFiles, ...prev])
      setActiveFileId(newFiles[0]?.id || null)
      setMessages([])
      setStatusMsg(data.message || 'Upload accepted.')
      setBackendStatus('online')
    } catch (error) {
      let detail = errorText(error, 'Upload failed. Is the backend running?')
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) detail = errorText(error, 'File too large.')
        else if (!error.response) detail = `Cannot reach backend at ${API_BASE_URL}.`
        setBackendStatus(error.response ? 'online' : 'offline')
      }
      setStatusMsg(detail)
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (question) => {
    const text = question.trim()
    if (!text || !activeFileReady || thinking) return

    const history = messages.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    setMessages(prev => [...prev, { role: 'user', text }])
    setThinking(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const botMsgId = Date.now()
    setMessages(prev => [...prev, { role: 'bot', text: '', sources: [], id: botMsgId, streaming: true }])

    try {
      const response = await fetch(`${API_BASE_URL}/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, namespace, file_id: activeFileId, question: text, history }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json()
        const detail = typeof err.detail === 'string' ? err.detail : err.detail?.message
        throw new Error(detail || 'Request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let sources = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

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
    } catch (error) {
      const detail = error.name === 'AbortError' ? 'Request cancelled.' : error.message || 'Something went wrong.'
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, text: detail, streaming: false } : m
      ))
      setBackendStatus(error.name === 'AbortError' ? 'online' : 'offline')
    } finally {
      setThinking(false)
      abortRef.current = null
    }
  }

  const removeUploadedFile = async (fileId) => {
    if (!fileId) return

    if (!uploadedFiles.some(file => file.id === fileId)) return
    const nextFile = uploadedFiles.find(file => file.id !== fileId)
    const wasActive = activeFileId === fileId

    // Update the UI immediately; remote vector/storage cleanup can be slow.
    const remainingFiles = uploadedFiles.filter(file => file.id !== fileId)
    setUploadedFiles(remainingFiles)
    if (wasActive) setActiveFileId(nextFile?.id || null)
    setMessages([])
    setStatusMsg('Removing file…')

    try {
      await axios.post(`${API_BASE_URL}/remove-file`, {
        session_id: sessionId,
        namespace,
        file_id: fileId,
      })

      setStatusMsg('File removed.')
      setBackendStatus('online')
    } catch (_) {
      // Keep the local session cleared even if remote cleanup fails.
      setStatusMsg('File removed.')
    }
  }

  const clearChat = () => setMessages([])
  const selectFile = (fileId) => {
    setActiveFileId(fileId)
    setMessages([])
  }
  const cancelAsk = () => abortRef.current?.abort()

  return {
    sessionId,
    uploadedFiles,
    uploading,
    messages,
    thinking,
    statusMsg,
    backendStatus,
    activeFileId,
    activeFile,
    activeFileReady,
    handleUpload,
    handleAsk,
    removeUploadedFile,
    clearChat,
    selectFile,
    cancelAsk,
  }
}

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
      let detail = 'Upload failed. Please try again.'
      if (axios.isAxiosError(e)) {
        detail = e.response?.data?.detail || (e.response ? e.message : 'Upload failed. Is the backend running?')
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
    setMessages(prev => [...prev, { role: 'user', text }])
    setThinking(true)
    try {
      const { data } = await axios.post(`${API_BASE_URL}/ask`, { session_id: sessionId, question: text })
      setMessages(prev => [...prev, { role: 'bot', text: data.answer, sources: data.sources || [] }])
      setBackendStatus('online')
    } catch (e) {
      let detail = 'Something went wrong. Please try again.'
      if (axios.isAxiosError(e)) {
        detail = e.response?.data?.detail || e.message || detail
        setBackendStatus(e.response ? 'online' : 'offline')
      }
      setMessages(prev => [...prev, { role: 'bot', text: detail, sources: [] }])
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

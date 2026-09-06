import { useState } from 'react'
import FileDropzone from './FileDropzone'
import FileList from './FileList'
import ChatWindow from './ChatWindow'
import { useDocAnalysis } from '../hooks/useDocAnalysis'

const SUGGESTIONS = {
  csv: [
    'Summarize this dataset in 5 bullet points.',
    'What are the column names and their data types?',
    'Find any missing or anomalous values.',
    'What are the min, max, and average for numeric columns?'
  ],
  pdf: [
    'Summarize this PDF in 5 bullet points.',
    'What are the key findings or conclusions?',
    'List any dates, names, and figures mentioned.',
    'What should I pay attention to first?'
  ],
  excel: [
    'Summarize each sheet in this workbook.',
    'What are the column names across all sheets?',
    'Find totals or summary statistics.',
    'Are there any inconsistencies in the data?'
  ],
  txt: [
    'Summarize this document in 5 bullet points.',
    'What is the main topic or argument?',
    'Extract key facts, dates, and names.',
    'What are the most important takeaways?'
  ],
  all: [
    'Summarize all uploaded documents.',
    'What are the key insights and takeaways?',
    'List any risks, anomalies, or inconsistencies.',
    'Provide a concise executive summary.'
  ]
}

export default function AnalyzerShell({
  type,
  acceptedTypes,
  label,
  icon
}) {
  const [question, setQuestion] = useState('')

  const {
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
    cancelAsk
  } = useDocAnalysis(type)

  const suggestions = SUGGESTIONS[type] || SUGGESTIONS.all

  const exportChat = () => {
    if (!messages.length) return

    const content = messages
      .map(
        msg =>
          `[${msg.role === 'user' ? 'You' : 'AI'}]\n${msg.content || msg.text || ''}`
      )
      .join('\n\n--------------------------------\n\n')

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8'
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `chat-export-${Date.now()}.txt`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const onAsk = () => {
    if (!question.trim() || !activeFileReady) return

    handleAsk(question)
    setQuestion('')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5 shadow-xl shadow-slate-950/40 lg:h-full lg:overflow-y-auto">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">
            Upload {label}
          </p>

          <FileDropzone
            acceptedTypes={acceptedTypes}
            label={label}
            icon={icon}
            onFile={handleUpload}
            loading={uploading}
          />

          {statusMsg && (
            <p
              className={`text-xs mt-2 ${
                statusMsg.toLowerCase().includes('wrong') ||
                statusMsg.toLowerCase().includes('fail') ||
                statusMsg.toLowerCase().includes('error')
                  ? 'text-rose-400'
                  : 'text-indigo-300'
              }`}
            >
              {statusMsg}
            </p>
          )}

          <FileList
            files={uploadedFiles}
            activeFileId={activeFileId}
            onRemove={removeUploadedFile}
            onSelect={selectFile}
          />
        </div>

        <div className="mt-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
            Suggested questions
          </p>

          <div className="space-y-1.5">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => handleAsk(s)}
                disabled={!activeFileReady || thinking}
                className="w-full text-left text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearChat}
            className="flex-1 text-xs border border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-500/80 px-3 py-2 rounded-xl transition"
          >
            Clear Chat
          </button>

          <button
            onClick={exportChat}
            disabled={!messages.length}
            className="flex-1 text-xs border border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-500/80 px-3 py-2 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export Chat
          </button>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950/60 border border-slate-800/70 rounded-2xl shadow-xl shadow-slate-950/40">
        <div className="border-b border-slate-800/70 p-4 bg-slate-950/70 flex items-center gap-3">
          <span className="text-xl">{icon}</span>

          <div>
            <h3 className="text-sm font-semibold text-white">
              {label} Analyzer
            </h3>

            <p className="text-xs text-slate-400">
              {uploadedFiles.length} file
              {uploadedFiles.length !== 1 ? 's' : ''} loaded ·{' '}
              {messages.length} messages
            </p>
          </div>

          <div
            className={`ml-auto flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border
            ${
              backendStatus === 'online'
                ? 'text-emerald-300/90 bg-emerald-500/10 border-emerald-500/20'
                : backendStatus === 'offline'
                ? 'text-rose-300/90 bg-rose-500/10 border-rose-500/20'
                : 'text-slate-300/90 bg-slate-500/10 border-slate-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400'
                  : backendStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-slate-400'
              }`}
            />
            {backendStatus === 'online'
              ? 'Online'
              : backendStatus === 'offline'
              ? 'Offline'
              : 'Checking'}
          </div>
        </div>

        <ChatWindow
          messages={messages}
          thinking={thinking}
        />

        <div className="border-t border-slate-800/70 p-4 bg-slate-950/70">
          <div className="flex gap-3 items-end">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onAsk()
                }
              }}
              placeholder={
                activeFileReady
                  ? `Ask about your ${label.toLowerCase()}…`
                  : activeFile
                  ? `${activeFile.name} is ${activeFile.status}`
                  : `Upload a ${label.toLowerCase()} file to get started`
              }
              disabled={!activeFileReady || thinking}
              rows={1}
              className="flex-1 resize-none bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 transition"
            />

            <button
              onClick={onAsk}
              disabled={
                !question.trim() ||
                !activeFileReady ||
                thinking
              }
              className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/25"
            >
              {thinking ? 'Asking' : 'Ask'}
            </button>
            {thinking && (
              <button
                onClick={cancelAsk}
                className="px-3 py-3 border border-slate-700/70 text-slate-300 rounded-xl text-sm transition hover:text-white hover:border-slate-500/80"
              >
                Stop
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'

export default function MessageBubble({ role, text, streaming }) {
  const [copied, setCopied] = useState(false)
  const isUser = role === 'user'
  const isStreaming = !isUser && streaming

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderText = content =>
    content.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return <span key={index} className="block h-2" />

      if (trimmed.startsWith('HEADING:')) {
        const title = trimmed.replace('HEADING:', '').trim()
        return (
          <span key={index} className="block text-base font-bold text-white mt-4 mb-1">
            {title}
          </span>
        )
      }

      const clean = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '')
      const isBullet = /^[-*•]/.test(trimmed) || /^\d+\./.test(trimmed)

      return (
        <span key={index} className="block leading-relaxed">
          {isBullet ? (
            <span className="flex gap-2">
              <span className="text-indigo-300 shrink-0 mt-0.5">•</span>
              <span>{clean}</span>
            </span>
          ) : (
            <span>{clean}</span>
          )}
        </span>
      )
    })

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-xs font-bold mr-2 shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
          AI
        </div>
      )}

      <div
        className={`max-w-[88%] px-4 py-3 rounded-[1.4rem] text-sm leading-relaxed shadow-sm relative ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-br-sm shadow-indigo-500/20'
            : 'bg-white/5 border border-white/10 text-slate-100 rounded-bl-sm backdrop-blur'
        }`}
      >
        <div className="space-y-1">
          {isStreaming && !text ? (
            <span className="inline-flex items-center gap-2 text-slate-400">
              <span className="animate-pulse">Thinking...</span>
            </span>
          ) : (
            renderText(text)
          )}
          {isStreaming && text && (
            <span className="inline-block w-2 h-4 bg-indigo-300 animate-pulse ml-1 rounded-sm" />
          )}
        </div>

        {!isUser && !streaming && text && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/90 text-slate-400 hover:text-white"
            title="Copy response"
          >
            {copied ? (
              <span className="text-[10px] text-emerald-400 font-medium px-1">Copied!</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

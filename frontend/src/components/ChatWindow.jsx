import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ messages, thinking }) {
  const bottomRef = useRef()
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.length === 0 && !thinking && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/70 border border-slate-800/60 flex items-center justify-center text-2xl">
              🔍
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">Search across your documents</p>
              <p className="text-xs text-slate-500">Upload files, then ask anything with instant citations.</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} role={m.role} text={m.text} />)}
        {thinking && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold shrink-0">
              AI
            </div>
            <span className="animate-pulse">Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

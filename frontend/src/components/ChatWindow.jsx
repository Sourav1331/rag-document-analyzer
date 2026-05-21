import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ messages, thinking }) {
  const bottomRef = useRef()
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !thinking && (
        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-3 pt-16">
          <div className="text-5xl">🔍</div>
          <p className="text-sm">Upload a document on the left<br />then ask anything about it</p>
        </div>
      )}
      {messages.map((m, i) => <MessageBubble key={i} role={m.role} text={m.text} />)}
      {thinking && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">AI</div>
          <span className="animate-pulse">Thinking…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
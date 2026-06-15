import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ messages, thinking }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5">
      <div className="w-full space-y-4">
        {messages.length === 0 && !thinking ? (
          <div className="min-h-[48vh] sm:min-h-[54vh] flex items-stretch">
            <div className="w-full max-w-2xl glass-panel rounded-[2rem] px-5 sm:px-6 py-8 text-center flex flex-col justify-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
                🔍
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-white">Search across your documents</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Upload files from the sidebar, then ask anything. Answers stay grounded with citations from the source material.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble
              key={m.id ?? i}
              role={m.role}
              text={m.text}
              streaming={m.streaming}
            />
          ))
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

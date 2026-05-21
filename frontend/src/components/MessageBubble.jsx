export default function MessageBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold mr-2 shrink-0 mt-1">
          AI
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
        ${isUser
          ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-br-sm shadow-indigo-500/20'
          : 'bg-slate-900/70 border border-slate-800/70 text-slate-100 rounded-bl-sm'}`}>
        {text}
      </div>
    </div>
  )
}

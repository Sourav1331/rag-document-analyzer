export default function MessageBubble({ role, text, sources }) {
  const isUser = role === 'user'

const renderText = (content) => {
  return content.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <span key={i} className="block h-2" />

    // HEADING: lines → large bold
    if (trimmed.startsWith('HEADING:')) {
      const title = trimmed.replace('HEADING:', '').trim()
      return (
        <span key={i} className="block text-base font-bold text-white mt-4 mb-1">
          {title}
        </span>
      )
    }

    // Clean and render bullet lines
    const clean = trimmed
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+\.\s+/, '')

    const isBullet = /^[-*•]/.test(trimmed) || /^\d+\./.test(trimmed)

    return (
      <span key={i} className="block leading-relaxed">
        {isBullet
          ? <span className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">•</span><span>{clean}</span></span>
          : <span>{clean}</span>}
      </span>
    )
  })
}

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold mr-2 shrink-0 mt-1">
          AI
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
        ${isUser
          ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-br-sm shadow-indigo-500/20'
          : 'bg-slate-900/70 border border-slate-800/70 text-slate-100 rounded-bl-sm'}`}>
        <div className="space-y-1">{renderText(text)}</div>
        {!isUser && sources?.length > 0 && (
          <div className="mt-3 border-t border-slate-800/70 pt-2 text-xs text-slate-400">
            <div className="uppercase tracking-[0.2em] text-[10px] text-slate-500 mb-1">Sources</div>
            <div className="flex flex-wrap gap-2">
              {sources.map((src) => (
                <span key={src} className="px-2 py-1 rounded-full bg-slate-800/70 border border-slate-700/70 text-slate-300">
                  {src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
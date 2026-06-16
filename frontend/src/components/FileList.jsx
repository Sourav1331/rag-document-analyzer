const labels = {
  pdf: 'PDF',
  csv: 'CSV',
  xlsx: 'XLS',
  xls: 'XLS',
  docx: 'DOC',
  doc: 'DOC',
  txt: 'TXT',
}

export default function FileList({ files, activeFileId, onRemove }) {
  if (!files.length) return null

  return (
    <div className="mt-3 space-y-2">
      {files.map((file, index) => {
        const name = typeof file === 'string' ? file : file?.name || ''
        const ext = name.split('.').pop().toLowerCase()
        const fileId = typeof file === 'object' ? file?.id : null
        const isActive = activeFileId && fileId === activeFileId

        return (
          <div
            key={fileId || index}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/8 bg-white/5 text-sm hover:bg-white/8 hover:border-white/12 transition"
          >
            <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
              {labels[ext] || 'FILE'}
            </span>
            <span className="min-w-0 flex-1 truncate text-slate-200">{name}</span>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
              isActive
                ? 'text-sky-200 bg-sky-500/10 border-sky-500/20'
                : 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {isActive ? 'Active' : 'Ready'}
            </span>
            {onRemove && fileId && (
              <button
                type="button"
                onClick={() => onRemove(fileId)}
                className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500/15 transition opacity-80 group-hover:opacity-100"
                aria-label={`Remove ${name}`}
                title="Remove file"
              >
                x
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

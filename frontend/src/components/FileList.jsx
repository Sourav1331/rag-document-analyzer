const icons = {
  pdf: '📄',
  csv: '📊',
  xlsx: '📊',
  xls: '📊',
  docx: '📝',
  doc: '📝',
  txt: '📃',
}

export default function FileList({ files, onRemove }) {
  if (!files.length) return null

  return (
    <div className="mt-3 space-y-2">
      {files.map((file, index) => {
        const name = typeof file === 'string' ? file : file?.name || ''
        const ext = name.split('.').pop().toLowerCase()
        const fileId = typeof file === 'object' ? file?.id : null

        return (
          <div
            key={fileId || index}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/8 bg-white/5 text-sm hover:bg-white/8 hover:border-white/12 transition"
          >
            <span className="text-base">{icons[ext] || '📎'}</span>
            <span className="truncate text-slate-200">{name}</span>
            <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-200 bg-emerald-500/10 border border-emerald-500/20">
              Ready
            </span>
            {onRemove && fileId && (
              <button
                type="button"
                onClick={() => onRemove(fileId)}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500/15 transition opacity-80 group-hover:opacity-100"
                aria-label={`Remove ${name}`}
                title="Remove file"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

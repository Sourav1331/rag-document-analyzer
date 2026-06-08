const icons = { pdf: '📄', csv: '📊', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', txt: '📃' }

export default function FileList({ files }) {
  if (!files.length) return null
  return (
    <div className="mt-4 space-y-2">
      {files.map((name, i) => {
        const ext = name.split('.').pop().toLowerCase()
        return (
          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-900/70 border border-slate-800/70 rounded-xl text-sm">
            <span>{icons[ext] || '📎'}</span>
            <span className="truncate text-slate-200">{name}</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-200 bg-emerald-500/10 border border-emerald-500/20">
              Ready
            </span>
          </div>
        )
      })}
    </div>
  )
}

const icons = { pdf: '📄', csv: '📊', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', txt: '📃' }

export default function FileList({ files }) {
  if (!files.length) return null
  return (
    <div className="mt-4 space-y-2">
      {files.map((name, i) => {
        const ext = name.split('.').pop().toLowerCase()
        return (
          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm">
            <span>{icons[ext] || '📎'}</span>
            <span className="truncate text-gray-300">{name}</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shrink-0" title="Ready" />
          </div>
        )
      })}
    </div>
  )
}
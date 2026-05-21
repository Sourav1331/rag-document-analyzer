import { useRef, useState } from 'react'

export default function UploadZone({ onUpload, loading }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handle = (fileList) => {
    if (fileList?.length) onUpload(Array.from(fileList))
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
      className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
        ${dragging
          ? 'border-indigo-400/80 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
          : 'border-slate-700/70 bg-slate-900/40 hover:border-slate-500/80 hover:bg-slate-900/60'}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.docx,.doc,.txt,.xlsx,.xls"
        className="hidden"
        onChange={e => handle(e.target.files)}
      />
      <div className="text-3xl mb-2">☁️</div>
      {loading
        ? <p className="text-sm text-indigo-300 animate-pulse">Processing files…</p>
        : <>
            <p className="text-sm text-slate-200 font-medium">Drop files or click to upload</p>
            <p className="text-xs text-slate-500 mt-1">PDF · CSV · DOCX · XLSX · TXT</p>
          </>
      }
    </div>
  )
}

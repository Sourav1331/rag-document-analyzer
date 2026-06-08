import { useRef, useState } from 'react'

export default function FileDropzone({ acceptedTypes, label, icon, onFile, loading }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)

  const validate = (fileList) => {
    const files = Array.from(fileList)
    const invalid = files.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return !acceptedTypes.includes(ext)
    })
    if (invalid.length) {
      setError(`Invalid file type. Please upload only ${acceptedTypes.join(', ')} files.`)
      return
    }
    setError(null)
    onFile(files)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); validate(e.dataTransfer.files) }}
        className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-indigo-400/80 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
            : error
              ? 'border-rose-500/60 bg-rose-500/5'
              : 'border-slate-700/70 bg-slate-900/40 hover:border-slate-500/80 hover:bg-slate-900/60'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={e => validate(e.target.files)}
        />
        <div className="text-3xl mb-2">{icon}</div>
        {loading
          ? <p className="text-sm text-indigo-300 animate-pulse">Processing files…</p>
          : <>
              <p className="text-sm text-slate-200 font-medium">Drop {label} file or click to upload</p>
              <p className="text-xs text-slate-500 mt-1">{acceptedTypes.join(' · ').toUpperCase()}</p>
            </>
        }
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  )
}

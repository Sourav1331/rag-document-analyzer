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
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
        ${dragging ? 'border-indigo-400 bg-indigo-950/30' : 'border-gray-700 hover:border-gray-500'}`}
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
        ? <p className="text-sm text-indigo-400 animate-pulse">Processing files…</p>
        : <>
            <p className="text-sm text-gray-300 font-medium">Drop files or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">PDF · CSV · DOCX · XLSX · TXT</p>
          </>
      }
    </div>
  )
}
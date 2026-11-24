import { useRef, useState } from 'react'
import { Icon } from './Icon'

export default function FileDropzone({ acceptedTypes, label, onFile, loading }) {
  const input = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  function accept(list) {
    const files = Array.from(list)
    if (loading || !files.length) return
    if (files.some(f => !acceptedTypes.includes('.' + f.name.split('.').pop().toLowerCase()))) {
      setError('Choose a file ending in ' + acceptedTypes.join(', ') + '.')
      return
    }
    setError('')
    onFile(files)
  }
  return <div><input ref={input} type="file" multiple hidden aria-label={'Upload ' + label + ' files'} accept={acceptedTypes.join(',')}
    onChange={e => { accept(e.target.files); e.target.value = '' }} />
    <button className={'dropzone' + (dragging ? ' dragging' : '')} type="button" disabled={loading} onClick={() => input.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}>
      <span className="upload-icon"><Icon name="upload" size={24} /></span><strong>{loading ? 'Uploading…' : 'Drop your files here'}</strong>
      <span>{loading ? 'Saving your source files' : 'or browse files'}</span><small>{acceptedTypes.join(' · ')}</small>
    </button>
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>
}

import { Icon } from './Icon'

export default function FileList({ files, activeFileId, onRemove, onSelect }) {
  if (!files.length) return null
  return <ul className="file-list">{files.map(file => {
    const active = file.id === activeFileId
    return <li key={file.id} className={active ? 'active-file' : ''}>
      <div><button className="file-select" onClick={() => onSelect(file.id)} aria-pressed={active}><Icon name="sheet" size={19} />
        <span><strong title={file.name}>{file.name}</strong><small>{active && file.status === 'ready' ? 'Active' : file.status || 'Processing'}</small></span></button>
        <button className="icon-button" onClick={() => onRemove(file.id)} aria-label={'Remove ' + file.name} title={'Remove ' + file.name}><Icon name="close" size={15} /></button></div>
      {file.error && <p className="field-error">{file.error}</p>}
    </li>
  })}</ul>
}

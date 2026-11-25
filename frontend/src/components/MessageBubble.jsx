import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Icon } from './Icon'
import { groupSourceFiles, passageLocation } from './sourceReferences'

const markdownPlugins = [remarkGfm]
const markdownComponents = {
  table({ children }) {
    return <div className="answer-table" role="region" aria-label="Answer table" tabIndex={0}>
      <table>{children}</table>
    </div>
  },
}

export default function MessageBubble({ role, text, streaming, sources = [] }) {
  const [copyStatus, setCopyStatus] = useState('')
  const user = role === 'user'
  const files = groupSourceFiles(sources)
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopyStatus('Copied') }
    catch { setCopyStatus('Copy unavailable') }
    setTimeout(() => setCopyStatus(''), 1800)
  }
  return <article className={'message ' + (user ? 'user-message' : 'assistant-message')}>
    <div className="message-author">{!user && <Icon name="layers" size={17} />}{user ? 'You' : 'DocRAG Studio'}</div>
    <div className="message-text">{streaming && !text ? <span role="status">Finding an answer…</span> : user ? text :
      <ReactMarkdown remarkPlugins={markdownPlugins} components={markdownComponents}>
        {text.replace(/^HEADING:\s*(.+)$/gm, '### $1')}
      </ReactMarkdown>}</div>
    {!user && !streaming && <div className="message-foot">{files.length > 0 && <details className="citations">
      <summary><Icon name="book" size={15} /><span>{files.length} source {files.length === 1 ? 'file' : 'files'} · {sources.length} {sources.length === 1 ? 'passage' : 'passages'}</span></summary>
      {files.map(file => <section key={file.id} className="citation-file">
        <strong>{file.name}</strong>
        <ul>{file.passages.map((passage, index) => <li key={passage.chunk_id ?? index}>
          <span>{passageLocation(passage)}</span>
          {passage.excerpt && <blockquote>{passage.excerpt}</blockquote>}
        </li>)}</ul>
      </section>)}
    </details>}
      {text && <button className="copy" onClick={copy}><Icon name="copy" size={14} />{copyStatus || 'Copy'}</button>}</div>}
  </article>
}

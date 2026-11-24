import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { Icon } from './Icon'

export default function ChatWindow({ messages, activeFile, ready }) {
  const pane = useRef(null)
  const follow = useRef(true)
  useEffect(() => {
    if (!messages.length) follow.current = true
    if (follow.current && pane.current) pane.current.scrollTop = pane.current.scrollHeight
  }, [messages])
  const title = ready ? 'What would you like to know?' : activeFile?.status === 'failed' ? 'This file needs attention' : activeFile ? 'Indexing your document' : 'Start with a source.'
  const detail = ready ? 'Ask a question below or choose a suggestion from your sources.' : activeFile?.status === 'failed' ? (activeFile.error || 'Try another file to start a conversation.') : activeFile ? 'You can ask a question once your file is ready.' : 'Upload a document to ask questions and see the passages behind each answer.'
  return <div className="chat-scroll" ref={pane} onScroll={e => { const p = e.currentTarget; follow.current = p.scrollHeight - p.scrollTop - p.clientHeight < 80 }}>
    {!messages.length ? <div className="chat-empty"><div className="empty-art"><span><Icon name="layers" size={37} /></span></div><h3>{title}</h3><p>{detail}</p></div>
      : <div className="messages">{messages.map((m,i) => <MessageBubble key={m.id ?? i} {...m} />)}</div>}
  </div>
}

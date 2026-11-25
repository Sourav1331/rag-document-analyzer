import { useState } from 'react'
import FileDropzone from './FileDropzone'
import FileList from './FileList'
import ChatWindow from './ChatWindow'
import { Icon } from './Icon'
import { groupSourceFiles, passageLocation } from './sourceReferences'
import { useDocAnalysis } from '../hooks/useDocAnalysis'

const SUGGESTIONS = {
  csv: [
    'Summarize this dataset in 5 bullet points.',
    'What are the column names and their data types?',
    'Find any missing or anomalous values.',
    'What are the min, max, and average for numeric columns?'
  ],
  pdf: [
    'Summarize this PDF in 5 bullet points.',
    'What are the key findings or conclusions?',
    'List dates, names, and any figure captions or references.',
    'What should I pay attention to first?'
  ],
  excel: [
    'Summarize each sheet in this workbook.',
    'What are the column names across all sheets?',
    'Find totals or summary statistics.',
    'Are there any inconsistencies in the data?'
  ],
  txt: [
    'Summarize this document in 5 bullet points.',
    'What is the main topic or argument?',
    'Extract key facts, dates, and names.',
    'What are the most important takeaways?'
  ],
  all: [
    'Summarize the selected document.',
    'What are the key insights and takeaways?',
    'List any risks, anomalies, or inconsistencies.',
    'Provide a concise executive summary.'
  ]
}


export default function AnalyzerShell({ type, acceptedTypes, label }) {
  const [showSuggestions, setShowSuggestions] = useState(() => window.matchMedia('(min-width: 681px)').matches)
  const [question, setQuestion] = useState('')
  const { uploadedFiles, uploading, messages, thinking, statusMsg, backendStatus,
    activeFileId, activeFile, activeFileReady, handleUpload, handleAsk,
    removeUploadedFile, clearChat, selectFile, cancelAsk } = useDocAnalysis(type)
  const suggestions = SUGGESTIONS[type] || SUGGESTIONS.all

  function exportChat() {
    const content = messages.map(m => {
      const sources = groupSourceFiles(m.sources).map(file =>
        file.name + ' (' + file.passages.map(passageLocation).join(', ') + ')'
      )
      return (m.role === 'user' ? 'You' : 'DocRAG') + '\n' + m.text +
        (sources.length ? '\nSources: ' + sources.join('\n') : '')
    }).join('\n\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'docrag-chat-' + Date.now() + '.txt'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function send() {
    if (activeFileReady && !thinking && question.trim()) {
      handleAsk(question)
      setQuestion('')
    }
  }

  return <div className="work-grid">
    <aside className="source-panel">
      <div className="panel-heading"><span className="section-icon"><Icon name="folder" /></span><h2>Sources</h2><span className="file-count">{uploadedFiles.length}</span></div>
      <FileDropzone acceptedTypes={acceptedTypes} label={label} onFile={handleUpload} loading={uploading} />
      {statusMsg && <p className="status-note" role="status">{statusMsg}</p>}
      <FileList files={uploadedFiles} activeFileId={activeFileId} onRemove={removeUploadedFile} onSelect={id => { if (id !== activeFileId) { selectFile(id); setQuestion('') } }} />
      {activeFileReady && <details className="suggestions" open={showSuggestions} onToggle={e => setShowSuggestions(e.currentTarget.open)}><summary>Suggested questions</summary>{suggestions.map(s => <button disabled={thinking} key={s} onClick={() => handleAsk(s)}>{s}</button>)}</details>}
      <div className="source-foot"><Icon name="info" size={16} /><p>Each conversation uses the selected file. Larger files take longer to index.</p></div>
    </aside>
    <section className="chat-panel" aria-label="Document conversation">
      <div className="chat-heading"><div className="chat-title"><h2>Conversation</h2><p title={activeFile?.name}>{activeFile?.name || 'No source selected'}</p></div>
        <span className={'connection ' + backendStatus}><i />{backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking'}</span>
        <div className="chat-tools"><button className="icon-button" disabled={!messages.length || thinking} onClick={exportChat} aria-label="Export chat" title="Export chat"><Icon name="download" size={17} /></button>
          <button className="icon-button" disabled={!messages.length || thinking} onClick={clearChat} aria-label="Clear chat" title="Clear chat"><Icon name="clear" size={17} /></button></div>
      </div>
      <ChatWindow messages={messages} activeFile={activeFile} ready={activeFileReady} />
      <form className="composer" onSubmit={e => { e.preventDefault(); send() }}>
        <div className="compose-box"><textarea aria-label="Question about the selected document" placeholder={activeFileReady ? 'Ask about this document…' : 'Add a ready source to ask a question…'} rows={2} disabled={!activeFileReady || thinking} value={question}
          onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }} />
          {thinking ? <button type="button" className="send" onClick={cancelAsk} aria-label="Stop answer"><Icon name="stop" size={18} /></button> : <button className="send" type="submit" disabled={!activeFileReady || !question.trim()} aria-label="Send question"><Icon name="send" size={18} /></button>}</div>
        <p>Enter to send <span>·</span> Shift + Enter for a new line</p>
      </form>
    </section>
  </div>
}

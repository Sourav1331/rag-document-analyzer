import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

import { Icon } from './Icon'
export { Icon } from './Icon'

export const formats = [
  { id: 'pdf', name: 'PDF documents', tab: 'PDF', extensions: '.pdf', description: 'Find key arguments, figures, and references in long reports.' },
  { id: 'csv', name: 'CSV datasets', tab: 'CSV', extensions: '.csv', description: 'Explore columns, compare entries, and spot patterns in your data.' },
  { id: 'excel', name: 'Excel workbooks', tab: 'Excel', extensions: '.xlsx / .xls', description: 'Ask about figures and compare information across sheets.' },
  { id: 'txt', name: 'Text & Word', tab: 'Text & Word', extensions: '.txt / .docx / .doc', description: 'Pull decisions, details, and action items from written notes.' },
]

export function Brand() {
  return <Link className="brand" to="/" aria-label="DocRAG Studio home"><img src="/docrag-icon.svg" alt="" width="35" height="35" /><span>DocRAG <b>Studio</b></span></Link>
}

export function Header({ theme, onToggleTheme, workspace = false }) {
  return <header className="site-header"><div className="frame nav-row">
    <Brand />
    <nav className="main-nav" aria-label="Main navigation">
      <Link to="/" aria-current={workspace ? undefined : 'page'}>Overview</Link>
      <Link to="/#analyzers">Analyzers</Link><Link to="/#workflow">How it works</Link>
    </nav>
    <div className="nav-actions"><ThemeToggle theme={theme} onToggle={onToggleTheme} />
      {workspace ? <Link className="button nav-button workspace-home" to="/">Overview</Link> : <Link className="button nav-button" to="/analyze" aria-label="Open workspace"><Icon name="workspace" size={16} /><span><span className="open-prefix">Open </span>workspace</span></Link>}
    </div>
  </div></header>
}

import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formats, Header, Icon } from '../components/StudioUI'
import CsvAnalyzer from '../components/CsvAnalyzer'
import PdfAnalyzer from '../components/PdfAnalyzer'
import ExcelAnalyzer from '../components/ExcelAnalyzer'
import TxtAnalyzer from '../components/TxtAnalyzer'

const panels = { pdf: PdfAnalyzer, csv: CsvAnalyzer, excel: ExcelAnalyzer, txt: TxtAnalyzer }
export default function AnalyzePage({ theme, onToggleTheme }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const [params, setParams] = useSearchParams()
  const selected = formats.some(f => f.id === params.get('type')) ? params.get('type') : 'pdf'
  return <><a className="skip" href="#workspace">Skip to workspace</a><Header workspace theme={theme} onToggleTheme={onToggleTheme} />
    <main id="workspace" className="frame workspace">
      <div className="workspace-intro"><p className="eyebrow"><span className="eyeline" /> Document intelligence</p><h1>Analysis workspace<span className="accent">.</span></h1></div>
      <nav className="format-tabs" aria-label="Choose an analyzer">{formats.map(f => <button key={f.id} aria-pressed={f.id === selected} onClick={() => setParams({ type: f.id })}><Icon name={f.id} size={18} />{f.tab}</button>)}</nav>
      {formats.map(f => { const Panel = panels[f.id]; return <section key={f.id} aria-label={f.name + ' analyzer'} hidden={f.id !== selected}><Panel /></section> })}
    </main></>
}

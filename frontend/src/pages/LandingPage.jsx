import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brand, formats, Header, Icon } from '../components/StudioUI'

const steps = [
  ['upload', 'Add your document', 'Choose an analyzer and drop in the file you want to read.'],
  ['chat', 'Ask in your own words', 'Start with a summary or ask for a specific number, date, or decision.'],
  ['book', 'Follow the source', 'Use the page and passage references to check details in your original file.'],
]
const questions = [
  ['Can I upload more than one file?', 'Yes. Upload several files of the same type, then select the one you want to ask about. Each question uses the selected file.'],
  ['What happens to my documents?', 'The backend stores uploaded files and their search index on disk. The browser starts a new session on reload. Use the remove button while the file is in your workspace to delete it.'],
  ['How are answers generated?', 'DocRAG finds relevant passages in your selected document and sends them with your question to Groq. Use the source references to check details in the original.'],
]

export default function LandingPage({ theme, onToggleTheme }) {
  const { hash } = useLocation()
  const sample = useRef(null)
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash])

  return <><a className="skip" href="#main">Skip to content</a><Header theme={theme} onToggleTheme={onToggleTheme} />
    <main id="main" className="frame">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyeline" /> Document intelligence</p>
          <h1 id="hero-title">Your documents,<br /><em>in focus.</em></h1>
          <p className="hero-lead">Turn reports, spreadsheets, and notes into a conversation. Ask a question and see where the answer comes from.</p>
          <div className="hero-actions"><Link to="/analyze" className="button primary"><Icon name="upload" size={18} />Analyze a file</Link>
            <button className="button secondary" onClick={() => sample.current.showModal()}><Icon name="play" size={15} />View example</button></div>
        </div>
        <div className="hero-plate"><img src="/document-study.webp" alt="A blue folder, printed reports, and a magnifying glass examining a page" width="960" height="720" fetchPriority="high" /></div>
      </section>
      <section className="formats-section" id="analyzers" aria-labelledby="formats-title">
        <div className="section-heading"><div><p className="eyebrow"><span className="eyeline" /> Analyzers</p><h2 id="formats-title">Choose your file type<span className="accent">.</span></h2></div></div>
        <div className="format-grid">{formats.map(f => <Link key={f.id} to={'/analyze?type=' + f.id} className={'format-card tone-' + f.id}>
          <div className="format-top"><span className="format-icon"><Icon name={f.id} size={26} /></span><span className="extension">{f.extensions}</span></div>
          <h3>{f.name}</h3><p>{f.description}</p>
        </Link>)}</div>
      </section>
      <section id="workflow" className="workflow"><div><p className="eyebrow"><span className="eyeline" /> How it works</p><h2>From file to <em>finding.</em></h2></div>
        <div className="steps">{steps.map(([icon,title,desc]) => <div className="step" key={title}><span className="step-icon"><Icon name={icon} /></span><div><h3>{title}</h3><p>{desc}</p></div></div>)}</div>
      </section>
      <section className="faq"><h2>Common questions</h2><div>{questions.map(([q,a]) => <details key={q}><summary>{q}<Icon name="plus" size={18} /></summary><p>{a}</p></details>)}</div></section>
    </main>
    <footer className="foot"><div className="frame"><Brand /><Link to="/analyze">Open workspace</Link></div></footer>
    <dialog ref={sample} className="sample-dialog" aria-labelledby="sample-title" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
      <div className="dialog-inner"><div className="dialog-top"><p className="eyebrow">Example analysis</p><button className="icon-button" aria-label="Close example" onClick={() => sample.current.close()}><Icon name="close" /></button></div>
      <h2 id="sample-title">Field study notes</h2><div className="excerpt"><strong>Source excerpt</strong><p>“The team interviewed 24 participants in May. Eighteen preferred the shorter onboarding form.”</p></div>
      <p className="example-question">What share preferred the shorter form?</p><p className="example-answer">18 of 24 participants preferred it, or <strong>75%</strong>.</p>
      <span className="source-chip"><Icon name="sheet" size={15} />Field study notes · p. 1</span>
      <div className="dialog-bottom"><Link className="button primary" to="/analyze">Analyze my document</Link></div></div>
    </dialog>
  </>
}

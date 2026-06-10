import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '📄',
    label: 'PDF Analyzer',
    desc: 'Extract insights, summaries, key findings, dates, and names from any PDF document instantly.',
    color: 'from-rose-500 to-pink-500',
    shadow: 'shadow-rose-500/20',
    tab: 'pdf',
  },
  {
    icon: '📊',
    label: 'CSV Analyzer',
    desc: 'Query rows, columns, statistics, and trends from any CSV dataset using plain English.',
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
    tab: 'csv',
  },
  {
    icon: '📑',
    label: 'Excel Analyzer',
    desc: 'Analyze multi-sheet Excel workbooks, find totals, inconsistencies, and summaries.',
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    tab: 'excel',
  },
  {
    icon: '📃',
    label: 'Text & DOCX',
    desc: 'Summarize, search, and extract key information from plain text and Word documents.',
    color: 'from-sky-500 to-blue-500',
    shadow: 'shadow-sky-500/20',
    tab: 'txt',
  },
]

const steps = [
  { num: '01', title: 'Upload your file', desc: 'Drop or browse any supported document. Each section only accepts its correct file type — no confusion.' },
  { num: '02', title: 'Ask in plain English', desc: 'Type any question naturally. No query language, no filters, no technical knowledge needed.' },
  { num: '03', title: 'Get grounded answers', desc: 'Every response is sourced directly from your document with citations. No guessing, no hallucinations.' },
]

const usecases = [
  { icon: '🎓', title: 'Students & Researchers', desc: 'Summarize research papers, extract citations, and find key arguments in seconds instead of hours.' },
  { icon: '💼', title: 'HR & Recruiters', desc: 'Analyze resumes instantly — extract skills, projects, experience, and live demo links in one query.' },
  { icon: '📈', title: 'Data Analysts', desc: 'Query CSV and Excel files conversationally. Get statistics, spot anomalies, and summarize datasets.' },
  { icon: '⚖️', title: 'Legal & Compliance', desc: 'Extract clauses, dates, obligations, and parties from contracts and legal documents quickly.' },
  { icon: '🏥', title: 'Healthcare', desc: 'Parse medical reports and records to surface key findings, diagnoses, and recommendations.' },
  { icon: '🛠️', title: 'Developers', desc: 'Query API docs, technical specs, and changelogs without reading through hundreds of pages.' },
]

const stats = [
  { value: '6+', label: 'File formats supported' },
  { value: '10x', label: 'Faster than manual reading' },
  { value: '100%', label: 'Answers from your document' },
  { value: '0', label: 'Hallucinations — grounded only' },
]

const faqs = [
  { q: 'Is my data safe?', a: 'Your files are processed in memory during the session only. Nothing is stored on disk permanently. Once you close the tab, the session is cleared.' },
  { q: 'What file types are supported?', a: 'PDF, CSV, Excel (.xlsx, .xls), plain text (.txt), and Word documents (.docx, .doc).' },
  { q: 'How accurate are the answers?', a: 'Answers are retrieved directly from your document using semantic search. The AI only responds based on what is in the file — it will tell you if something is not found.' },
  { q: 'Can I upload multiple files at once?', a: 'Yes. The All Documents section accepts multiple files together and lets you query across all of them in one conversation.' },
  { q: 'Do I need an account?', a: 'No. Just open the app, upload your file, and start asking questions immediately.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-gray-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
            R
          </div>
          <span className="text-base font-semibold text-white brand">DocRAG Studio</span>
          <nav className="ml-auto">
            <button
              onClick={() => navigate('/analyze')}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition"
            >
              Get started →
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight brand">
          Ask anything about<br />
          <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">any document</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload PDF, CSV, Excel, or text files and get instant, accurate answers in plain English.
          Powered by RAG — every answer is pulled directly from your document.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button
            onClick={() => navigate('/analyze')}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
          >
            Start analyzing for free →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-5">
              <div className="text-3xl font-bold text-white brand mb-1">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-white brand mb-2">One analyzer for every file type</h2>
          <p className="text-slate-400 text-sm">Each section is purpose-built for its format — so you always get relevant, accurate results.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <button
              key={f.tab}
              onClick={() => navigate(`/analyze?tab=${f.tab}`)}
              className="group text-left rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 hover:border-slate-600/70 hover:bg-slate-900/80 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg ${f.shadow} group-hover:scale-105 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              <div className="mt-4 text-xs text-indigo-400 group-hover:text-indigo-300 transition flex items-center gap-1">
                Open analyzer →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white brand mb-2">How it works</h2>
            <p className="text-slate-400 text-sm">Three steps from upload to answer.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="text-5xl font-bold text-indigo-500/30 brand mb-4">{s.num}</div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-white brand mb-2">Built for everyone</h2>
          <p className="text-slate-400 text-sm">Whether you're a student, analyst, or developer — DocRAG saves you hours.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {usecases.map(u => (
            <div key={u.title} className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 hover:border-slate-700/70 transition">
              <div className="text-3xl mb-3">{u.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{u.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white brand mb-2">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(f => (
              <div key={f.q} className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-6 py-5">
                <h3 className="text-sm font-semibold text-white mb-2">{f.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 brand">Ready to analyze your documents?</h2>
          <p className="text-slate-400 mb-8 text-sm">No signup. No setup. Just upload and ask.</p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
          >
            Start for free →
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500">
        DocRAG Studio — AI-powered document analysis · Built with LangChain, Groq & React
      </footer>
    </div>
  )
}
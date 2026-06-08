import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '📊',
    label: 'CSV Analyzer',
    desc: 'Query rows, columns, trends, and statistics from any CSV dataset.',
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
    tab: 'csv',
  },
  {
    icon: '📄',
    label: 'PDF Analyzer',
    desc: 'Extract insights, summaries, and answers from PDF documents.',
    color: 'from-rose-500 to-pink-500',
    shadow: 'shadow-rose-500/20',
    tab: 'pdf',
  },
  {
    icon: '📑',
    label: 'Excel Analyzer',
    desc: 'Analyze multi-sheet Excel workbooks and tabular data at scale.',
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    tab: 'excel',
  },
  {
    icon: '📃',
    label: 'Text Analyzer',
    desc: 'Search, summarize, and analyze plain text and Markdown files.',
    color: 'from-sky-500 to-blue-500',
    shadow: 'shadow-sky-500/20',
    tab: 'txt',
  },
]

const steps = [
  { num: '01', title: 'Upload your file', desc: 'Drop or browse any supported document. Each section accepts only its file type.' },
  { num: '02', title: 'Ask anything', desc: 'Type a question in plain English — or pick a suggested prompt.' },
  { num: '03', title: 'Get grounded answers', desc: 'Responses are sourced directly from your document. No guessing.' },
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
          <nav className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate('/analyze')}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
            >
              Analyze
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition"
            >
              Get started →
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          Powered by RAG + Groq LLaMA
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight brand">
          Analyze any document<br />
          <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">with AI precision</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload CSV, PDF, Excel, or text files and instantly query them in plain English.
          Every answer is grounded in your document — no hallucinations.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/analyze')}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
          >
            Start analyzing →
          </button>
          <button
            onClick={() => navigate('/analyze?tab=csv')}
            className="px-8 py-3.5 border border-slate-700/70 text-slate-300 hover:text-white hover:border-slate-500/80 rounded-2xl transition text-base"
          >
            Try with CSV
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold text-white text-center mb-3 brand">Dedicated analyzer for every file type</h2>
        <p className="text-slate-400 text-center mb-10 text-sm">Each section accepts only the correct format — so you always get relevant, accurate analysis.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <button
              key={f.tab}
              onClick={() => navigate(`/analyze?tab=${f.tab}`)}
              className="group text-left rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 hover:border-slate-700/70 hover:bg-slate-900/80 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg ${f.shadow} group-hover:scale-105 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              <div className="mt-4 text-xs text-indigo-400 group-hover:text-indigo-300 transition flex items-center gap-1">
                Open analyzer <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-2xl font-semibold text-white text-center mb-12 brand">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="text-4xl font-bold text-indigo-500/40 brand mb-4">{s.num}</div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 brand">Ready to analyze your documents?</h2>
          <p className="text-slate-400 mb-8">No setup required. Just upload and ask.</p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
          >
            Start for free →
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 py-8 text-center text-xs text-slate-500">
        DocRAG Studio — AI-powered document analysis
      </footer>
    </div>
  )
}

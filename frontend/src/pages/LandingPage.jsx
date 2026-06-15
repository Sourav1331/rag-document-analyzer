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
  {
    num: '01',
    title: 'Upload your file',
    desc: 'Drop or browse any supported document. Each section only accepts its correct file type, so the workflow stays simple.',
  },
  {
    num: '02',
    title: 'Ask in plain English',
    desc: 'Type a question naturally. No query language, no filters, and no special formatting required.',
  },
  {
    num: '03',
    title: 'Get grounded answers',
    desc: 'Every response is pulled directly from your document with citations, so the output stays anchored to the source.',
  },
]

const usecases = [
  {
    icon: '🎓',
    title: 'Students & Researchers',
    desc: 'Summarize papers, extract citations, and find key arguments in seconds instead of hours.',
  },
  {
    icon: '💼',
    title: 'HR & Recruiters',
    desc: 'Analyze resumes instantly and extract skills, projects, experience, and live demo links in one query.',
  },
  {
    icon: '📈',
    title: 'Data Analysts',
    desc: 'Query CSV and Excel files conversationally. Get statistics, spot anomalies, and summarize datasets.',
  },
  {
    icon: '⚖️',
    title: 'Legal & Compliance',
    desc: 'Extract clauses, dates, obligations, and parties from contracts and legal documents quickly.',
  },
  {
    icon: '🏥',
    title: 'Healthcare',
    desc: 'Parse medical reports and records to surface key findings, diagnoses, and recommendations.',
  },
  {
    icon: '🛠️',
    title: 'Developers',
    desc: 'Query API docs, technical specs, and changelogs without reading through hundreds of pages.',
  },
]

const stats = [
  { value: '6+', label: 'File formats supported' },
  { value: '10x', label: 'Faster than manual reading' },
  { value: '100%', label: 'Grounded in your document' },
  { value: '0', label: 'Guessing required' },
]

const faqs = [
  {
    q: 'Is my data safe?',
    a: 'Your files are processed in memory during the session only. Nothing is stored permanently. Once you close the tab, the session is cleared.',
  },
  {
    q: 'What file types are supported?',
    a: 'PDF, CSV, Excel (.xlsx, .xls), plain text (.txt), and Word documents (.docx, .doc).',
  },
  {
    q: 'How accurate are the answers?',
    a: 'Answers are retrieved directly from your document using semantic search. The assistant only responds based on what is in the file.',
  },
  {
    q: 'Can I upload multiple files at once?',
    a: 'Yes. The All Documents section accepts multiple files together and lets you query across all of them in one conversation.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-gray-100 overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/25">
            R
          </div>
          <div>
            <span className="text-base font-semibold text-white brand">DocRAG Studio</span>
            <div className="text-xs text-slate-400">Document intelligence workspace</div>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="ml-auto px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold rounded-xl transition shadow-lg shadow-black/20"
          >
            Get started →
          </button>
        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[-10rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute right-[-8rem] top-[10rem] h-[22rem] w-[22rem] rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <section className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 reveal-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                RAG-powered document analysis
              </div>

              <div className="space-y-5 reveal-up reveal-delay-1">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[0.95] brand">
                  Ask anything about
                  <span className="block bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                    any document
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-7">
                  Upload PDF, CSV, Excel, or text files and get direct answers in plain English.
                  Every response is grounded in the uploaded content, so the output stays useful and trustworthy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 reveal-up reveal-delay-2">
                <button
                  onClick={() => navigate('/analyze')}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
                >
                  Start analyzing
                </button>
                <a
                  href="#features"
                  className="px-8 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition text-base"
                >
                  Explore features
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="glass-panel rounded-2xl px-4 py-4 reveal-up"
                    style={{ animationDelay: `${180 + index * 80}ms` }}
                  >
                    <div className="text-2xl font-bold text-white brand mb-1">{stat.value}</div>
                    <div className="text-[11px] text-slate-400 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative reveal-up reveal-delay-2">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-sky-500/10 blur-2xl float-slow" />
              <div className="relative glass-panel-strong rounded-[2rem] p-5 sm:p-6">
                <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="ml-auto text-xs text-slate-400">Live document conversation</div>
                  </div>

                  <div className="space-y-4">
                    <div className="max-w-[90%] ml-auto rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-3 text-sm text-white shadow-lg shadow-indigo-500/20">
                      What are the key findings or conclusions?
                    </div>
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Sources</div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/8 text-xs">CTF_Attendance.pdf</span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/8 text-xs">front_page.pdf</span>
                      </div>
                      <div className="space-y-2 text-slate-300 leading-relaxed">
                        <p>The document highlights attendance, event schedule, and submission details.</p>
                        <p>It also calls out deadlines, required checks, and formatting expectations.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Streaming answers</span>
                    <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Instant citations</span>
                    <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Multi-file analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 pb-24 relative">
          <div className="text-center mb-10 reveal-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-white brand mb-3">One analyzer for every file type</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Each section is purpose-built for its format so the interface stays clear and the results stay relevant.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <button
                key={feature.tab}
                onClick={() => navigate(`/analyze?tab=${feature.tab}`)}
                className="group text-left rounded-3xl border border-white/8 bg-white/5 p-6 hover:border-white/15 hover:bg-white/8 transition-all duration-200 reveal-up"
                style={{ animationDelay: `${120 + index * 85}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 shadow-lg ${feature.shadow} group-hover:-translate-y-0.5 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                <div className="mt-4 text-xs text-indigo-300 group-hover:text-indigo-200 transition flex items-center gap-1">
                  Open analyzer →
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="border-y border-white/8 bg-slate-950/45">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="text-center mb-12 reveal-up">
              <h2 className="text-2xl sm:text-3xl font-bold text-white brand mb-3">How it works</h2>
              <p className="text-slate-400 text-sm sm:text-base">Three steps from upload to answer.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-10">
              {steps.map((step, index) => (
                <div
                  key={step.num}
                  className="glass-panel rounded-3xl p-6 text-center reveal-up"
                  style={{ animationDelay: `${120 + index * 110}ms` }}
                >
                  <div className="text-5xl font-bold text-indigo-300/25 brand mb-4">{step.num}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-12 reveal-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-white brand mb-3">Built for everyone</h2>
            <p className="text-slate-400 text-sm sm:text-base">Whether you're a student, analyst, or developer, DocRAG saves time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {usecases.map((usecase, index) => (
              <div
                key={usecase.title}
                className="glass-panel rounded-3xl p-6 reveal-up"
                style={{ animationDelay: `${100 + index * 70}ms` }}
              >
                <div className="text-3xl mb-3">{usecase.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{usecase.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{usecase.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/8 bg-slate-950/45">
          <div className="max-w-4xl mx-auto px-6 py-24">
            <div className="text-center mb-12 reveal-up">
              <h2 className="text-2xl sm:text-3xl font-bold text-white brand mb-3">Frequently asked questions</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq.q}
                  className="glass-panel rounded-3xl px-6 py-5 reveal-up"
                  style={{ animationDelay: `${100 + index * 60}ms` }}
                >
                  <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="rounded-[2rem] border border-indigo-400/15 bg-gradient-to-br from-indigo-500/15 to-sky-500/10 p-10 sm:p-14 text-center glass-panel-strong reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 brand">Ready to analyze your documents?</h2>
            <p className="text-slate-300 mb-8 text-sm sm:text-base">No signup. No setup. Just upload and ask.</p>
            <button
              onClick={() => navigate('/analyze')}
              className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 transition text-base"
            >
              Start for free →
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 py-8 text-center text-xs text-slate-500">
        DocRAG Studio · AI-powered document analysis · Built with LangChain, Groq & React
      </footer>
    </div>
  )
}

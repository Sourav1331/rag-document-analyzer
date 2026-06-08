// REPLACE the entire file with this:
import AllDocsAnalyzer from '../components/AllDocsAnalyzer'
import { useNavigate } from 'react-router-dom'

export default function AnalyzePage() {
  const navigate = useNavigate()

  return (
    <div className="h-screen overflow-hidden flex flex-col text-gray-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur shrink-0">
        <div className="px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20"
          >
            R
          </button>
          <div>
            <h1 className="text-base font-semibold text-white brand">DocRAG Studio</h1>
            <span className="text-xs text-slate-400">Document intelligence workspace</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="ml-auto text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            ← Home
          </button>
        </div>
      </header>

      {/* Analyzer */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
        <AllDocsAnalyzer />
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AllDocsAnalyzer from '../components/AllDocsAnalyzer'
import CsvAnalyzer from '../components/CsvAnalyzer'
import PdfAnalyzer from '../components/PdfAnalyzer'
import ExcelAnalyzer from '../components/ExcelAnalyzer'
import TxtAnalyzer from '../components/TxtAnalyzer'

const TABS = [
  { id: 'all',   label: 'All Docs', icon: '📁', desc: 'PDF · CSV · DOCX · XLSX · TXT' },
  { id: 'csv',   label: 'CSV',      icon: '📊', desc: '.csv only' },
  { id: 'pdf',   label: 'PDF',      icon: '📄', desc: '.pdf only' },
  { id: 'excel', label: 'Excel',    icon: '📑', desc: '.xlsx · .xls only' },
  { id: 'txt',   label: 'Text',     icon: '📃', desc: '.txt only' },
]

const COMPONENTS = {
  all:   <AllDocsAnalyzer />,
  csv:   <CsvAnalyzer />,
  pdf:   <PdfAnalyzer />,
  excel: <ExcelAnalyzer />,
  txt:   <TxtAnalyzer />,
}

export default function AnalyzePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialTab = TABS.find(t => t.id === searchParams.get('tab'))?.id || 'all'
  const [activeTab, setActiveTab] = useState(initialTab)

  const switchTab = (id) => {
    setActiveTab(id)
    setSearchParams({ tab: id })
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col text-gray-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur shrink-0">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
            R
          </button>
          <div>
            <h1 className="text-base font-semibold text-white brand">DocRAG Studio</h1>
            <span className="text-xs text-slate-400">Document intelligence workspace</span>
          </div>
          <button onClick={() => navigate('/')} className="ml-auto text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-800/60">
            ← Home
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 overflow-x-auto pb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === tab.id
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full border
                ${activeTab === tab.id
                  ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
                  : 'text-slate-500 bg-slate-800/50 border-slate-700/50'}`}>
                {tab.desc}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-6">
        {COMPONENTS[activeTab]}
      </div>
    </div>
  )
}

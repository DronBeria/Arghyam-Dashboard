import { useState } from 'react'
import { Header }         from './components/Header'
import { KPICards }       from './components/KPICards'
import { CallSummary }    from './components/CallSummary'
import { KPIResults }     from './components/KPIResults'
import { SchemeCoverage } from './components/SchemeCoverage'
import { ZoneScores }     from './components/ZoneScores'
import { DistrictScores } from './components/DistrictScores'
import { RepeatCallers }  from './components/RepeatCallers'
import { CallAttempts }   from './components/CallAttempts'
import { QuestionFunnel } from './components/QuestionFunnel'

const NAV_ITEMS = [
  { id: 'kpi-cards',       label: 'KPI Overview',        icon: '◈' },
  { id: 'call-summary',    label: '1. Call Summary',      icon: '◉' },
  { id: 'kpi-results',     label: '2. KPI Results',       icon: '◈' },
  { id: 'scheme-coverage', label: '3. Scheme Coverage',   icon: '◉' },
  { id: 'zone-scores',     label: '4. Zone Scores',       icon: '◈' },
  { id: 'district-scores', label: '5. District Scores',   icon: '◉' },
  { id: 'repeat-callers',  label: '6. Repeat Callers',    icon: '◈' },
  { id: 'call-attempts',   label: '7. Call Attempts',     icon: '◉' },
  { id: 'question-funnel', label: '8. Question Funnel',   icon: '◈' },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-52' : 'w-0 overflow-hidden'
          } flex-shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-200 hidden md:block`}
        >
          <nav className="py-4">
            <p className="px-4 text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">
              Sections
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <span className="text-slate-600">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="bg-slate-800 rounded p-2 text-xs text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-400">CSAT AI Phase 1</p>
              <p>Assam JJM · April 2026</p>
              <p>Bot: Raya</p>
            </div>
          </div>
        </aside>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block fixed top-20 left-2 z-50 bg-slate-800 border border-slate-700 rounded p-1 text-slate-400 hover:text-white"
            title="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>

          <div className="divide-y divide-slate-800/60">
            <KPICards />
            <CallSummary />
            <KPIResults />
            <SchemeCoverage />
            <ZoneScores />
            <DistrictScores />
            <RepeatCallers />
            <CallAttempts />
            <QuestionFunnel />
          </div>

          {/* Footer */}
          <footer className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600 leading-relaxed">
            Source: CSAT AI Phase 1 · Assam Jal Jeevan Mission · 45,863 completed calls · April 2026 ·
            All figures verified from primary data · BSI = raw score (0–5.0) ÷ 5 = scale 0–1.0 · Benchmark ≥ 0.70 = Good
          </footer>
        </main>
      </div>
    </div>
  )
}

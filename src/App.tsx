import { useState, useEffect } from 'react'
import { Header }            from './components/Header'
import { OverviewPage }      from './pages/OverviewPage'
import { CallAnalysisPage }  from './pages/CallAnalysisPage'
import { CallRecordsPage }   from './pages/CallRecordsPage'
import { SurveyResultsPage } from './pages/SurveyResultsPage'
import { SchemePage }        from './pages/SchemePage'
import { GeographicPage }    from './pages/GeographicPage'

// ─── Nav structure ────────────────────────────────────────────────────────────
type PageId = 'overview' | 'calls' | 'records' | 'survey' | 'schemes' | 'geographic'

interface NavGroup {
  label: string
  icon: string
  items: { id: PageId; label: string; description: string }[]
}

const NAV: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: '◈',
    items: [
      { id: 'overview',   label: 'Overview',        description: 'KPIs, BSI gauge, funnel' },
    ],
  },
  {
    label: 'Call Data',
    icon: '📞',
    items: [
      { id: 'calls',   label: 'Call Analysis',   description: 'Summary, attempts, repeat callers' },
      { id: 'records', label: 'Call Records',    description: 'Browse individual calls + recordings' },
    ],
  },
  {
    label: 'Survey',
    icon: '📋',
    items: [
      { id: 'survey',     label: 'Survey Results',  description: 'Q1–Q5 KPIs, Q5 split, funnel' },
    ],
  },
  {
    label: 'Schemes',
    icon: '🏗️',
    items: [
      { id: 'schemes',    label: 'Scheme Coverage', description: 'Valid, flagged, functional rate' },
    ],
  },
  {
    label: 'Geography',
    icon: '🗺️',
    items: [
      { id: 'geographic', label: 'Zone & Districts', description: 'BSI by zone + 31 districts' },
    ],
  },
]

const PAGE_META: Record<PageId, { title: string; sub: string }> = {
  overview:   { title: 'Dashboard Overview',     sub: 'State-level KPIs at a glance' },
  calls:      { title: 'Call Analysis',           sub: 'Breakdown of 45,863 calls' },
  records:    { title: 'Call Records',            sub: 'Browse, filter and play individual calls' },
  survey:     { title: 'Survey Results',          sub: 'Q1–Q5 satisfaction indicators' },
  schemes:    { title: 'Scheme Coverage',         sub: '2,373 IMIS schemes analysed' },
  geographic: { title: 'Zone & District Scores',  sub: 'BSI by geography across Assam' },
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]               = useState<PageId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Call Data']))

  function navigate(id: PageId) {
    setPage(id)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  // Listen for navigation events dispatched from child pages (e.g. OverviewPage nav cards)
  useEffect(() => {
    function onNav(e: Event) { navigate((e as CustomEvent).detail as PageId) }
    window.addEventListener('navigate', onNav)
    return () => window.removeEventListener('navigate', onNav)
  }, [])

  function toggleGroup(label: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <Header pageTitle={PAGE_META[page].title} onNavigate={(id) => navigate(id as PageId)} />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`${sidebarOpen ? 'w-60' : 'w-14'} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-200 overflow-hidden`}>

          {/* Logo + collapse toggle */}
          <div className={`flex items-center border-b border-slate-800 ${sidebarOpen ? 'justify-between px-3 py-3' : 'justify-center py-3'}`}>
            {sidebarOpen && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-none truncate">Araghyam</p>
                  <p className="text-xs text-slate-500 leading-none mt-0.5 truncate">CSAT AI · Phase 1</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="text-xs">{sidebarOpen ? '◂' : '▸'}</span>
            </button>
          </div>

          <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
            {NAV.map((group) => {
              const isExpanded = expandedGroups.has(group.label) || group.items.length === 1
              const hasActiveItem = group.items.some(i => i.id === page)

              return (
                <div key={group.label} className="mb-1">
                  {/* Group header — shown when sidebar open AND group has >1 item */}
                  {sidebarOpen && group.items.length > 1 && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                        hasActiveItem ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{group.icon}</span>
                        {group.label}
                      </span>
                      <span>{isExpanded ? '▾' : '▸'}</span>
                    </button>
                  )}

                  {/* Section label for single-item groups when sidebar open */}
                  {sidebarOpen && group.items.length === 1 && (
                    <p className="px-2 pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {group.label}
                    </p>
                  )}

                  {/* Nav items */}
                  {(isExpanded || !sidebarOpen) && group.items.map((item) => {
                    const active = page === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        } ${sidebarOpen && group.items.length > 1 ? 'pl-4' : ''}`}
                      >
                        <span className={`text-base flex-shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`}>{group.icon}</span>
                        {sidebarOpen && (
                          <div className="text-left min-w-0">
                            <div className={`text-xs font-medium truncate ${active ? 'text-white' : ''}`}>{item.label}</div>
                            {!active && <div className="text-xs text-slate-600 truncate">{item.description}</div>}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          {sidebarOpen ? (
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <p className="text-xs text-slate-500">Live · April 2026 · Assam</p>
              </div>
              <p className="text-xs text-slate-700 mt-1">45,863 calls · 31 districts</p>
            </div>
          ) : (
            <div className="p-2 border-t border-slate-800 flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Page subtitle bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">{PAGE_META[page].sub}</p>
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <span>Araghyam</span>
              <span>›</span>
              <span className="text-gray-600 font-medium">{PAGE_META[page].title}</span>
            </nav>
          </div>

          {/* Page body */}
          <div className="px-5 sm:px-6 py-6 max-w-7xl mx-auto w-full">
            {page === 'overview'   && <OverviewPage />}
            {page === 'calls'      && <CallAnalysisPage />}
            {page === 'records'    && <CallRecordsPage />}
            {page === 'survey'     && <SurveyResultsPage />}
            {page === 'schemes'    && <SchemePage />}
            {page === 'geographic' && <GeographicPage />}
          </div>

          <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mx-5">
            Araghyam · CSAT AI Phase 1 · Assam Jal Jeevan Mission · 45,863 calls · April 2026 ·
            BSI scale 0–5.0 · Benchmark ≥ 3.50 = Good
          </footer>
        </main>
      </div>
    </div>
  )
}

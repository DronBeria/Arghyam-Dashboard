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
        <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden`}>
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-end p-3 text-gray-400 hover:text-gray-600 border-b border-gray-100"
          >
            <span className="text-xs">{sidebarOpen ? '◂' : '▸'}</span>
          </button>

          <nav className="flex-1 py-2 overflow-y-auto">
            {NAV.map((group) => {
              const isExpanded = expandedGroups.has(group.label) || group.items.length === 1
              const hasActiveItem = group.items.some(i => i.id === page)

              return (
                <div key={group.label} className="mb-1">
                  {/* Group header — shown when sidebar open AND group has >1 item */}
                  {sidebarOpen && group.items.length > 1 && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        hasActiveItem ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{group.icon}</span>
                        {group.label}
                      </span>
                      <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
                    </button>
                  )}

                  {/* Section label for single-item groups when sidebar open */}
                  {sidebarOpen && group.items.length === 1 && (
                    <p className="px-3 pt-2 pb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        } ${sidebarOpen && group.items.length > 1 ? 'pl-6' : ''}`}
                      >
                        <span className="text-base flex-shrink-0">{group.icon}</span>
                        {sidebarOpen && (
                          <div className="text-left min-w-0">
                            <div className="text-xs font-medium truncate">{item.label}</div>
                            {!active && <div className="text-xs text-gray-400 truncate">{item.description}</div>}
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
          {sidebarOpen && (
            <div className="p-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                CSAT AI Phase 1<br />
                April 2026 · Assam
              </p>
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
            BSI scale 0–1.0 · Benchmark ≥ 0.70 = Good
          </footer>
        </main>
      </div>
    </div>
  )
}

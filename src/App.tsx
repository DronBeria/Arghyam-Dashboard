import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Header } from './components/Header'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { CallAnalysisPage } from './pages/CallAnalysisPage'
import { CallRecordsPage } from './pages/CallRecordsPage'
import { SurveyResultsPage } from './pages/SurveyResultsPage'
import { SchemePage } from './pages/SchemePage'
import { GeographicPage } from './pages/GeographicPage'
import { DataVerificationPage } from './pages/DataVerificationPage'

// ─── Nav structure ────────────────────────────────────────────────────────────
type PageId = 'overview' | 'calls' | 'records' | 'survey' | 'schemes' | 'geographic' | 'verification'

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
      { id: 'overview', label: 'Overview', description: 'KPIs, BSI score, priorities' },
    ],
  },
  {
    label: 'Call Data',
    icon: '📞',
    items: [
      { id: 'calls', label: 'Call Analysis', description: 'Summary, attempts, repeat callers' },
      { id: 'records', label: 'Call Records', description: 'Browse individual calls + recordings' },
    ],
  },
  {
    label: 'Survey',
    icon: '📋',
    items: [
      { id: 'survey', label: 'Survey Results', description: 'Q1–Q5 KPIs, Q5 split, funnel' },
    ],
  },
  {
    label: 'Schemes',
    icon: '🏗️',
    items: [
      { id: 'schemes', label: 'Scheme Coverage', description: 'Valid, flagged, functional rate' },
    ],
  },
  {
    label: 'Geography',
    icon: '🗺️',
    items: [
      { id: 'geographic', label: 'Zone & Districts', description: 'BSI by zone + 31 districts' },
    ],
  },
  {
    label: 'Audit',
    icon: '🔍',
    items: [
      { id: 'verification', label: 'Data Verification', description: 'Sanity checks, bot errors, proof' },
    ],
  },
]

const PAGE_META: Record<PageId, { title: string; sub: string }> = {
  overview: { title: 'Dashboard Overview', sub: 'State-level KPIs at a glance' },
  calls: { title: 'Call Analysis', sub: 'Breakdown of 45,863 calls' },
  records: { title: 'Call Records', sub: 'Browse, filter and play individual calls' },
  survey: { title: 'Survey Results', sub: 'Q1–Q5 satisfaction indicators' },
  schemes: { title: 'Scheme Coverage', sub: '2,373 IMIS schemes analysed' },
  geographic: { title: 'Zone & District Scores', sub: 'BSI by geography across Assam' },
  verification: { title: 'Data Verification', sub: 'Sanity check audit — raw data vs dashboard' },
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState<PageId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Call Data']))

  // ── Auth state ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  function navigate(id: PageId) {
    setPage(id)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

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

  // ── Loading splash ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <span className="text-white text-xl font-black">A</span>
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!session) return <LoginPage />

  const userEmail = session.user?.email

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        pageTitle={PAGE_META[page].title}
        onNavigate={(id) => navigate(id as PageId)}
        userEmail={userEmail}
      />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`${sidebarOpen ? 'w-60' : 'w-14'} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-200 overflow-hidden`}>

          {/* Logo + collapse toggle */}
          <div className={`flex items-center border-b border-slate-800 ${sidebarOpen ? 'justify-between px-4 py-4' : 'justify-center py-4'}`}>
            {sidebarOpen && (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <span className="text-white text-sm font-black">A</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none truncate tracking-tight">CSAT AI</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-1 truncate uppercase tracking-widest font-medium">Phase 1</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all p-1.5 rounded-lg"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
            {NAV.map((group) => {
              const isExpanded = expandedGroups.has(group.label) || group.items.length === 1
              const hasActiveItem = group.items.some(i => i.id === page)

              return (
                <div key={group.label} className="mb-1">
                  {sidebarOpen && group.items.length > 1 && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${hasActiveItem ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{group.icon}</span>
                        {group.label}
                      </span>
                      <span>{isExpanded ? '▾' : '▸'}</span>
                    </button>
                  )}

                  {sidebarOpen && group.items.length === 1 && (
                    <p className="px-2 pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {group.label}
                    </p>
                  )}

                  {(isExpanded || !sidebarOpen) && group.items.map((item) => {
                    const active = page === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all ${active
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

          {/* User info + sign out */}
          <div className="mt-auto border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            {sidebarOpen ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                      {userEmail?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-none">{userEmail?.split('@')[0]}</p>
                    <p className="text-[9px] text-slate-500 truncate mt-1 uppercase tracking-tighter font-medium">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full text-xs font-bold text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 hover:border-red-500 px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-2 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                    {userEmail?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  title="Sign out"
                  className="w-8 h-8 flex items-center justify-center text-red-500/60 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">{PAGE_META[page].sub}</p>
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <span>Araghyam</span>
              <span>›</span>
              <span className="text-gray-600 font-medium">{PAGE_META[page].title}</span>
            </nav>
          </div>

          <div className="px-5 sm:px-6 py-6 max-w-7xl mx-auto w-full">
            {page === 'overview' && <OverviewPage />}
            {page === 'calls' && <CallAnalysisPage />}
            {page === 'records' && <CallRecordsPage />}
            {page === 'survey' && <SurveyResultsPage />}
            {page === 'schemes' && <SchemePage />}
            {page === 'geographic' && <GeographicPage />}
            {page === 'verification' && <DataVerificationPage />}
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

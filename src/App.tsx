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
    <div className="flex min-h-screen bg-slate-100">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} sticky top-0 h-screen flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-300 z-40 shadow-2xl shadow-slate-900/50`}>

        {/* Logo + collapse toggle */}
        <div className={`flex items-center border-b border-white/5 ${sidebarOpen ? 'justify-between px-5 py-5' : 'justify-center py-5'}`}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <span className="text-white text-sm font-black italic">A</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-none truncate tracking-tight">CSAT AI</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1 truncate uppercase tracking-[0.2em] font-medium">Phase 1</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-500 hover:text-white hover:bg-white/5 transition-all p-2 rounded-xl"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
          {NAV.map((group) => {
            const isExpanded = expandedGroups.has(group.label) || group.items.length === 1
            const hasActiveItem = group.items.some(i => i.id === page)

            return (
              <div key={group.label} className="mb-2">
                {sidebarOpen && group.items.length > 1 && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${hasActiveItem ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{group.icon}</span>
                      {group.label}
                    </span>
                    <span className="text-[8px]">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                )}

                {sidebarOpen && group.items.length === 1 && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className={`text-lg flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>{group.icon}</span>
                      {sidebarOpen && (
                        <div className="text-left min-w-0">
                          <div className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-slate-200'}`}>{item.label}</div>
                          {!active && <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{item.description}</div>}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User profile + Sign Out */}
        <div className="mt-auto border-t border-white/5 bg-slate-950/20 backdrop-blur-sm">
          {sidebarOpen ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3.5 px-1">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-black">
                    {userEmail?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate leading-none">{userEmail?.split('@')[0]}</p>
                  <p className="text-[9px] text-slate-500 truncate mt-1.5 uppercase tracking-widest font-bold">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full text-xs font-bold text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 hover:border-red-500 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="p-3 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-black">
                  {userEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                title="Sign out"
                className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pageTitle={PAGE_META[page].title}
          onNavigate={(id) => navigate(id as PageId)}
          userEmail={userEmail}
        />
        <main className="flex-1">
          {/* Breadcrumbs / Subbar */}
          <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-16 z-30 backdrop-blur-md bg-white/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{PAGE_META[page].sub}</p>
            <nav className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-slate-900">
              {PAGE_META[page].title}
            </nav>
          </div>

          <div className="px-6 py-10 max-w-7xl mx-auto w-full">
            {page === 'overview' && <OverviewPage />}
            {page === 'calls' && <CallAnalysisPage />}
            {page === 'records' && <CallRecordsPage />}
            {page === 'survey' && <SurveyResultsPage />}
            {page === 'schemes' && <SchemePage />}
            {page === 'geographic' && <GeographicPage />}
            {page === 'verification' && <DataVerificationPage />}

            <footer className="mt-20 pt-10 border-t border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-loose">
                Araghyam · CSAT AI Phase 1 · Assam Jal Jeevan Mission<br />
                45,863 calls · April 2026 · BSI scale 0–5.0
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

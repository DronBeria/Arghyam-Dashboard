import { useState, useEffect, useCallback } from 'react'
import { CommandPalette } from './components/CommandPalette'
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
  const [paletteOpen, setPaletteOpen] = useState(false)

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

  // Global Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f172a' }}>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-[52px]'} h-full flex-shrink-0 flex flex-col transition-all duration-200 z-40 border-r border-white/[0.06]`}
        style={{ background: '#0f172a' }}>

        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-white/[0.06] flex-shrink-0 ${sidebarOpen ? 'px-4 gap-3' : 'justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black">A</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white leading-none">Araghyam</p>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium tracking-widest uppercase">JJM Phase 1</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors p-1 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7"/></svg>
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-black">A</span>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto min-h-0 px-2 space-y-0.5">
          {NAV.map((group) => {
            const isExpanded = expandedGroups.has(group.label) || group.items.length === 1
            const hasActive  = group.items.some(i => i.id === page)
            return (
              <div key={group.label}>
                {sidebarOpen && (
                  <div className="px-2 pt-3 pb-1">
                    {group.items.length > 1 ? (
                      <button onClick={() => toggleGroup(group.label)}
                        className={`w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${hasActive ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>
                        <span>{group.label}</span>
                        <span className="text-[8px]">{isExpanded ? '▾' : '▸'}</span>
                      </button>
                    ) : (
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">{group.label}</p>
                    )}
                  </div>
                )}
                {(isExpanded || !sidebarOpen) && group.items.map((item) => {
                  const active = page === item.id
                  return (
                    <button key={item.id} onClick={() => navigate(item.id)}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 rounded-lg transition-all ${
                        sidebarOpen ? 'px-2.5 py-2' : 'px-0 py-2 justify-center'
                      } ${active
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                      }`}>
                      {/* Icon: simple svg shapes, no emoji */}
                      <NavIcon id={item.id} active={active} />
                      {sidebarOpen && (
                        <span className={`text-[12px] font-medium truncate ${active ? 'text-blue-300' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      )}
                      {active && sidebarOpen && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User + Sign out */}
        <div className="flex-shrink-0 border-t border-white/[0.06] p-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-300 truncate leading-none">{userEmail?.split('@')[0]}</p>
              </div>
              <button onClick={() => supabase.auth.signOut()} title="Sign out"
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
              </button>
            </div>
          ) : (
            <button onClick={() => supabase.auth.signOut()} title="Sign out"
              className="w-full flex items-center justify-center py-2 text-slate-600 hover:text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
            </button>
          )}
        </div>
      </aside>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <Header
          pageTitle={PAGE_META[page].title}
          onNavigate={(id) => navigate(id as PageId)}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto">
          {/* Page header bar */}
          <div className="bg-white/80 backdrop-blur border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span>Araghyam</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-semibold">{PAGE_META[page].title}</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="panel-label hidden sm:block">{PAGE_META[page].sub}</p>
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span className="text-[10px] font-semibold hidden md:block">Search</span>
                <kbd className="text-[9px] font-mono bg-slate-100 border border-slate-200 px-1 rounded hidden md:block">⌘K</kbd>
              </button>
            </div>
          </div>

          <div className="px-6 py-6 max-w-7xl mx-auto w-full">
            {page === 'overview' && <OverviewPage />}
            {page === 'calls' && <CallAnalysisPage />}
            {page === 'records' && <CallRecordsPage />}
            {page === 'survey' && <SurveyResultsPage />}
            {page === 'schemes' && <SchemePage />}
            {page === 'geographic' && <GeographicPage />}
            {page === 'verification' && <DataVerificationPage />}

            <footer className="mt-12 pt-6 border-t border-slate-200/60 text-center">
              <p className="panel-label">Araghyam · CSAT AI Phase 1 · Assam JJM · 45,863 calls · April 2026</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Clean SVG nav icons — no emoji ───────────────────────────────────────────
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const cls = `w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`
  const icons: Record<string, JSX.Element> = {
    overview:     <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    calls:        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
    records:      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    survey:       <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    schemes:      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
    geographic:   <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/><circle cx="12" cy="12" r="9"/></svg>,
    verification: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  }
  return icons[id] ?? <div className={`w-4 h-4 rounded-sm ${active ? 'bg-blue-400' : 'bg-slate-600'}`} />
}

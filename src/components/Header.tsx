import { useState } from 'react'
import { DownloadModal } from './DownloadModal'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  pageTitle: string
  phase?: 'phase1' | 'phase2'
  onNavigate: (page: string) => void
  userEmail?: string
}

const QUICK_LINKS = [
  {
    group: 'Pages',
    items: [
      { id: 'overview', label: 'Dashboard Overview', icon: '◈', desc: 'KPIs, BSI score, priorities' },
      { id: 'calls', label: 'Call Analysis', icon: '📞', desc: 'Funnel, attempts, repeat callers' },
      { id: 'records', label: 'Call Records', icon: '🎙️', desc: 'Browse calls + play recordings' },
      { id: 'survey', label: 'Survey Results', icon: '📋', desc: 'Q1–Q5 satisfaction breakdown' },
      { id: 'schemes', label: 'Scheme Coverage', icon: '🏗️', desc: 'Functional vs non-functional' },
      { id: 'geographic', label: 'Zone & Districts', icon: '🗺️', desc: 'BSI rankings by geography' },
    ],
  },
  {
    group: 'Quick filters',
    items: [
      { id: 'records', label: 'Dissatisfied calls with recordings', icon: '😞', desc: 'Call Records → Dissatisfied + Recording preset' },
      { id: 'geographic', label: 'Critical zones deep-dive', icon: '🔴', desc: 'BTAD & Barak Valley districts' },
      { id: 'schemes', label: 'Non-functional schemes', icon: '⚠️', desc: '507 schemes failing functionality test' },
    ],
  },
]

export function Header({ pageTitle, phase = 'phase1', onNavigate, userEmail }: HeaderProps) {
  const [open, setOpen]               = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <>
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between h-14 flex-shrink-0 relative z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('overview')}>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-800 leading-none tracking-tight">{pageTitle}</h2>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {phase === 'phase1' ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Phase 1 · Apr 2026</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Phase 2 · Awaiting data</span>
            </div>
          )}

          {/* Download */}
          <button onClick={() => setShowDownload(true)}
            className="hidden sm:flex items-center gap-1.5 btn-primary">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>

          {/* Quick Jump */}
          <div className="relative">
            <button onClick={() => { setOpen(v => !v); setUserMenuOpen(false) }}
              className={`flex items-center gap-1.5 btn-outline ${open ? '!border-blue-500 !text-blue-600 !bg-blue-50' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16"/></svg>
              <span className="hidden md:inline">Navigate</span>
              <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="panel-label">Navigation</p>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {QUICK_LINKS.map(group => (
                      <div key={group.group} className="p-2">
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {group.group}
                        </p>
                        {group.items.map(item => (
                          <button
                            key={item.label}
                            onClick={() => { onNavigate(item.id); setOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-slate-700">{item.label}</p>
                              <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                    <p className="panel-label">Araghyam · JJM Phase 1 · April 2026</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User */}
          {userEmail && (
            <div className="relative">
              <button onClick={() => { setUserMenuOpen(v => !v); setOpen(false) }}
                className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-colors">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-semibold text-slate-600 max-w-[100px] truncate hidden sm:block">{userEmail.split('@')[0]}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="panel-label">Account</p>
                      <p className="text-[11px] text-slate-600 truncate font-medium mt-1">{userEmail}</p>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors text-left">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download modal */}
      {showDownload && (
        <DownloadModal onClose={() => setShowDownload(false)} userEmail={userEmail} />
      )}
    </>
  )
}

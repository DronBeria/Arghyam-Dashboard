import { useState } from 'react'
import { DownloadModal } from './DownloadModal'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  pageTitle: string
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

export function Header({ pageTitle, onNavigate, userEmail }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between h-16 flex-shrink-0 relative z-50 shadow-sm">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate('overview')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white text-sm font-black italic">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-blue-600 font-bold leading-none mb-1 uppercase tracking-widest">Araghyam</p>
              <h2 className="text-base font-extrabold text-slate-900 leading-none tracking-tight">{pageTitle}</h2>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Data · April 2026
          </span>

          {/* Download button */}
          <button
            onClick={() => setShowDownload(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
              bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>

          {/* Quick Jump dropdown */}
          <div className="relative">
            <button
              onClick={() => { setOpen(v => !v); setUserMenuOpen(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${open
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
            >
              <span className="text-sm">⚡</span>
              <span className="hidden md:inline">Quick Jump</span>
              <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dashboard Navigation</p>
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
                            className="w-full flex items-start gap-3.5 px-3 py-2.5 hover:bg-blue-50/80 rounded-xl text-left transition-all group"
                          >
                            <span className="text-lg w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-100/50 transition-colors">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 tracking-tight">{item.label}</p>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-slate-400 italic">Phase 1 · April 2026</p>
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User menu */}
          {userEmail && (
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(v => !v); setOpen(false) }}
                className={`flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full text-xs font-bold transition-all border ${userMenuOpen
                    ? 'bg-slate-100 border-slate-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                  }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm shadow-blue-600/20">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] lg:max-w-[120px] truncate text-slate-700">{userEmail.split('@')[0]}</span>
                <svg className={`w-3 h-3 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</p>
                      <p className="text-xs text-slate-600 truncate font-medium mt-0.5">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => { supabase.auth.signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
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

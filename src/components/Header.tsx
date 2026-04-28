import { useState } from 'react'

interface HeaderProps {
  pageTitle: string
  onNavigate: (page: string) => void
}

const QUICK_LINKS = [
  {
    group: 'Pages',
    items: [
      { id: 'overview',   label: 'Dashboard Overview',  icon: '◈', desc: 'KPIs, alerts, quick answers' },
      { id: 'calls',      label: 'Call Analysis',        icon: '📞', desc: 'Funnel, attempts, repeat callers' },
      { id: 'records',    label: 'Call Records',         icon: '🎙️', desc: 'Browse calls + play recordings' },
      { id: 'survey',     label: 'Survey Results',       icon: '📋', desc: 'Q1–Q5 satisfaction breakdown' },
      { id: 'schemes',    label: 'Scheme Coverage',      icon: '🏗️', desc: 'Functional vs non-functional' },
      { id: 'geographic', label: 'Zone & Districts',     icon: '🗺️', desc: 'BSI rankings by geography' },
    ],
  },
  {
    group: 'Quick filters',
    items: [
      { id: 'records', label: 'Dissatisfied calls with recordings', icon: '😞', desc: 'Call Records → Completed · Dissatisfied' },
      { id: 'geographic', label: 'Critical zones deep-dive', icon: '🔴', desc: 'BTAD & Barak Valley districts' },
      { id: 'schemes',    label: 'Non-functional schemes', icon: '⚠️', desc: '507 schemes failing functionality test' },
    ],
  },
]

export function Header({ pageTitle, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between h-14 flex-shrink-0 relative z-50">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">Araghyam · CSAT AI Phase 1</p>
          <h2 className="text-sm font-bold text-gray-800 leading-none">{pageTitle}</h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Quick Jump dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              open
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            ⚡ Quick Jump
            <span>{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
                {QUICK_LINKS.map(group => (
                  <div key={group.group}>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {group.group}
                    </p>
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        onClick={() => { onNavigate(item.id); setOpen(false) }}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                      >
                        <span className="text-base mt-0.5 w-5 flex-shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-400">Araghyam · April 2026 · 45,863 calls · Assam</p>
                </div>
              </div>
            </>
          )}
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · April 2026
        </span>
        <span className="hidden md:inline text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full">
          45,863 calls
        </span>
      </div>
    </div>
  )
}

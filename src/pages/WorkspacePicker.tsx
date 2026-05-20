interface WorkspacePickerProps {
  userEmail: string
  onSelect: (ws: 'main' | 'tinsukia') => void
}

export function WorkspacePicker({ userEmail, onSelect }: WorkspacePickerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <span className="text-white text-xl font-black">A</span>
          </div>
          <h1 className="text-white text-2xl font-black mb-1">Choose Dashboard</h1>
          <p className="text-slate-500 text-sm">Signed in as <span className="text-slate-300 font-medium">{userEmail}</span></p>
        </div>

        {/* Workspace cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Main Dashboard */}
          <button
            onClick={() => onSelect('main')}
            className="group relative text-left bg-white/[0.04] border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/[0.06] rounded-2xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /><circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-white font-bold text-base mb-1">Main Dashboard</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">All Assam · 33 districts · 7 zones · full state-level analysis</p>
            <div className="flex flex-wrap gap-1.5">
              {['125,588 calls', 'Phase 1 + 2', 'All districts'].map(t => (
                <span key={t} className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </button>

          {/* Tinsukia Dashboard */}
          <button
            onClick={() => onSelect('tinsukia')}
            className="group relative text-left bg-white/[0.04] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/[0.06] rounded-2xl p-6 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Most Improved</span>
                <svg className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-white font-bold text-base mb-1">Tinsukia District</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">Upper Assam · focused district analysis · scheme-level breakdown</p>
            <div className="flex flex-wrap gap-1.5">
              {['806 calls', '8 valid schemes', '+8% Score improvement'].map(t => (
                <span key={t} className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Arghyam · CSAT AI · Assam Jal Jeevan Mission · Government of Assam
        </p>
      </div>
    </div>
  )
}

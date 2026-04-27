export function Header() {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Assam Jal Jeevan Mission
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                CSAT AI Phase 1 — Official Results Dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            AI Voice Bot (Raya)
          </span>
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            45,863 Calls
          </span>
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            2,373 Schemes · 7 Zones · 31 Districts
          </span>
          <span className="bg-blue-950 border border-blue-800 text-blue-300 px-3 py-1.5 rounded-full font-medium">
            April 2026
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Good ≥ 0.70
        </span>
        <span className="mx-1">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate 0.40–0.69
        </span>
        <span className="mx-1">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Critical &lt; 0.40
        </span>
        <span className="mx-1">·</span>
        <span>BSI scale 0–1.0 · Benchmark ≥ 0.70 = Good</span>
      </div>
    </div>
  )
}

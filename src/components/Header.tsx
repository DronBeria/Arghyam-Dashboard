export function Header() {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top gov banner */}
      <div className="bg-blue-900 px-6 py-1.5 flex items-center justify-between">
        <span className="text-xs text-blue-200 font-medium tracking-wide">
          Government of Assam · Jal Jeevan Mission
        </span>
        <span className="text-xs text-blue-300">
          Phase 1 Report · April 2026
        </span>
      </div>

      {/* Main header */}
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Emblem placeholder */}
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-white text-lg font-bold">JJM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                Assam Jal Jeevan Mission
              </h1>
              <p className="text-sm text-blue-700 font-medium mt-0.5">
                CSAT AI Phase 1 — Official Beneficiary Satisfaction Report
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI Voice Bot (Raya) · 45,863 calls · 2,373 schemes · 7 zones · 31 districts
              </p>
            </div>
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-2 sm:text-right">
            {[
              { color: 'bg-emerald-500', label: 'Good', sub: '≥ 70%' },
              { color: 'bg-amber-500',   label: 'Moderate', sub: '40–69%' },
              { color: 'bg-red-500',     label: 'Critical', sub: '< 40%' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-xs font-medium text-gray-700">{s.label}</span>
                <span className="text-xs text-gray-400">{s.sub}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-blue-700">BSI</span>
              <span className="text-xs text-blue-500">scale 0–1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

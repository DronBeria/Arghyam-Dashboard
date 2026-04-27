import { CALL_SUMMARY, CALL_SUMMARY_NOTE } from '../data/csatData'

function fmt(n: number) {
  return n.toLocaleString()
}

export function CallSummary() {
  return (
    <section id="call-summary" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        1. Call Summary
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        All 45,863 calls — Consented 27.4% + Did not consent 72.6% = 100%
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Call Group</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Count</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">% of 45,863</th>
              <th className="text-left py-2 pl-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {CALL_SUMMARY.map((row, i) => {
              const isTotal   = row.group.includes('Total calls')
              const isUsable  = row.group.includes('Usable')
              const isHighlight = isTotal || isUsable
              return (
                <tr
                  key={i}
                  className={`border-b border-slate-800/50 ${
                    isTotal  ? 'bg-blue-950/30 font-semibold' :
                    isUsable ? 'bg-emerald-950/20 font-medium' : ''
                  }`}
                >
                  <td className="py-2 pr-4 text-slate-300 font-mono text-xs">{row.group}</td>
                  <td className="py-2 px-3 text-right text-slate-200 font-mono">{fmt(row.count)}</td>
                  <td className="py-2 px-3 text-right text-slate-400 font-mono">{row.pct.toFixed(1)}%</td>
                  <td className="py-2 pl-3 text-slate-500 text-xs hidden md:table-cell">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 text-xs text-amber-300 leading-relaxed">
        <span className="font-semibold">⚠ Note: </span>{CALL_SUMMARY_NOTE}
      </div>
    </section>
  )
}

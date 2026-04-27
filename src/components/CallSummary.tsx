import { CALL_SUMMARY, CALL_SUMMARY_NOTE } from '../data/csatData'

function fmt(n: number) { return n.toLocaleString() }

export function CallSummary() {
  return (
    <div>
      <h2 className="section-title">1. Call Summary</h2>
      <p className="section-sub">All 45,863 calls — Consented 27.4% + Did not consent 72.6% = 100%</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Call Group</th>
              <th className="th text-right">Count</th>
              <th className="th text-right">%</th>
              <th className="th hidden lg:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {CALL_SUMMARY.map((row, i) => {
              const isTotal  = row.group.includes('Total calls')
              const isUsable = row.group.includes('Usable')
              const isIndent = row.group.startsWith('    ')
              return (
                <tr key={i} className={`hover:bg-gray-50 ${
                  isTotal  ? 'bg-blue-50 font-semibold' :
                  isUsable ? 'bg-emerald-50 font-medium' :
                  isIndent ? 'bg-gray-50/70' : ''
                }`}>
                  <td className="td font-mono text-xs whitespace-nowrap">{row.group}</td>
                  <td className="td-mono text-right font-semibold">{fmt(row.count)}</td>
                  <td className={`td-mono text-right ${
                    isTotal ? 'text-blue-700' : isUsable ? 'text-emerald-700' : 'text-gray-500'
                  }`}>{row.pct.toFixed(1)}%</td>
                  <td className="td text-xs text-gray-400 hidden lg:table-cell">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Note: </span>{CALL_SUMMARY_NOTE}
      </div>
    </div>
  )
}

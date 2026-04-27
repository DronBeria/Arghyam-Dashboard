import { REPEAT_CALLERS } from '../data/csatData'

export function RepeatCallers() {
  return (
    <section id="repeat-callers" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        6. Repeat Callers
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        170 households called again in a prior cycle vs 45,693 first-time callers — every metric improves with familiarity
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Metric</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                First-time<br/><span className="normal-case font-normal">(n = 45,693)</span>
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Repeat<br/><span className="normal-case font-normal">(n = 170)</span>
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Change</th>
              <th className="text-left py-2 pl-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Insight</th>
            </tr>
          </thead>
          <tbody>
            {REPEAT_CALLERS.map((row, i) => {
              const isHeader = row.metric === 'Count'
              return (
                <tr key={i} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${isHeader ? 'bg-slate-800/40' : ''}`}>
                  <td className="py-2 pr-3 text-slate-300 font-medium">{row.metric}</td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">{row.firstTime}</td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-mono font-semibold">{row.repeat}</td>
                  <td className="py-2 px-3 text-right text-blue-400 font-mono text-sm font-bold">{row.change}</td>
                  <td className="py-2 pl-3 text-slate-500 text-xs hidden md:table-cell">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-blue-950/20 border border-blue-900/40 rounded p-3 text-xs text-blue-300 leading-relaxed">
        <span className="font-semibold">Key insight: </span>
        Repeat callers consent at 44.7% vs 27.4% for first-time — familiarity with the Raya bot drives ~2× better data yield. Prioritise re-calling in Phase 2 for better coverage.
      </div>
    </section>
  )
}

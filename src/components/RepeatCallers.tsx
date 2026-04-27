import { REPEAT_CALLERS } from '../data/csatData'

export function RepeatCallers() {
  return (
    <div>
      <h2 className="section-title">6. Repeat Callers</h2>
      <p className="section-sub">170 repeat households vs 45,693 first-time — every metric improves with familiarity</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Metric</th>
              <th className="th text-right">First-time<br/><span className="normal-case font-normal text-gray-400">(n = 45,693)</span></th>
              <th className="th text-right">Repeat<br/><span className="normal-case font-normal text-gray-400">(n = 170)</span></th>
              <th className="th text-right">Change</th>
              <th className="th hidden md:table-cell">Insight</th>
            </tr>
          </thead>
          <tbody>
            {REPEAT_CALLERS.map((row, i) => {
              const isHeader = row.metric === 'Count'
              const hasGain = row.change.startsWith('+')
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isHeader ? 'bg-gray-50 font-semibold' : ''}`}>
                  <td className="td font-medium text-gray-800">{row.metric}</td>
                  <td className="td-mono text-right text-gray-700">{row.firstTime}</td>
                  <td className="td-mono text-right font-semibold text-emerald-700">{row.repeat}</td>
                  <td className={`td-mono text-right font-bold ${hasGain ? 'text-blue-700' : 'text-gray-500'}`}>
                    {row.change}
                  </td>
                  <td className="td text-xs text-gray-400 hidden md:table-cell">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
        <span className="font-semibold">Key insight: </span>
        Repeat callers consent at 44.7% vs 27.4% for first-time. Prioritise re-calling in Phase 2 for better coverage and data quality.
      </div>
    </div>
  )
}

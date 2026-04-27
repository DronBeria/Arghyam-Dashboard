import { CALL_ATTEMPTS } from '../data/csatData'

export function CallAttempts() {
  return (
    <div>
      <h2 className="section-title">7. Call Attempts</h2>
      <p className="section-sub">Each household dialled up to 5 times · Satisfied % = of consented Q5 respondents only</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Attempt</th>
              <th className="th text-right">Total Calls</th>
              <th className="th text-right hidden sm:table-cell">% of All</th>
              <th className="th text-right">Consented</th>
              <th className="th text-right hidden md:table-cell">Consent %</th>
              <th className="th text-right hidden md:table-cell">Q5 Resp.</th>
              <th className="th text-right hidden lg:table-cell">Satisfied n</th>
              <th className="th text-right">Satisfied %</th>
            </tr>
          </thead>
          <tbody>
            {CALL_ATTEMPTS.map((row, i) => {
              const isAll = row.attempt === 'All'
              const satColor =
                row.satisfiedPct >= 55 ? 'text-emerald-700' :
                row.satisfiedPct >= 45 ? 'text-amber-700' : 'text-red-600'
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isAll ? 'bg-blue-50 font-semibold' : ''}`}>
                  <td className={`td font-mono ${isAll ? 'text-blue-700' : 'text-gray-600'}`}>
                    {isAll ? 'All' : `Attempt ${row.attempt}`}
                  </td>
                  <td className="td-mono text-right">{row.totalCalls.toLocaleString()}</td>
                  <td className="td-mono text-right text-gray-400 hidden sm:table-cell">{row.pctOfAll.toFixed(2)}%</td>
                  <td className="td-mono text-right">{row.consentedN.toLocaleString()}</td>
                  <td className="td-mono text-right text-gray-500 hidden md:table-cell">{row.consentPct}%</td>
                  <td className="td-mono text-right text-gray-500 hidden md:table-cell">{row.q5Respondents.toLocaleString()}</td>
                  <td className="td-mono text-right text-gray-400 hidden lg:table-cell">{row.satisfiedN.toLocaleString()}</td>
                  <td className={`td-mono text-right font-bold ${satColor}`}>{row.satisfiedPct.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 leading-relaxed">
        Attempt 4 shows the lowest satisfaction (38.5%) — households requiring 4+ calls may be less engaged. Attempt 5's 63.0% is based on a small sample (27 respondents).
      </div>
    </div>
  )
}

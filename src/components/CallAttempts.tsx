import { CALL_ATTEMPTS } from '../data/csatData'

export function CallAttempts() {
  return (
    <section id="call-attempts" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        7. Call Attempts
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Each household dialled up to 5 times · Satisfied % = of consented Q5 respondents only
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Attempt</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Total Calls</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">% of All</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Consented</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Consent %</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Q5 Resp.</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Satisfied n</th>
              <th className="text-right py-2 pl-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Satisfied %</th>
            </tr>
          </thead>
          <tbody>
            {CALL_ATTEMPTS.map((row, i) => {
              const isAll = row.attempt === 'All'
              const satisfiedColor =
                row.satisfiedPct >= 55 ? 'text-emerald-400' :
                row.satisfiedPct >= 45 ? 'text-amber-400' : 'text-red-400'
              return (
                <tr
                  key={i}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${isAll ? 'bg-blue-950/20 font-semibold' : ''}`}
                >
                  <td className={`py-2 pr-3 font-mono ${isAll ? 'text-blue-300' : 'text-slate-400'}`}>
                    {isAll ? 'All' : `Attempt ${row.attempt}`}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300 font-mono">
                    {row.totalCalls.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-500 font-mono text-xs hidden sm:table-cell">
                    {row.pctOfAll.toFixed(2)}%
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300 font-mono">
                    {row.consentedN.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                    {row.consentPct}%
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                    {row.q5Respondents.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden lg:table-cell">
                    {row.satisfiedN.toLocaleString()}
                  </td>
                  <td className={`py-2 pl-2 text-right font-mono font-bold ${satisfiedColor}`}>
                    {row.satisfiedPct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-slate-800/30 border border-slate-700 rounded p-3 text-xs text-slate-400 leading-relaxed">
        Attempt 4 shows the lowest satisfaction (38.5%) — households that need 4+ calls to respond may be less engaged. Attempt 5's higher satisfied% (63.0%) is based on a small sample (27 respondents).
      </div>
    </section>
  )
}

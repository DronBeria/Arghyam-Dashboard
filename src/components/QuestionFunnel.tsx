import { QUESTION_FUNNEL } from '../data/csatData'

export function QuestionFunnel() {
  const maxAnswered = QUESTION_FUNNEL[0].answered

  return (
    <div>
      <h2 className="section-title">8. Question Response Funnel</h2>
      <p className="section-sub">How many answered each question · Q1A is a follow-up to Q1 (base = Q1=Yes callers) · Q2, Q3, Q5 use consented base</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual funnel */}
        <div className="space-y-3">
          {QUESTION_FUNNEL.map((q, i) => {
            const pct = (q.answered / maxAnswered) * 100
            const yesPct = (q.yesCount / maxAnswered) * 100
            const barColor =
              q.yesPct >= 70 ? 'bg-emerald-500' :
              q.yesPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
            const textColor =
              q.yesPct >= 70 ? 'text-emerald-700' :
              q.yesPct >= 40 ? 'text-amber-700' : 'text-red-600'
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-6 text-center py-0.5 rounded ${barColor} text-white`}>{q.q}</span>
                    <span className="text-sm font-medium text-gray-700">{q.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${textColor}`}>{q.yesPct.toFixed(1)}% yes</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                  <div className="h-full bg-gray-200 rounded-lg transition-all" style={{ width: `${pct}%` }} />
                  <div className={`absolute top-0 left-0 h-full ${barColor} opacity-80 rounded-lg transition-all`}
                    style={{ width: `${yesPct}%` }} />
                  <div className="absolute inset-0 flex items-center px-3 justify-between">
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {q.answered.toLocaleString()} answered
                    </span>
                    <span className="text-xs text-white/90 drop-shadow">
                      {q.yesCount.toLocaleString()} yes
                    </span>
                  </div>
                </div>
                {q.note && <p className="text-xs text-gray-400 mt-0.5 pl-8">{q.note}</p>}
              </div>
            )
          })}
          <p className="text-xs text-gray-400 mt-1">Bar width = answered as % of Q1 base · Color = yes% satisfaction</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 h-fit">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Q</th>
                <th className="th text-right">Answered</th>
                <th className="th text-right">Yes</th>
                <th className="th text-right">No</th>
                <th className="th text-right">Yes %</th>
                <th className="th hidden sm:table-cell">Base</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_FUNNEL.map((q) => (
                <tr key={q.q} className="hover:bg-gray-50">
                  <td className="td font-mono text-xs font-bold text-gray-500">{q.q}</td>
                  <td className="td-mono text-right">{q.answered.toLocaleString()}</td>
                  <td className="td-mono text-right text-emerald-600 text-xs">{q.yesCount.toLocaleString()}</td>
                  <td className="td-mono text-right text-red-500 text-xs">{q.noCount.toLocaleString()}</td>
                  <td className={`td-mono text-right font-bold ${
                    q.yesPct >= 70 ? 'text-emerald-700' :
                    q.yesPct >= 40 ? 'text-amber-700' : 'text-red-600'
                  }`}>{q.yesPct.toFixed(1)}%</td>
                  <td className="td text-xs text-gray-400 hidden sm:table-cell">{q.askedLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">Note on bases: </span>
            Q1 base = 9,224 usable calls. Q1A base = 2,855 (Q1=Yes callers only — follow-up question). Q2, Q3, Q5 base = 12,583 consented calls.
          </div>
        </div>
      </div>
    </div>
  )
}

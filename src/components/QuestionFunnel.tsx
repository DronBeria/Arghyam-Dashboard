import { QUESTION_FUNNEL } from '../data/csatData'

export function QuestionFunnel() {
  const maxAnswered = QUESTION_FUNNEL[0].answered

  return (
    <section id="question-funnel" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        8. Question Response Funnel
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        How many answered each question · Questions are NOT strictly sequential · Independent bases
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual funnel */}
        <div className="space-y-2">
          {QUESTION_FUNNEL.map((q, i) => {
            const pct = (q.answered / maxAnswered) * 100
            const barColor =
              q.yesPct >= 70 ? 'bg-emerald-500' :
              q.yesPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
            return (
              <div key={i} className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500 w-6">{q.q}</span>
                  <span className="text-xs text-slate-300 font-medium">{q.label}</span>
                  <span className={`ml-auto text-xs font-bold ${
                    q.yesPct >= 70 ? 'text-emerald-400' :
                    q.yesPct >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>{q.yesPct.toFixed(1)}% yes</span>
                </div>
                {/* Answered bar */}
                <div className="h-7 bg-slate-800 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-slate-700 rounded transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  {/* Yes portion */}
                  <div
                    className={`absolute top-0 left-0 h-full ${barColor} opacity-70 rounded transition-all`}
                    style={{ width: `${(q.yesCount / maxAnswered) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-xs font-mono text-white font-semibold">
                      {q.answered.toLocaleString()} answered
                    </span>
                    <span className="ml-auto text-xs font-mono text-white/70">
                      {q.yesCount.toLocaleString()} yes / {q.noCount.toLocaleString()} no
                    </span>
                  </div>
                </div>
                {q.note && (
                  <p className="text-xs text-slate-600 mt-0.5 pl-8">{q.note}</p>
                )}
              </div>
            )
          })}
          <div className="mt-2 text-xs text-slate-500">
            Bar width = answered as % of Q1 base (9,224) · Color = % yes satisfaction
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 pr-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Q</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Answered</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Yes</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">No</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Yes %</th>
                <th className="text-left py-2 pl-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Base</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_FUNNEL.map((q) => (
                <tr key={q.q} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2 pr-2 text-slate-400 font-mono text-xs">{q.q}</td>
                  <td className="py-2 px-2 text-right text-slate-300 font-mono">{q.answered.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-emerald-400 font-mono text-xs">{q.yesCount.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-red-400 font-mono text-xs">{q.noCount.toLocaleString()}</td>
                  <td className={`py-2 px-2 text-right font-mono font-bold ${
                    q.yesPct >= 70 ? 'text-emerald-400' :
                    q.yesPct >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>{q.yesPct.toFixed(1)}%</td>
                  <td className="py-2 pl-2 text-slate-500 text-xs hidden sm:table-cell">{q.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 bg-slate-800/30 border border-slate-700 rounded p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Note on bases:</p>
            <p>Q1 base = 9,224 usable calls (any call where Q1 was answered). Q2–Q5 base = 12,583 consented calls — not all consented callers answered every question.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

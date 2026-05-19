import { useState } from 'react'
import { usePhaseData } from '../context/PhaseDataContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

function fmt(n: number) { return n.toLocaleString() }

type Tab = 'summary' | 'attempts' | 'repeat' | 'funnel'

export function CallAnalysisPage() {
  const data = usePhaseData()
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <div className="space-y-4">

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { id: 'summary',  label: 'Call Summary',     icon: '📊' },
          { id: 'attempts', label: 'Call Attempts',   icon: '🔄' },
          { id: 'repeat',   label: 'Repeat Callers',  icon: '↩️' },
          { id: 'funnel',   label: 'Question Funnel', icon: '🔻' },
        ] as { id: Tab; label: string; icon: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary'  && <CallSummaryTab data={data} />}
      {tab === 'attempts' && <AttemptsTab data={data} />}
      {tab === 'repeat'   && <RepeatTab data={data} />}
      {tab === 'funnel'   && <QuestionFunnelTab data={data} />}
    </div>
  )
}

// ─── Call Summary ─────────────────────────────────────────────────────────────

function CallSummaryTab({ data }: { data: ReturnType<typeof usePhaseData> }) {
  const { KPI_HEADLINE, CALL_SUMMARY, OUTCOME_BREAKDOWN } = data
  const summaryRows = [
    { label: 'Total calls dialled',       count: KPI_HEADLINE.totalCalls,   pct: 100.0,                              bold: true  },
    { label: 'Consented',                  count: Math.round(KPI_HEADLINE.totalCalls * KPI_HEADLINE.consentRate / 100), pct: KPI_HEADLINE.consentRate, bold: false },
    { label: 'Did not consent',            count: KPI_HEADLINE.totalCalls - Math.round(KPI_HEADLINE.totalCalls * KPI_HEADLINE.consentRate / 100), pct: +(100 - KPI_HEADLINE.consentRate).toFixed(1), bold: false },
    { label: 'Usable calls (Q1 answered)', count: CALL_SUMMARY.find(r => r.group.startsWith('Usable'))?.count ?? 0, pct: CALL_SUMMARY.find(r => r.group.startsWith('Usable'))?.pct ?? 0, bold: true  },
    { label: 'Reached Q5 (Overall)',       count: KPI_HEADLINE.completedSurvey, pct: +(KPI_HEADLINE.completedSurvey / KPI_HEADLINE.totalCalls * 100).toFixed(1), bold: false },
    { label: 'Completed all 5 questions',  count: CALL_SUMMARY.find(r => r.group.includes('Completed'))?.count ?? 0, pct: CALL_SUMMARY.find(r => r.group.includes('Completed'))?.pct ?? 0, bold: false },
  ]

  return (
    <div className="space-y-4">

      {/* Outcome breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Call Outcome Breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">How all {fmt(KPI_HEADLINE.totalCalls)} calls resolved</p>

        <div className="h-4 rounded-full overflow-hidden flex mb-3">
          {OUTCOME_BREAKDOWN.map(o => (
            <div key={o.label} className={`${o.color} h-full`} style={{ width: `${o.pct}%` }} title={`${o.label}: ${o.pct}%`} />
          ))}
        </div>

        <div className="space-y-2">
          {OUTCOME_BREAKDOWN.map(o => (
            <div key={o.label} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${o.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-700 font-medium truncate">{o.label}</span>
                  <span className="text-xs font-mono text-gray-500 ml-2 flex-shrink-0">{fmt(o.val)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${o.color} rounded-full`} style={{ width: `${o.pct}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-600 w-10 text-right flex-shrink-0">{o.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call summary table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Call Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="th text-left">Category</th>
              <th className="th text-right">Count</th>
              <th className="th text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 last:border-0 ${row.bold ? 'bg-slate-50/80' : ''}`}>
                <td className={`td text-xs ${row.bold ? 'font-bold text-gray-800' : 'text-gray-500 pl-5'}`}>{row.label}</td>
                <td className="td-mono text-right font-semibold">{fmt(row.count)}</td>
                <td className="td-mono text-right text-gray-400">{row.pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Call Attempts ────────────────────────────────────────────────────────────

function AttemptsTab({ data }: { data: ReturnType<typeof usePhaseData> }) {
  const { CALL_ATTEMPTS, ATTEMPT_CHART, attemptsInsight } = data
  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ATTEMPT_CHART.map(a => {
          const satColor = a.satisfied >= 55 ? 'text-emerald-700' : a.satisfied >= 45 ? 'text-amber-700' : 'text-red-600'
          const satBg    = a.satisfied >= 55 ? 'bg-emerald-50 border-emerald-200' : a.satisfied >= 45 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
          const conColor = a.consent >= 26 ? 'text-emerald-700' : a.consent >= 23 ? 'text-amber-700' : 'text-red-600'
          return (
            <div key={a.attempt} className={`rounded-xl border p-3.5 ${satBg}`}>
              <p className="text-xs font-bold text-gray-500 mb-2">{a.attempt} Attempt</p>
              <p className={`text-xl font-black leading-none ${satColor}`}>{a.satisfied}%</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Satisfied</p>
              <div className="pt-2 border-t border-current border-opacity-10">
                <p className={`text-sm font-bold ${conColor}`}>{a.consent}%</p>
                <p className="text-xs text-gray-400">Consent rate</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dual chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-800">Performance by Attempt Number</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Each household dialled up to 5 times · Consent % and Satisfaction %</p>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ATTEMPT_CHART} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="attempt" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 80]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" axisLine={false} tickLine={false} />
              <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="4 2" label={{ value: '50%', position: 'right', fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                formatter={(val: number, name: string) => [`${val}%`, name === 'consent' ? 'Consent Rate' : 'Satisfaction']}
              />
              <Bar dataKey="consent" name="consent" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="satisfied" name="satisfied" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {ATTEMPT_CHART.map((e, i) => (
                  <Cell key={i} fill={
                    e.satisfied >= 55 ? '#10b981' :
                    e.satisfied >= 45 ? '#f59e0b' : '#ef4444'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-5 mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-indigo-300" />
            <span className="text-xs text-gray-500">Consent Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-gray-500">Satisfied ≥55%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-xs text-gray-500">45–55%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-xs text-gray-500">&lt;45%</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Detailed Attempt Breakdown</h3>
          <p className="text-xs text-gray-400">All 5 attempt tiers + aggregate</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
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
                const isAll    = row.attempt === 'All'
                const satColor = row.satisfiedPct >= 55 ? 'text-emerald-700' : row.satisfiedPct >= 45 ? 'text-amber-700' : 'text-red-600'
                return (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 ${isAll ? 'bg-blue-50' : ''}`}>
                    <td className={`td font-mono font-semibold ${isAll ? 'text-blue-700' : 'text-gray-600'}`}>
                      {isAll ? 'All Attempts' : `Attempt ${row.attempt}`}
                    </td>
                    <td className="td-mono text-right">{fmt(row.totalCalls)}</td>
                    <td className="td-mono text-right text-gray-400 hidden sm:table-cell">{row.pctOfAll.toFixed(2)}%</td>
                    <td className="td-mono text-right">{fmt(row.consentedN)}</td>
                    <td className="td-mono text-right text-gray-500 hidden md:table-cell">{row.consentPct}%</td>
                    <td className="td-mono text-right text-gray-500 hidden md:table-cell">{fmt(row.q5Respondents)}</td>
                    <td className="td-mono text-right text-gray-400 hidden lg:table-cell">{fmt(row.satisfiedN)}</td>
                    <td className={`td-mono text-right font-bold ${satColor}`}>{row.satisfiedPct.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-600">Note on Q5 base:</strong> {data.q5NoteText}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
        <strong>Insight:</strong> {attemptsInsight}
      </div>
    </div>
  )
}

// ─── Repeat Callers ───────────────────────────────────────────────────────────

function RepeatTab({ data }: { data: ReturnType<typeof usePhaseData> }) {
  const LIFT_CARDS = data.liftCards
  const TREND      = data.repeatTrend

  return (
    <div className="space-y-4">

      {/* Headline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">First-Time vs Repeat Callers</h3>
            <p className="text-xs text-gray-400 mt-0.5">{data.REPEAT_CALLERS[0]?.repeat} households previously contacted — key metric comparison</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold flex-shrink-0 ml-3">
            {data.REPEAT_CALLERS[0]?.repeat} repeat HH
          </span>
        </div>

        {/* Lift cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {LIFT_CARDS.map(c => {
            const lift = ((c.repeat - c.first) / c.first * 100).toFixed(0)
            return (
              <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
                <p className="text-xs text-gray-500 font-medium mb-2">{c.label}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-xl font-black leading-none ${c.color}`}>{c.repeat}{c.unit}</span>
                  <span className="text-xs text-gray-400 mb-0.5">repeat</span>
                </div>
                <p className="text-xs text-gray-400">vs {c.first}{c.unit} first-time</p>
                <p className={`text-xs font-bold mt-2 ${c.color}`}>+{lift}% lift</p>
              </div>
            )
          })}
        </div>

        {/* Side-by-side bar comparison */}
        <div className="space-y-3">
          {TREND.map(t => {
            const maxVal = Math.max(t.first, t.repeat) * 1.15
            return (
              <div key={t.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{t.name} Rate</span>
                  <span className="text-gray-400 font-mono">{t.first}% → <span className="text-blue-600 font-bold">{t.repeat}%</span></span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">First-time</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(t.first / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-8 flex-shrink-0">{t.first}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-semibold w-16 text-right flex-shrink-0">Repeat</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(t.repeat / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 w-8 flex-shrink-0">{t.repeat}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Detailed Metric Comparison</h3>
          <p className="text-xs text-gray-400">All tracked metrics across caller groups</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Metric</th>
                <th className="th text-center">First-Time</th>
                <th className="th text-center">Repeat</th>
                <th className="th text-center hidden sm:table-cell">Change</th>
                <th className="th hidden md:table-cell">Insight</th>
              </tr>
            </thead>
            <tbody>
              {data.REPEAT_CALLERS.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="td font-medium text-gray-700">{row.metric}</td>
                  <td className="td-mono text-center text-gray-500">{row.firstTime}</td>
                  <td className="td-mono text-center text-blue-700 font-bold">{row.repeat}</td>
                  <td className={`td-mono text-center hidden sm:table-cell font-bold ${
                    row.change.startsWith('+') ? 'text-emerald-700' : 'text-gray-400'
                  }`}>{row.change || '—'}</td>
                  <td className="td text-xs text-gray-400 hidden md:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-700 leading-relaxed">
        <strong>Key insight:</strong> {data.repeatInsight}
      </div>
    </div>
  )
}

// ─── Question Funnel ──────────────────────────────────────────────────────────

function QuestionFunnelTab({ data }: { data: ReturnType<typeof usePhaseData> }) {
  const { QUESTION_FUNNEL, funnelCards } = data

  return (
    <div className="space-y-4">

      {/* Context header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {funnelCards.map(k => (
          <div key={k.label} className={`rounded-xl border p-3.5 ${k.bg}`}>
            <p className={`text-xl font-black leading-none ${k.color}`}>{k.val}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{k.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-question visual bars */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Response Rate + Yes/No Split per Question</h3>
        <p className="text-xs text-gray-400 mb-1">Two separate metrics per question:</p>
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-slate-300 rounded-sm inline-block"/>Response rate = answered ÷ asked (how many responded)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-400 rounded-sm inline-block"/>Yes % = yes ÷ answered (of those who responded, how many said yes)</span>
        </div>
        <div className="space-y-5">
          {QUESTION_FUNNEL.map(q => {
            const yesPctColor = q.yesPct >= 70 ? 'text-emerald-700' : q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
            const yesBarColor = q.yesPct >= 70 ? 'bg-emerald-500' : q.yesPct >= 50 ? 'bg-amber-400' : 'bg-red-400'

            return (
              <div key={q.q} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-gray-400 w-5">{q.q}</span>
                    <span className="text-xs font-semibold text-gray-800">{q.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{q.note}</span>
                </div>

                {/* Metric 1: Response rate */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                    <span className="font-medium text-gray-500">Response rate</span>
                    <span className="font-bold text-gray-700">{q.answered.toLocaleString()} of {q.askedN.toLocaleString()} asked = <strong>{q.responsePct.toFixed(1)}%</strong></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full" style={{ width: `${q.responsePct}%` }} />
                  </div>
                </div>

                {/* Metric 2: Yes/No of those who answered */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                    <span className="font-medium text-gray-500">Yes % <span className="text-gray-400 font-normal">(of {q.answered.toLocaleString()} who answered)</span></span>
                    <span className={`font-black ${yesPctColor}`}>{q.yesPct.toFixed(2)}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden flex">
                    <div className={`h-full ${yesBarColor}`} style={{ width: `${q.yesPct}%` }} />
                    <div className="h-full bg-red-200 flex-1" />
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-emerald-700 font-semibold">Yes: {q.yesCount.toLocaleString()}</span>
                    <span className="text-red-500">No: {q.noCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Full table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Question Response Detail</h3>
          <p className="text-xs text-gray-400">All 5 questions · Yes/No counts · % of base</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Q</th>
                <th className="th">Indicator</th>
                <th className="th text-right">Asked</th>
                <th className="th text-right">Answered</th>
                <th className="th text-right hidden sm:table-cell">Response %</th>
                <th className="th text-right hidden sm:table-cell">Yes n</th>
                <th className="th text-right hidden sm:table-cell">No n</th>
                <th className="th text-right">Yes % of answered</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_FUNNEL.map(q => {
                const yesPctColor = q.yesPct >= 70 ? 'text-emerald-700' : q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
                return (
                  <tr key={q.q} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="td font-mono text-xs font-bold text-gray-500">{q.q}</td>
                    <td className="td font-medium text-gray-800">{q.label}</td>
                    <td className="td-mono text-right text-gray-400">{q.askedN.toLocaleString()}</td>
                    <td className="td-mono text-right">{q.answered.toLocaleString()}</td>
                    <td className="td-mono text-right text-gray-500 hidden sm:table-cell">{q.responsePct.toFixed(1)}%</td>
                    <td className="td-mono text-right text-emerald-700 hidden sm:table-cell">{q.yesCount.toLocaleString()}</td>
                    <td className="td-mono text-right text-red-500 hidden sm:table-cell">{q.noCount.toLocaleString()}</td>
                    <td className={`td-mono text-right font-bold ${yesPctColor}`}>{q.yesPct.toFixed(1)}%</td>
                    <td className="td text-xs text-gray-400 hidden lg:table-cell">{q.askedLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
          Q5 note: {data.q5BaseNote}
        </div>
      </div>

    </div>
  )
}

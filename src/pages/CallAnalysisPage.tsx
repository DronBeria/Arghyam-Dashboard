import { useState } from 'react'
import { CALL_SUMMARY, CALL_ATTEMPTS, REPEAT_CALLERS, QUESTION_FUNNEL } from '../data/csatData'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

function fmt(n: number) { return n.toLocaleString() }

type Tab = 'summary' | 'attempts' | 'repeat' | 'funnel'

// Derived from CALL_ATTEMPTS source — consent/satisfied pcts verified against Excel
const ATTEMPT_CHART = [
  { attempt: '1st', consent: 28, satisfied: 52.3, calls: 39633 },
  { attempt: '2nd', consent: 25, satisfied: 51.7, calls: 4224  },
  { attempt: '3rd', consent: 23, satisfied: 47.5, calls: 1220  },
  { attempt: '4th', consent: 22, satisfied: 38.5, calls: 479   },
  { attempt: '5th', consent: 23, satisfied: 63.0, calls: 307   },
]

const FUNNEL_STEPS = [
  { label: 'Total Dialled',      val: 45863, pct: 100,  color: 'bg-blue-500',    textColor: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'     },
  { label: 'Consented (Yes)',    val: 12583, pct: 27.4, color: 'bg-indigo-500',  textColor: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
  { label: 'Usable (Q1+ answ.)', val: 9224,  pct: 20.1, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200'},
  { label: 'All Questions Done', val: 1578,  pct: 3.4,  color: 'bg-emerald-700', textColor: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-300'},
]

// Derived from CALL_SUMMARY — explicitly refused: 31,710 of which 897 were usable
// 31,710 − 897 = 30,813 clean refused; no response: 1,208; unknown: 362
// Total: 12,583 + 897 + 30,813 + 1,208 + 362 = 45,863 ✓
const OUTCOME_BREAKDOWN = [
  { label: 'Answered – Consented',        val: 12583, pct: 27.4, color: 'bg-emerald-400' },
  { label: 'Answered – Refused (usable)', val: 897,   pct: 2.0,  color: 'bg-amber-400'   },
  { label: 'Answered – Refused (clean)',  val: 30813, pct: 67.2, color: 'bg-orange-400'  },
  { label: 'No Response (blank)',          val: 1208,  pct: 2.6,  color: 'bg-red-300'     },
  { label: 'Unknown / Invalid',            val: 362,   pct: 0.8,  color: 'bg-gray-300'    },
]

export function CallAnalysisPage() {
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

      {tab === 'summary'  && <CallSummaryTab />}
      {tab === 'attempts' && <AttemptsTab />}
      {tab === 'repeat'   && <RepeatTab />}
      {tab === 'funnel'   && <QuestionFunnelTab />}
    </div>
  )
}

// ─── Call Summary ─────────────────────────────────────────────────────────────

function CallSummaryTab() {
  return (
    <div className="space-y-4">

      {/* Funnel hero */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Call Funnel Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">From 45,863 dialled calls down to 9,224 usable data points</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
            Phase 1 · April 2026
          </span>
        </div>

        {/* Funnel steps */}
        <div className="flex items-end gap-2 mb-6">
          {FUNNEL_STEPS.map((s) => {
            const height = Math.max(16, (s.pct / 100) * 88)
            return (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-center">
                  <p className={`text-base font-black ${s.textColor}`}>{fmt(s.val)}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.pct}%</p>
                </div>
                <div className="w-full flex justify-center">
                  <div
                    className={`w-full rounded-lg ${s.color} opacity-90`}
                    style={{ height: `${height}px` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center leading-tight font-medium">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Drop rates */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm font-black text-red-600">72.6%</p>
            <p className="text-xs text-gray-400">Did not consent</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-amber-600">79.9%</p>
            <p className="text-xs text-gray-400">Did not answer Q1</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-gray-500">96.6%</p>
            <p className="text-xs text-gray-400">Did not finish all Q</p>
          </div>
        </div>
      </div>

      {/* Outcome breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Call Outcome Breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">How all 45,863 calls resolved</p>

        {/* Stacked bar */}
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

      {/* Detailed table + note */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Detailed Call Log Table</h3>
          <p className="text-xs text-gray-400">Full breakdown by category</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th text-left">Category</th>
                <th className="th text-right">Count</th>
                <th className="th text-right hidden sm:table-cell">%</th>
                <th className="th hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {CALL_SUMMARY.map((row, i) => {
                const isHeader = !row.group.startsWith('└') && !row.group.startsWith(' ')
                return (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 ${isHeader ? 'bg-slate-50' : ''}`}>
                    <td className={`td font-mono text-xs ${isHeader ? 'font-semibold text-gray-800' : 'text-gray-500 pl-6'}`}>
                      {row.group}
                    </td>
                    <td className="td-mono text-right font-medium">{fmt(row.count)}</td>
                    <td className="td-mono text-right text-gray-400 hidden sm:table-cell">{row.pct.toFixed(1)}%</td>
                    <td className="td text-xs text-gray-400 hidden md:table-cell">{row.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="m-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
          <strong>Why usable = 9,224 and not 8,327?</strong> — 897 calls logged as "refused" lasted long enough (median 133 sec) that Q1 was answered before hang-up. Rule: any call where Q1 was answered = usable. 8,327 + 897 = 9,224 ✓
        </div>
      </div>
    </div>
  )
}

// ─── Call Attempts ────────────────────────────────────────────────────────────

function AttemptsTab() {
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
        <strong>Insight:</strong> Attempt 4 shows the lowest satisfaction (38.5%) — households requiring 4+ calls may be less engaged or have worse service.
        Attempt 5's 63.0% is based on a very small sample (27 respondents) and is not statistically reliable.
      </div>
    </div>
  )
}

// ─── Repeat Callers ───────────────────────────────────────────────────────────

function RepeatTab() {
  const LIFT_CARDS = [
    { label: 'Consent Rate',  first: 27.4, repeat: 44.7, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Usable Calls',  first: 20.0, repeat: 37.1, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Completion',    first: 3.4,  repeat: 5.9,  unit: '%', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
  ]

  const TREND = [
    { name: 'Consent',    first: 27.4, repeat: 44.7 },
    { name: 'Usable',     first: 20.0, repeat: 37.1 },
    { name: 'Completion', first: 3.4,  repeat: 5.9  },
  ]

  return (
    <div className="space-y-4">

      {/* Headline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">First-Time vs Repeat Callers</h3>
            <p className="text-xs text-gray-400 mt-0.5">170 households (0.37%) received more than one call — key metric comparison</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold flex-shrink-0 ml-3">
            170 repeat HH
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
              {REPEAT_CALLERS.map((row, i) => (
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
        <strong>Key insight:</strong> Repeat callers yield nearly double the data at 37.1% usable rate vs 20.0% for first-time calls.
        Phase 2 should prioritize re-contacting non-responding households from Phase 1.
      </div>
    </div>
  )
}

// ─── Question Funnel ──────────────────────────────────────────────────────────

function QuestionFunnelTab() {
  const BASE_CONSENTED = 12583
  const BASE_USABLE    = 9224

  return (
    <div className="space-y-4">

      {/* Context header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Consented base (Q2–Q5)', val: '12,583', sub: 'Agreed to survey',    color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200'   },
          { label: 'Usable base (Q1)',        val: '9,224',  sub: 'Answered Q1',          color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'       },
          { label: 'Q5 respondents',          val: '4,284',  sub: '34.1% of consented',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'     },
          { label: 'Completed all 5',         val: '1,578',  sub: '3.4% of all calls',    color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3.5 ${k.bg}`}>
            <p className={`text-xl font-black leading-none ${k.color}`}>{k.val}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{k.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-question visual bars */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Response Drop-off by Question</h3>
        <p className="text-xs text-gray-400 mb-4">
          Q1 base = 9,224 usable calls · Q2–Q5 base = 12,583 consented · Questions are not strictly sequential
        </p>
        <div className="space-y-4">
          {QUESTION_FUNNEL.map(q => {
            const yesPctColor = q.yesPct >= 70 ? 'text-emerald-700' : q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
            const yesBarColor = q.yesPct >= 70 ? 'bg-emerald-500' : q.yesPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
            const base = q.q === 'Q1' ? BASE_USABLE : BASE_CONSENTED
            const responsePct = +((q.answered / base) * 100).toFixed(1)

            return (
              <div key={q.q}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold font-mono text-gray-400 w-5">{q.q}</span>
                    <span className="text-xs font-semibold text-gray-700">{q.label}</span>
                    <span className="text-xs text-gray-300 italic hidden sm:inline">"{q.label === 'Water Daily' ? 'Did water come every day in last 7 days?' : q.label === 'Water Quality' ? 'Is the water clean enough?' : q.label === 'Water Quantity' ? 'Is there enough water?' : q.label === 'Consistent Timing' ? 'Does it arrive at a fixed time?' : 'Are you satisfied with your supply?'}"</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-mono">{q.answered.toLocaleString()} answered</span>
                    <span className={`text-sm font-black ${yesPctColor}`}>{(q.yesPct * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Response rate bar */}
                <div className="mb-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>Response rate: {responsePct}% of {q.q === 'Q1' ? '9,224 usable' : '12,583 consented'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full" style={{ width: `${Math.min(responsePct, 100)}%` }} />
                  </div>
                </div>

                {/* Yes/No split bar */}
                <div className="h-4 rounded-full overflow-hidden flex">
                  <div className={`h-full ${yesBarColor}`} style={{ width: `${q.yesPct * 100}%` }} />
                  <div className="h-full bg-red-200 flex-1" />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-emerald-700 font-medium">Yes: {q.yesCount.toLocaleString()}</span>
                  <span className="text-red-500">No: {q.noCount.toLocaleString()}</span>
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
                <th className="th text-right">Answered</th>
                <th className="th text-right hidden sm:table-cell">Yes n</th>
                <th className="th text-right hidden sm:table-cell">No n</th>
                <th className="th text-right">Yes %</th>
                <th className="th hidden lg:table-cell">Data Base</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_FUNNEL.map(q => {
                const yesPctColor = q.yesPct >= 70 ? 'text-emerald-700' : q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
                return (
                  <tr key={q.q} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="td font-mono text-xs font-bold text-gray-500">{q.q}</td>
                    <td className="td font-medium text-gray-800">{q.label}</td>
                    <td className="td-mono text-right">{q.answered.toLocaleString()}</td>
                    <td className="td-mono text-right text-emerald-700 hidden sm:table-cell">{q.yesCount.toLocaleString()}</td>
                    <td className="td-mono text-right text-red-500 hidden sm:table-cell">{q.noCount.toLocaleString()}</td>
                    <td className={`td-mono text-right font-bold ${yesPctColor}`}>{(q.yesPct * 100).toFixed(2)}%</td>
                    <td className="td text-xs text-gray-400 hidden lg:table-cell">{q.base}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
          Q5 note: 8,299 of 12,583 consented respondents did not answer Q5 (unknown / not captured).
          Only 4,284 (34.1%) gave a Q5 response — this is the base for all satisfaction figures.
        </div>
      </div>

    </div>
  )
}

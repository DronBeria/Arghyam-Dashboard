import { useState } from 'react'
import { CALL_SUMMARY, CALL_SUMMARY_NOTE, CALL_ATTEMPTS, REPEAT_CALLERS } from '../data/csatData'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

function fmt(n: number) { return n.toLocaleString() }

type Tab = 'summary' | 'attempts' | 'repeat'

const ATTEMPT_CHART = [
  { attempt: '1st', consent: 28, satisfied: 52.3 },
  { attempt: '2nd', consent: 25, satisfied: 51.7 },
  { attempt: '3rd', consent: 23, satisfied: 47.5 },
  { attempt: '4th', consent: 22, satisfied: 38.5 },
  { attempt: '5th', consent: 23, satisfied: 63.0 },
]

export function CallAnalysisPage() {
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {([
            { id: 'summary',  label: 'Call Summary',   icon: '📊' },
            { id: 'attempts', label: 'Call Attempts',  icon: '🔄' },
            { id: 'repeat',   label: 'Repeat Callers', icon: '↩️' },
          ] as { id: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'summary' && <CallSummaryTab />}
          {tab === 'attempts' && <AttemptsTab />}
          {tab === 'repeat' && <RepeatTab />}
        </div>
      </div>
    </div>
  )
}

function CallSummaryTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Call Funnel Breakdown</h3>
        <p className="text-xs text-gray-400">From 45,863 dialled calls to 9,224 usable data points</p>
      </div>

      {/* Visual funnel */}
      <div className="space-y-2">
        {[
          { label: 'Total Dialled',     val: 45863, pct: 100,  color: 'bg-blue-500',    width: 100  },
          { label: 'Consented (Yes)',   val: 12583, pct: 27.4, color: 'bg-indigo-400',  width: 27.4 },
          { label: 'Usable (Q1 answ.)', val: 9224,  pct: 20.1, color: 'bg-emerald-500', width: 20.1 },
          { label: 'Completed all Q',   val: 1578,  pct: 3.4,  color: 'bg-emerald-700', width: 3.4  },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="font-medium">{s.label}</span>
              <span className="font-mono text-gray-500">{fmt(s.val)} <span className="text-gray-400">({s.pct}%)</span></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.width}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Category</th>
              <th className="th text-right">Count</th>
              <th className="th text-right hidden sm:table-cell">%</th>
              <th className="th hidden md:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {CALL_SUMMARY.map((row, i) => {
              const isHeader = !row.group.startsWith('└') && !row.group.startsWith(' ')
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isHeader ? 'bg-slate-50' : ''}`}>
                  <td className={`td font-mono text-xs ${isHeader ? 'font-semibold text-gray-800' : 'text-gray-500 pl-4'}`}>
                    {row.group}
                  </td>
                  <td className="td-mono text-right">{fmt(row.count)}</td>
                  <td className="td-mono text-right text-gray-400 hidden sm:table-cell">{row.pct.toFixed(1)}%</td>
                  <td className="td text-xs text-gray-400 hidden md:table-cell">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
        <strong>Why usable = 9,224 and not 8,327?</strong> — 897 calls logged as "refused" lasted long enough (median 133 sec) that Q1 was answered before hang-up. Rule: any call where Q1 was answered = usable. 8,327 + 897 = 9,224 ✓
      </div>
    </div>
  )
}

function AttemptsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Performance by Attempt Number</h3>
        <p className="text-xs text-gray-400">Each household dialled up to 5 times · Satisfied % of consented Q5 respondents</p>
      </div>

      {/* Dual bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ATTEMPT_CHART} margin={{ top: 0, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="attempt" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, 80]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
              formatter={(val: number, name: string) => [`${val}%`, name === 'consent' ? 'Consent Rate' : 'Satisfaction']}
            />
            <Bar dataKey="consent" name="consent" fill="#818cf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="satisfied" name="satisfied" radius={[4, 4, 0, 0]}>
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        Attempt 4 shows the lowest satisfaction (38.5%) — households requiring 4+ calls may be less engaged.
        Attempt 5's 63.0% is based on a small sample (27 respondents).
      </div>
    </div>
  )
}

function RepeatTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">First-Time vs Repeat Callers</h3>
        <p className="text-xs text-gray-400">170 households (0.37%) received more than one call — metrics compared</p>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Consent Rate Lift', val: '+63%', sub: '27.4% → 44.7%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Usable Calls Lift', val: '+86%', sub: '20.0% → 37.1%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Completion Lift',   val: '≈ 2×', sub: '3.4% → 5.9%',  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'     },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
            <div className="text-xs font-medium text-gray-600 mt-1">{c.label}</div>
            <div className="text-xs text-gray-400">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Metric</th>
              <th className="th text-center">First-Time</th>
              <th className="th text-center">Repeat</th>
              <th className="th text-center hidden sm:table-cell">Change</th>
              <th className="th hidden md:table-cell">Insight</th>
            </tr>
          </thead>
          <tbody>
            {REPEAT_CALLERS.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="td font-medium text-gray-700">{row.metric}</td>
                <td className="td-mono text-center">{row.firstTime}</td>
                <td className="td-mono text-center text-blue-700 font-semibold">{row.repeat}</td>
                <td className={`td-mono text-center hidden sm:table-cell font-bold ${
                  row.change.startsWith('+') ? 'text-emerald-700' : 'text-gray-400'
                }`}>{row.change || '—'}</td>
                <td className="td text-xs text-gray-400 hidden md:table-cell">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700">
        <strong>Key insight:</strong> Repeat callers yield nearly double the data at 37.1% usable rate vs 20.0% for first-time calls.
        Phase 2 should prioritize re-contacting non-responding households.
      </div>
    </div>
  )
}

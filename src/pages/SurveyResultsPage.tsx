import { useState } from 'react'
import { KPI_QUESTIONS, Q5_SPLIT, QUESTION_FUNNEL } from '../data/csatData'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ReferenceLine, ResponsiveContainer, PieChart, Pie, Legend,
} from 'recharts'
import { StatusBadge } from '../components/StatusBadge'

type Tab = 'kpi' | 'q5' | 'funnel'

const SORTED_Q = [...KPI_QUESTIONS].sort((a, b) => b.yesPct - a.yesPct)

export function SurveyResultsPage() {
  const [tab, setTab] = useState<Tab>('kpi')
  const [selectedQ, setSelectedQ] = useState<string | null>(null)

  const activeQ = selectedQ ? KPI_QUESTIONS.find(q => q.id === selectedQ) : undefined

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {([
            { id: 'kpi',    label: 'KPI Results',       icon: '📋' },
            { id: 'q5',     label: 'Q5 Satisfaction',   icon: '⭐' },
            { id: 'funnel', label: 'Question Funnel',   icon: '🔻' },
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
          {tab === 'kpi' && <KPITab selectedQ={selectedQ} setSelectedQ={setSelectedQ} activeQ={activeQ} />}
          {tab === 'q5' && <Q5Tab />}
          {tab === 'funnel' && <FunnelTab />}
        </div>
      </div>
    </div>
  )
}

function KPITab({ selectedQ, setSelectedQ, activeQ }: {
  selectedQ: string | null
  setSelectedQ: (id: string | null) => void
  activeQ: (typeof KPI_QUESTIONS)[0] | undefined
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Survey KPI Results</h3>
        <p className="text-xs text-gray-400">Q1–Q5 · Click any bar or row for question details</p>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SORTED_Q.map(q => ({ name: q.id, label: q.label, pct: q.yesPct, color: q.color, status: q.status }))}
            margin={{ top: 4, right: 16, bottom: 0, left: -16 }}
            onClick={(d) => d?.activePayload && setSelectedQ(d.activePayload[0]?.payload?.name)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
              formatter={(val: number, _: string, props: { payload?: { label?: string } }) => [
                `${val.toFixed(1)}%`,
                props.payload?.label ?? 'Yes',
              ]}
            />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2" label={{ value: '70% benchmark', fill: '#10b981', fontSize: 10 }} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]} cursor="pointer">
              {SORTED_Q.map((q, i) => <Cell key={i} fill={q.color} opacity={selectedQ && selectedQ !== q.id ? 0.3 : 1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Question detail panel */}
      {activeQ && (
        <div className={`rounded-xl border p-4 ${
          activeQ.status === 'Good' ? 'bg-emerald-50 border-emerald-200' :
          activeQ.status === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{activeQ.id}</span>
              <h4 className="text-sm font-semibold text-gray-800 mt-0.5">{activeQ.label}</h4>
              <p className="text-xs text-gray-500 mt-1 italic">"{activeQ.question}"</p>
            </div>
            <button onClick={() => setSelectedQ(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              { label: 'Yes %',    val: `${activeQ.yesPct.toFixed(2)}%` },
              { label: 'Yes Count', val: activeQ.yesCount.toLocaleString() },
              { label: 'No Count',  val: activeQ.noCount.toLocaleString() },
              { label: 'Base (n)',  val: activeQ.base.toLocaleString() },
            ].map(m => (
              <div key={m.label} className="bg-white/70 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-gray-800">{m.val}</div>
                <div className="text-xs text-gray-500">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">Weight: {activeQ.weight}</span>
            <StatusBadge status={activeQ.status} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th w-8">Q</th>
              <th className="th">Indicator</th>
              <th className="th text-right">Yes %</th>
              <th className="th text-right hidden sm:table-cell">Yes n</th>
              <th className="th text-right hidden md:table-cell">No n</th>
              <th className="th text-right hidden md:table-cell">Base</th>
              <th className="th hidden lg:table-cell text-right">Weight</th>
              <th className="th text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {SORTED_Q.map((q) => (
              <tr
                key={q.id}
                onClick={() => setSelectedQ(selectedQ === q.id ? null : q.id)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedQ === q.id ? 'bg-blue-50' : ''}`}
              >
                <td className="td font-mono text-xs font-bold text-gray-600">{q.id}</td>
                <td className="td font-medium text-gray-800">{q.label}</td>
                <td className={`td-mono text-right font-bold ${
                  q.status === 'Good' ? 'text-emerald-700' :
                  q.status === 'Critical' ? 'text-red-600' : 'text-amber-700'
                }`}>{q.yesPct.toFixed(2)}%</td>
                <td className="td-mono text-right text-gray-500 hidden sm:table-cell">{q.yesCount.toLocaleString()}</td>
                <td className="td-mono text-right text-gray-400 hidden md:table-cell">{q.noCount.toLocaleString()}</td>
                <td className="td-mono text-right text-gray-400 hidden md:table-cell">{q.base.toLocaleString()}</td>
                <td className="td-mono text-right text-gray-400 hidden lg:table-cell">{q.weight}</td>
                <td className="td text-center"><StatusBadge status={q.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PIE_DATA = [
  { name: 'Satisfied',    value: Q5_SPLIT.satisfied.pct,    fill: '#10b981' },
  { name: 'Neutral',      value: Q5_SPLIT.neutral.pct,      fill: '#94a3b8' },
  { name: 'Dissatisfied', value: Q5_SPLIT.dissatisfied.pct, fill: '#ef4444' },
]

function Q5Tab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Q5 — Overall Satisfaction Split</h3>
        <p className="text-xs text-gray-400">4,284 respondents · 3-way satisfaction breakdown</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {PIE_DATA.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(val: number) => [`${val}%`, '']} contentStyle={{ borderRadius: 8 }} />
              <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Satisfied',    pct: Q5_SPLIT.satisfied.pct,    n: Q5_SPLIT.satisfied.count,    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
            { label: 'Neutral',      pct: Q5_SPLIT.neutral.pct,      n: Q5_SPLIT.neutral.count,      color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200',       bar: 'bg-slate-400' },
            { label: 'Dissatisfied', pct: Q5_SPLIT.dissatisfied.pct, n: Q5_SPLIT.dissatisfied.count, color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         bar: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                <span className={`text-xl font-bold ${s.color}`}>{s.pct}%</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${s.pct}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{s.n.toLocaleString()} respondents</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-gray-600">
        <strong>Q5 context:</strong> Only 4,284 of 9,224 usable calls reached Q5 (overall satisfaction).
        Of those, slightly more than half (52.1%) reported satisfaction — below the 70% benchmark.
        The 24.8% dissatisfied rate is a key concern for Phase 2 intervention.
      </div>
    </div>
  )
}

function FunnelTab() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Question Response Funnel</h3>
        <p className="text-xs text-gray-400">Drop-off at each question stage · Q2–Q5 share the 12,583 consented base</p>
      </div>

      {/* Visual funnel */}
      <div className="space-y-3">
        {QUESTION_FUNNEL.map((q, i) => (
          <div key={q.q} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-gray-500 font-mono">{q.q}</span>
                <span className="text-sm font-semibold text-gray-800 ml-2">{q.label}</span>
              </div>
              <span className={`text-sm font-bold ${
                q.yesPct >= 70 ? 'text-emerald-700' :
                q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
              }`}>{q.yesPct.toFixed(1)}% yes</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Yes: {q.yesCount.toLocaleString()}</span>
                  <span>No: {q.noCount.toLocaleString()}</span>
                  <span>Total: {q.answered.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className={`h-full rounded-l-full ${
                    q.yesPct >= 70 ? 'bg-emerald-500' :
                    q.yesPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`} style={{ width: `${q.yesPct}%` }} />
                  <div className="h-full bg-red-200 flex-1" />
                </div>
              </div>
            </div>
            {q.note && (
              <p className="text-xs text-gray-400 mt-1.5">{q.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Q</th>
              <th className="th">Indicator</th>
              <th className="th text-right">Answered</th>
              <th className="th text-right">Yes n</th>
              <th className="th text-right hidden sm:table-cell">No n</th>
              <th className="th text-right">Yes %</th>
              <th className="th hidden md:table-cell">Base</th>
            </tr>
          </thead>
          <tbody>
            {QUESTION_FUNNEL.map((q) => (
              <tr key={q.q} className="hover:bg-gray-50">
                <td className="td font-mono text-xs font-bold text-gray-600">{q.q}</td>
                <td className="td font-medium text-gray-800">{q.label}</td>
                <td className="td-mono text-right">{q.answered.toLocaleString()}</td>
                <td className="td-mono text-right text-emerald-700">{q.yesCount.toLocaleString()}</td>
                <td className="td-mono text-right text-red-500 hidden sm:table-cell">{q.noCount.toLocaleString()}</td>
                <td className={`td-mono text-right font-bold ${
                  q.yesPct >= 70 ? 'text-emerald-700' :
                  q.yesPct >= 50 ? 'text-amber-700' : 'text-red-600'
                }`}>{q.yesPct.toFixed(2)}%</td>
                <td className="td text-xs text-gray-400 hidden md:table-cell">{q.base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { KPI_QUESTIONS, Q5_SPLIT } from '../data/csatData'
import { StatusBadge } from './StatusBadge'

function fmt(n: number) { return n.toLocaleString() }

const CHART_COLORS: Record<string, string> = {
  Good:     '#10b981',
  Moderate: '#f59e0b',
  Critical: '#ef4444',
}

export function KPIResults() {
  const chartData = KPI_QUESTIONS.map((q) => ({
    name: q.id,
    label: q.label,
    pct: Number(q.yesPct.toFixed(1)),
    color: CHART_COLORS[q.status] ?? '#6b7280',
  }))

  return (
    <div>
      <h2 className="section-title">2. KPI Results</h2>
      <p className="section-sub">% satisfied = Yes ÷ (Yes + No) · Benchmark ≥ 70% = Good</p>

      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              formatter={(val: number) => [`${val}%`, 'Satisfied']}
            />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2"
              label={{ value: '70% target', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Question</th>
              <th className="th text-right">Yes</th>
              <th className="th text-right">No</th>
              <th className="th text-right">% Yes</th>
              <th className="th text-right hidden sm:table-cell">Base</th>
              <th className="th text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {KPI_QUESTIONS.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="td">
                  <span className="text-xs font-bold text-gray-400 mr-1">{q.id}</span>
                  <span className="font-medium text-gray-800">{q.label}</span>
                  <div className="text-xs text-gray-400 italic mt-0.5">{q.question}</div>
                </td>
                <td className="td-mono text-right text-emerald-600 text-xs">{fmt(q.yesCount)}</td>
                <td className="td-mono text-right text-red-500 text-xs">{fmt(q.noCount)}</td>
                <td className={`td-mono text-right font-bold ${
                  q.status === 'Good' ? 'text-emerald-700' :
                  q.status === 'Critical' ? 'text-red-600' : 'text-amber-700'
                }`}>{q.yesPct.toFixed(1)}%</td>
                <td className="td-mono text-right text-gray-400 text-xs hidden sm:table-cell">{fmt(q.base)}</td>
                <td className="td text-center"><StatusBadge status={q.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">Q5 Overall Split — {fmt(Q5_SPLIT.base)} respondents</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Satisfied',    data: Q5_SPLIT.satisfied,    bg: 'bg-emerald-50 border-emerald-200', val: 'text-emerald-700' },
            { label: 'Neutral',      data: Q5_SPLIT.neutral,      bg: 'bg-gray-100 border-gray-200',      val: 'text-gray-700' },
            { label: 'Dissatisfied', data: Q5_SPLIT.dissatisfied, bg: 'bg-red-50 border-red-200',         val: 'text-red-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3`}>
              <div className={`text-2xl font-bold ${s.val}`}>{s.data.pct}%</div>
              <div className={`text-xs font-medium mt-1 ${s.val}`}>{s.label}</div>
              <div className="text-xs text-gray-400">{fmt(s.data.count)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

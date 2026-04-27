import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { KPI_QUESTIONS, Q5_SPLIT } from '../data/csatData'
import { StatusBadge } from './StatusBadge'

function fmt(n: number) { return n.toLocaleString() }

export function KPIResults() {
  const chartData = KPI_QUESTIONS.map((q) => ({
    name: q.id,
    label: q.label,
    pct: Number(q.yesPct.toFixed(1)),
    color: q.color,
  }))

  return (
    <section id="kpi-results" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        2. KPI Results
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        % satisfied = Yes ÷ (Yes + No) · sorted strongest to weakest · Benchmark ≥ 70% = Good
      </p>

      {/* Bar chart */}
      <div className="h-52 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(val: number) => [`${val}%`, 'Satisfied']}
            />
            <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 2" label={{ value: '70% benchmark', fill: '#22c55e', fontSize: 10 }} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Question</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Yes</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">No</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">% Yes</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Base</th>
              <th className="text-center py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-center py-2 pl-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Weight</th>
            </tr>
          </thead>
          <tbody>
            {KPI_QUESTIONS.map((q) => (
              <tr key={q.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-2 pr-3">
                  <span className="text-xs font-mono text-slate-500 mr-1">{q.id}</span>
                  <span className="text-slate-300">{q.label}</span>
                  <div className="text-xs text-slate-500 italic">{q.question}</div>
                </td>
                <td className="py-2 px-2 text-right text-emerald-400 font-mono text-xs">{fmt(q.yesCount)}</td>
                <td className="py-2 px-2 text-right text-red-400 font-mono text-xs">{fmt(q.noCount)}</td>
                <td className="py-2 px-2 text-right font-bold text-slate-200 font-mono">{q.yesPct.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right text-slate-500 font-mono text-xs">{fmt(q.base)}</td>
                <td className="py-2 px-2 text-center"><StatusBadge status={q.status} /></td>
                <td className="py-2 pl-2 text-center text-slate-500 text-xs hidden sm:table-cell">{q.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Q5 3-way split */}
      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-400 mb-3">
          Q5 Overall Split — {fmt(Q5_SPLIT.base)} respondents
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-400">{Q5_SPLIT.satisfied.pct}%</div>
            <div className="text-xs text-emerald-500 mt-1">Satisfied</div>
            <div className="text-xs text-slate-500">{fmt(Q5_SPLIT.satisfied.count)}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-300">{Q5_SPLIT.neutral.pct}%</div>
            <div className="text-xs text-slate-400 mt-1">Neutral</div>
            <div className="text-xs text-slate-500">{fmt(Q5_SPLIT.neutral.count)}</div>
          </div>
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{Q5_SPLIT.dissatisfied.pct}%</div>
            <div className="text-xs text-red-500 mt-1">Dissatisfied</div>
            <div className="text-xs text-slate-500">{fmt(Q5_SPLIT.dissatisfied.count)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

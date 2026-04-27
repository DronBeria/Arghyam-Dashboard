import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { ZONE_SCORES } from '../data/csatData'
import { StatusBadge, statusColor } from './StatusBadge'

function bsiColor(bsi: number | null) {
  if (bsi === null) return '#475569'
  if (bsi >= 0.70) return '#22c55e'
  if (bsi >= 0.40) return '#f59e0b'
  return '#ef4444'
}

export function ZoneScores() {
  const chartData = ZONE_SCORES.filter((z) => z.bsi !== null && z.zone !== 'Assam (State)').map((z) => ({
    zone: z.zone.replace(' Assam', ''),
    bsi: z.bsi!,
    color: bsiColor(z.bsi),
  }))

  const stateRow = ZONE_SCORES.find((z) => z.zone === 'Assam (State)')!

  return (
    <section id="zone-scores" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        4. Zone Scores
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        BSI = average of all valid scheme scores in the zone · out of 1.0 · No zone meets ≥ 0.70 benchmark yet
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">BSI by Zone</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 0.7]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="zone" tick={{ fill: '#94a3b8', fontSize: 11 }} width={58} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
                  formatter={(val: number) => [val.toFixed(4), 'BSI']}
                />
                <ReferenceLine x={0.70} stroke="#22c55e" strokeDasharray="4 2" />
                <Bar dataKey="bsi" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Zone</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">BSI</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Quality</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Quantity</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Daily</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Calls</th>
                <th className="text-center py-2 pl-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {ZONE_SCORES.map((z, i) => {
                const isState = z.zone === 'Assam (State)'
                return (
                  <tr
                    key={i}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${isState ? 'bg-blue-950/20 font-semibold' : ''}`}
                  >
                    <td className={`py-2 pr-3 ${isState ? 'text-blue-300' : 'text-slate-300'}`}>{z.zone}</td>
                    <td className={`py-2 px-2 text-right font-mono font-bold ${statusColor(z.status)}`}>
                      {z.bsi !== null ? z.bsi.toFixed(4) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden sm:table-cell">
                      {z.quality !== null ? z.quality.toFixed(3) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden sm:table-cell">
                      {z.quantity !== null ? z.quantity.toFixed(3) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                      {z.daily !== null ? z.daily.toFixed(3) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-500 font-mono text-xs hidden md:table-cell">
                      {z.usableCalls !== null ? z.usableCalls.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 pl-2 text-center"><StatusBadge status={z.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {stateRow && (
            <p className="text-xs text-slate-500 mt-2">
              State total: {stateRow.usableCalls?.toLocaleString()} usable calls across all zones
            </p>
          )}
        </div>
      </div>

      {/* DHAC note */}
      <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded p-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">DHAC:</span> Only 95 calls made · 1.1% consent rate · excluded from scoring — must re-call in Phase 2
      </div>
    </section>
  )
}

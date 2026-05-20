import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { ZONE_SCORES } from '../data/csatData'
import { StatusBadge, statusColor } from './StatusBadge'

function bsiColor(bsi: number | null) {
  if (bsi === null) return '#d1d5db'
  if (bsi >= 0.70) return '#10b981'
  if (bsi >= 0.40) return '#f59e0b'
  return '#ef4444'
}

export function ZoneScores() {
  const chartData = ZONE_SCORES
    .filter((z) => z.bsi !== null && z.zone !== 'Assam (State)')
    .map((z) => ({ zone: z.zone.replace(' Assam', ''), bsi: z.bsi!, color: bsiColor(z.bsi) }))

  return (
    <div>
      <h2 className="section-title">4. Zone Scores</h2>
      <p className="section-sub">Score = average of valid scheme scores · out of 1.0 · No zone meets ≥ 0.70 benchmark yet</p>

      <div className="h-44 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 72 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" domain={[0, 0.7]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis type="category" dataKey="zone" tick={{ fill: '#374151', fontSize: 11 }} width={70} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
              formatter={(val: number) => [val.toFixed(4), 'Score']} />
            <ReferenceLine x={0.70} stroke="#10b981" strokeDasharray="4 2" />
            <Bar dataKey="bsi" radius={[0, 4, 4, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Zone</th>
              <th className="th text-right">Score</th>
              <th className="th text-right hidden sm:table-cell">Quality</th>
              <th className="th text-right hidden sm:table-cell">Quantity</th>
              <th className="th text-right hidden md:table-cell">Daily</th>
              <th className="th text-right hidden md:table-cell">Calls</th>
              <th className="th text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {ZONE_SCORES.map((z, i) => {
              const isState = z.zone === 'Assam (State)'
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isState ? 'bg-blue-50 font-semibold' : ''}`}>
                  <td className={`td font-medium ${isState ? 'text-blue-700' : 'text-gray-800'}`}>{z.zone}</td>
                  <td className={`td-mono text-right font-bold ${statusColor(z.status)}`}>
                    {z.bsi !== null ? z.bsi.toFixed(4) : '—'}
                  </td>
                  <td className="td-mono text-right text-gray-500 hidden sm:table-cell">
                    {z.quality !== null ? z.quality.toFixed(3) : '—'}
                  </td>
                  <td className="td-mono text-right text-gray-500 hidden sm:table-cell">
                    {z.quantity !== null ? z.quantity.toFixed(3) : '—'}
                  </td>
                  <td className="td-mono text-right text-gray-500 hidden md:table-cell">
                    {z.daily !== null ? z.daily.toFixed(3) : '—'}
                  </td>
                  <td className="td-mono text-right text-gray-400 hidden md:table-cell">
                    {z.usableCalls !== null ? z.usableCalls.toLocaleString() : '—'}
                  </td>
                  <td className="td text-center"><StatusBadge status={z.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        DHAC excluded: only 95 calls made · 1.1% consent rate · to be re-called in Phase 2
      </p>
    </div>
  )
}

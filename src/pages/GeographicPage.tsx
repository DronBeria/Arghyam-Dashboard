import { useState } from 'react'
import { usePhaseData } from '../context/PhaseDataContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { StatusBadge, statusColor } from '../components/StatusBadge'
type View = 'zones' | 'districts'

function bsiColor(bsi: number | null) {
  if (bsi === null) return '#d1d5db'
  if (bsi >= 0.70) return '#10b981'
  if (bsi >= 0.40) return '#f59e0b'
  return '#ef4444'
}

export function GeographicPage() {
  const { ZONE_SCORES, DISTRICT_SCORES, bestDistrict, worstDistrict, districtCountLabel, dhacNote } = usePhaseData()
  const ZONES = ['All', ...new Set(DISTRICT_SCORES.map(d => d.zone))]

  const [view, setView] = useState<View>('zones')
  const [selectedZone, setSelectedZone] = useState('All')
  const [sortBy, setSortBy] = useState<'bsi' | 'name'>('bsi')
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)

  const filteredDistricts = DISTRICT_SCORES
    .filter(d => selectedZone === 'All' || d.zone === selectedZone)
    .sort((a, b) => sortBy === 'bsi' ? b.bsi - a.bsi : a.district.localeCompare(b.district))

  const activeDistrict = selectedDistrict ? DISTRICT_SCORES.find(d => d.district === selectedDistrict) : undefined

  const zoneChartData = ZONE_SCORES
    .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
    .map(z => ({ zone: z.zone.replace(' Assam', ''), bsi: +(z.bsi! * 5).toFixed(3), rawBsi: z.bsi!, color: bsiColor(z.bsi) }))

  return (
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        {([
          { id: 'zones',     label: 'Zone Overview' },
          { id: 'districts', label: 'District Deep-Dive' },
        ] as { id: View; label: string }[]).map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === v.id
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'zones' && <ZonesView chartData={zoneChartData} ZONE_SCORES={ZONE_SCORES} dhacNote={dhacNote} />}

      {view === 'districts' && (
        <DistrictsView
          filteredDistricts={filteredDistricts}
          ZONES={ZONES}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          activeDistrict={activeDistrict}
          bestDistrict={bestDistrict}
          worstDistrict={worstDistrict}
          districtCountLabel={districtCountLabel}
        />
      )}
    </div>
  )
}

function ZonesView({ chartData, ZONE_SCORES, dhacNote }: { chartData: any[]; ZONE_SCORES: any[]; dhacNote: string }) {
  return (
    <div className="space-y-5">
      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-1">Zone Score Comparison</p>
        <p className="text-xs text-gray-400 mb-4">Score out of 5.0 · Green dashed = 3.50 target</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 72 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 3.5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis type="category" dataKey="zone" tick={{ fill: '#374151', fontSize: 11 }} width={70} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                formatter={(val: number) => [`${val.toFixed(3)} / 5.0`, 'Score']}
              />
              <ReferenceLine x={3.50} stroke="#10b981" strokeDasharray="4 2" />
              <Bar dataKey="bsi" radius={[0, 4, 4, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Zone Score Details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Zone</th>
                <th className="th text-right">Score (/5.0)</th>
                <th className="th text-right hidden sm:table-cell">Quality</th>
                <th className="th text-right hidden sm:table-cell">Quantity</th>
                <th className="th text-right hidden md:table-cell">Daily</th>
                <th className="th text-right hidden md:table-cell">Usable Calls</th>
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
                      {z.bsi !== null ? (z.bsi * 5).toFixed(3) : '—'}
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
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">{dhacNote}</p>
        </div>
      </div>
    </div>
  )
}

function DistrictsView({
  filteredDistricts, ZONES, selectedZone, setSelectedZone, sortBy, setSortBy,
  selectedDistrict, setSelectedDistrict, activeDistrict,
  bestDistrict, worstDistrict, districtCountLabel,
}: {
  filteredDistricts: any[]
  ZONES: string[]
  selectedZone: string
  setSelectedZone: (z: string) => void
  sortBy: 'bsi' | 'name'
  setSortBy: (s: 'bsi' | 'name') => void
  selectedDistrict: string | null
  setSelectedDistrict: (d: string | null) => void
  activeDistrict: any
  bestDistrict: { name: string; bsi5: string }
  worstDistrict: { name: string; bsi5: string }
  districtCountLabel: string
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5 items-center">
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedZone === z
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {z}
            </button>
          ))}
          <button
            onClick={() => setSortBy(sortBy === 'bsi' ? 'name' : 'bsi')}
            className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium border bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          >
            {sortBy === 'bsi' ? 'Sort: Score ↓' : 'Sort: A–Z'}
          </button>
        </div>
      </div>

      {/* District detail panel */}
      {activeDistrict && (
        <div className={`rounded-xl border p-4 ${
          activeDistrict.status === 'Good' ? 'bg-emerald-50 border-emerald-200' :
          activeDistrict.status === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-gray-800">{activeDistrict.district}</h4>
              <p className="text-xs text-gray-500">{activeDistrict.zone} · {activeDistrict.validSchemes} valid schemes</p>
            </div>
            <button onClick={() => setSelectedDistrict(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              { label: 'Score (/5.0)',     val: (activeDistrict.bsi * 5).toFixed(3) },
              { label: 'Quality',        val: activeDistrict.quality.toFixed(3) },
              { label: 'Quantity',       val: activeDistrict.quantity.toFixed(3) },
              { label: 'Usable Calls',   val: activeDistrict.usableCalls.toLocaleString() },
            ].map(m => (
              <div key={m.label} className="bg-white/70 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-gray-800">{m.val}</div>
                <div className="text-xs text-gray-500">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={activeDistrict.status} />
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  activeDistrict.status === 'Good' ? 'bg-emerald-500' :
                  activeDistrict.status === 'Critical' ? 'bg-red-400' : 'bg-amber-400'
                }`}
                style={{ width: `${(activeDistrict.bsi / 0.7) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{((activeDistrict.bsi / 0.7) * 100).toFixed(0)}% of 3.50 target</span>
          </div>
        </div>
      )}

      {/* District table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th w-8">#</th>
                <th className="th">District</th>
                <th className="th hidden sm:table-cell">Zone</th>
                <th className="th text-right">Score (/5.0)</th>
                <th className="th text-right hidden md:table-cell">Quality</th>
                <th className="th text-right hidden md:table-cell">Quantity</th>
                <th className="th text-right hidden lg:table-cell">Schemes</th>
                <th className="th text-right hidden lg:table-cell">Calls</th>
                <th className="th text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((d, i) => (
                <tr
                  key={d.district}
                  onClick={() => setSelectedDistrict(selectedDistrict === d.district ? null : d.district)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedDistrict === d.district ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="td text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="td font-medium text-gray-800">{d.district}</td>
                  <td className="td text-gray-500 text-xs hidden sm:table-cell">{d.zone}</td>
                  <td className={`td-mono text-right font-bold ${statusColor(d.status)}`}>
                    {(d.bsi * 5).toFixed(3)}
                  </td>
                  <td className="td-mono text-right text-gray-500 hidden md:table-cell">{d.quality.toFixed(3)}</td>
                  <td className="td-mono text-right text-gray-500 hidden md:table-cell">{d.quantity.toFixed(3)}</td>
                  <td className="td-mono text-right text-gray-400 hidden lg:table-cell">{d.validSchemes}</td>
                  <td className="td-mono text-right text-gray-400 hidden lg:table-cell">{d.usableCalls.toLocaleString()}</td>
                  <td className="td text-center"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          <span><span className="text-emerald-600 font-semibold">Best:</span> {bestDistrict.name} — Score {bestDistrict.bsi5}/5.0</span>
          <span><span className="text-red-600 font-semibold">Worst:</span> {worstDistrict.name} — Score {worstDistrict.bsi5}/5.0</span>
          <span className="text-gray-400">Showing {filteredDistricts.length} of {districtCountLabel} districts</span>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { DISTRICT_SCORES } from '../data/csatData'
import { StatusBadge, statusColor } from './StatusBadge'

const ZONES = ['All', 'North Assam', 'Upper Assam', 'Lower Assam', 'BTAD', 'Barak Valley', 'KAAC']

export function DistrictScores() {
  const [selectedZone, setSelectedZone] = useState('All')
  const [sortBy, setSortBy] = useState<'bsi' | 'district'>('bsi')

  const filtered = DISTRICT_SCORES
    .filter((d) => selectedZone === 'All' || d.zone === selectedZone)
    .sort((a, b) => sortBy === 'bsi' ? b.bsi - a.bsi : a.district.localeCompare(b.district))

  return (
    <div>
      <h2 className="section-title">5. District Scores</h2>
      <p className="section-sub">31 districts grouped by zone · sorted best to worst by BSI</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {ZONES.map((z) => (
          <button key={z} onClick={() => setSelectedZone(z)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              selectedZone === z
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}>
            {z}
          </button>
        ))}
        <button onClick={() => setSortBy(sortBy === 'bsi' ? 'district' : 'bsi')}
          className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium border bg-white text-gray-500 border-gray-200 hover:bg-gray-50">
          {sortBy === 'bsi' ? 'Sort: BSI ↓' : 'Sort: A–Z'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th w-8">#</th>
              <th className="th">District</th>
              <th className="th hidden sm:table-cell">Zone</th>
              <th className="th text-right">BSI</th>
              <th className="th text-right hidden md:table-cell">Quality</th>
              <th className="th text-right hidden md:table-cell">Quantity</th>
              <th className="th text-right hidden lg:table-cell">Schemes</th>
              <th className="th text-right hidden lg:table-cell">Calls</th>
              <th className="th text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.district} className="hover:bg-gray-50">
                <td className="td text-gray-400 text-xs font-mono">{i + 1}</td>
                <td className="td font-medium text-gray-800">{d.district}</td>
                <td className="td text-gray-500 text-xs hidden sm:table-cell">{d.zone}</td>
                <td className={`td-mono text-right font-bold ${statusColor(d.status)}`}>
                  {d.bsi.toFixed(4)}
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

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span><span className="text-emerald-600 font-semibold">Best:</span> Sivasagar — BSI 0.5320</span>
        <span><span className="text-red-600 font-semibold">Worst:</span> Hailakandi — BSI 0.2785</span>
        <span className="text-gray-400">Showing {filtered.length} of 31 districts</span>
      </div>
    </div>
  )
}

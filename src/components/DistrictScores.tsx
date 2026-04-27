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
    <section id="district-scores" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        5. District Scores
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        31 districts grouped by zone · sorted best to worst by BSI
      </p>

      {/* Zone filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ZONES.map((z) => (
          <button
            key={z}
            onClick={() => setSelectedZone(z)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedZone === z
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {z}
          </button>
        ))}
        <button
          onClick={() => setSortBy(sortBy === 'bsi' ? 'district' : 'bsi')}
          className="ml-auto px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700"
        >
          Sort: {sortBy === 'bsi' ? 'BSI ↓' : 'A–Z'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide">District</th>
              <th className="text-left py-2 pr-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Zone</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">BSI</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Quality</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Quantity</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Valid Schemes</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Usable Calls</th>
              <th className="text-center py-2 pl-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.district} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                <td className="py-1.5 pr-3 text-slate-600 text-xs font-mono">{i + 1}</td>
                <td className="py-1.5 pr-3 text-slate-300 font-medium">{d.district}</td>
                <td className="py-1.5 pr-3 text-slate-500 text-xs hidden sm:table-cell">{d.zone}</td>
                <td className={`py-1.5 px-2 text-right font-mono font-bold ${statusColor(d.status)}`}>
                  {d.bsi.toFixed(4)}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                  {d.quality.toFixed(3)}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                  {d.quantity.toFixed(3)}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-500 font-mono text-xs hidden lg:table-cell">
                  {d.validSchemes}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-500 font-mono text-xs hidden lg:table-cell">
                  {d.usableCalls.toLocaleString()}
                </td>
                <td className="py-1.5 pl-2 text-center"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>
          <span className="text-emerald-400 font-semibold">Best: </span>
          Sivasagar — BSI 0.5320
        </span>
        <span>·</span>
        <span>
          <span className="text-red-400 font-semibold">Worst: </span>
          Hailakandi — BSI 0.2785
        </span>
        <span>·</span>
        <span>
          Showing {filtered.length} of 31 districts
        </span>
      </div>
    </section>
  )
}

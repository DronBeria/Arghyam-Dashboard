import { useState } from 'react'
import { SCHEME_COVERAGE } from '../data/csatData'
import { supabase } from '../lib/supabase'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function fmt(n: number) { return n.toLocaleString() }

interface SchemeResult {
  scheme_name: string | null
  district: string | null
  zone: string | null
  total: number
  usable: number
  consented: number
}

const PIE = [
  { name: 'Valid',    value: SCHEME_COVERAGE.valid,   fill: '#10b981' },
  { name: 'Flagged',  value: SCHEME_COVERAGE.flagged,  fill: '#f59e0b' },
  { name: 'No Data',  value: SCHEME_COVERAGE.noData,   fill: '#d1d5db' },
]

const FUNC_PIE = [
  { name: 'Regular Supply',   value: SCHEME_COVERAGE.functional,    fill: '#10b981' },
  { name: 'Irregular Supply', value: SCHEME_COVERAGE.nonFunctional, fill: '#ef4444' },
]

export function SchemePage() {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SchemeResult[]>([])
  const [searching, setSearching]   = useState(false)
  const [searched, setSearched]     = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true); setSearched(false)
    const { data } = await supabase
      .from('call_records')
      .select('scheme_name, district, zone')
      .or(`scheme_name.ilike.%${query.trim()}%`)
      .limit(200)
    if (data) {
      // Group by scheme_name
      const map: Record<string, SchemeResult> = {}
      for (const r of data as any[]) {
        const key = r.scheme_name || 'Unknown'
        if (!map[key]) map[key] = { scheme_name: r.scheme_name, district: r.district, zone: r.zone, total: 0, usable: 0, consented: 0 }
        map[key].total++
      }
      // Get usable + consented counts per scheme
      const names = Object.keys(map)
      if (names.length > 0) {
        const { data: u } = await supabase.from('call_records')
          .select('scheme_name').in('scheme_name', names).eq('is_usable', true)
        const { data: c } = await supabase.from('call_records')
          .select('scheme_name').in('scheme_name', names).eq('consented', true)
        ;(u ?? []).forEach((r: any) => { if (map[r.scheme_name]) map[r.scheme_name].usable++ })
        ;(c ?? []).forEach((r: any) => { if (map[r.scheme_name]) map[r.scheme_name].consented++ })
      }
      setResults(Object.values(map).sort((a, b) => b.usable - a.usable))
    }
    setSearching(false); setSearched(true)
  }

  return (
    <div className="space-y-5">

      {/* ── IMIS / Scheme Search ─────────────────────────────────────────── */}
      <div className="card p-4">
        <p className="panel-title mb-3">Search Schemes</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Scheme name or IMIS ID…"
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-2.5
              placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button type="submit" disabled={searching}
            className="btn-primary px-5 py-2.5 rounded-xl disabled:opacity-50">
            {searching ? '…' : 'Search'}
          </button>
        </form>

        {searched && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No schemes found for "{query}"</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="th text-left">Scheme Name</th>
                      <th className="th text-left">District</th>
                      <th className="th text-left">Zone</th>
                      <th className="th text-right">Total Calls</th>
                      <th className="th text-right">Usable</th>
                      <th className="th text-right">Consented</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="td font-medium text-gray-800 max-w-[200px] truncate">{r.scheme_name || '—'}</td>
                        <td className="td text-gray-500">{r.district || '—'}</td>
                        <td className="td text-gray-500">{r.zone || '—'}</td>
                        <td className="td-mono text-right">{fmt(r.total)}</td>
                        <td className="td-mono text-right text-blue-600">{fmt(r.usable)}</td>
                        <td className="td-mono text-right text-emerald-600">{fmt(r.consented)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 20 && (
                  <p className="text-[10px] text-gray-400 text-center py-2">Showing 20 of {results.length} results — refine your search</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Coverage overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total IMIS Schemes',  val: SCHEME_COVERAGE.total.toLocaleString(),    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
          { label: 'Valid Schemes',        val: `${SCHEME_COVERAGE.valid} (${SCHEME_COVERAGE.validPct}%)`, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Flagged / Suspect',    val: `${SCHEME_COVERAGE.flagged.toLocaleString()} (${SCHEME_COVERAGE.flaggedPct}%)`, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'No Data',              val: `${SCHEME_COVERAGE.noData} (${SCHEME_COVERAGE.noDataPct}%)`, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <div className={`text-xl font-bold ${c.color}`}>{c.val}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts + Functional rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Coverage donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Scheme Coverage</p>
          <p className="text-xs text-gray-400 mb-3">All 2,373 IMIS schemes</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {PIE.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(val: number) => [val.toLocaleString(), '']} contentStyle={{ borderRadius: 8 }} />
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regular supply donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Regular vs Irregular Supply</p>
          <p className="text-xs text-gray-400 mb-3">Of 615 valid schemes only</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={FUNC_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {FUNC_PIE.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(val: number) => [val, '']} contentStyle={{ borderRadius: 8 }} />
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-700 mb-3">Regular Supply Rate</p>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600">{SCHEME_COVERAGE.functionalRate}%</div>
              <div className="text-xs text-gray-500 mt-1">of valid schemes supply water regularly</div>
              <div className="text-xs text-gray-400">{SCHEME_COVERAGE.functional} of {SCHEME_COVERAGE.valid} valid schemes</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${SCHEME_COVERAGE.functionalRate}%` }} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{SCHEME_COVERAGE.nonFunctional}</div>
              <div className="text-xs text-gray-500">schemes with irregular supply</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

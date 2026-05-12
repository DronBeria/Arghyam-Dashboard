import { SCHEME_COVERAGE } from '../data/csatData'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

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
  return (
    <div className="space-y-5">
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

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SCHEME_COVERAGE } from '../data/csatData'

const PIE_DATA = [
  { name: `Valid (≥6 calls)`,    value: SCHEME_COVERAGE.valid,   color: '#10b981' },
  { name: 'Flagged (1–5 calls)', value: SCHEME_COVERAGE.flagged,  color: '#f59e0b' },
  { name: 'No data',             value: SCHEME_COVERAGE.noData,   color: '#d1d5db' },
]
const FUNC_DATA = [
  { name: 'Regular Supply',   value: SCHEME_COVERAGE.functional,    color: '#10b981' },
  { name: 'Irregular Supply', value: SCHEME_COVERAGE.nonFunctional, color: '#ef4444' },
]

export function SchemeCoverage() {
  return (
    <div>
      <h2 className="section-title">3. Scheme Coverage</h2>
      <p className="section-sub">2,373 IMIS schemes · Minimum 6 usable responses needed for valid scoring</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">All 2,373 Schemes</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} dataKey="value" innerRadius="50%" outerRadius="78%" paddingAngle={2}>
                  {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  formatter={(val: number) => [`${val} schemes`, '']} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1 text-center">
            {[
              { label: 'Valid',    val: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-700' },
              { label: 'Flagged', val: SCHEME_COVERAGE.flagged,  pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-700' },
              { label: 'No Data', val: SCHEME_COVERAGE.noData,   pct: SCHEME_COVERAGE.noDataPct,  color: 'text-gray-500' },
            ].map((s) => (
              <div key={s.label}>
                <div className={`text-lg font-bold ${s.color}`}>{s.val.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{s.label} · {s.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Of 615 Valid Schemes — Supply Regularity</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={FUNC_DATA} dataKey="value" innerRadius="50%" outerRadius="78%" paddingAngle={2}>
                  {FUNC_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  formatter={(val: number) => [`${val} schemes`, '']} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-700">{SCHEME_COVERAGE.functional}</div>
              <div className="text-xs text-gray-500">Regular Supply · {SCHEME_COVERAGE.functionalRate}%</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{SCHEME_COVERAGE.nonFunctional}</div>
              <div className="text-xs text-gray-500">Irregular Supply · {(100 - SCHEME_COVERAGE.functionalRate).toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 text-center font-medium">
            Only 17.6% of valid schemes supply water regularly — 82.4% have irregular supply
          </div>
        </div>
      </div>
    </div>
  )
}

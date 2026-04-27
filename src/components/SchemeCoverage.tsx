import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SCHEME_COVERAGE } from '../data/csatData'

const PIE_DATA = [
  { name: `Valid (≥${SCHEME_COVERAGE.minThreshold} calls)`, value: SCHEME_COVERAGE.valid,   color: '#22c55e' },
  { name: 'Flagged (1–5 calls)',                             value: SCHEME_COVERAGE.flagged,  color: '#f59e0b' },
  { name: 'No data (0 calls)',                               value: SCHEME_COVERAGE.noData,   color: '#475569' },
]

const FUNCTIONAL_DATA = [
  { name: 'Functional',     value: SCHEME_COVERAGE.functional,    color: '#22c55e' },
  { name: 'Non-functional', value: SCHEME_COVERAGE.nonFunctional, color: '#ef4444' },
]

export function SchemeCoverage() {
  return (
    <section id="scheme-coverage" className="px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">
        3. Scheme Coverage
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        2,373 IMIS schemes · Minimum 6 usable responses needed for valid scoring
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scheme validity donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">All 2,373 Schemes</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} dataKey="value" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                  {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
                  formatter={(val: number) => [`${val} schemes`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'Valid',    val: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-400' },
              { label: 'Flagged', val: SCHEME_COVERAGE.flagged,  pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-400' },
              { label: 'No Data', val: SCHEME_COVERAGE.noData,   pct: SCHEME_COVERAGE.noDataPct,  color: 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.val.toLocaleString()}</div>
                <div className="text-xs text-slate-500">{s.label} · {s.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Functional breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">
            Of 615 Valid Schemes — Functional Status
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={FUNCTIONAL_DATA} dataKey="value" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                  {FUNCTIONAL_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
                  formatter={(val: number) => [`${val} schemes`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{SCHEME_COVERAGE.functional}</div>
              <div className="text-xs text-slate-500">Functional · {SCHEME_COVERAGE.functionalRate}%</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{SCHEME_COVERAGE.nonFunctional}</div>
              <div className="text-xs text-slate-500">Non-functional · {(100 - SCHEME_COVERAGE.functionalRate).toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-3 bg-red-950/30 border border-red-900/50 rounded p-2 text-xs text-red-300">
            Only 17.6% of valid schemes are functional — 82.4% require intervention
          </div>
        </div>
      </div>
    </section>
  )
}

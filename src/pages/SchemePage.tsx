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
  { name: 'Functional',     value: SCHEME_COVERAGE.functional,    fill: '#10b981' },
  { name: 'Non-Functional', value: SCHEME_COVERAGE.nonFunctional, fill: '#ef4444' },
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

        {/* Functional donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Valid Scheme Functionality</p>
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
          <p className="text-sm font-semibold text-gray-700 mb-3">Functionality Rate</p>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600">{SCHEME_COVERAGE.functionalRate}%</div>
              <div className="text-xs text-gray-500 mt-1">of valid schemes are functional</div>
              <div className="text-xs text-gray-400">{SCHEME_COVERAGE.functional} of {SCHEME_COVERAGE.valid} valid schemes</div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${SCHEME_COVERAGE.functionalRate}%` }} />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{SCHEME_COVERAGE.nonFunctional}</div>
              <div className="text-xs text-gray-500">non-functional schemes identified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Definitions + thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4">Scheme Classification Criteria</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Valid',
              color: 'text-emerald-700',
              bg: 'bg-emerald-50 border-emerald-200',
              criteria: [
                'Minimum 6 usable calls received',
                'Sufficient data for BSI scoring',
                'At least 1 answered Q1 response',
              ],
              count: `${SCHEME_COVERAGE.valid} schemes`,
            },
            {
              title: 'Flagged / Suspect',
              color: 'text-amber-700',
              bg: 'bg-amber-50 border-amber-200',
              criteria: [
                'Fewer than 6 usable calls',
                'High refusal / no-consent rate',
                'Potential IMIS data quality issues',
              ],
              count: `${SCHEME_COVERAGE.flagged.toLocaleString()} schemes`,
            },
            {
              title: 'No Data',
              color: 'text-gray-600',
              bg: 'bg-gray-50 border-gray-200',
              criteria: [
                'Zero calls reached or connected',
                'Not included in BSI calculation',
                'Targeted for Phase 2 re-call',
              ],
              count: `${SCHEME_COVERAGE.noData} schemes`,
            },
          ].map(c => (
            <div key={c.title} className={`rounded-xl border p-4 ${c.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${c.color}`}>{c.title}</span>
                <span className="text-xs text-gray-400">{c.count}</span>
              </div>
              <ul className="space-y-1">
                {c.criteria.map((cr, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="mt-0.5 text-gray-400">•</span>
                    {cr}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Functional scheme definition */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">What Makes a Scheme "Functional"?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-xs text-gray-600">
            <p>A scheme is classified as <strong className="text-emerald-700">functional</strong> when it meets all three minimum criteria:</p>
            <ul className="space-y-1 ml-3">
              <li>• <strong>Q1 ≥ 50%</strong> — Water supplied at least 4 of last 7 days</li>
              <li>• <strong>Q2 ≥ 70%</strong> — Water quality rated clean by majority</li>
              <li>• <strong>Q3 ≥ 70%</strong> — Sufficient quantity reported</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600 mb-1">82.4%</div>
            <div className="text-xs text-gray-700 font-medium">of valid schemes are <strong>NOT functional</strong></div>
            <div className="text-xs text-gray-400 mt-1">507 of 615 valid schemes fail at least one criterion</div>
            <div className="text-xs text-gray-400">Minimum threshold: {SCHEME_COVERAGE.minThreshold} usable calls per scheme</div>
          </div>
        </div>
      </div>
    </div>
  )
}

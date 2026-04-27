import { KPI_HEADLINE, CALL_SUMMARY, KPI_QUESTIONS, SCHEME_COVERAGE, ZONE_SCORES } from '../data/csatData'
import { StatusBadge } from '../components/StatusBadge'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts'

function fmt(n: number) { return n.toLocaleString() }

const HEADLINE_CARDS = [
  { label: 'Total Calls',         value: '45,863',                        sub: '2,373 IMIS schemes',         color: 'border-blue-500',    bg: 'bg-blue-50',   text: 'text-blue-700'   },
  { label: 'State BSI',           value: '0.4406 / 1.0',                  sub: 'Moderate · Target ≥ 0.70',   color: 'border-amber-500',   bg: 'bg-amber-50',  text: 'text-amber-700'  },
  { label: 'Overall Satisfied',   value: `${KPI_HEADLINE.satisfied}%`,    sub: 'Of 4,284 Q5 respondents',    color: 'border-amber-500',   bg: 'bg-amber-50',  text: 'text-amber-700'  },
  { label: 'Functional Schemes',  value: `${KPI_HEADLINE.functionalSchemes}%`, sub: '108 of 615 valid',    color: 'border-red-500',     bg: 'bg-red-50',    text: 'text-red-700'    },
  { label: 'Consent Rate',        value: `${KPI_HEADLINE.consentRate}%`,  sub: '12,583 agreed',              color: 'border-slate-400',   bg: 'bg-slate-50',  text: 'text-slate-700'  },
  { label: 'Usable Calls',        value: '9,224',                         sub: '20.1% of total',             color: 'border-emerald-500', bg: 'bg-emerald-50',text: 'text-emerald-700'},
]

const BSI_GAUGE = [{ name: 'BSI', value: 44.06, fill: '#f59e0b' }, { name: 'Gap', value: 55.94, fill: '#f3f4f6' }]

const Q_CHART = KPI_QUESTIONS.map(q => ({
  name: q.id, pct: q.yesPct, status: q.status,
  color: q.status === 'Good' ? '#10b981' : q.status === 'Critical' ? '#ef4444' : '#f59e0b',
}))

const TOP_ZONES = ZONE_SCORES.filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))

export function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {HEADLINE_CARDS.map((c) => (
          <div key={c.label} className={`bg-white rounded-xl border border-gray-200 border-t-4 ${c.color} p-4 shadow-sm hover:shadow-md transition-shadow`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 leading-tight">{c.label}</p>
            <p className={`text-xl font-bold ${c.text} leading-tight`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* BSI Gauge */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-700 mb-1">State BSI Score</p>
          <p className="text-xs text-gray-400 mb-3">Benchmark ≥ 0.70 = Good</p>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%"
                startAngle={180} endAngle={0} data={BSI_GAUGE}>
                <RadialBar dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-6">
            <span className="text-3xl font-bold text-amber-600">0.4406</span>
            <p className="text-xs text-amber-600 font-medium mt-0.5">Moderate</p>
          </div>
          <div className="mt-3 w-full flex justify-between text-xs text-gray-400">
            <span>0</span><span className="text-emerald-600 font-medium">0.70 target</span><span>1.0</span>
          </div>
        </div>

        {/* Q satisfaction mini chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Survey KPIs</p>
          <p className="text-xs text-gray-400 mb-3">% yes per question</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Q_CHART} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Satisfied']} />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2" />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {Q_CHART.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Call funnel summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">Call Funnel</p>
          <p className="text-xs text-gray-400 mb-3">From dialled to completed</p>
          <div className="space-y-2.5">
            {[
              { label: 'Total Dialled', val: 45863, pct: 100, color: 'bg-blue-500' },
              { label: 'Consented',     val: 12583, pct: 27.4, color: 'bg-indigo-400' },
              { label: 'Usable (Q1)',   val: 9224,  pct: 20.1, color: 'bg-emerald-500' },
              { label: 'Completed all', val: 1578,  pct: 3.4,  color: 'bg-emerald-700' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="font-mono">{fmt(s.val)} <span className="text-gray-400">({s.pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone + Scheme overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Zone ranking */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Zone Rankings</p>
              <p className="text-xs text-gray-400">BSI score out of 1.0</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">
              No zone meets 0.70 yet
            </span>
          </div>
          <div className="space-y-2">
            {TOP_ZONES.map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono w-4">{i + 1}</span>
                <span className="text-xs font-medium text-gray-700 w-28 truncate">{z.zone}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${
                      z.status === 'Good' ? 'bg-emerald-500' :
                      z.status === 'Critical' ? 'bg-red-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${((z.bsi ?? 0) / 0.7) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-bold font-mono w-14 text-right ${
                  z.status === 'Good' ? 'text-emerald-700' :
                  z.status === 'Critical' ? 'text-red-600' : 'text-amber-700'
                }`}>{z.bsi?.toFixed(4)}</span>
                <StatusBadge status={z.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Scheme + Q5 split */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Scheme Coverage</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Valid',    val: SCHEME_COVERAGE.valid,   pct: '25.9%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                { label: 'Flagged', val: SCHEME_COVERAGE.flagged,  pct: '60.1%', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'   },
                { label: 'No Data', val: SCHEME_COVERAGE.noData,   pct: '14.0%', color: 'text-gray-500',    bg: 'bg-gray-100 border-gray-200'    },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
                  <div className={`text-xl font-bold ${s.color}`}>{s.val.toLocaleString()}</div>
                  <div className={`text-xs font-medium ${s.color}`}>{s.label}</div>
                  <div className="text-xs text-gray-400">{s.pct}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 text-center">
              Only <strong>17.6%</strong> of valid schemes functional · 108 of 615
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Q5 Overall Satisfaction Split</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Satisfied',    pct: 52.1, n: 2233, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                { label: 'Neutral',      pct: 23.1, n: 990,  color: 'text-gray-600',    bg: 'bg-gray-100 border-gray-200'    },
                { label: 'Dissatisfied', pct: 24.8, n: 1061, color: 'text-red-700',     bg: 'bg-red-50 border-red-200'       },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.pct}%</div>
                  <div className={`text-xs font-medium ${s.color}`}>{s.label}</div>
                  <div className="text-xs text-gray-400">{fmt(s.n)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

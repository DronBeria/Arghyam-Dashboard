import {
  KPI_HEADLINE, KPI_QUESTIONS, SCHEME_COVERAGE,
  ZONE_SCORES, DISTRICT_SCORES,
} from '../data/csatData'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts'
import { StatusBadge } from '../components/StatusBadge'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_CALLS   = 45863
const CONSENTED     = 12583
const USABLE        = 9224
const COMPLETED_ALL = 1578
const STATE_BSI     = KPI_HEADLINE.stateBSI

const BSI_GAUGE = [
  { name: 'BSI',    value: +(STATE_BSI * 100).toFixed(2), fill: '#f59e0b' },
  { name: 'Gap to target', value: +(70 - STATE_BSI * 100).toFixed(2), fill: '#d1fae5' },
  { name: 'Above target',  value: 30, fill: '#f3f4f6' },
]

const Q_CHART = [...KPI_QUESTIONS]
  .sort((a, b) => b.yesPct - a.yesPct)
  .map(q => ({
    name: q.id, label: q.label, pct: q.yesPct, base: q.base,
    color: q.status === 'Good' ? '#10b981' : q.status === 'Critical' ? '#ef4444' : '#f59e0b',
  }))

const ZONES_RANKED = ZONE_SCORES
  .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))

function fmt(n: number) { return n.toLocaleString() }

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  return (
    <div className="space-y-5">

      {/* ── Status flags ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          🚨 Q1 Daily Supply: 30.95% — critical gap
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          ⚠️ 507 of 615 valid schemes non-functional
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          📍 2 zones Critical · 0 zones meet 0.70 target
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Phase 1 complete · Phase 2 re-calling recommended
        </span>
      </div>

      {/* ── Headline KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Calls',      value: fmt(TOTAL_CALLS),              sub: fmt(2373) + ' IMIS schemes',              t: 'border-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700'    },
          { label: 'State BSI',        value: STATE_BSI + ' / 1.0',          sub: 'Moderate · target ≥ 0.70',               t: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
          { label: 'Q5 Satisfied',     value: KPI_HEADLINE.satisfied + '%',  sub: '2,233 of 4,284 who reached Q5',          t: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
          { label: 'Functional Schms', value: KPI_HEADLINE.functionalSchemes + '%', sub: '108 of 615 valid schemes',        t: 'border-red-400',     bg: 'bg-red-50',     text: 'text-red-700'     },
          { label: 'Consent Rate',     value: ((CONSENTED / TOTAL_CALLS) * 100).toFixed(1) + '%', sub: fmt(CONSENTED) + ' agreed to participate', t: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-700' },
          { label: 'Usable Calls',     value: fmt(USABLE),                   sub: ((USABLE / TOTAL_CALLS) * 100).toFixed(1) + '% of total · BSI base', t: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        ].map(c => (
          <div key={c.label}
            className={`bg-white rounded-xl border border-gray-100 border-t-4 ${c.t} p-4 shadow-sm hover:shadow-md transition-shadow`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 leading-tight">{c.label}</p>
            <p className={`text-xl font-bold ${c.text} leading-tight`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1 leading-snug">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── BSI · Survey KPIs · Call Funnel ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* BSI Gauge */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-700 mb-0.5 self-start">State BSI Score</p>
          <p className="text-xs text-gray-400 mb-3 self-start">Composite 0–1.0 · Good ≥ 0.70</p>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="85%" innerRadius="60%" outerRadius="100%"
                startAngle={180} endAngle={0} data={BSI_GAUGE}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-8">
            <span className="text-3xl font-bold text-amber-600">{STATE_BSI}</span>
            <span className="text-sm text-amber-400 ml-1">/ 1.0</span>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              Moderate · {((0.70 - STATE_BSI) * 100).toFixed(1)}pts below 0.70 target
            </p>
          </div>
          <div className="mt-2 w-full flex justify-between text-xs text-gray-400">
            <span>0</span><span className="text-emerald-600 font-semibold">0.70 target</span><span>1.0</span>
          </div>
          <div className="mt-3 w-full space-y-1.5 pt-3 border-t border-gray-100">
            {[
              { label: 'Quality (Q2)',  val: 0.8905, max: 1.5 },
              { label: 'Quantity (Q3)', val: 0.8158, max: 1.5 },
              { label: 'Daily (Q1)',    val: 0.2803, max: 0.75 },
            ].map(c => {
              const fp = (c.val / c.max) * 100
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-500">{c.label}</span>
                    <span className={`font-mono ${fp < 45 ? 'text-red-500' : fp < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {c.val.toFixed(3)}/{c.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fp < 45 ? 'bg-red-400' : fp < 65 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${fp}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Survey KPIs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">Survey KPIs — % Yes</p>
          <p className="text-xs text-gray-400 mb-3">Each question has an independent respondent base</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Q_CHART} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, _: string, p: { payload?: { label?: string; base?: number } }) => [
                    `${v.toFixed(1)}%  (n = ${p.payload?.base?.toLocaleString()})`,
                    p.payload?.label ?? '',
                  ]}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2"
                  label={{ value: '70% target', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {Q_CHART.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
            {Q_CHART.map(q => (
              <div key={q.name} className="flex justify-between text-xs text-gray-400">
                <span><span className="font-mono font-bold text-gray-600">{q.name}</span> {q.label}</span>
                <span>n = {fmt(q.base)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">Call Funnel</p>
          <p className="text-xs text-gray-400 mb-4">All % of {fmt(TOTAL_CALLS)} total calls</p>
          <div className="space-y-3">
            {[
              { label: 'Total Dialled',  val: TOTAL_CALLS,   pct: 100,                                                    color: 'bg-blue-500'    },
              { label: 'Consented',      val: CONSENTED,     pct: +((CONSENTED / TOTAL_CALLS) * 100).toFixed(1),         color: 'bg-indigo-400'  },
              { label: 'Usable (Q1)',    val: USABLE,        pct: +((USABLE / TOTAL_CALLS) * 100).toFixed(1),            color: 'bg-emerald-500' },
              { label: 'All 5 complete', val: COMPLETED_ALL, pct: +((COMPLETED_ALL / TOTAL_CALLS) * 100).toFixed(1),    color: 'bg-emerald-700' },
            ].map((s, i, arr) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="font-mono text-gray-500">{fmt(s.val)} <span className="text-gray-400">({s.pct}%)</span></span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
                {i < arr.length - 1 && (
                  <p className="text-xs text-gray-400 mt-0.5 text-right">
                    ↓ {((arr[i+1].val / s.val) * 100).toFixed(1)}% carried forward
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zone Rankings · Scheme Coverage ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Zone Rankings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Zone BSI Rankings</p>
              <p className="text-xs text-gray-400">Scale 0–1.0 · Target ≥ 0.70 · No zone qualifies yet</p>
            </div>
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full font-medium">
              0 / 6 meet target
            </span>
          </div>
          <div className="space-y-2.5">
            {ZONES_RANKED.map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono w-4 flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-medium text-gray-700 w-24 truncate flex-shrink-0">{z.zone}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div className={`h-full rounded ${z.status === 'Critical' ? 'bg-red-400' : 'bg-amber-400'}`}
                    style={{ width: `${(z.bsi! / 1.0) * 100}%` }} />
                </div>
                <span className={`text-xs font-bold font-mono w-14 text-right flex-shrink-0 ${z.status === 'Critical' ? 'text-red-600' : 'text-amber-700'}`}>
                  {z.bsi?.toFixed(4)}
                </span>
                <div className="flex-shrink-0"><StatusBadge status={z.status} /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4"></span>
            <span className="text-xs font-semibold text-blue-600 w-24 flex-shrink-0">State Avg</span>
            <div className="flex-1 h-5 bg-blue-50 rounded overflow-hidden border border-blue-100">
              <div className="h-full bg-blue-300 rounded" style={{ width: `${(0.4406 / 1.0) * 100}%` }} />
            </div>
            <span className="text-xs font-bold font-mono w-14 text-right text-blue-600">0.4406</span>
            <div className="flex-shrink-0"><StatusBadge status="Moderate" /></div>
          </div>
        </div>

        {/* Scheme Coverage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Scheme Coverage</p>
              <p className="text-xs text-gray-400">{fmt(SCHEME_COVERAGE.total)} total IMIS schemes</p>
            </div>
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full font-medium">
              {SCHEME_COVERAGE.functionalRate}% functional
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            {[
              { label: 'Valid',   n: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Flagged', n: SCHEME_COVERAGE.flagged, pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'     },
              { label: 'No Data', n: SCHEME_COVERAGE.noData,  pct: SCHEME_COVERAGE.noDataPct,  color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200'       },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-2.5 ${s.bg}`}>
                <div className={`text-lg font-bold ${s.color}`}>{fmt(s.n)}</div>
                <div className={`text-xs font-semibold ${s.color}`}>{s.label}</div>
                <div className="text-xs text-gray-400">{s.pct}%</div>
              </div>
            ))}
          </div>

          {/* Stacked bar — sums to 100% */}
          <div className="h-3 rounded-full overflow-hidden flex mb-1">
            <div className="bg-emerald-400 h-full" style={{ width: `${SCHEME_COVERAGE.validPct}%` }} />
            <div className="bg-amber-400 h-full"   style={{ width: `${SCHEME_COVERAGE.flaggedPct}%` }} />
            <div className="bg-gray-300 h-full"    style={{ width: `${SCHEME_COVERAGE.noDataPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span className="text-emerald-600">■ Valid {SCHEME_COVERAGE.validPct}%</span>
            <span className="text-amber-600">■ Flagged {SCHEME_COVERAGE.flaggedPct}%</span>
            <span>■ No data {SCHEME_COVERAGE.noDataPct}%</span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Of {fmt(SCHEME_COVERAGE.valid)} valid schemes:</p>
            <div className="h-3 rounded-full overflow-hidden flex mb-1.5">
              <div className="bg-emerald-500 h-full" style={{ width: `${SCHEME_COVERAGE.functionalRate}%` }} />
              <div className="bg-red-400 h-full flex-1" />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-emerald-700 font-semibold">✓ {fmt(SCHEME_COVERAGE.functional)} functional ({SCHEME_COVERAGE.functionalRate}%)</span>
              <span className="text-red-600 font-semibold">✗ {fmt(SCHEME_COVERAGE.nonFunctional)} failing</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Q1 ≥50% AND Q2 ≥70% AND Q3 ≥70%</p>
          </div>
        </div>
      </div>

      {/* ── Q5 Satisfaction split ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-1">Q5 — Overall Satisfaction</p>
        <p className="text-xs text-gray-400 mb-4">4,284 respondents · 3-way split</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Satisfied',    pct: 52.1, n: 2233, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
            { label: 'Neutral',      pct: 23.1, n: 990,  color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200',     bar: 'bg-slate-400'   },
            { label: 'Dissatisfied', pct: 24.8, n: 1061, color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         bar: 'bg-red-500'     },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.pct}%</div>
              <div className={`text-xs font-semibold ${s.color} mt-1`}>{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{fmt(s.n)} respondents</div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-2">
                <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigate to deeper views ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Explore in Detail</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { page: 'calls',      icon: '📞', label: 'Call Analysis',    sub: 'Funnel, attempts, repeat' },
            { page: 'records',    icon: '🎙️', label: 'Call Records',     sub: '8,782 calls + recordings' },
            { page: 'survey',     icon: '📋', label: 'Survey Results',   sub: 'Q1–Q5 breakdown' },
            { page: 'schemes',    icon: '🏗️', label: 'Scheme Coverage',  sub: 'Functional analysis' },
            { page: 'geographic', icon: '🗺️', label: 'Zone & Districts', sub: 'BSI by geography' },
          ].map(n => (
            <a
              key={n.page}
              href={`#${n.page}`}
              onClick={(e) => {
                e.preventDefault()
                const event = new CustomEvent('navigate', { detail: n.page })
                window.dispatchEvent(event)
              }}
              className="flex flex-col items-start gap-1 p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group cursor-pointer"
            >
              <span className="text-xl">{n.icon}</span>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{n.label}</span>
              <span className="text-xs text-gray-400">{n.sub}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}

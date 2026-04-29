import {
  KPI_HEADLINE, KPI_QUESTIONS, SCHEME_COVERAGE, ZONE_SCORES,
} from '../data/csatData'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_CALLS   = 45863
const CONSENTED     = 12583
const USABLE        = 9224
const COMPLETED_ALL = 1578
const STATE_BSI     = KPI_HEADLINE.stateBSI
const STATE_BSI_5   = +(STATE_BSI * 5).toFixed(2)
const TARGET_5      = 3.50
const GAP_5         = +(TARGET_5 - STATE_BSI_5).toFixed(2)

const BSI_GAUGE = [
  { name: 'BSI',  value: +(STATE_BSI * 100).toFixed(1), fill: '#f59e0b' },
  { name: 'Gap',  value: +(70 - STATE_BSI * 100).toFixed(1), fill: '#fef3c7' },
  { name: 'Rest', value: 30, fill: '#f1f5f9' },
]

const ZONES_RANKED = ZONE_SCORES
  .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))

// Service area cards — plain language, like the reference dashboard
const SERVICE_AREAS = [
  {
    id: 'daily',
    title: 'Gets Water Every Day',
    sub: 'Last 7 days · daily supply regularity',
    yesN: 2855, noN: 6369, base: 9224,
    pct: 30.95,
    status: 'Critical',
    statusLabel: 'Critical',
    weight: '0.75 / 5',
    insight: 'Biggest gap — 69% of households report irregular supply',
    borderColor: 'border-l-red-500',
    barColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    badgeBg: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    id: 'quality',
    title: 'Happy with Water Quality',
    sub: 'Cleanliness and potability',
    yesN: 3293, noN: 1260, base: 4553,
    pct: 72.33,
    status: 'Good',
    statusLabel: 'Good',
    weight: '1.5 / 5',
    insight: 'Only metric above 70% target — quality perception is positive',
    borderColor: 'border-l-emerald-500',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    id: 'quantity',
    title: 'Satisfied with Water Quantity',
    sub: 'Sufficient supply volume',
    yesN: 2953, noN: 1792, base: 4745,
    pct: 62.23,
    status: 'Moderate',
    statusLabel: 'Needs Attention',
    weight: '1.5 / 5',
    insight: '38% report insufficient water volume — high-weight metric',
    borderColor: 'border-l-amber-500',
    barColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    id: 'timing',
    title: 'Water Comes at a Fixed Time',
    sub: 'Predictability and scheduling',
    yesN: 1222, noN: 920, base: 2142,
    pct: 57.05,
    status: 'Moderate',
    statusLabel: 'Needs Attention',
    weight: '0.75 / 5',
    insight: 'Predictability remains below target — scheduling improvements needed',
    borderColor: 'border-l-amber-400',
    barColor: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    id: 'overall',
    title: 'Overall Satisfaction',
    sub: 'Q5 — 3-way: Happy / Neutral / Sad',
    yesN: 2233, noN: 2051, base: 4284,
    pct: 52.12,
    status: 'Moderate',
    statusLabel: 'Needs Attention',
    weight: '0.5 / 5',
    insight: '24.8% expressed dissatisfaction; 23.1% neutral — improvement possible',
    borderColor: 'border-l-amber-500',
    barColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
  },
]

function fmt(n: number) { return n.toLocaleString() }

function nav(page: string) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: page }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  return (
    <div className="space-y-5">

      {/* ── 1. Alert banner ────────────────────────────────────────────── */}
      <div className="bg-red-600 rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 items-center">
        <span className="text-white text-xs font-semibold uppercase tracking-wider flex-shrink-0">🚨 Action Required</span>
        <span className="text-red-100 text-xs">Only 30.95% households get water every day</span>
        <span className="text-red-200 text-xs hidden sm:inline">·</span>
        <span className="text-red-100 text-xs">507 of 615 valid schemes are non-functional</span>
        <span className="text-red-200 text-xs hidden sm:inline">·</span>
        <span className="text-red-100 text-xs">BTAD and Barak Valley are Critical zones</span>
      </div>

      {/* ── 2. State BSI Hero ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">

          {/* Score */}
          <div className="flex items-center gap-6">
            {/* Radial gauge */}
            <div className="relative w-28 h-16 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="90%" innerRadius="55%" outerRadius="100%"
                  startAngle={180} endAngle={0} data={BSI_GAUGE}>
                  <RadialBar dataKey="value" cornerRadius={3} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 text-center">
                <span className="text-amber-400 text-xs font-bold">{STATE_BSI_5}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
                State Beneficiary Satisfaction Index
              </p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-amber-400 leading-none">{STATE_BSI_5}</span>
                <div>
                  <span className="text-slate-400 text-lg">/ 5.0</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚠ NEEDS ATTENTION · {GAP_5} below target
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-2">Target ≥ 3.50 (Good) · Assam Jal Jeevan Mission · Phase 1 · April 2026</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="lg:flex-1 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>0</span>
              <span className="text-emerald-400">3.50 target</span>
              <span>5.0</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(STATE_BSI_5 / 5) * 100}%` }} />
              <div className="absolute top-0 h-full w-px bg-emerald-400/60" style={{ left: '70%' }} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Water Quality',  val: '0.891', sub: 'of 1.5',  pct: 59.4, color: 'text-emerald-400' },
                { label: 'Water Quantity', val: '0.816', sub: 'of 1.5',  pct: 54.4, color: 'text-amber-400'   },
                { label: 'Daily Supply',   val: '0.280', sub: 'of 0.75', pct: 37.4, color: 'text-red-400'     },
              ].map(c => (
                <div key={c.label} className="bg-slate-700/50 rounded-lg p-2">
                  <div className={`text-sm font-bold ${c.color}`}>{c.val}<span className="text-xs text-slate-500 ml-1">{c.sub}</span></div>
                  <div className="text-xs text-slate-500">{c.label}</div>
                  <div className="h-1 bg-slate-600 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${c.color.replace('text-', 'bg-')}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement funnel */}
          <div className="lg:w-52 flex-shrink-0 bg-slate-700/50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Survey Reach</p>
            {[
              { label: 'Called',      n: TOTAL_CALLS,   pct: 100,   color: 'bg-blue-400'    },
              { label: 'Consented',   n: CONSENTED,     pct: 27.4,  color: 'bg-indigo-400'  },
              { label: 'Gave Data',   n: USABLE,        pct: 20.1,  color: 'bg-emerald-400' },
              { label: 'Completed',   n: COMPLETED_ALL, pct: 3.4,   color: 'bg-emerald-600' },
            ].map(s => (
              <div key={s.label} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="text-slate-400 font-mono">{fmt(s.n)}</span>
                </div>
                <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Service Area Breakdown ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">How Did Citizens Rate Each Service Area?</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Satisfaction Key:&nbsp;
              <span className="text-emerald-600 font-semibold">Good</span> (≥70% Yes) &nbsp;
              <span className="text-amber-600 font-semibold">Needs Attention</span> (40–70%) &nbsp;
              <span className="text-red-600 font-semibold">Critical</span> (&lt;40%)
            </p>
          </div>
          <button onClick={() => nav('survey')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">
            Full Survey →
          </button>
        </div>

        <div className="space-y-2.5">
          {SERVICE_AREAS.map(q => (
            <div
              key={q.id}
              onClick={() => nav('survey')}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${q.borderColor} p-4 shadow-sm
                hover:shadow-md hover:border-r-blue-200 cursor-pointer transition-all group`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{q.title}</p>
                    <span className="text-xs text-gray-400 hidden sm:inline">{q.sub}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    <span className="font-bold text-gray-700">{fmt(q.yesN)}</span> of{' '}
                    <span className="font-semibold">{fmt(q.base)}</span> households said "Yes" —{' '}
                    <span className={`font-bold ${q.pct >= 70 ? 'text-emerald-600' : q.pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {q.pct.toFixed(1)}%
                    </span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${q.barColor} rounded-full transition-all`} style={{ width: `${q.pct}%` }} />
                    </div>
                    <div className="h-3 w-px bg-gray-200 flex-shrink-0" style={{ marginLeft: `calc(${70}% - 100%)` }} />
                    <span className="text-xs text-gray-400 flex-shrink-0 w-24 hidden md:block">{q.insight}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 md:hidden">{q.insight}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${q.badgeBg}`}>
                    {q.statusLabel}
                  </span>
                  <span className="text-xs text-gray-300 group-hover:text-blue-400">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Zone Rankings + Scheme Coverage ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Zone Rankings */}
        <div
          onClick={() => nav('geographic')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Zone BSI Rankings</p>
              <p className="text-xs text-gray-400">Scale 0–5.0 · Target ≥ 3.50 · 0 of 6 qualify</p>
            </div>
            <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">View map →</span>
          </div>
          <div className="space-y-2">
            {ZONES_RANKED.map((z, i) => {
              const bsi5 = (z.bsi! * 5).toFixed(2)
              const isCrit = z.status === 'Critical'
              return (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 font-mono">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-700 w-24 truncate">{z.zone}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${isCrit ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${(z.bsi! / 1.0) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold font-mono w-16 text-right ${isCrit ? 'text-red-600' : 'text-amber-700'}`}>
                    {bsi5}/5
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isCrit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {isCrit ? 'Critical' : 'Needs Attention'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
            <span className="text-xs w-4" />
            <span className="text-xs font-semibold text-blue-700 w-24">State Avg</span>
            <div className="flex-1 h-4 bg-blue-50 rounded overflow-hidden border border-blue-100">
              <div className="h-full bg-blue-400 rounded" style={{ width: `${(STATE_BSI / 1.0) * 100}%` }} />
            </div>
            <span className="text-xs font-bold font-mono w-16 text-right text-blue-700">{STATE_BSI_5}/5</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Needs Att.</span>
          </div>
        </div>

        {/* Scheme Coverage */}
        <div
          onClick={() => nav('schemes')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Scheme Coverage</p>
              <p className="text-xs text-gray-400">{fmt(SCHEME_COVERAGE.total)} IMIS schemes · Phase 1</p>
            </div>
            <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">View detail →</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Valid',     n: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Flagged',  n: SCHEME_COVERAGE.flagged, pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'     },
              { label: 'No Data',  n: SCHEME_COVERAGE.noData,  pct: SCHEME_COVERAGE.noDataPct,  color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200'       },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border p-2.5 text-center ${s.bg}`}>
                <div className={`text-xl font-black ${s.color}`}>{fmt(s.n)}</div>
                <div className={`text-xs font-semibold ${s.color}`}>{s.label}</div>
                <div className="text-xs text-gray-400">{s.pct}%</div>
              </div>
            ))}
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex mb-2">
            <div className="bg-emerald-400" style={{ width: `${SCHEME_COVERAGE.validPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${SCHEME_COVERAGE.flaggedPct}%` }} />
            <div className="bg-gray-200 flex-1" />
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-700">Of {fmt(SCHEME_COVERAGE.valid)} valid schemes:</p>
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                Critical
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500" style={{ width: `${SCHEME_COVERAGE.functionalRate}%` }} />
              <div className="bg-red-400 flex-1" />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-emerald-700 font-semibold">✓ {fmt(SCHEME_COVERAGE.functional)} functional ({SCHEME_COVERAGE.functionalRate}%)</span>
              <span className="text-red-600 font-semibold">✗ {fmt(SCHEME_COVERAGE.nonFunctional)} failing</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. What Needs Attention ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-1">What Needs Attention — Phase 2 Priorities</p>
        <p className="text-xs text-gray-400 mb-4">Based on Phase 1 findings · Araghyam recommendation</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              priority: '01',
              issue: 'Daily Supply Regularity',
              detail: '69% of 9,224 surveyed households report irregular water supply — highest-impact problem',
              action: 'Target: Q1 improvement in Phase 2 re-calls',
              color: 'border-red-200 bg-red-50',
              badge: 'bg-red-100 text-red-700',
              num: 'text-red-300',
              page: 'calls',
            },
            {
              priority: '02',
              issue: 'Non-Functional Schemes',
              detail: '507 of 615 valid schemes (82.4%) fail the functionality test — scheme infrastructure crisis',
              action: 'Target: Re-inspect flagged 1,426 schemes',
              color: 'border-amber-200 bg-amber-50',
              badge: 'bg-amber-100 text-amber-700',
              num: 'text-amber-300',
              page: 'schemes',
            },
            {
              priority: '03',
              issue: 'Critical Zones: BTAD & Barak Valley',
              detail: 'BTAD (1.92/5.0) and Barak Valley (1.89/5.0) are the two lowest-performing regions',
              action: 'Target: Zone-specific re-call campaigns in Phase 2',
              color: 'border-orange-200 bg-orange-50',
              badge: 'bg-orange-100 text-orange-700',
              num: 'text-orange-300',
              page: 'geographic',
            },
          ].map(a => (
            <div
              key={a.priority}
              onClick={() => nav(a.page)}
              className={`rounded-xl border-2 p-4 cursor-pointer hover:shadow-md transition-all group ${a.color}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-3xl font-black ${a.num} leading-none`}>{a.priority}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.badge}`}>Action Required</span>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">{a.issue}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{a.detail}</p>
              <p className="text-xs text-gray-500 font-medium">{a.action}</p>
              <p className="text-xs text-blue-500 group-hover:text-blue-700 mt-2">Explore →</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Explore navigation ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-blue-100 p-5">
        <p className="text-sm font-bold text-gray-800 mb-1">Explore Full Data</p>
        <p className="text-xs text-gray-400 mb-4">Click any section above or jump directly to a detailed view</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { page: 'calls',      icon: '📞', label: 'Call Analysis',    sub: 'Funnel, attempts, repeat callers',   color: 'hover:border-blue-400 hover:bg-blue-50'    },
            { page: 'records',    icon: '🎙️', label: 'Call Records',     sub: '105,512 raw calls + 8,782 recordings', color: 'hover:border-purple-400 hover:bg-purple-50' },
            { page: 'survey',     icon: '📋', label: 'Survey Results',   sub: 'Q1–Q5 full breakdown + Q5 split',    color: 'hover:border-emerald-400 hover:bg-emerald-50' },
            { page: 'schemes',    icon: '🏗️', label: 'Scheme Coverage',  sub: 'Functional analysis · 2,373 schemes', color: 'hover:border-amber-400 hover:bg-amber-50'  },
            { page: 'geographic', icon: '🗺️', label: 'Zone & Districts', sub: 'BSI by zone + 31 districts',         color: 'hover:border-red-400 hover:bg-red-50'       },
          ].map(n => (
            <button
              key={n.page}
              onClick={() => nav(n.page)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border border-gray-200 bg-white transition-all group text-left shadow-sm hover:shadow-md ${n.color}`}
            >
              <span className="text-2xl">{n.icon}</span>
              <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900 leading-tight">{n.label}</span>
              <span className="text-xs text-gray-400 leading-tight">{n.sub}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

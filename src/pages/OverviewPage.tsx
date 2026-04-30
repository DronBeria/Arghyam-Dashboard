import { KPI_HEADLINE, ZONE_SCORES, SCHEME_COVERAGE } from '../data/csatData'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATE_BSI   = KPI_HEADLINE.stateBSI
const STATE_BSI_5 = +(STATE_BSI * 5).toFixed(2)
const TARGET_5    = 3.50
const GAP_5       = +(TARGET_5 - STATE_BSI_5).toFixed(2)

const ZONES_RANKED = ZONE_SCORES
  .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))

const SERVICE_AREAS = [
  { id: 'daily',    q: 'Q1', title: 'Daily Water Supply',      yesN: 2855,  base: 9224, pct: 30.95, status: 'Critical',  bar: 'bg-red-500',     badge: 'bg-red-100 text-red-700',     border: 'border-l-red-500'    },
  { id: 'quality',  q: 'Q2', title: 'Water Quality',           yesN: 3293,  base: 4553, pct: 72.33, status: 'Good',      bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-500' },
  { id: 'quantity', q: 'Q3', title: 'Water Quantity',          yesN: 2953,  base: 4745, pct: 62.23, status: 'Moderate',  bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-500'  },
  { id: 'timing',   q: 'Q4', title: 'Fixed Supply Timing',     yesN: 1222,  base: 2142, pct: 57.05, status: 'Moderate',  bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-400'  },
  { id: 'overall',  q: 'Q5', title: 'Overall Satisfaction',    yesN: 2233,  base: 4284, pct: 52.12, status: 'Moderate',  bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-500'  },
]

function fmt(n: number) { return n.toLocaleString() }
function nav(page: string) { window.dispatchEvent(new CustomEvent('navigate', { detail: page })) }

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  return (
    <div className="space-y-4">

      {/* ── 1. Top KPI strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'State BSI Score',   val: `${STATE_BSI_5}/5.0`, sub: `${GAP_5} below target`,     color: 'text-amber-600',   bg: 'bg-amber-50  border-amber-200',  icon: '📊' },
          { label: 'Calls Dialled',     val: '45,863',              sub: 'Assam · April 2026',         color: 'text-blue-700',    bg: 'bg-blue-50   border-blue-200',   icon: '📞' },
          { label: 'Surveys Completed', val: '9,224',               sub: 'Usable Q1+ responses',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '✅' },
          { label: 'Satisfied (Q5)',    val: '52.1%',               sub: '24.8% dissatisfied',         color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200', icon: '😊' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-2xl font-black leading-none ${k.color}`}>{k.val}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              </div>
              <span className="text-xl">{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. BSI Score card + alert ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* BSI Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-800">Beneficiary Satisfaction Index (BSI)</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              ⚠ Needs Attention
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Phase 1 · Assam JJM · Target ≥ 3.50 (Good)</p>

          {/* Main score bar */}
          <div className="mb-4">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-amber-600">{STATE_BSI_5}</span>
              <span className="text-lg text-gray-400 mb-1">/ 5.0</span>
              <span className="text-xs text-gray-400 mb-1.5 ml-1">({GAP_5} gap to target)</span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-200" style={{ width: '40%' }} />
                <div className="h-full bg-amber-200" style={{ width: '30%' }} />
                <div className="h-full bg-emerald-200 flex-1" />
              </div>
              <div className="absolute inset-y-0 left-0 h-full bg-amber-500 rounded-full"
                style={{ width: `${(STATE_BSI_5 / 5) * 100}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-600" style={{ left: '70%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 Critical</span>
              <span className="text-emerald-600 font-medium">3.50 Target ↑</span>
              <span>5.0 Perfect</span>
            </div>
          </div>

          {/* Component mini-bars */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Water Quality',  scored: 0.8905, max: 1.5,  color: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'Water Quantity', scored: 0.8158, max: 1.5,  color: 'bg-amber-500',   text: 'text-amber-700'   },
              { label: 'Daily Supply',   scored: 0.2803, max: 0.75, color: 'bg-red-500',    text: 'text-red-700'     },
            ].map(c => (
              <div key={c.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className={`text-sm font-bold ${c.text}`}>{c.scored.toFixed(3)}</div>
                <div className="text-xs text-gray-400 mb-1.5">{c.label} <span className="text-gray-300">/ {c.max}</span></div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${(c.scored / c.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert + Survey Reach */}
        <div className="space-y-3">
          {/* Alert */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Key Concerns</p>
            <div className="space-y-2">
              {[
                { icon: '🚱', text: 'Only 31% get water daily' },
                { icon: '🔧', text: '82% of schemes non-functional' },
                { icon: '🔴', text: 'BTAD & Barak Valley critical' },
              ].map(a => (
                <div key={a.text} className="flex items-center gap-2">
                  <span className="text-sm">{a.icon}</span>
                  <span className="text-xs text-red-700 font-medium">{a.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Survey reach */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-700 mb-3">Survey Reach Funnel</p>
            <div className="space-y-2">
              {[
                { label: 'Called',    n: 45863, pct: 100,  color: 'bg-blue-500'    },
                { label: 'Consented', n: 12583, pct: 27.4, color: 'bg-indigo-400'  },
                { label: 'Usable',    n: 9224,  pct: 20.1, color: 'bg-emerald-500' },
                { label: 'Completed', n: 1578,  pct: 3.4,  color: 'bg-emerald-700' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600 font-medium">{s.label}</span>
                    <span className="text-gray-500 font-mono">{fmt(s.n)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Service Areas ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Service Area Satisfaction</p>
            <p className="text-xs text-gray-400">Q1–Q5 · Good ≥70% · Moderate 40–70% · Critical &lt;40%</p>
          </div>
          <button onClick={() => nav('survey')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors">
            Full Survey →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {SERVICE_AREAS.map(q => {
            const pctColor = q.pct >= 70 ? 'text-emerald-700' : q.pct >= 40 ? 'text-amber-700' : 'text-red-700'
            return (
              <div key={q.id} onClick={() => nav('survey')}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors group border-l-4 ${q.border}`}>
                <span className="text-xs font-bold text-gray-400 font-mono w-6 flex-shrink-0">{q.q}</span>
                <div className="w-36 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{q.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(q.yesN)} / {fmt(q.base)} said Yes</p>
                </div>
                <div className="flex-1">
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 h-full rounded-full transition-all" style={{ width: `${q.pct}%`, backgroundColor: q.bar.replace('bg-', '') === q.bar ? undefined : undefined }} >
                      <div className={`w-full h-full ${q.bar} rounded-full`} />
                    </div>
                    <div className="absolute top-0 bottom-0 w-px bg-gray-400/40" style={{ left: '70%' }} />
                  </div>
                </div>
                <span className={`text-sm font-black w-12 text-right flex-shrink-0 ${pctColor}`}>{q.pct.toFixed(1)}%</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-28 text-center flex-shrink-0 ${q.badge}`}>{q.status}</span>
                <span className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 text-xs">→</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 4. Zone Rankings + Scheme Coverage ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Zone Rankings */}
        <div onClick={() => nav('geographic')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Zone BSI Rankings</p>
              <p className="text-xs text-gray-400">0 of 6 zones reach 3.50 target</p>
            </div>
            <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">View map →</span>
          </div>
          <div className="space-y-2.5">
            {ZONES_RANKED.map((z, i) => {
              const bsi5 = (z.bsi! * 5).toFixed(2)
              const isCrit = z.status === 'Critical'
              const barPct = (z.bsi! / 0.7) * 100  // normalize against target
              return (
                <div key={z.zone} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-300 font-mono w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-700 w-28 truncate flex-shrink-0">{z.zone}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isCrit ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(barPct, 100)}%` }} />
                  </div>
                  <span className={`text-xs font-bold font-mono w-14 text-right flex-shrink-0 ${isCrit ? 'text-red-600' : 'text-amber-600'}`}>
                    {bsi5}/5
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scheme Coverage */}
        <div onClick={() => nav('schemes')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Scheme Coverage</p>
              <p className="text-xs text-gray-400">{fmt(SCHEME_COVERAGE.total)} IMIS schemes surveyed</p>
            </div>
            <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">View detail →</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Valid',    n: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Flagged', n: SCHEME_COVERAGE.flagged, pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100'     },
              { label: 'No Data', n: SCHEME_COVERAGE.noData,  pct: SCHEME_COVERAGE.noDataPct,  color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-100'       },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border p-3 text-center ${s.bg}`}>
                <div className={`text-lg font-black ${s.color}`}>{fmt(s.n)}</div>
                <div className={`text-xs font-semibold ${s.color}`}>{s.label}</div>
                <div className="text-xs text-gray-400">{s.pct}%</div>
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full overflow-hidden flex">
            <div className="bg-emerald-400" style={{ width: `${SCHEME_COVERAGE.validPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${SCHEME_COVERAGE.flaggedPct}%` }} />
            <div className="bg-gray-200 flex-1" />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 font-medium">Of {fmt(SCHEME_COVERAGE.valid)} valid schemes</span>
              <span className="text-red-600 font-bold">{SCHEME_COVERAGE.nonFunctional} failing</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500" style={{ width: `${SCHEME_COVERAGE.functionalRate}%` }} />
              <div className="bg-red-400 flex-1" />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-emerald-700">{SCHEME_COVERAGE.functionalRate}% functional</span>
              <span className="text-red-600">{100 - SCHEME_COVERAGE.functionalRate}% non-functional</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Phase 2 Priorities ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-bold text-gray-800 mb-1">Phase 2 Action Priorities</p>
        <p className="text-xs text-gray-400 mb-4">Based on Phase 1 data · Araghyam recommendations</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: '1', title: 'Fix Daily Supply',     detail: '69% of surveyed households report irregular water — the biggest single gap in the BSI score.', tag: 'Critical', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', num: 'text-red-300', page: 'calls' },
            { n: '2', title: 'Repair Non-Functional Schemes', detail: '507 of 615 valid schemes (82%) fail functionality — infrastructure must be addressed before Phase 2 surveys.', tag: 'High Priority', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', num: 'text-amber-300', page: 'schemes' },
            { n: '3', title: 'Target Critical Zones', detail: 'BTAD (1.92/5) and Barak Valley (1.89/5) need dedicated intervention campaigns before Phase 2.', tag: 'High Priority', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', num: 'text-orange-300', page: 'geographic' },
          ].map(a => (
            <div key={a.n} onClick={() => nav(a.page)}
              className={`rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all group ${a.color}`}>
              <div className="flex items-start justify-between mb-2.5">
                <span className={`text-4xl font-black leading-none ${a.num}`}>{a.n}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.badge}`}>{a.tag}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">{a.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{a.detail}</p>
              <p className="text-xs text-blue-500 group-hover:text-blue-700 mt-3 font-medium">View data →</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Quick navigation ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { page: 'calls',      icon: '📞', label: 'Call Analysis',   color: 'hover:border-blue-300    hover:bg-blue-50/40'    },
          { page: 'records',    icon: '🎙️', label: 'Call Records',    color: 'hover:border-purple-300  hover:bg-purple-50/40'  },
          { page: 'survey',     icon: '📋', label: 'Survey Results',  color: 'hover:border-emerald-300 hover:bg-emerald-50/40' },
          { page: 'schemes',    icon: '🏗️', label: 'Scheme Coverage', color: 'hover:border-amber-300   hover:bg-amber-50/40'   },
          { page: 'geographic', icon: '🗺️', label: 'Zone & Districts',color: 'hover:border-red-300     hover:bg-red-50/40'     },
        ].map(n => (
          <button key={n.page} onClick={() => nav(n.page)}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 bg-white transition-all text-left shadow-sm hover:shadow ${n.color}`}>
            <span className="text-xl flex-shrink-0">{n.icon}</span>
            <span className="text-xs font-semibold text-gray-700 leading-tight">{n.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}

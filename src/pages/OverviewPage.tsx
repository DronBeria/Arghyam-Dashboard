import { useState } from 'react'
import {
  KPI_HEADLINE, KPI_QUESTIONS, SCHEME_COVERAGE,
  ZONE_SCORES, DISTRICT_SCORES,
} from '../data/csatData'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts'
import { StatusBadge } from '../components/StatusBadge'

// ─── Derived constants ────────────────────────────────────────────────────────
const TOTAL_CALLS    = 45863
const CONSENTED      = 12583
const USABLE         = 9224
const COMPLETED_ALL  = 1578
const CONSENT_PCT    = ((CONSENTED / TOTAL_CALLS) * 100).toFixed(1)     // 27.4
const USABLE_PCT     = ((USABLE    / TOTAL_CALLS) * 100).toFixed(1)     // 20.1
const COMPLETED_PCT  = ((COMPLETED_ALL / TOTAL_CALLS) * 100).toFixed(1) // 3.4
const STATE_BSI      = KPI_HEADLINE.stateBSI                            // 0.4406

const CRITICAL_ZONES     = ZONE_SCORES.filter(z => z.status === 'Critical' && z.zone !== 'Assam (State)')
const CRITICAL_DISTRICTS = DISTRICT_SCORES.filter(d => d.status === 'Critical').sort((a, b) => a.bsi - b.bsi)
const BEST_DISTRICT      = [...DISTRICT_SCORES].sort((a, b) => b.bsi - a.bsi)[0]
const WORST_DISTRICT     = [...DISTRICT_SCORES].sort((a, b) => a.bsi - b.bsi)[0]

// Gauge data scaled 0–100 so RadialBar fills correctly
const BSI_GAUGE = [
  { name: 'BSI',    value: +(STATE_BSI * 100).toFixed(2), fill: '#f59e0b' },
  { name: 'Target', value: +(70 - STATE_BSI * 100).toFixed(2), fill: '#d1fae5' },
  { name: 'Gap',    value: 30, fill: '#f3f4f6' },
]

const Q_CHART = [...KPI_QUESTIONS]
  .sort((a, b) => b.yesPct - a.yesPct)
  .map(q => ({
    name: q.id, label: q.label, pct: q.yesPct, base: q.base,
    color: q.status === 'Good' ? '#10b981' : q.status === 'Critical' ? '#ef4444' : '#f59e0b',
  }))

function fmt(n: number) { return n.toLocaleString() }
function dropPct(a: number, b: number) { return ((a / b) * 100).toFixed(1) }

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const [openAlert, setOpenAlert]     = useState<string | null>(null)
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  return (
    <div className="space-y-5">
      <AlertBar openAlert={openAlert} setOpenAlert={setOpenAlert} />
      <KPIStrip />
      <QuickAnswers openQuestion={openQuestion} setOpenQuestion={setOpenQuestion} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BSIGauge />
        <SurveyKPIChart />
        <CallFunnel />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ZoneRanking />
        <SchemeSnapshot />
      </div>
    </div>
  )
}

// ─── Alert bar ────────────────────────────────────────────────────────────────
const ALERTS = [
  {
    id: 'daily', level: 'critical' as const, icon: '🚨',
    title: 'Only 30.95% receive water daily — worst KPI and primary BSI driver',
    short: `6,369 of 9,224 households reported water did NOT arrive every day. This single metric pulls down the entire BSI score more than any other.`,
    detail: `Q1 (Water Received Daily) scored 30.95% yes — the lowest of all 5 indicators. Water continuity is the foundation: quality and satisfaction can only improve after supply is consistent. Districts with lowest Q1 scores are Hailakandi (BSI 0.2785), Tamulpur, Baksa, Udalguri.`,
  },
  {
    id: 'schemes', level: 'critical' as const, icon: '⚠️',
    title: '507 of 615 valid schemes non-functional (82.4%) — need immediate field action',
    short: `Only 108 valid schemes pass all 3 functionality tests. 1,426 more are flagged (insufficient data) and need re-calling in Phase 2.`,
    detail: `A scheme is "functional" when: Q1 ≥50% daily water, Q2 ≥70% clean quality, Q3 ≥70% sufficient quantity. Of 615 schemes with ≥6 usable calls, 507 fail at least one test. The 1,426 flagged + 332 no-data schemes represent another 1,758 schemes with unknown status.`,
  },
  {
    id: 'zones', level: 'warning' as const, icon: '📍',
    title: `${CRITICAL_ZONES.length} zones Critical (BSI < 0.40) · No zone meets the 0.70 benchmark`,
    short: `BTAD (0.3841) and Barak Valley (0.3789) are the worst performing zones. The best zone, North Assam (0.4836), is still 26 points below the 0.70 Good target.`,
    detail: `${CRITICAL_DISTRICTS.length} districts are in Critical status: ${CRITICAL_DISTRICTS.map(d => `${d.district} (${d.bsi.toFixed(4)})`).join(', ')}. These should be the priority for Phase 2 interventions. Note that BSI is a composite — improving Q1 (daily water) alone would significantly lift all zone scores.`,
  },
]

function AlertBar({ openAlert, setOpenAlert }: { openAlert: string | null; setOpenAlert: (id: string | null) => void }) {
  return (
    <div className="space-y-2">
      {ALERTS.map(a => {
        const isOpen   = openAlert === a.id
        const isCrit   = a.level === 'critical'
        const border   = isCrit ? 'border-red-200'  : 'border-amber-200'
        const bg       = isCrit ? 'bg-red-50'        : 'bg-amber-50'
        const title    = isCrit ? 'text-red-800'     : 'text-amber-800'
        const body     = isCrit ? 'text-red-700'     : 'text-amber-700'
        const btn      = isCrit ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        return (
          <div key={a.id} className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
            <button className="w-full flex items-start gap-3 px-4 py-3 text-left"
              onClick={() => setOpenAlert(isOpen ? null : a.id)}>
              <span className="text-base flex-shrink-0 mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${title}`}>{a.title}</p>
                <p className={`text-xs mt-0.5 ${body}`}>{a.short}</p>
              </div>
              <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${btn}`}>
                {isOpen ? 'Hide ▲' : 'Explain ▼'}
              </span>
            </button>
            {isOpen && (
              <div className={`px-4 pb-4 pt-2 text-xs ${body} leading-relaxed border-t ${border}`}>
                {a.detail}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI strip ────────────────────────────────────────────────────────────────
function KPIStrip() {
  const cards = [
    { label: 'Total Calls',     value: fmt(TOTAL_CALLS),         sub: `${fmt(2373)} IMIS schemes`,             color: 'border-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',    tip: 'All dials made across Assam in Phase 1' },
    { label: 'State BSI',       value: `${STATE_BSI} / 1.0`,     sub: `Moderate · ${((0.70-STATE_BSI)*100).toFixed(1)}pts below target`, color: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', tip: 'Beneficiary Satisfaction Index — composite of Q1–Q5 weighted scores' },
    { label: 'Q5 Satisfied',    value: `${KPI_HEADLINE.satisfied}%`, sub: `2,233 of 4,284 who reached Q5`,    color: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   tip: 'Only 4,284 of 9,224 usable calls reached the final question' },
    { label: 'Functional Schms',value: `${KPI_HEADLINE.functionalSchemes}%`, sub: `108 of 615 valid · 507 need action`, color: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700', tip: 'Functional = Q1≥50% AND Q2≥70% AND Q3≥70%' },
    { label: 'Consent Rate',    value: `${CONSENT_PCT}%`,         sub: `${fmt(CONSENTED)} of ${fmt(TOTAL_CALLS)} agreed`, color: 'border-slate-400', bg: 'bg-slate-50', text: 'text-slate-700', tip: 'Households that agreed to participate after picking up' },
    { label: 'Usable Calls',    value: fmt(USABLE),               sub: `${USABLE_PCT}% of total · BSI base`,  color: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', tip: 'Any call where Q1 was answered — the base for all BSI scoring' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} title={c.tip}
          className={`bg-white rounded-xl border-t-4 border border-gray-100 ${c.color} p-3.5 shadow-sm hover:shadow-md transition-shadow`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 leading-tight">{c.label}</p>
          <p className={`text-xl font-bold ${c.text} leading-tight`}>{c.value}</p>
          <p className="text-xs text-gray-400 mt-1 leading-snug">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Quick answers accordion ──────────────────────────────────────────────────
function QuickAnswers({ openQuestion, setOpenQuestion }: {
  openQuestion: number | null
  setOpenQuestion: (i: number | null) => void
}) {
  const items = [
    {
      q: 'Is the Jal Jeevan Mission achieving its goals in Assam?',
      badge: 'Partially · BSI 0.44',
      badgeColor: 'bg-amber-100 text-amber-700',
      answer: `The state BSI of ${STATE_BSI} (Moderate) is 26.1 points below the 0.70 Good benchmark. ${KPI_HEADLINE.satisfied}% of Q5 respondents are satisfied, but only 4,284 of 9,224 usable calls even reached Q5. The primary gap is water continuity — only 30.95% of households receive water every single day.`,
    },
    {
      q: 'Which zones and districts need immediate intervention?',
      badge: `${CRITICAL_DISTRICTS.length} Critical districts`,
      badgeColor: 'bg-red-100 text-red-700',
      answer: `Critical zones: BTAD (0.3841) and Barak Valley (0.3789). Critical districts: ${CRITICAL_DISTRICTS.map(d => `${d.district} (${d.bsi.toFixed(4)})`).join(' · ')}. Worst district: ${WORST_DISTRICT.district}, ${WORST_DISTRICT.zone} — BSI ${WORST_DISTRICT.bsi.toFixed(4)}. Best: ${BEST_DISTRICT.district} — BSI ${BEST_DISTRICT.bsi.toFixed(4)}.`,
    },
    {
      q: 'What is the #1 problem that if fixed would improve BSI the most?',
      badge: 'Q1: Daily supply (30.95%)',
      badgeColor: 'bg-red-100 text-red-700',
      answer: `Supply continuity (Q1) at 30.95% yes. Q1 has the highest weight in the BSI formula and its score is 2× worse than any other indicator. Every other metric (quality, quantity, satisfaction) is contingent on water actually flowing. If Q1 improved to 70%, the state BSI would cross into Moderate-high range.`,
    },
    {
      q: 'How many schemes need fixing and what type of action?',
      badge: '507 non-functional + 1,758 unknown',
      badgeColor: 'bg-red-100 text-red-700',
      answer: `3 priority groups: (1) 507 valid but non-functional schemes — field engineering required (check pumps, pipes, connections). (2) 1,426 flagged schemes — need Phase 2 re-calling with ≥6 usable calls to score. (3) 332 schemes with zero data — need initial calling. Total: 2,265 schemes requiring action of some kind.`,
    },
    {
      q: 'Is the satisfaction survey data reliable enough to act on?',
      badge: `${USABLE_PCT}% usable rate`,
      badgeColor: 'bg-blue-100 text-blue-700',
      answer: `Reasonable confidence for zone/district-level decisions, lower for individual scheme-level. ${USABLE_PCT}% usable rate (${fmt(USABLE)} calls), consent at ${CONSENT_PCT}%. Only ${COMPLETED_PCT}% (${fmt(COMPLETED_ALL)}) completed all 5 questions, so Q2–Q5 metrics are based on subset of usable calls with varying bases (Q2 n=4,553, Q3 n=4,745, Q4 n=2,142, Q5 n=4,284). These bases are independent — not a funnel.`,
    },
    {
      q: 'What do dissatisfied households actually say?',
      badge: '1,061 dissatisfied (24.8%)',
      badgeColor: 'bg-orange-100 text-orange-700',
      answer: `24.8% of Q5 respondents (1,061 people) are dissatisfied. From the Upper Assam IVR call records (available in Call Records page), common themes in AI summaries include: "pipeline installed but no water flowing", "water supply stopped weeks ago", "village-wide supply failure", "irregular hours making it unusable". Filter Call Records → Status: Completed → Q5: Dissatisfied to review individual calls with recordings.`,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">Quick Answers — Data-Backed</p>
          <p className="text-xs text-gray-400">Click any question for the answer with exact figures</p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
          {items.length} questions
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors group"
            >
              <span className="text-xs text-gray-300 font-mono w-4 flex-shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.q}</span>
              <span className={`hidden sm:inline-flex flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                {item.badge}
              </span>
              <span className="text-gray-300 text-xs ml-1 flex-shrink-0">{openQuestion === i ? '▲' : '▼'}</span>
            </button>
            {openQuestion === i && (
              <div className="px-5 pb-4 pt-1">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BSI Gauge ────────────────────────────────────────────────────────────────
function BSIGauge() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
      <p className="text-sm font-semibold text-gray-700 mb-0.5">State BSI Score</p>
      <p className="text-xs text-gray-400 mb-3">0 = worst · 1.0 = best · Target ≥ 0.70</p>
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
          Moderate · {((0.70 - STATE_BSI) * 100).toFixed(1)} pts below 0.70 target
        </p>
      </div>
      <div className="mt-3 w-full flex justify-between text-xs text-gray-400">
        <span>0</span>
        <span className="text-emerald-600 font-semibold">0.70 target</span>
        <span>1.0</span>
      </div>
      {/* BSI component bars */}
      <div className="mt-3 w-full space-y-1.5 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1.5">BSI component scores</p>
        {[
          { label: 'Quality (Q2)',   val: 0.8905, max: 1.5 },
          { label: 'Quantity (Q3)',  val: 0.8158, max: 1.5 },
          { label: 'Daily (Q1)',     val: 0.2803, max: 0.75 },
        ].map(c => {
          const fillPct = (c.val / c.max) * 100
          return (
            <div key={c.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-500">{c.label}</span>
                <span className={`font-mono font-medium ${fillPct < 45 ? 'text-red-500' : fillPct < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {c.val.toFixed(3)} / {c.max}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${fillPct < 45 ? 'bg-red-400' : fillPct < 65 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${fillPct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Survey KPI chart ─────────────────────────────────────────────────────────
function SurveyKPIChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-0.5">Survey KPIs — % Yes per Question</p>
      <p className="text-xs text-gray-400 mb-3">Each Q has a different respondent base — hover for details</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Q_CHART} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, _: string, p: { payload?: { label?: string; base?: number } }) => [
                `${v.toFixed(1)}%  (n = ${p.payload?.base?.toLocaleString() ?? '?'} respondents)`,
                p.payload?.label ?? '',
              ]}
            />
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2"
              label={{ value: '70% benchmark', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {Q_CHART.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
        {Q_CHART.map(q => (
          <div key={q.name} className="flex justify-between">
            <span><span className="font-mono font-bold text-gray-600">{q.name}</span> {q.label}</span>
            <span>n = {fmt(q.base)}</span>
          </div>
        ))}
        <p className="text-gray-300 pt-1">Note: Q1 base = 9,224 usable calls. Q2–Q5 bases are independent — not a funnel from Q1.</p>
      </div>
    </div>
  )
}

// ─── Call funnel ──────────────────────────────────────────────────────────────
function CallFunnel() {
  const steps = [
    { label: 'Total Dialled',  val: TOTAL_CALLS,   pct: 100,         bar: 100,                       color: 'bg-blue-500'    },
    { label: 'Consented',      val: CONSENTED,     pct: +CONSENT_PCT,  bar: +CONSENT_PCT,            color: 'bg-indigo-400'  },
    { label: 'Usable (Q1)',    val: USABLE,        pct: +USABLE_PCT,   bar: +USABLE_PCT,             color: 'bg-emerald-500' },
    { label: 'All 5 complete', val: COMPLETED_ALL, pct: +COMPLETED_PCT, bar: +COMPLETED_PCT,         color: 'bg-emerald-700' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-0.5">Call Funnel</p>
      <p className="text-xs text-gray-400 mb-4">All % are share of 45,863 total calls</p>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.label}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="font-medium">{s.label}</span>
              <span className="font-mono text-gray-500">
                {fmt(s.val)} <span className="text-gray-400">({s.pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.bar}%` }} />
            </div>
            {i < steps.length - 1 && (
              <p className="text-xs text-gray-400 mt-0.5 text-right">
                ↓ {dropPct(steps[i+1].val, s.val)}% of above pass through
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
        <p className="font-semibold text-gray-700 mb-1">Why usable (9,224) ≠ consented (12,583)?</p>
        897 refused calls lasted long enough for Q1 to be answered before hang-up (median 133 sec).
        Rule: Q1 answered = usable. 9,224 = 8,327 consented-and-answered-Q1 + 897 refused-but-Q1-captured.
      </div>
    </div>
  )
}

// ─── Zone ranking ─────────────────────────────────────────────────────────────
function ZoneRanking() {
  const zones = ZONE_SCORES
    .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
    .sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Zone BSI Rankings</p>
          <p className="text-xs text-gray-400">Target ≥ 0.70 · No zone meets target yet</p>
        </div>
        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full font-medium">
          0 / 6 meet 0.70
        </span>
      </div>
      <div className="space-y-2.5">
        {zones.map((z, i) => (
          <div key={z.zone} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono w-4">{i + 1}</span>
            <span className="text-xs font-medium text-gray-700 w-24 truncate">{z.zone}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden" title={`${z.bsi?.toFixed(4)} / 1.0`}>
              <div
                className={`h-full rounded ${z.status === 'Critical' ? 'bg-red-400' : 'bg-amber-400'}`}
                style={{ width: `${((z.bsi ?? 0) / 1.0) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-bold font-mono w-14 text-right ${z.status === 'Critical' ? 'text-red-600' : 'text-amber-700'}`}>
              {z.bsi?.toFixed(4)}
            </span>
            <StatusBadge status={z.status} />
          </div>
        ))}
      </div>
      {/* State average line */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-4"></span>
          <span className="text-xs font-semibold text-blue-700 w-24">State Avg</span>
          <div className="flex-1 h-5 bg-blue-50 rounded overflow-hidden border border-blue-200">
            <div className="h-full bg-blue-400 rounded" style={{ width: `${(0.4406 / 1.0) * 100}%` }} />
          </div>
          <span className="text-xs font-bold font-mono w-14 text-right text-blue-700">0.4406</span>
          <StatusBadge status="Moderate" />
        </div>
      </div>
    </div>
  )
}

// ─── Scheme snapshot ──────────────────────────────────────────────────────────
function SchemeSnapshot() {
  const { valid, validPct, flagged, flaggedPct, noData, noDataPct,
          functional, nonFunctional, functionalRate, total } = SCHEME_COVERAGE

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Scheme Coverage</p>
          <p className="text-xs text-gray-400">{fmt(total)} total IMIS schemes surveyed</p>
        </div>
        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full font-medium">
          Only {functionalRate}% functional
        </span>
      </div>

      {/* 3-way split */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { label: 'Valid',   n: valid,   pct: validPct,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', tip: `${validPct}% of all schemes — have ≥6 usable calls` },
          { label: 'Flagged', n: flagged, pct: flaggedPct, color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     tip: `${flaggedPct}% — fewer than 6 usable calls, not scored` },
          { label: 'No Data', n: noData,  pct: noDataPct,  color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200',       tip: `${noDataPct}% — zero calls reached` },
        ].map(s => (
          <div key={s.label} title={s.tip} className={`rounded-xl border p-2.5 ${s.bg} cursor-default`}>
            <div className={`text-lg font-bold ${s.color}`}>{fmt(s.n)}</div>
            <div className={`text-xs font-semibold ${s.color}`}>{s.label}</div>
            <div className="text-xs text-gray-400">{s.pct}%</div>
          </div>
        ))}
      </div>

      {/* Stacked bar: valid + flagged + no data = 100% */}
      <div className="mb-1">
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="bg-emerald-400 h-full" title={`Valid: ${validPct}%`}   style={{ width: `${validPct}%`   }} />
          <div className="bg-amber-400 h-full"  title={`Flagged: ${flaggedPct}%`} style={{ width: `${flaggedPct}%` }} />
          <div className="bg-gray-300 h-full"   title={`No data: ${noDataPct}%`}  style={{ width: `${noDataPct}%`  }} />
        </div>
        <div className="flex text-xs text-gray-400 mt-1 justify-between">
          <span className="text-emerald-600">■ Valid {validPct}%</span>
          <span className="text-amber-600">■ Flagged {flaggedPct}%</span>
          <span className="text-gray-400">■ No data {noDataPct}%</span>
        </div>
      </div>

      {/* Functionality within valid schemes */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Of {fmt(valid)} valid schemes — functionality test:
        </p>
        <div className="h-3 rounded-full overflow-hidden flex mb-1">
          <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${functionalRate}%` }} />
          <div className="bg-red-400 h-full rounded-r-full flex-1" />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-700 font-semibold">✓ {fmt(functional)} functional ({functionalRate}%)</span>
          <span className="text-red-600 font-semibold">✗ {fmt(nonFunctional)} failing ({(100-functionalRate).toFixed(1)}%)</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Functional = Q1 ≥50% AND Q2 ≥70% AND Q3 ≥70%</p>
      </div>
    </div>
  )
}

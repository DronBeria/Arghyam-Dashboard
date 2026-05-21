import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import * as p1 from '../data/csatData'
import * as p2 from '../data/csatData2'
import { usePhaseData } from '../context/PhaseDataContext'

function fmt(n: number) { return n.toLocaleString() }

// ─── Phase headline summary ───────────────────────────────────────────────────
// Note: BSI values updated to min_usable=4 threshold (was min=6)
// With ≥4, Phase 2 includes more under-sampled schemes → overall Score lower than Phase 1
const HEADLINE = [
  {
    phase: 'Phase 1', period: 'April 2026', color: 'emerald',
    calls: 45863, consent: 27.4, bsi5: 2.54, satisfied: 51.7,
    usable: 9224, usablePct: 20.1, validSchemes: 1016, districts: 33,
    border: 'border-emerald-200', bg: 'bg-emerald-50', badge: 'bg-emerald-600',
    text: 'text-emerald-700',
  },
  {
    phase: 'Phase 2', period: 'May 2026', color: 'blue',
    calls: 79725, consent: 16.1, bsi5: 2.13, satisfied: 55.0,
    usable: 6408, usablePct: 8.0, validSchemes: 461, districts: 33,
    border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-600',
    text: 'text-blue-700',
  },
]

// ─── Survey Q1–Q5 side-by-side (Q% unchanged — not scheme-weighted) ───────────
const SURVEY_CHART = [
  { q: 'Q1 Daily', p1: 30.95, p2: 30.34, benchmark: 70 },
  { q: 'Q1A Timing', p1: 57.2, p2: 56.7, benchmark: 70 },
  { q: 'Q2 Quality', p1: 72.33, p2: 73.09, benchmark: 70 },
  { q: 'Q3 Quantity', p1: 62.23, p2: 64.93, benchmark: 70 },
  { q: 'Q5 Satisfied', p1: 51.7, p2: 55.02, benchmark: 70 },
]

// ─── Zone BSI comparison (min_usable=4) ──────────────────────────────────────
const ZONE_CHART = [
  { zone: 'North Assam', p1: 2.681, p2: 2.302 },
  { zone: 'Upper Assam', p1: 2.666, p2: 2.265 },
  { zone: 'Lower Assam', p1: 2.485, p2: 1.800 },
  { zone: 'BTAD',        p1: 2.101, p2: 1.805 },
  { zone: 'KAAC',        p1: 3.568, p2: null  },
  { zone: 'Barak Valley',p1: 2.206, p2: null  },
]

// ─── What improved / what didn't ─────────────────────────────────────────────
const IMPROVED = [
  { label: 'Q5 Overall Satisfaction', p1: '51.7%',  p2: '55.0%',  change: '+3.3pp', note: 'More households satisfied overall in Phase 2' },
  { label: 'Q3 Water Quantity',       p1: '62.23%', p2: '64.93%', change: '+2.7pp', note: 'Availability improved slightly' },
  { label: 'Q2 Water Quality',        p1: '72.33%', p2: '73.09%', change: '+0.8pp', note: 'Already good — remained strong' },
  { label: 'Phase 2 outreach',        p1: '45,863', p2: '79,725', change: '+74%',   note: 'Phase 2 reached many more new households' },
]

const NEEDS_WORK = [
  { label: 'State Score (≥4 scheme threshold)', p1: '2.54/5', p2: '2.13/5', note: 'Phase 2 included more under-sampled schemes with lower scores' },
  { label: 'Q1 Daily Water Supply',   p1: '30.95%', p2: '30.34%', note: 'No progress — only 1 in 3 households get water daily' },
  { label: 'Consent Rate',            p1: '27.4%',  p2: '16.1%',  note: 'Phase 2 reached harder-to-contact new households' },
  { label: 'Usable Call Yield',       p1: '20.1%',  p2: '8.0%',   note: 'Larger area, more first-time contacts, lower yield' },
  { label: 'Barak Valley / KAAC',     p1: 'Moderate', p2: 'No data', note: 'Insufficient Phase 2 calls for reliable score' },
  { label: 'Valid Scheme Coverage',   p1: '1,016',  p2: '461',    note: 'Phase 2 spread across more schemes — fewer per scheme' },
]

// ─── Key insight callouts ──────────────────────────────────────────────────────
const INSIGHTS = [
  {
    emoji: '📊',
    title: 'Score methodology updated to ≥4 calls threshold',
    body: 'The Citizen Satisfaction Survey Score now includes schemes with ≥4 usable survey responses (previously ≥6). This broader threshold captures more ground reality and includes schemes that were lightly surveyed in Phase 2.',
    color: 'bg-violet-50 border-violet-200 text-violet-800',
  },
  {
    emoji: '🚱',
    title: 'Daily water remains the critical gap',
    body: 'Only 30% of households report receiving water every day — unchanged across both phases. This is the single biggest drag on the overall Score and the most urgent priority for Phase 3.',
    color: 'bg-red-50 border-red-200 text-red-800',
  },
  {
    emoji: '📞',
    title: 'Phase 2 reached 74% more households',
    body: '79,725 new calls in May vs 45,863 in April. Lower consent (16% vs 27%) is expected when reaching first-time contacts at scale across a wider area.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    emoji: '✅',
    title: 'Quality and quantity satisfaction improving',
    body: 'Q2 (water quality) and Q3 (quantity) both improved from Phase 1 to Phase 2 at the individual-response level. Citizens who participated report better experiences with these dimensions.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
]

// ─── Call attempts comparison ─────────────────────────────────────────────────
const ATTEMPTS_COMPARE = [
  { attempt: '1st', p1Consent: 28, p2Consent: 13, p1Sat: 52.3, p2Sat: 53.9 },
  { attempt: '2nd', p1Consent: 25, p2Consent: 22, p1Sat: 51.7, p2Sat: 56.4 },
  { attempt: '3rd', p1Consent: 23, p2Consent: 29, p1Sat: 47.5, p2Sat: 48.9 },
  { attempt: '4th', p1Consent: 22, p2Consent: 45, p1Sat: 38.5, p2Sat: 40.0 },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ComparisonPage() {
  const data = usePhaseData()

  // In district-focus mode (Dhubri etc.) show district-specific comparison from context
  if (data.districtFocus && data.comparison) {
    const c = data.comparison
    return (
      <div className="space-y-6">
        <div className="card p-5 border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            <div>
              <p className="text-base font-black text-gray-900">{data.districtFocus} District — Phase 1 vs Phase 2</p>
              <p className="text-xs text-gray-400">Most improved district in Assam · Upper Assam Zone</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black text-amber-600">{c.p1Bsi5} → {c.p2Bsi5} <span className="text-base font-medium text-gray-400">/ 5</span></p>
              <p className="text-xs font-bold text-emerald-600">+{(+c.p2Bsi5 - +c.p1Bsi5).toFixed(2)} improvement</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Phase 1 Calls', val: c.p1Calls.toLocaleString(), color: 'text-emerald-700' },
              { label: 'Phase 2 Calls', val: c.p2Calls.toLocaleString(), color: 'text-blue-700' },
              { label: 'Phase 1 Score', val: `${c.p1Bsi5}/5`, color: 'text-emerald-700' },
              { label: 'Phase 2 Score', val: `${c.p2Bsi5}/5`, color: 'text-blue-700' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg p-3 border border-gray-100">
                <p className={`text-lg font-black ${m.color}`}>{m.val}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="panel-title">Key Metric Changes  Phase 1 → Phase 2</p>
            <p className="panel-sub mt-0.5">Green = improvement · Red = regression</p>
          </div>
          <div className="divide-y divide-gray-50">
            {c.metrics.map(m => {
              const isUp = m.trend === 'up'; const isGood = (isUp && m.isGoodUp) || (!isUp && !m.isGoodUp)
              return (
                <div key={m.label} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0 truncate">{m.label}</span>
                  <span className="text-xs font-mono text-gray-400 w-16 text-right flex-shrink-0">{m.p1}</span>
                  <span className="text-gray-300 text-xs">→</span>
                  <span className="text-xs font-mono font-bold text-gray-800 w-16 text-right flex-shrink-0">{m.p2}</span>
                  <span className={`text-sm font-black w-5 flex-shrink-0 ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>{isUp ? '↑' : '↓'}</span>
                  <span className={`text-xs font-bold w-16 flex-shrink-0 ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>{m.change}</span>
                  <span className="text-[10px] text-gray-400 flex-1 leading-snug hidden md:block">{m.note}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="panel-title">{data.districtFocus} Score  Phase 1 → Phase 2</p>
          </div>
          <div className="px-5 py-4">
            {c.zoneChanges.map(z => (
              <div key={z.zone} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-semibold text-gray-700 flex-1">{z.zone}</span>
                <span className="text-sm font-mono text-gray-400">{z.p1Bsi5}/5</span>
                <span className="text-gray-300">→</span>
                <span className="text-sm font-mono font-bold text-gray-800">{z.p2Bsi5}/5</span>
                <span className="text-sm font-black text-emerald-600">↑ {z.changePp}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100">
            <p className="text-[10px] text-amber-700">{data.districtFocus} District: Phase 1 ({c.p1Calls} calls) vs Phase 2 ({c.p2Calls} calls). Score improvement +{(+c.p2Bsi5-+c.p1Bsi5).toFixed(2)}/5 is the highest of any district in Assam.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── 1. Phase Headlines ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HEADLINE.map(h => (
          <div key={h.phase} className={`card p-5 border-2 ${h.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded ${h.badge} mb-1`}>{h.phase}</span>
                <p className="text-xs text-gray-400">{h.period}</p>
              </div>
              <div className={`text-3xl font-black ${h.text}`}>{h.bsi5.toFixed(2)}<span className="text-base font-medium text-gray-400">/5</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Calls',     val: fmt(h.calls) },
                { label: 'Consent Rate',    val: `${h.consent}%` },
                { label: 'Q5 Satisfied',    val: `${h.satisfied}%` },
                { label: 'Usable Call Rate',val: `${h.usablePct}%` },
                { label: 'Valid Schemes',   val: fmt(h.validSchemes) },
                { label: 'Districts',       val: `${h.districts}` },
              ].map(m => (
                <div key={m.label} className={`rounded-lg p-2 ${h.bg}`}>
                  <p className={`text-sm font-bold ${h.text}`}>{m.val}</p>
                  <p className="text-[10px] text-gray-500">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Key Insights ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INSIGHTS.map(ins => (
          <div key={ins.title} className={`rounded-xl border p-4 ${ins.color}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{ins.emoji}</span>
              <div>
                <p className="text-sm font-bold mb-1">{ins.title}</p>
                <p className="text-xs leading-relaxed opacity-80">{ins.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Survey Q1–Q5 Satisfaction Chart ─────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="panel-title">Survey Results Comparison — Q1 through Q5</p>
          <p className="panel-sub mt-0.5">% of respondents who answered YES (satisfied) · 70% = Good benchmark</p>
        </div>
        <div className="p-5">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SURVEY_CHART} margin={{ top: 4, right: 16, bottom: 0, left: -16 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="q" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name === 'p1' ? 'Phase 1' : 'Phase 2']}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 2" label={{ value: '70% target', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <Legend formatter={v => <span className="text-xs text-gray-600">{v === 'p1' ? 'Phase 1 (Apr 2026)' : 'Phase 2 (May 2026)'}</span>} />
                <Bar dataKey="p1" name="p1" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="p2" name="p2" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {SURVEY_CHART.map(q => {
              const diff = q.p2 - q.p1
              const isUp = diff > 0.1
              const isDown = diff < -0.1
              return (
                <div key={q.q} className="text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-0.5">{q.q}</p>
                  <p className={`text-xs font-bold ${isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
                    {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(diff).toFixed(1)}pp
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 4. Zone BSI Comparison ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="panel-title">Zone Score Comparison — Phase 1 vs Phase 2</p>
          <p className="panel-sub mt-0.5">Score out of 5.0 · Every tracked zone improved · Barak Valley had no Phase 2 data</p>
        </div>
        <div className="p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ZONE_CHART.filter(z => z.p2 !== null)} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 80 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 3.5]} tick={{ fill: '#9ca3af', fontSize: 10 }} tickCount={8} />
                <YAxis type="category" dataKey="zone" tick={{ fill: '#374151', fontSize: 11 }} width={78} />
                <Tooltip
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(val: number, name: string) => [`${val.toFixed(3)}/5.0`, name === 'p1' ? 'Phase 1' : 'Phase 2']}
                />
                <ReferenceLine x={3.5} stroke="#10b981" strokeDasharray="4 2" />
                <Bar dataKey="p1" name="p1" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={14} />
                <Bar dataKey="p2" name="p2" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="th text-left">Zone</th>
                  <th className="th text-right">Phase 1 Score</th>
                  <th className="th text-right">Phase 2 Score</th>
                  <th className="th text-center">Change</th>
                  <th className="th text-left hidden md:table-cell">What changed</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { zone: 'Upper Assam',  p1: 2.393, p2: 2.971, note: 'Biggest improvement — quality and quantity both rose' },
                  { zone: 'BTAD',         p1: 1.921, p2: 2.505, note: 'Was Critical in P1, now Moderate — strong recovery' },
                  { zone: 'KAAC',         p1: 2.316, p2: 3.125, note: 'Near target threshold — small sample though' },
                  { zone: 'North Assam',  p1: 2.418, p2: 2.553, note: 'Steady improvement across its many districts' },
                  { zone: 'Lower Assam',  p1: 2.277, p2: 2.557, note: 'Good improvement; Dhubri district standout' },
                  { zone: 'Barak Valley', p1: 1.895, p2: null,  note: 'No Phase 2 data — Hailakandi was worst in Phase 1' },
                ].map(z => {
                  const diff = z.p2 !== null ? z.p2 - z.p1 : null
                  return (
                    <tr key={z.zone} className={`border-b border-gray-50 last:border-0 ${z.p2 === null ? 'opacity-50' : ''}`}>
                      <td className="td font-medium text-gray-800">{z.zone}</td>
                      <td className="td-mono text-right text-emerald-700 font-bold">{z.p1.toFixed(3)}/5</td>
                      <td className="td-mono text-right text-blue-700 font-bold">{z.p2 !== null ? `${z.p2.toFixed(3)}/5` : '—'}</td>
                      <td className="td text-center">
                        {diff !== null
                          ? <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{diff > 0 ? '↑' : '↓'} +{diff.toFixed(3)}</span>
                          : <span className="text-xs text-gray-300">No data</span>}
                      </td>
                      <td className="td text-xs text-gray-400 hidden md:table-cell">{z.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 5. What Improved / What Needs Work ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50/50">
            <p className="text-sm font-bold text-emerald-800">What Improved ↑</p>
            <p className="text-xs text-emerald-600">Metrics that got better from Phase 1 to Phase 2</p>
          </div>
          <div className="divide-y divide-gray-50">
            {IMPROVED.map(m => (
              <div key={m.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                  <span className="text-xs font-bold text-emerald-600">{m.change}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-emerald-700 font-mono">{m.p1}</span>
                  <span>→</span>
                  <span className="text-blue-700 font-mono font-bold">{m.p2}</span>
                  <span className="ml-1">· {m.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50/50">
            <p className="text-sm font-bold text-red-800">Still Needs Work ↓</p>
            <p className="text-xs text-red-600">Metrics that didn't improve or need attention</p>
          </div>
          <div className="divide-y divide-gray-50">
            {NEEDS_WORK.map(m => (
              <div key={m.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                  <span className="text-xs text-gray-400">P1: {m.p1}</span>
                </div>
                <p className="text-[10px] text-gray-400">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Call Attempts Comparison ─────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="panel-title">Call Attempt Behaviour — Phase 1 vs Phase 2</p>
          <p className="panel-sub mt-0.5">Consent rate and satisfaction by attempt number (Phase 2 had max 4 attempts)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="th">Attempt</th>
                <th className="th text-center">P1 Consent %</th>
                <th className="th text-center">P2 Consent %</th>
                <th className="th text-center">P1 Satisfied %</th>
                <th className="th text-center">P2 Satisfied %</th>
              </tr>
            </thead>
            <tbody>
              {ATTEMPTS_COMPARE.map(a => (
                <tr key={a.attempt} className="border-b border-gray-50 last:border-0">
                  <td className="td font-mono text-gray-600">{a.attempt}</td>
                  <td className="td-mono text-center text-emerald-700">{a.p1Consent}%</td>
                  <td className="td-mono text-center text-blue-700">{a.p2Consent}%</td>
                  <td className="td-mono text-center text-emerald-700">{a.p1Sat}%</td>
                  <td className="td-mono text-center text-blue-700">{a.p2Sat}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 text-xs text-gray-500">
          Phase 2 consent rate rises sharply at attempt 4 (45%) — households that persisted through 4 calls are highly engaged. Phase 1 had a 5th attempt; Phase 2 did not.
        </div>
      </div>

    </div>
  )
}

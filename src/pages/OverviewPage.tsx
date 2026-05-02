import { useState, useMemo } from 'react'
import { KPI_HEADLINE, ZONE_SCORES, DISTRICT_SCORES, SCHEME_COVERAGE } from '../data/csatData'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScopeData {
  label:        string
  bsi:          number
  bsi5:         string
  status:       string
  usableCalls:  number | null
  validSchemes: number | null
  quality:      number | null   // out of 1.5
  quantity:     number | null   // out of 1.5
  daily:        number | null   // out of 0.75
  zone:         string | null
}

// ─── Static derived values ────────────────────────────────────────────────────
const STATE_BSI   = KPI_HEADLINE.stateBSI
const STATE_BSI_5 = +(STATE_BSI * 5).toFixed(2)
const TARGET_5    = 3.50
const ZONE_LIST   = ZONE_SCORES.filter(z => z.bsi !== null && z.zone !== 'Assam (State)').map(z => z.zone)
const DISTRICT_LIST = DISTRICT_SCORES.map(d => d.district)

// Q percentages for state scope (from raw call counts — most accurate)
const STATE_Q = [
  { q: 'Q1', label: 'Daily Supply',       pct: 30.95, max: 100, status: 'Critical' },
  { q: 'Q2', label: 'Water Quality',       pct: 72.33, max: 100, status: 'Good'     },
  { q: 'Q3', label: 'Water Quantity',      pct: 62.23, max: 100, status: 'Moderate' },
  { q: 'Q4', label: 'Consistent Timing',   pct: 57.05, max: 100, status: 'Moderate' },
  { q: 'Q5', label: 'Overall Satisfaction',pct: 52.12, max: 100, status: 'Moderate' },
]

function statusColor(s: string) {
  if (s === 'Good')     return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' }
  if (s === 'Critical') return { badge: 'bg-red-100 text-red-700 border-red-200',             bar: 'bg-red-500',     text: 'text-red-700'     }
  if (s === 'No Data')  return { badge: 'bg-gray-100 text-gray-500 border-gray-200',          bar: 'bg-gray-300',    text: 'text-gray-500'    }
  return                       { badge: 'bg-amber-100 text-amber-700 border-amber-200',        bar: 'bg-amber-500',   text: 'text-amber-700'   }
}

function fmt(n: number) { return n.toLocaleString() }
function nav(page: string) { window.dispatchEvent(new CustomEvent('navigate', { detail: page })) }

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const [scopeType, setScopeType] = useState<'state' | 'zone' | 'district'>('state')
  const [scopeValue, setScopeValue] = useState('')

  // Derive all data from current scope
  const scope = useMemo<ScopeData>(() => {
    if (scopeType === 'zone' && scopeValue) {
      const z = ZONE_SCORES.find(z => z.zone === scopeValue)
      if (!z) return stateScope()
      const schemes = DISTRICT_SCORES.filter(d => d.zone === scopeValue).reduce((s, d) => s + d.validSchemes, 0)
      return {
        label: z.zone, bsi: z.bsi ?? 0, bsi5: ((z.bsi ?? 0) * 5).toFixed(2),
        status: z.status ?? 'No Data', usableCalls: z.usableCalls, validSchemes: schemes,
        quality: z.quality, quantity: z.quantity, daily: z.daily, zone: z.zone,
      }
    }
    if (scopeType === 'district' && scopeValue) {
      const d = DISTRICT_SCORES.find(d => d.district === scopeValue)
      if (!d) return stateScope()
      return {
        label: d.district, bsi: d.bsi, bsi5: (d.bsi * 5).toFixed(2),
        status: d.status, usableCalls: d.usableCalls, validSchemes: d.validSchemes,
        quality: d.quality, quantity: d.quantity, daily: null, zone: d.zone,
      }
    }
    return stateScope()
  }, [scopeType, scopeValue])

  // Districts shown in breakdown — reactive to scope
  const breakdownRows = useMemo(() => {
    if (scopeType === 'zone' && scopeValue) {
      return DISTRICT_SCORES.filter(d => d.zone === scopeValue).sort((a, b) => b.bsi - a.bsi)
    }
    if (scopeType === 'district' && scopeValue) {
      const d = DISTRICT_SCORES.find(d => d.district === scopeValue)
      return d ? DISTRICT_SCORES.filter(x => x.zone === d.zone).sort((a, b) => b.bsi - a.bsi) : []
    }
    return ZONE_SCORES.filter(z => z.bsi !== null && z.zone !== 'Assam (State)').sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))
  }, [scopeType, scopeValue])

  const isScoped = scopeType !== 'state'
  const sc = statusColor(scope.status)
  const gap5 = +(TARGET_5 - +scope.bsi5).toFixed(2)

  // Build Q bars — component-derived for zone/district, direct % for state
  const qBars = useMemo(() => {
    if (scopeType === 'state') return STATE_Q
    if (!scope.quality && !scope.quantity) return []
    const rows = [
      { q: 'Q2', label: 'Water Quality',  pct: scope.quality ? +(scope.quality / 1.5 * 100).toFixed(1) : null, max: 100 },
      { q: 'Q3', label: 'Water Quantity', pct: scope.quantity ? +(scope.quantity / 1.5 * 100).toFixed(1) : null, max: 100 },
      { q: 'Q1', label: 'Daily Supply',   pct: scope.daily    ? +(scope.daily / 0.75 * 100).toFixed(1) : null,  max: 100 },
    ]
    return rows.filter(r => r.pct !== null).map(r => ({
      ...r, pct: r.pct!, status: r.pct! >= 70 ? 'Good' : r.pct! >= 40 ? 'Moderate' : 'Critical',
    }))
  }, [scope, scopeType])

  function handleScopeTypeChange(t: 'state' | 'zone' | 'district') {
    setScopeType(t)
    setScopeValue(t === 'zone' ? ZONE_LIST[0] : t === 'district' ? DISTRICT_LIST[0] : '')
  }

  return (
    <div className="space-y-4">

      {/* ── Scope selector ──────────────────────────────────────────────── */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <span className="panel-label flex-shrink-0">Scope</span>

        <div className="tab-bar">
          {(['state', 'zone', 'district'] as const).map(t => (
            <button key={t} onClick={() => handleScopeTypeChange(t)}
              className={scopeType === t ? 'tab-item-active' : 'tab-item'}>
              {t === 'state' ? 'All Assam' : t}
            </button>
          ))}
        </div>

        {/* Value dropdown */}
        {scopeType === 'zone' && (
          <select value={scopeValue} onChange={e => setScopeValue(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            {ZONE_LIST.map(z => <option key={z}>{z}</option>)}
          </select>
        )}
        {scopeType === 'district' && (
          <select value={scopeValue} onChange={e => setScopeValue(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            {DISTRICT_LIST.map(d => <option key={d}>{d}</option>)}
          </select>
        )}

        {/* Breadcrumb label */}
        <div className="flex items-center gap-2 ml-auto">
          {isScoped && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sc.badge}`}>
              {scope.status}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {scopeType === 'state' ? '45,863 calls · 35 districts · 7 zones'
             : scopeType === 'zone' ? `${scope.usableCalls ? fmt(scope.usableCalls) : '—'} usable calls · ${scope.validSchemes ?? '—'} valid schemes`
             : `${scope.usableCalls ? fmt(scope.usableCalls) : '—'} usable calls · ${scope.validSchemes ?? '—'} valid schemes · ${scope.zone}`}
          </span>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            value: scope.bsi5 + '/5',
            label: 'BSI Score',
            sub: gap5 > 0 ? `${gap5} below 3.50 target` : 'Meets target',
            accent: scope.status === 'Good' ? 'border-l-emerald-500' : scope.status === 'Critical' ? 'border-l-red-500' : 'border-l-amber-500',
            valueColor: sc.text,
          },
          {
            value: scopeType === 'state' ? '9,224' : scope.usableCalls ? fmt(scope.usableCalls) : '—',
            label: 'Usable Calls',
            sub: scopeType === 'state' ? '45,863 dialled · 27.4% consent rate' : `${scope.validSchemes ?? '—'} valid schemes`,
            accent: 'border-l-blue-500',
            valueColor: 'text-slate-900',
          },
          {
            value: scopeType === 'state' ? '52.1%' : scope.quality ? `${(scope.quality / 1.5 * 100).toFixed(1)}%` : '—',
            label: scopeType === 'state' ? 'Overall Satisfied (Q5)' : 'Water Quality Score',
            sub: scopeType === 'state' ? '23.1% neutral · 24.8% dissatisfied' : scope.quantity ? `Quantity: ${(scope.quantity / 1.5 * 100).toFixed(1)}%` : '',
            accent: 'border-l-violet-500',
            valueColor: 'text-slate-900',
          },
        ].map(k => (
          <div key={k.label} className={`card p-4 border-l-4 ${k.accent}`}>
            <p className={`stat-value ${k.valueColor}`}>{k.value}</p>
            <p className="stat-label">{k.label}</p>
            <p className="stat-sub">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── BSI gauge + Service areas ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* BSI gauge */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="panel-title">BSI Score</p>
              <p className="panel-sub mt-0.5">{scope.label} · Target ≥ 3.50 / 5.0</p>
            </div>
            <span className={`badge ${scope.status === 'Good' ? 'badge-good' : scope.status === 'Critical' ? 'badge-critical' : scope.status === 'No Data' ? 'badge-neutral' : 'badge-moderate'}`}>
              {scope.status}
            </span>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-black ${sc.text}`}>{scope.bsi5}</span>
              <span className="text-base text-gray-400 mb-0.5">/ 5.0</span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-100"   style={{ width: '40%' }} />
                <div className="h-full bg-amber-100" style={{ width: '30%' }} />
                <div className="h-full bg-emerald-100 flex-1" />
              </div>
              <div className={`absolute inset-y-0 left-0 h-full ${sc.bar} rounded-full transition-all duration-500`}
                style={{ width: `${(+scope.bsi5 / 5) * 100}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/60" style={{ left: '70%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span className="text-emerald-600 font-medium">3.50 ↑</span>
              <span>5.0</span>
            </div>
          </div>

          {/* Component contributions */}
          {(scope.quality || scope.quantity) && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium">BSI components</p>
              {[
                { label: 'Quality', val: scope.quality, max: 1.5, color: 'bg-emerald-400' },
                { label: 'Quantity', val: scope.quantity, max: 1.5, color: 'bg-blue-400' },
                ...(scope.daily ? [{ label: 'Daily Supply', val: scope.daily, max: 0.75, color: 'bg-red-400' }] : []),
              ].map(c => c.val && (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${(c.val / c.max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-12 text-right">{c.val}/{c.max}</span>
                </div>
              ))}
            </div>
          )}

          {/* State-level note */}
          {scopeType !== 'state' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {scopeType === 'district' ? 'Q4 & Q5 not available at district level' : 'Q4 & Q5 not available at zone level'}
              </p>
            </div>
          )}
        </div>

        {/* Service area bars */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="panel-title">Service Area Performance</p>
              <p className="panel-sub mt-0.5">
                {scopeType === 'state'
                  ? 'Q1–Q5 · from call responses · Good ≥70%'
                  : 'Q1–Q3 derived from BSI components · Good ≥70%'}
              </p>
            </div>
            {scopeType === 'state' && (
              <button onClick={() => nav('survey')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Full results →
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {qBars.map(q => {
              const c = statusColor(q.status)
              const noPct = +(100 - q.pct).toFixed(2)
              return (
                <div key={q.q} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-gray-400 font-mono w-6 flex-shrink-0">{q.q}</span>
                  <span className="text-xs font-semibold text-gray-700 w-32 flex-shrink-0">{q.label}</span>
                  <div className="flex-1">
                    {/* Full 100% bar: yes + no */}
                    <div className="relative h-2.5 rounded-full overflow-hidden flex">
                      <div className={`h-full ${c.bar}`} style={{ width: `${q.pct}%` }} />
                      <div className="h-full bg-gray-200 flex-1" />
                      <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '70%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5 text-gray-400">
                      <span className={`font-semibold ${c.text}`}>Yes {q.pct}%</span>
                      <span>No {noPct}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border w-20 text-center flex-shrink-0 ${c.badge}`}>
                    {q.status}
                  </span>
                </div>
              )
            })}
            {qBars.length === 0 && (
              <div className="px-5 py-6 text-center text-xs text-gray-400">No component data for this scope</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Zone / District breakdown ────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">
              {scopeType === 'state' ? 'Zone Rankings'
               : scopeType === 'zone'  ? `Districts in ${scopeValue}`
               : `Other districts in ${DISTRICT_SCORES.find(d => d.district === scopeValue)?.zone ?? ''}`}
            </p>
            <p className="text-xs text-gray-400">
              {scopeType === 'state' ? 'No zone meets the 3.50 target · sorted best to worst'
               : 'Sorted by BSI · click a district to drill down'}
            </p>
          </div>
          <button onClick={() => nav('geographic')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Full map →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="th text-left">{scopeType === 'state' ? 'Zone' : 'District'}</th>
                <th className="th text-right">BSI /5</th>
                <th className="th text-right hidden sm:table-cell">Quality</th>
                <th className="th text-right hidden sm:table-cell">Quantity</th>
                {scopeType !== 'district' && <th className="th text-right hidden md:table-cell">Usable Calls</th>}
                {scopeType !== 'state' && <th className="th text-right hidden md:table-cell">Valid Schemes</th>}
                <th className="th text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {breakdownRows.map((row: any) => {
                const bsi5 = ((row.bsi ?? 0) * 5).toFixed(2)
                const rc = statusColor(row.status ?? 'Moderate')
                const isSelected = scopeType === 'district' && row.district === scopeValue
                return (
                  <tr key={row.zone ?? row.district}
                    onClick={() => {
                      if (row.district) {
                        setScopeType('district')
                        setScopeValue(row.district)
                      }
                    }}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${
                      row.district ? 'cursor-pointer hover:bg-blue-50/40' : ''
                    } ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                    <td className="td">
                      <span className="font-semibold text-gray-800 text-xs">{row.zone ?? row.district}</span>
                      {isSelected && <span className="ml-2 text-[10px] text-blue-500 font-bold">← selected</span>}
                    </td>
                    <td className="td-mono text-right">
                      <span className={`font-black text-sm ${rc.text}`}>{bsi5}</span>
                    </td>
                    <td className="td-mono text-right text-xs text-gray-500 hidden sm:table-cell">
                      {row.quality ? (row.quality / 1.5 * 100).toFixed(1) + '%' : '—'}
                    </td>
                    <td className="td-mono text-right text-xs text-gray-500 hidden sm:table-cell">
                      {row.quantity ? (row.quantity / 1.5 * 100).toFixed(1) + '%' : '—'}
                    </td>
                    {scopeType !== 'district' && (
                      <td className="td-mono text-right text-xs text-gray-400 hidden md:table-cell">
                        {row.usableCalls ? fmt(row.usableCalls) : '—'}
                      </td>
                    )}
                    {scopeType !== 'state' && (
                      <td className="td-mono text-right text-xs text-gray-400 hidden md:table-cell">
                        {row.validSchemes ?? '—'}
                      </td>
                    )}
                    <td className="td text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${rc.badge}`}>
                        {row.status ?? 'Moderate'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Scheme coverage + Call consent breakdown ────────────────────── */}
      {scopeType === 'state' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Scheme coverage */}
          <div onClick={() => nav('schemes')}
            className="card p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Scheme Coverage</p>
                <p className="text-xs text-gray-400">{fmt(SCHEME_COVERAGE.total)} IMIS schemes total · sums to 100%</p>
              </div>
              <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">Details →</span>
            </div>
            {/* Stacked 100% bar */}
            <div className="h-3 rounded-full overflow-hidden flex mb-2">
              <div className="bg-emerald-400 h-full" style={{ width: `${SCHEME_COVERAGE.validPct}%` }} />
              <div className="bg-amber-400 h-full"   style={{ width: `${SCHEME_COVERAGE.flaggedPct}%` }} />
              <div className="bg-gray-200 h-full flex-1" />
            </div>
            <div className="flex justify-between text-xs">
              {[
                { label: 'Valid (≥6 calls)', n: SCHEME_COVERAGE.valid,   pct: SCHEME_COVERAGE.validPct,   color: 'text-emerald-700', dot: 'bg-emerald-400' },
                { label: 'Flagged (1–5)',    n: SCHEME_COVERAGE.flagged, pct: SCHEME_COVERAGE.flaggedPct, color: 'text-amber-700',   dot: 'bg-amber-400'   },
                { label: 'No data',          n: SCHEME_COVERAGE.noData,  pct: SCHEME_COVERAGE.noDataPct,  color: 'text-gray-400',    dot: 'bg-gray-300'    },
              ].map(s => (
                <div key={s.label} className="flex items-start gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`font-bold ${s.color}`}>{s.pct}%</p>
                    <p className="text-gray-400 text-[10px]">{s.label}</p>
                    <p className="text-gray-500 text-[10px]">{fmt(s.n)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs">
              <span className="text-gray-500">Of 615 valid schemes:</span>
              <span className="text-emerald-700 font-bold">17.6% functional</span>
              <span className="text-red-600 font-bold">82.4% non-functional</span>
            </div>
          </div>

          {/* Call consent breakdown */}
          <div onClick={() => nav('calls')}
            className="card p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Call Consent Breakdown</p>
                <p className="text-xs text-gray-400">45,863 total calls · sums to 100%</p>
              </div>
              <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">Call analysis →</span>
            </div>
            {/* Stacked 100% consent bar */}
            <div className="h-3 rounded-full overflow-hidden flex mb-2">
              <div className="bg-indigo-500 h-full" style={{ width: '27.4%' }} />
              <div className="bg-red-400 h-full"    style={{ width: '69.1%' }} />
              <div className="bg-amber-300 h-full"  style={{ width: '2.6%'  }} />
              <div className="bg-gray-300 h-full flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {[
                { label: 'Consented',       pct: '27.4%', n: '12,583', dot: 'bg-indigo-500', color: 'text-indigo-700' },
                { label: 'Refused',         pct: '69.1%', n: '31,710', dot: 'bg-red-400',    color: 'text-red-600'   },
                { label: 'No response',     pct: '2.6%',  n: '1,208',  dot: 'bg-amber-300',  color: 'text-amber-600' },
                { label: 'Unknown/invalid', pct: '0.8%',  n: '362',    dot: 'bg-gray-300',   color: 'text-gray-500'  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                  <span className="text-gray-500">{s.label}</span>
                  <span className={`font-bold ${s.color} ml-auto`}>{s.pct}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">27.4 + 69.1 + 2.6 + 0.8 = 100% ✓</p>
          </div>
        </div>
      )}

    </div>
  )
}

function stateScope(): ScopeData {
  const state = ZONE_SCORES.find(z => z.zone === 'Assam (State)')!
  return {
    label: 'All Assam', bsi: STATE_BSI, bsi5: STATE_BSI_5.toFixed(2),
    status: 'Moderate', usableCalls: 9224, validSchemes: SCHEME_COVERAGE.valid,
    quality: state.quality, quantity: state.quantity, daily: state.daily, zone: null,
  }
}

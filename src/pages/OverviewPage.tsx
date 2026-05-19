import { useState, useMemo, useEffect } from 'react'
import { usePhaseData } from '../context/PhaseDataContext'
import { supabase } from '../lib/supabase'

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
  satisfaction: number | null   // Q5 contribution /0.5; multiply ×2 for Q5 sat%
  zone:         string | null
}

interface SchemeStats {
  schemeName:     string
  totalCalls:     number
  usableCalls:    number
  consentedCalls: number
  bsiStandard:    number
  bsiUsable:      number
  bsiConsented:   number
  bsi5:           (mode: BsiMode) => string
  status:         (mode: BsiMode) => string
  q1Pct:  number; q1aPct: number; q2Pct: number; q3Pct: number; q5Pct: number
}

type BsiMode = 'standard' | 'usable' | 'consented'

const TARGET_5 = 3.50

// ── Insight generator ─────────────────────────────────────────────────────────
function insight(
  scopeType: string,
  scope: { bsi5: string; status: string; usableCalls: number | null; validSchemes: number | null; quality: number | null; quantity: number | null },
  stateInsightCalls: string,
  stateInsightQuality: string,
) {
  const gap = (3.50 - parseFloat(scope.bsi5)).toFixed(2)
  if (scopeType === 'state') return {
    bsi:     `${gap} below target · no zone meets the ≥3.50 benchmark`,
    calls:   stateInsightCalls,
    quality: stateInsightQuality,
  }
  const bsiNum = parseFloat(scope.bsi5)
  return {
    bsi:     bsiNum >= 3.5 ? `Meets target ≥3.50` : `${gap} below target · ${scope.status}`,
    calls:   `${(scope.validSchemes ?? 0)} valid schemes · ${(scope.usableCalls ?? 0).toLocaleString()} calls counted in BSI`,
    quality: scope.quality
      ? `Quality ${(scope.quality / 1.5 * 100).toFixed(1)}% · Quantity ${scope.quantity ? (scope.quantity / 1.5 * 100).toFixed(1) : '?'}%`
      : 'Scope data from valid scheme average',
  }
}

function statusColor(s: string) {
  if (s === 'Good')     return { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' }
  if (s === 'Critical') return { badge: 'bg-red-100 text-red-700 border-red-200',             bar: 'bg-red-500',     text: 'text-red-700'     }
  if (s === 'No Data')  return { badge: 'bg-gray-100 text-gray-500 border-gray-200',          bar: 'bg-gray-300',    text: 'text-gray-500'    }
  return                       { badge: 'bg-amber-100 text-amber-700 border-amber-200',        bar: 'bg-amber-500',   text: 'text-amber-700'   }
}

function fmt(n: number) { return n.toLocaleString() }
function nav(page: string) { window.dispatchEvent(new CustomEvent('navigate', { detail: page })) }

function bsiStatus(bsi5: number) {
  return bsi5 >= 3.5 ? 'Good' : bsi5 >= 2.0 ? 'Moderate' : 'Critical'
}

function calcBsi(q1: number, q1a: number, q2: number, q3: number, q5: number) {
  return +((q1*0.75 + q1a*0.75 + q2*1.5 + q3*1.5 + q5*0.5) / 5.0).toFixed(4)
}

function generateActionPlan(scope: ScopeData, qBars: any[], phaseLabel: string, dateLabel: string) {
  const data = { phaseLabel, dateLabel }
  const w = window.open('', '_blank')!
  const bsi5 = scope.bsi5
  const gap  = (3.50 - +bsi5).toFixed(2)
  const q2   = qBars.find(q => q.q === 'Q2')
  const q3   = qBars.find(q => q.q === 'Q3')
  const q1   = qBars.find(q => q.q === 'Q1')
  const weakest = [...qBars].sort((a, b) => a.pct - b.pct)[0]

  w.document.write(`<!DOCTYPE html><html><head><title>Action Plan — ${scope.label}</title>
  <style>
    body{font-family:sans-serif;max-width:700px;margin:40px auto;color:#0f172a;font-size:14px}
    h1{font-size:22px;font-weight:900;margin:0 0 4px}
    .sub{color:#64748b;font-size:12px;margin-bottom:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0}
    .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:14px}
    .kpi .val{font-size:26px;font-weight:900;margin:4px 0}
    .kpi .lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
    .bar-wrap{background:#f1f5f9;height:8px;border-radius:4px;margin:4px 0;overflow:hidden}
    .bar{height:100%;border-radius:4px}
    .red{background:#ef4444}.amber{background:#f59e0b}.green{background:#10b981}
    .section{margin:24px 0;border-top:1px solid #f1f5f9;padding-top:16px}
    h2{font-size:14px;font-weight:700;margin:0 0 10px;color:#475569}
    ul{margin:0;padding:0 0 0 16px;color:#475569;font-size:13px;line-height:2}
    .footer{margin-top:40px;border-top:1px solid #f1f5f9;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center}
    @media print{body{margin:20px}}
  </style></head><body>
  <p style="font-size:11px;color:#94a3b8;margin-bottom:4px">ARAGHYAM · JJM CSAT AI · DISTRICT ACTION PLAN</p>
  <h1>${scope.label}</h1>
  <p class="sub">${data.phaseLabel} · ${data.dateLabel} · Zone: ${scope.zone ?? 'All Assam'} · Generated ${new Date().toLocaleDateString('en-IN')}</p>

  <div class="grid">
    <div class="kpi">
      <div class="lbl">BSI Score</div>
      <div class="val" style="color:${+bsi5>=3.5?'#10b981':+bsi5>=2?'#f59e0b':'#ef4444'}">${bsi5}/5</div>
      <div class="bar-wrap"><div class="bar ${+bsi5>=3.5?'green':+bsi5>=2?'amber':'red'}" style="width:${(+bsi5/5)*100}%"></div></div>
      <div style="font-size:11px;color:#94a3b8">Target: 3.50 · Gap: ${gap}</div>
    </div>
    <div class="kpi">
      <div class="lbl">Usable Calls</div>
      <div class="val" style="color:#2563eb">${scope.usableCalls?.toLocaleString() ?? '—'}</div>
      <div style="font-size:11px;color:#94a3b8">Valid scheme calls</div>
    </div>
    <div class="kpi">
      <div class="lbl">Valid Schemes</div>
      <div class="val" style="color:#7c3aed">${scope.validSchemes ?? '—'}</div>
      <div style="font-size:11px;color:#94a3b8">Of 2,373 IMIS total</div>
    </div>
  </div>

  ${qBars.length > 0 ? `<div class="section"><h2>Service Area Performance</h2>
  ${qBars.map(q=>`<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:12px"><span><b>${q.q}</b> ${q.label}</span><b style="color:${q.pct>=70?'#10b981':q.pct>=40?'#f59e0b':'#ef4444'}">${q.pct}%</b></div>
    <div class="bar-wrap"><div class="bar ${q.pct>=70?'green':q.pct>=40?'amber':'red'}" style="width:${q.pct}%"></div></div>
    <div style="font-size:10px;color:#94a3b8">Benchmark: 70% · Status: ${q.status}</div>
  </div>`).join('')}</div>` : ''}

  <div class="section"><h2>Priority Actions</h2><ul>
    ${weakest ? `<li><b>Highest priority:</b> ${weakest.label} is at ${weakest.pct}% — the biggest gap from the 70% benchmark</li>` : ''}
    ${q1 && q1.pct < 50 ? `<li>Water regularity (Q1) is critically low at ${q1.pct}% — verify scheme infrastructure and supply schedule</li>` : ''}
    ${q2 && q2.pct < 70 ? `<li>Water quality (Q2) at ${q2.pct}% — inspect treatment and source quality</li>` : ''}
    ${q3 && q3.pct < 70 ? `<li>Water quantity (Q3) at ${q3.pct}% — check distribution coverage and pressure</li>` : ''}
    <li>Target re-call in Phase 2 to verify improvement</li>
    <li>BSI gap of ${gap} points to target 3.50 — focus on bottom two indicators</li>
  </ul></div>

  <div class="footer">Araghyam · Assam Jal Jeevan Mission · Confidential · Government of Assam</div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const data = usePhaseData()
  const { KPI_HEADLINE, ZONE_SCORES, DISTRICT_SCORES, SCHEME_COVERAGE } = data
  const STATE_BSI   = KPI_HEADLINE.stateBSI
  const STATE_BSI_5 = +(STATE_BSI * 5).toFixed(2)
  const ZONE_LIST   = ZONE_SCORES.filter(z => z.bsi !== null && z.zone !== 'Assam (State)').map(z => z.zone)
  const DISTRICT_LIST = DISTRICT_SCORES.map(d => d.district)

  const [scopeType, setScopeType] = useState<'state' | 'zone' | 'district'>('state')
  const [scopeValue, setScopeValue] = useState('')
  const [schemeList, setSchemeList]     = useState<string[]>([])
  const [schemeFilter, setSchemeFilter] = useState('')
  const [schemeStats, setSchemeStats]   = useState<SchemeStats | null>(null)
  const [loadingSchemes, setLoadingSchemes] = useState(false)
  const [bsiMode, setBsiMode]               = useState<BsiMode>('standard')
  const [linkCopied, setLinkCopied]         = useState(false)

  // Restore scope from URL params on first load
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const s = p.get('scope') as 'zone' | 'district' | null
    const v = p.get('v') || ''
    if (s === 'zone' || s === 'district') { setScopeType(s); setScopeValue(v) }
  }, [])

  // Keep URL in sync with current scope (for sharing)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (scopeType === 'state') {
      url.searchParams.delete('scope'); url.searchParams.delete('v')
    } else {
      url.searchParams.set('scope', scopeType)
      if (scopeValue) url.searchParams.set('v', scopeValue)
      else url.searchParams.delete('v')
    }
    window.history.replaceState({}, '', url.toString())
  }, [scopeType, scopeValue])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Listen for scope changes from command palette
  useEffect(() => {
    function onSetScope(e: Event) {
      const { type, value } = (e as CustomEvent).detail as { type: 'zone' | 'district'; value: string }
      setScopeType(type)
      setScopeValue(value)
    }
    window.addEventListener('setScope', onSetScope)
    return () => window.removeEventListener('setScope', onSetScope)
  }, [])

  // Fetch scheme names when a district is selected (Phase 1 only — Phase 2 has no call_records in DB)
  useEffect(() => {
    if (!data.hasSchemeSearch || scopeType !== 'district' || !scopeValue) {
      setSchemeList([]); setSchemeFilter(''); setSchemeStats(null); return
    }
    setLoadingSchemes(true)
    supabase.from('call_records').select('scheme_name').eq('district', scopeValue)
      .not('scheme_name', 'is', null)
      .then(({ data: rows }) => {
        const names = [...new Set((rows ?? []).map((r: any) => r.scheme_name as string).filter(Boolean))].sort()
        setSchemeList(names)
        setLoadingSchemes(false)
      })
  }, [scopeType, scopeValue, data.hasSchemeSearch])

  // Compute scheme-level stats when a scheme is picked (Phase 1 only)
  useEffect(() => {
    if (!schemeFilter || !data.hasSchemeSearch) { setSchemeStats(null); setBsiMode('standard'); return }
    supabase.from('call_records')
      .select('q1_answer,q2_answer,q3_answer,q4_answer,q5_answer,consented')
      .eq('scheme_name', schemeFilter)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const lc = (v: unknown) => String(v ?? '').toLowerCase()

        // ── Subsets ──
        const usable    = data.filter((r: any) => ['yes','no'].includes(lc(r.q1_answer)))
        const consented = data.filter((r: any) => r.consented === true)
        const conQ1yes  = consented.filter((r: any) => lc(r.q1_answer) === 'yes')

        // ── Standard mode pcts (Q1/Q1A = usable base, Q2/Q3/Q5 = consented base) ──
        const q1YesN  = usable.filter((r: any) => lc(r.q1_answer) === 'yes').length
        const q1Pct   = usable.length ? q1YesN / usable.length : 0
        const q1YesU  = usable.filter((r: any) => lc(r.q1_answer) === 'yes')
        const q1aAns  = q1YesU.filter((r: any) => ['yes','no'].includes(lc(r.q4_answer)))
        const q1aYesN = q1aAns.filter((r: any) => lc(r.q4_answer) === 'yes').length
        const q1aPct  = q1aAns.length ? q1aYesN / q1aAns.length : 0
        const q2Ans   = consented.filter((r: any) => ['yes','no'].includes(lc(r.q2_answer)))
        const q2Pct   = q2Ans.length ? q2Ans.filter((r: any) => lc(r.q2_answer) === 'yes').length / q2Ans.length : 0
        const q3Ans   = consented.filter((r: any) => ['yes','no'].includes(lc(r.q3_answer)))
        const q3Pct   = q3Ans.length ? q3Ans.filter((r: any) => lc(r.q3_answer) === 'yes').length / q3Ans.length : 0
        const q5Ans   = consented.filter((r: any) => ['satisfied','neutral','dissatisfied'].includes(lc(r.q5_answer)))
        const q5Pct   = q5Ans.length ? q5Ans.filter((r: any) => lc(r.q5_answer) === 'satisfied').length / q5Ans.length : 0

        // ── Usable mode pcts (Q2/Q3/Q5 recalculated from anyone who answered, not just consented) ──
        const q2AnsU  = data.filter((r: any) => ['yes','no'].includes(lc(r.q2_answer)))
        const q2PctU  = q2AnsU.length ? q2AnsU.filter((r: any) => lc(r.q2_answer) === 'yes').length / q2AnsU.length : 0
        const q3AnsU  = data.filter((r: any) => ['yes','no'].includes(lc(r.q3_answer)))
        const q3PctU  = q3AnsU.length ? q3AnsU.filter((r: any) => lc(r.q3_answer) === 'yes').length / q3AnsU.length : 0
        const q5AnsU  = data.filter((r: any) => ['satisfied','neutral','dissatisfied'].includes(lc(r.q5_answer)))
        const q5PctU  = q5AnsU.length ? q5AnsU.filter((r: any) => lc(r.q5_answer) === 'satisfied').length / q5AnsU.length : 0

        // ── Consented mode pcts (Q1/Q1A recalculated from consented-only base) ──
        const q1AnsC  = consented.filter((r: any) => ['yes','no'].includes(lc(r.q1_answer)))
        const q1PctC  = q1AnsC.length ? q1AnsC.filter((r: any) => lc(r.q1_answer) === 'yes').length / q1AnsC.length : 0
        const q1aAnsC = conQ1yes.filter((r: any) => ['yes','no'].includes(lc(r.q4_answer)))
        const q1aPctC = q1aAnsC.length ? q1aAnsC.filter((r: any) => lc(r.q4_answer) === 'yes').length / q1aAnsC.length : 0

        // ── BSI per mode ──
        const bsiStd = calcBsi(q1Pct,  q1aPct,  q2Pct,  q3Pct,  q5Pct)   // standard
        const bsiUsb = calcBsi(q1Pct,  q1aPct,  q2PctU, q3PctU, q5PctU)   // usable: Q2/Q3/Q5 from all-callers
        const bsiCon = calcBsi(q1PctC, q1aPctC, q2Pct,  q3Pct,  q5Pct)   // consented: Q1/Q1A from consented-only

        setSchemeStats({
          schemeName: schemeFilter, totalCalls: data.length,
          usableCalls: usable.length, consentedCalls: consented.length,
          bsiStandard: bsiStd, bsiUsable: bsiUsb, bsiConsented: bsiCon,
          bsi5: (mode) => {
            const v = mode === 'usable' ? bsiUsb : mode === 'consented' ? bsiCon : bsiStd
            return (+(v * 5).toFixed(2)).toString()
          },
          status: (mode) => {
            const v = mode === 'usable' ? bsiUsb : mode === 'consented' ? bsiCon : bsiStd
            return bsiStatus(+(v * 5).toFixed(2))
          },
          q1Pct: +(q1Pct*100).toFixed(1), q1aPct: +(q1aPct*100).toFixed(1),
          q2Pct: +(q2Pct*100).toFixed(1), q3Pct: +(q3Pct*100).toFixed(1),
          q5Pct: +(q5Pct*100).toFixed(1),
        })
      })
  }, [schemeFilter])

  // Derive all data from current scope
  const scope = useMemo<ScopeData>(() => {
    if (scopeType === 'zone' && scopeValue) {
      const z = ZONE_SCORES.find(z => z.zone === scopeValue)
      if (!z) return stateScope(ZONE_SCORES, SCHEME_COVERAGE, STATE_BSI, STATE_BSI_5)
      const schemes = DISTRICT_SCORES.filter(d => d.zone === scopeValue).reduce((s, d) => s + d.validSchemes, 0)
      return {
        label: z.zone, bsi: z.bsi ?? 0, bsi5: ((z.bsi ?? 0) * 5).toFixed(2),
        status: z.status ?? 'No Data', usableCalls: z.usableCalls, validSchemes: schemes,
        quality: z.quality, quantity: z.quantity, daily: z.daily,
        satisfaction: (z as any).satisfaction ?? null, zone: z.zone,
      }
    }
    if (scopeType === 'district' && scopeValue) {
      const d = DISTRICT_SCORES.find(d => d.district === scopeValue)
      if (!d) return stateScope(ZONE_SCORES, SCHEME_COVERAGE, STATE_BSI, STATE_BSI_5)
      return {
        label: d.district, bsi: d.bsi, bsi5: (d.bsi * 5).toFixed(2),
        status: d.status, usableCalls: d.usableCalls, validSchemes: d.validSchemes,
        quality: d.quality, quantity: d.quantity, daily: null,
        satisfaction: (d as any).satisfaction ?? null, zone: d.zone,
      }
    }
    return stateScope(ZONE_SCORES, SCHEME_COVERAGE, STATE_BSI, STATE_BSI_5)
  }, [scopeType, scopeValue, ZONE_SCORES, DISTRICT_SCORES, SCHEME_COVERAGE, STATE_BSI, STATE_BSI_5])

  // Districts shown in breakdown — reactive to scope
  const breakdownRows = useMemo(() => {
    if (scopeType === 'zone' && scopeValue) {
      return DISTRICT_SCORES.filter(d => d.zone === scopeValue).sort((a, b) => b.bsi - a.bsi)
    }
    if (scopeType === 'district' && scopeValue) {
      const d = DISTRICT_SCORES.find(d => d.district === scopeValue)
      return d ? DISTRICT_SCORES.filter(x => x.zone === d.zone).sort((a, b) => b.bsi - a.bsi) : []
    }
    if (scopeType === 'district') {
      return DISTRICT_SCORES.slice().sort((a, b) => b.bsi - a.bsi)
    }
    return ZONE_SCORES.filter(z => z.zone !== 'Assam (State)').sort((a, b) => (b.bsi ?? 0) - (a.bsi ?? 0))
  }, [scopeType, scopeValue, ZONE_SCORES, DISTRICT_SCORES])

  const isScoped = scopeType !== 'state'
  const ins = insight(scopeType, scope, data.stateInsightCalls, data.stateInsightQuality)

  const { KPI_QUESTIONS } = data
  // Q bars for state scope — derived from KPI_QUESTIONS
  const STATE_Q = useMemo(() => KPI_QUESTIONS.map(q => ({
    q: q.id, label: q.label, pct: q.yesPct, max: 100, status: q.status, insight: '',
  })), [KPI_QUESTIONS])

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
    setScopeValue('')   // '' = All; user picks specific value from dropdown
    setSchemeFilter(''); setSchemeStats(null); setSchemeList([])
  }

  // Active scope for display — scheme overrides district when selected
  const activeScheme = schemeFilter && schemeStats
  const activeBsi5   = activeScheme ? schemeStats!.bsi5(bsiMode) : scope.bsi5
  const activeStatus = activeScheme ? schemeStats!.status(bsiMode) : scope.status
  const activeSc     = statusColor(activeStatus)
  const activeLabel  = activeScheme ? schemeStats!.schemeName : scope.label
  const activeGap5   = +(TARGET_5 - +activeBsi5).toFixed(2)

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

        {/* Value dropdowns */}
        {scopeType === 'zone' && (
          <select value={scopeValue} onChange={e => setScopeValue(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All zones</option>
            {ZONE_LIST.map(z => <option key={z}>{z}</option>)}
          </select>
        )}
        {scopeType === 'district' && (
          <select value={scopeValue} onChange={e => { setScopeValue(e.target.value); setSchemeFilter(''); setSchemeStats(null) }}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All districts</option>
            {DISTRICT_LIST.map(d => <option key={d}>{d}</option>)}
          </select>
        )}

        {/* Scheme dropdown — shown when district selected and schemes available */}
        {scopeType === 'district' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Scheme</span>
            {loadingSchemes ? (
              <span className="text-xs text-gray-400 italic">loading…</span>
            ) : schemeList.length > 0 ? (
              <select value={schemeFilter} onChange={e => setSchemeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-blue-200 rounded-lg bg-blue-50 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">All schemes</option>
                {schemeList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span className="text-xs text-gray-400 italic">no data in call records</span>
            )}
          </div>
        )}

        {/* BSI basis radio — only active when a scheme is selected */}
        {activeScheme ? (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">BSI basis</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] font-semibold">
              {(['standard', 'usable', 'consented'] as BsiMode[]).map(m => (
                <button key={m} onClick={() => setBsiMode(m)}
                  className={`px-2 py-1 capitalize transition-colors ${
                    bsiMode === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : scopeType === 'district' && schemeList.length > 0 ? (
          <p className="text-[10px] text-gray-400 ml-auto italic">Select a scheme above to compare BSI bases</p>
        ) : null}

        {/* Breadcrumb label + copy link */}
        {!(scopeType === 'district' || activeScheme) && (
          <div className="flex items-center gap-2 ml-auto">
            {isScoped && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${activeSc.badge}`}>
                {activeStatus}
              </span>
            )}
            <span className="text-xs text-gray-400 hidden sm:block">
              {scopeType === 'state' ? data.stateScopeText
               : `${scope.usableCalls ? fmt(scope.usableCalls) : '—'} usable calls · ${scope.validSchemes ?? '—'} valid schemes`}
            </span>
            {/* Copy link button */}
            <button onClick={copyLink} title="Copy link to this view"
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-2 py-1 rounded-lg transition-all">
              {linkCopied
                ? <><span className="text-emerald-500">✓</span> Copied</>
                : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Share</>}
            </button>
          </div>
        )}
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            value: activeBsi5 + '/5',
            label: activeScheme ? `BSI · ${bsiMode}` : 'BSI Score',
            insight: activeScheme
              ? `${bsiMode} basis · ${activeGap5 > 0 ? activeGap5 + ' below target' : 'meets target'}`
              : ins.bsi,
            accent: activeStatus === 'Good' ? 'border-l-emerald-500' : activeStatus === 'Critical' ? 'border-l-red-500' : 'border-l-amber-500',
            valueColor: activeSc.text,
            badge: activeStatus,
          },
          {
            value: activeScheme
              ? fmt(schemeStats!.usableCalls)
              : (scopeType === 'state' ? data.usableCallsLabel : scope.usableCalls ? fmt(scope.usableCalls) : '—'),
            label: 'Usable Calls',
            insight: activeScheme
              ? `${fmt(schemeStats!.consentedCalls)} consented · ${fmt(schemeStats!.totalCalls)} total for this scheme`
              : (scopeType === 'state' ? data.usableInsightText : ins.calls),
            accent: 'border-l-blue-500',
            valueColor: 'text-slate-900',
            badge: activeScheme
              ? `${fmt(schemeStats!.totalCalls)} total`
              : (scopeType === 'state' ? data.usableYieldText : `${scope.validSchemes ?? '—'} valid schemes`),
          },
          {
            value: activeScheme
              ? `${schemeStats!.q5Pct}%`
              : scopeType === 'state'
                ? data.q5BaseLabel.split(' ')[0]
                : scope.satisfaction !== null && scope.satisfaction !== undefined
                  ? `${+(scope.satisfaction / 0.5 * 100).toFixed(1)}%`
                  : '—',
            label: scopeType === 'state' && !activeScheme ? 'Q5 Respondents' : 'Q5 Satisfied',
            insight: activeScheme
              ? `Overall satisfaction for ${schemeStats!.schemeName}`
              : scopeType === 'state'
                ? `Answered Q5 (Overall Satisfaction) · ${data.q5BaseLabel.split(' ')[0]} reached Q5`
                : scope.satisfaction !== null && scope.satisfaction !== undefined
                  ? `Q5 satisfaction rate (scheme-weighted avg for this ${scopeType})`
                  : 'No Q5 data for this scope',
            accent: 'border-l-teal-500',
            valueColor: 'text-slate-900',
            badge: activeScheme ? '' : (scopeType === 'state' ? '51.7% satisfied' : ''),
          },
          {
            value: activeScheme
              ? `${schemeStats!.q2Pct}%`
              : (scopeType === 'state' ? `${KPI_HEADLINE.satisfied}%` : scope.quality ? `${(scope.quality / 1.5 * 100).toFixed(1)}%` : '—'),
            label: activeScheme ? 'Water Quality' : (scopeType === 'state' ? 'Q5 Satisfied' : 'Water Quality'),
            insight: activeScheme
              ? `Q1: ${schemeStats!.q1Pct}% · Q1A: ${schemeStats!.q1aPct}% · Q3: ${schemeStats!.q3Pct}%`
              : ins.quality,
            accent: 'border-l-violet-500',
            valueColor: 'text-slate-900',
            badge: scopeType === 'state' ? `${data.q5BaseLabel.split(' ')[0]} responded` : '',
          },
        ].map(k => (
          <div key={k.label} className={`card p-4 border-l-4 ${k.accent}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className={`stat-value ${k.valueColor}`}>{k.value}</p>
              {k.badge && <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 flex-shrink-0 hidden sm:block">{k.badge}</span>}
            </div>
            <p className="stat-label">{k.label}</p>
            <p className="stat-sub leading-snug">{k.insight}</p>
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
              <p className="panel-sub mt-0.5">{activeLabel} · Target ≥ 3.50 / 5.0</p>
            </div>
            <span className={`badge ${activeStatus === 'Good' ? 'badge-good' : activeStatus === 'Critical' ? 'badge-critical' : activeStatus === 'No Data' ? 'badge-neutral' : 'badge-moderate'}`}>
              {activeStatus}
            </span>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-4xl font-black ${activeSc.text}`}>{activeBsi5}</span>
              <span className="text-base text-gray-400 mb-0.5">/ 5.0</span>
              {activeScheme && (
                <span className="text-[10px] font-semibold text-blue-500 mb-1 ml-1 capitalize">{bsiMode} basis</span>
              )}
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-100"   style={{ width: '40%' }} />
                <div className="h-full bg-amber-100" style={{ width: '30%' }} />
                <div className="h-full bg-emerald-100 flex-1" />
              </div>
              <div className={`absolute inset-y-0 left-0 h-full ${activeSc.bar} rounded-full transition-all duration-500`}
                style={{ width: `${(+activeBsi5 / 5) * 100}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/60" style={{ left: '70%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span className="text-emerald-600 font-medium">3.50 ↑</span>
              <span>5.0</span>
            </div>
          </div>

          {/* Scheme-level Q breakdown */}
          {activeScheme && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Q breakdown for this scheme</p>
              {[
                { label: 'Q1 Daily',    pct: schemeStats!.q1Pct,  color: 'bg-red-400',     max: 100 },
                { label: 'Q1A Timing',  pct: schemeStats!.q1aPct, color: 'bg-orange-400',  max: 100 },
                { label: 'Q2 Quality',  pct: schemeStats!.q2Pct,  color: 'bg-emerald-400', max: 100 },
                { label: 'Q3 Quantity', pct: schemeStats!.q3Pct,  color: 'bg-blue-400',    max: 100 },
                { label: 'Q5 Overall',  pct: schemeStats!.q5Pct,  color: 'bg-violet-400',  max: 100 },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-10 text-right">{c.pct}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Component contributions (zone/district static data) */}
          {!activeScheme && (scope.quality || scope.quantity) && (
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
                  <span className="text-xs font-mono text-gray-400 w-8 text-right flex-shrink-0">{+(c.val / c.max * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* State-level note */}
          {scopeType !== 'state' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {scopeType === 'district' ? 'Q1A & Q5 not available at district level' : 'Q1A & Q5 not available at zone level'}
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
            {qBars.map((q: any) => {
              const c = statusColor(q.status)
              const noPct = +(100 - q.pct).toFixed(2)
              return (
                <div key={q.q} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 font-mono w-6 flex-shrink-0">{q.q}</span>
                    <span className="text-[12px] font-semibold text-slate-700 w-32 flex-shrink-0 truncate">{q.label}</span>
                    <div className="flex-1">
                      <div className="relative h-2 rounded-full overflow-hidden flex">
                        <div className={`h-full ${c.bar}`} style={{ width: `${q.pct}%` }} />
                        <div className="h-full bg-slate-100 flex-1" />
                        <div className="absolute top-0 bottom-0 w-px bg-slate-300" style={{ left: '70%' }} />
                      </div>
                      <div className="flex justify-between text-[10px] mt-0.5 text-slate-400">
                        <span className={`font-semibold ${c.text}`}>Yes {q.pct}%</span>
                        <span>No {noPct}%</span>
                      </div>
                    </div>
                    <span className={`badge ${q.status === 'Good' ? 'badge-good' : q.status === 'Critical' ? 'badge-critical' : 'badge-moderate'} w-20 text-center flex-shrink-0`}>
                      {q.status}
                    </span>
                  </div>
                  {q.insight && (
                    <p className="text-[10px] text-slate-400 mt-1 ml-9 leading-snug italic">{q.insight}</p>
                  )}
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
              {scopeType === 'state'
                ? 'Zone Rankings'
                : scopeType === 'zone' && scopeValue
                  ? `Districts in ${scopeValue}`
                  : scopeType === 'zone'
                    ? 'All Zones'
                    : scopeType === 'district' && scopeValue
                      ? `Other districts in ${DISTRICT_SCORES.find(d => d.district === scopeValue)?.zone ?? ''}`
                      : 'All Districts'}
            </p>
            <p className="text-xs text-gray-400">
              {scopeType === 'state'
                ? 'No zone meets the 3.50 target · sorted best to worst'
                : scopeType === 'district' && !scopeValue
                  ? `${data.districtCountLabel} districts · sorted by BSI · click to drill down`
                  : 'Sorted by BSI · click a district to drill down'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {scopeType === 'district' && scopeValue && (
              <button onClick={() => generateActionPlan(scope, qBars, data.phaseLabel, data.dateLabel)}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors no-print">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Action Plan PDF
              </button>
            )}
            <button onClick={() => nav('geographic')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Full map →
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="th text-left">
                  {scopeType === 'state' ? 'Zone' : 'District'}
                </th>
                {scopeType === 'district' && !scopeValue && (
                  <th className="th text-left hidden sm:table-cell">Zone</th>
                )}
                <th className="th text-right">BSI /5</th>
                <th className="th hidden lg:table-cell">Trend</th>
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
                const isSelected = scopeType === 'district' && scopeValue && row.district === scopeValue
                const rowLabel = scopeType === 'state' ? row.zone : (row.district ?? row.zone)
                return (
                  <tr key={`${row.zone ?? ''}-${row.district ?? ''}`}
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
                      <span className="font-semibold text-gray-800 text-xs">{rowLabel}</span>
                      {isSelected && <span className="ml-2 text-[10px] text-blue-500 font-bold">← selected</span>}
                    </td>
                    {scopeType === 'district' && !scopeValue && (
                      <td className="td text-xs text-gray-400 hidden sm:table-cell">{row.zone ?? '—'}</td>
                    )}
                    <td className="td-mono text-right">
                      <span className={`font-black text-sm ${rc.text}`}>{bsi5}</span>
                    </td>
                    {/* BSI sparkline — Phase 1 progress bar + Ph2 pending indicator */}
                    <td className="td hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rc.bar}`}
                            style={{ width: `${Math.min((+(bsi5) / 5) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-300 font-medium whitespace-nowrap">Ph2 —</span>
                      </div>
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
              <span className="text-gray-500">{data.validSchemesText}</span>
              <span className="text-emerald-700 font-bold">{SCHEME_COVERAGE.functionalRate}% regular supply</span>
              <span className="text-red-600 font-bold">{(100 - SCHEME_COVERAGE.functionalRate).toFixed(1)}% irregular supply</span>
            </div>
          </div>

          {/* Call consent breakdown */}
          <div onClick={() => nav('calls')}
            className="card p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Call Consent Breakdown</p>
                <p className="text-xs text-gray-400">{fmt(KPI_HEADLINE.totalCalls)} total calls · sums to 100%</p>
              </div>
              <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium">Call analysis →</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex mb-2">
              {data.consentBreakdown.map(s => (
                <div key={s.label} className={`${s.dot} h-full`} style={{ width: s.pct }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {data.consentBreakdown.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                  <span className="text-gray-500">{s.label}</span>
                  <span className={`font-bold ${s.color} ml-auto`}>{s.pct}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{data.consentNoteText}</p>
          </div>
        </div>
      )}

      {/* ── Phase Comparison (Full Campaign only) ───────────────────────── */}
      {data.comparison && <PhaseComparisonSection comparison={data.comparison} />}

    </div>
  )
}

// ─── Phase Comparison Section ─────────────────────────────────────────────────
function PhaseComparisonSection({ comparison }: { comparison: NonNullable<ReturnType<typeof usePhaseData>['comparison']> }) {
  const trendIcon  = (trend: string, isGoodUp: boolean) => {
    if (trend === 'neutral') return { icon: '→', cls: 'text-gray-500' }
    const isPositive = (trend === 'up' && isGoodUp) || (trend === 'down' && !isGoodUp)
    return {
      icon: trend === 'up' ? '↑' : '↓',
      cls: isPositive ? 'text-emerald-600' : 'text-red-600',
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-black">≈</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Phase 1 vs Phase 2 Comparison</p>
            <p className="text-xs text-gray-400">
              Phase 1: 45,863 calls · Apr 2026 · BSI {comparison.p1Bsi5}/5 &nbsp;|&nbsp;
              Phase 2: 79,725 calls · May 2026 · BSI {comparison.p2Bsi5}/5
            </p>
          </div>
        </div>
      </div>

      {/* KPI comparison grid */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="panel-title">Key Metric Changes  Phase 1 → Phase 2</p>
          <p className="panel-sub mt-0.5">Arrow colour: green = improvement · red = regression</p>
        </div>
        <div className="divide-y divide-gray-50">
          {comparison.metrics.map(m => {
            const { icon, cls } = trendIcon(m.trend, m.isGoodUp)
            return (
              <div key={m.label} className="px-5 py-3 flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-600 w-36 flex-shrink-0 truncate">{m.label}</span>
                <span className="text-xs font-mono text-gray-500 w-16 text-right flex-shrink-0">{m.p1}</span>
                <span className="text-gray-300 text-xs flex-shrink-0">→</span>
                <span className="text-xs font-mono font-bold text-gray-800 w-16 text-right flex-shrink-0">{m.p2}</span>
                <span className={`text-sm font-black w-6 flex-shrink-0 ${cls}`}>{icon}</span>
                <span className={`text-xs font-bold w-16 flex-shrink-0 ${cls}`}>{m.change}</span>
                <span className="text-[10px] text-gray-400 flex-1 leading-snug hidden md:block">{m.note}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zone BSI changes */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="panel-title">Zone BSI Changes  Phase 1 → Phase 2</p>
          <p className="panel-sub mt-0.5">BSI out of 5.0 · Phase 2 zone data based on limited May 2026 sample</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="th text-left">Zone</th>
                <th className="th text-right">Phase 1 BSI</th>
                <th className="th text-right">Phase 2 BSI</th>
                <th className="th text-center">Change</th>
              </tr>
            </thead>
            <tbody>
              {comparison.zoneChanges.map(z => {
                const isUp = z.direction === 'up'
                const isNoData = z.direction === 'nodata'
                return (
                  <tr key={z.zone} className="border-b border-gray-50 last:border-0">
                    <td className="td font-medium text-gray-800">{z.zone}</td>
                    <td className="td-mono text-right text-gray-600">{z.p1Bsi5 === '—' ? '—' : `${z.p1Bsi5}/5`}</td>
                    <td className="td-mono text-right text-gray-600">{isNoData || !z.p2Bsi5 ? <span className="text-gray-300">No data</span> : `${z.p2Bsi5}/5`}</td>
                    <td className="td text-center">
                      {isNoData ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className={`text-xs font-bold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isUp ? '↑' : '↓'} {z.changePp}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-100">
          <p className="text-[10px] text-amber-700">Phase 2 zone scores are based on 800 usable calls across 5 zones (vs 9,224 in Phase 1). Results are directional indicators — sample sizes are limited for some zones.</p>
        </div>
      </div>
    </div>
  )
}

function stateScope(
  ZONE_SCORES: any[], SCHEME_COVERAGE: any,
  STATE_BSI: number, STATE_BSI_5: number,
): ScopeData {
  const state = ZONE_SCORES.find((z: any) => z.zone === 'Assam (State)')!
  return {
    label: 'All Assam', bsi: STATE_BSI, bsi5: STATE_BSI_5.toFixed(2),
    status: 'Moderate', usableCalls: state.usableCalls, validSchemes: SCHEME_COVERAGE.valid,
    quality: state.quality, quantity: state.quantity, daily: state.daily,
    satisfaction: (state as any).satisfaction ?? null, zone: null,
  }
}

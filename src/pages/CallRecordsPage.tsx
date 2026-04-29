import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { downloadFilteredCallsCSV } from '../utils/reports'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CallRecord {
  id: number
  contact_id: number | null
  call_id: number | null
  contact_status: string | null
  contact_attempts: number
  call_duration: number | null
  call_start_time: string | null
  zone: string | null
  district: string | null
  scheme_name: string | null
  call_recording_url: string | null
  consented: boolean | null
  call_ended_early: boolean | null
  early_end_reason: string | null
  callback_requested: boolean | null
  q1_answer: string | null
  q1_evidence: string | null
  days_without_water: string | null
  q2_answer: string | null
  q2_evidence: string | null
  quality_issue_details: string | null
  q3_answer: string | null
  q3_evidence: string | null
  quantity_issue_details: string | null
  q4_answer: string | null
  q4_evidence: string | null
  q5_answer: string | null
  q5_evidence: string | null
  satisfaction_reason: string | null
  dissatisfaction_reason: string | null
  supply_issue_scope: string | null
  call_summary: string | null
  additional_feedback: string | null
  is_usable: boolean
  is_completed: boolean
  satisfaction: string | null
}

const ZONES = ['All Zones', 'Critical Zones', 'North Assam', 'Upper Assam', 'Lower Assam', 'BTAD', 'Barak Valley', 'KAAC']
const STATUSES = ['All', 'Completed', 'Unanswered', 'Pending']
const SATISFACTIONS = ['All', 'Satisfied', 'Neutral', 'Dissatisfied', 'No Q5']
const Q_OPTS = ['All', 'Yes', 'No']
const PAGE_SIZE = 50

type SortCol = 'call_start_time' | 'call_duration' | 'contact_attempts' | 'district' | 'zone'
type SortDir = 'asc' | 'desc'

// Quick filter presets
interface Preset {
  id: string
  label: string
  icon: string
  desc: string
  filters: {
    zone?: string
    status?: string
    sat?: string
    q1?: string
    hasRecording?: boolean | null
    callbackOnly?: boolean
    minDuration?: number | null
  }
}

const QUICK_FILTERS: Preset[] = [
  {
    id: 'dissatisfied_rec',
    label: 'Dissatisfied + Recording',
    icon: '😞',
    desc: 'Completed calls where Q5=Dissatisfied and recording exists',
    filters: { status: 'Completed', sat: 'Dissatisfied', hasRecording: true },
  },
  {
    id: 'no_daily_water',
    label: 'No Daily Water (Q1=No)',
    icon: '🚱',
    desc: 'Households reporting water did not come every day',
    filters: { q1: 'No', status: 'All' },
  },
  {
    id: 'critical_zones',
    label: 'Critical Zones',
    icon: '🔴',
    desc: 'BTAD and Barak Valley — lowest BSI regions',
    filters: { zone: 'Critical Zones', status: 'All' },
  },
  {
    id: 'callbacks',
    label: 'Callback Requested',
    icon: '📲',
    desc: 'Callers who asked to be called back',
    filters: { callbackOnly: true, status: 'All' },
  },
  {
    id: 'long_calls',
    label: 'Long Calls (>3 min)',
    icon: '⏱️',
    desc: 'High-engagement calls with rich data',
    filters: { minDuration: 180, status: 'Completed' },
  },
  {
    id: 'with_recordings',
    label: 'Has Recording',
    icon: '🎙️',
    desc: 'All completed calls with an audio recording',
    filters: { hasRecording: true, status: 'Completed' },
  },
  {
    id: 'neutral_calls',
    label: 'Neutral Satisfaction',
    icon: '😐',
    desc: 'Q5 answered as Neutral — borderline cases',
    filters: { sat: 'Neutral', status: 'Completed' },
  },
]

function fmtDur(sec: number | null) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60), s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function CallRecordsPage() {
  const [records, setRecords]       = useState<CallRecord[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [zone, setZone]             = useState('All Zones')
  const [status, setStatus]         = useState('Completed')
  const [sat, setSat]               = useState('All')
  const [q1Filter, setQ1Filter]     = useState('All')
  const [q2Filter, setQ2Filter]     = useState('All')
  const [q3Filter, setQ3Filter]     = useState('All')
  const [q4Filter, setQ4Filter]     = useState('All')
  const [hasRecording, setHasRecording] = useState<boolean | null>(null)
  const [callbackOnly, setCallbackOnly] = useState(false)
  const [minDuration, setMinDuration]   = useState<number | null>(null)
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [sortCol, setSortCol]           = useState<SortCol>('call_start_time')
  const [sortDir, setSortDir]           = useState<SortDir>('desc')
  const [page, setPage]             = useState(0)
  const [selected, setSelected]     = useState<CallRecord | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting]   = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { fetchRecords() }, [zone, status, sat, q1Filter, q2Filter, q3Filter, q4Filter, hasRecording, callbackOnly, minDuration, dateFrom, dateTo, page, debouncedSearch, sortCol, sortDir])

  async function fetchRecords() {
    setLoading(true)
    let q = supabase
      .from('call_records')
      .select('*', { count: 'exact' })
      .order(sortCol, { ascending: sortDir === 'asc', nullsFirst: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (zone === 'Critical Zones') q = q.in('zone', ['BTAD', 'Barak Valley'])
    else if (zone !== 'All Zones') q = q.eq('zone', zone)

    if (status !== 'All') q = q.eq('contact_status', status)

    if (sat === 'No Q5') q = q.is('q5_answer', null)
    else if (sat !== 'All') q = q.eq('satisfaction', sat)

    if (q1Filter === 'Yes') q = q.eq('q1_answer', 'yes')
    else if (q1Filter === 'No') q = q.eq('q1_answer', 'no')

    if (q2Filter === 'Yes') q = q.eq('q2_answer', 'yes')
    else if (q2Filter === 'No') q = q.eq('q2_answer', 'no')

    if (q3Filter === 'Yes') q = q.eq('q3_answer', 'yes')
    else if (q3Filter === 'No') q = q.eq('q3_answer', 'no')

    if (q4Filter === 'Yes') q = q.eq('q4_answer', 'yes')
    else if (q4Filter === 'No') q = q.eq('q4_answer', 'no')

    if (hasRecording === true)  q = q.not('call_recording_url', 'is', null)
    if (hasRecording === false) q = q.is('call_recording_url', null)

    if (callbackOnly) q = q.eq('callback_requested', true)
    if (minDuration)  q = q.gte('call_duration', minDuration)
    if (dateFrom) q = q.gte('call_start_time', dateFrom)
    if (dateTo)   q = q.lte('call_start_time', dateTo + 'T23:59:59')

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim()
      q = q.or(`scheme_name.ilike.%${s}%,district.ilike.%${s}%,call_summary.ilike.%${s}%,call_id.eq.${Number.isInteger(+s) ? s : -1}`)
    }

    const { data, count, error } = await q
    if (!error && data) { setRecords(data); setTotal(count ?? 0) }
    setLoading(false)
  }

  function applyPreset(p: Preset) {
    if (activePreset === p.id) {
      // Toggle off — reset to defaults
      resetFilters()
      return
    }
    setActivePreset(p.id)
    setZone(p.filters.zone ?? 'All Zones')
    setStatus(p.filters.status ?? 'Completed')
    setSat(p.filters.sat ?? 'All')
    setQ1Filter(p.filters.q1 ?? 'All')
    setHasRecording(p.filters.hasRecording ?? null)
    setCallbackOnly(p.filters.callbackOnly ?? false)
    setMinDuration(p.filters.minDuration ?? null)
    setPage(0)
    setSelected(null)
  }

  function resetFilters() {
    setZone('All Zones'); setStatus('Completed'); setSat('All')
    setQ1Filter('All'); setQ2Filter('All'); setQ3Filter('All'); setQ4Filter('All')
    setHasRecording(null); setCallbackOnly(false)
    setMinDuration(null); setDateFrom(''); setDateTo('')
    setSearch(''); setPage(0); setActivePreset(null); setSelected(null)
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(0)
  }

  async function exportCSV() {
    setExporting(true)
    try {
      await downloadFilteredCallsCSV(
        {
          zone: zone === 'All Zones' ? undefined : zone,
          sat: sat === 'All' ? undefined : sat,
          q1: q1Filter === 'All' ? undefined : q1Filter,
          hasRecording,
          callbackOnly: callbackOnly ? true : undefined,
          minDuration,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
        [zone !== 'All Zones' && zone, sat !== 'All' && sat].filter(Boolean).join('_') || 'Filtered'
      )
    } finally {
      setExporting(false)
    }
  }

  const activeFilterCount = [
    zone !== 'All Zones', status !== 'Completed', sat !== 'All',
    q1Filter !== 'All', q2Filter !== 'All', q3Filter !== 'All', q4Filter !== 'All',
    hasRecording !== null, callbackOnly, minDuration !== null,
    dateFrom !== '', dateTo !== '',
    debouncedSearch.trim() !== '',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">

      {/* ── Quick Filter Presets ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Quick Filters</p>
            <p className="text-xs text-gray-400">One-click analysis views · click again to clear</p>
          </div>
          {activePreset && (
            <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Clear all ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              title={p.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activePreset === p.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-stretch">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: 'Matching Records', val: total.toLocaleString(),       color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
            { label: 'With Recording',   val: '8,782',                      color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
            { label: 'Survey Usable',    val: '9,224',                      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Active Filters',   val: activeFilterCount > 0 ? `${activeFilterCount} active` : 'Default', color: activeFilterCount > 0 ? 'text-amber-700' : 'text-gray-500', bg: activeFilterCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border p-3 ${c.bg}`}>
              <div className={`text-lg font-bold ${c.color}`}>{c.val}</div>
              <div className="text-xs text-gray-500">{c.label}</div>
            </div>
          ))}
        </div>
        {/* Export CSV button */}
        <button
          onClick={exportCSV}
          disabled={exporting || total === 0}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
        >
          <span className="text-lg">{exporting ? '⟳' : '↓'}</span>
          <span className="text-xs font-semibold text-emerald-700">{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1 font-medium">Search</label>
            <input
              type="text"
              placeholder="District, scheme, summary keywords, call ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Zone</label>
            <select value={zone} onChange={e => { setZone(e.target.value); setPage(0); setActivePreset(null) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); setActivePreset(null) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Q5 Satisfaction</label>
            <select value={sat} onChange={e => { setSat(e.target.value); setPage(0); setActivePreset(null) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {SATISFACTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* More filters toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 text-xs border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            More ▾
          </button>
          <button onClick={resetFilters}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Reset
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            {/* Survey answer filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['Q1 Daily Water',    q1Filter, setQ1Filter],
                ['Q2 Water Quality',  q2Filter, setQ2Filter],
                ['Q3 Quantity',       q3Filter, setQ3Filter],
                ['Q4 Timing',         q4Filter, setQ4Filter],
              ] as [string, string, (v: string) => void][]).map(([lbl, val, setter]) => (
                <div key={lbl}>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">{lbl}</label>
                  <div className="flex gap-1">
                    {Q_OPTS.map(o => (
                      <button key={o} onClick={() => { setter(o); setPage(0); setActivePreset(null) }}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${val === o ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Recording</label>
                <div className="flex gap-1">
                  {([['All', null], ['Has', true], ['None', false]] as [string, boolean | null][]).map(([label, val]) => (
                    <button key={label} onClick={() => { setHasRecording(val); setPage(0); setActivePreset(null) }}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${hasRecording === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Min Duration</label>
                <div className="flex gap-1">
                  {([['Any', null], ['>1min', 60], ['>3min', 180], ['>5min', 300]] as [string, number | null][]).map(([label, val]) => (
                    <button key={label} onClick={() => { setMinDuration(val); setPage(0); setActivePreset(null) }}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${minDuration === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                <input type="checkbox" checked={callbackOnly} onChange={e => { setCallbackOnly(e.target.checked); setPage(0); setActivePreset(null) }}
                  className="rounded border-gray-300 text-blue-600" />
                <span className="text-xs text-gray-600 font-medium">Callback Requested only</span>
              </label>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium flex-shrink-0">Date range:</span>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(0) }}
                  className="text-xs text-gray-400 hover:text-gray-600">clear</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${selected ? 'hidden lg:flex lg:flex-col lg:flex-1' : 'flex-1'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Call Records
              {!loading && <span className="ml-2 text-xs font-normal text-gray-400">{total.toLocaleString()} total · page {page + 1}</span>}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => { setPage(page + 1); setSelected(null) }} disabled={records.length < PAGE_SIZE}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <span className="animate-spin inline-block">⟳</span> Loading…
            </div>
          ) : records.length === 0 ? (
            <EmptyState zone={zone} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Call ID</th>
                    <SortTh col="call_start_time" label="Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                    <SortTh col="district" label="District" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                    <th className="th hidden lg:table-cell">Summary</th>
                    <th className="th text-center">Status</th>
                    <th className="th text-center">Q5</th>
                    <th className="th text-center hidden md:table-cell">Q1</th>
                    <SortTh col="call_duration" label="Dur." sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-right hidden md:table-cell" />
                    <th className="th text-center">🎙️</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${selected?.id === r.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                      <td className="td">
                        <div className="font-mono text-xs text-blue-600 font-semibold">{r.call_id ?? r.contact_id}</div>
                        {r.zone && <div className="text-xs text-gray-400">{r.zone}</div>}
                      </td>
                      <td className="td text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">{fmtDate(r.call_start_time)}</td>
                      <td className="td text-xs text-gray-500 hidden sm:table-cell">{r.district ?? '—'}</td>
                      <td className="td text-xs text-gray-500 hidden lg:table-cell max-w-xs">
                        <p className="truncate">{r.call_summary ?? '—'}</p>
                      </td>
                      <td className="td text-center"><StatusBadge r={r} /></td>
                      <td className="td text-center"><SatBadge sat={r.satisfaction} /></td>
                      <td className="td text-center hidden md:table-cell">
                        <Q1Badge ans={r.q1_answer} />
                      </td>
                      <td className="td-mono text-right text-xs text-gray-400 hidden md:table-cell">{fmtDur(r.call_duration)}</td>
                      <td className="td text-center">
                        {r.call_recording_url
                          ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs">▶</span>
                          : <span className="text-gray-200 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <CallDetail record={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ zone }: { zone: string }) {
  const isNonUpperAssam = zone !== 'All Zones' && zone !== 'Upper Assam' && zone !== 'Critical Zones'
  return (
    <div className="flex flex-col items-center justify-center h-56 gap-3 text-center px-6">
      <span className="text-4xl">📭</span>
      {isNonUpperAssam ? (
        <>
          <p className="text-sm font-medium text-gray-600">No records for {zone}</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Only Upper Assam data has been imported so far (105,512 rows from "Upper Assam Test Batch.xlsx").
            Other zone data will appear once their batch files are imported.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-600">No records match these filters</p>
          <p className="text-xs text-gray-400">Try adjusting the filters above, or use Reset to return to defaults.</p>
        </>
      )}
    </div>
  )
}

// ─── Call detail drawer ───────────────────────────────────────────────────────
function CallDetail({ record: r, onClose }: { record: CallRecord; onClose: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4 max-h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-start justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-gray-400">Call Detail</p>
          <p className="text-sm font-bold text-gray-800 font-mono">
            {r.call_id ? `Call #${r.call_id}` : `Contact #${r.contact_id}`}
          </p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <StatusBadge r={r} />
            <SatBadge sat={r.satisfaction} />
            {r.callback_requested && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">📲 Callback</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 text-lg">×</button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {/* Audio player */}
        {r.call_recording_url ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🎙️ Recording</p>
            <AudioPlayer url={r.call_recording_url} duration={r.call_duration} />
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">No recording for this call</p>
          </div>
        )}

        {/* Call summary */}
        {r.call_summary && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Summary</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed">
              {r.call_summary}
            </div>
          </div>
        )}

        {/* Call info */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Call Info</p>
          <dl className="space-y-1.5">
            {[
              { k: 'Date / Time',  v: fmtDate(r.call_start_time) },
              { k: 'Duration',     v: fmtDur(r.call_duration) },
              { k: 'Attempt #',    v: `Attempt ${r.contact_attempts}` },
              { k: 'Status',       v: r.contact_status ?? '—' },
              { k: 'Zone',         v: r.zone ?? '—' },
              { k: 'District',     v: r.district ?? '—' },
              { k: 'Scheme',       v: r.scheme_name ?? '—' },
              { k: 'Consented',    v: r.consented === true ? 'Yes ✓' : r.consented === false ? 'No ✗' : '—' },
              ...(r.call_ended_early ? [{ k: 'Ended Early', v: r.early_end_reason ?? 'Yes' }] : []),
              ...(r.callback_requested ? [{ k: 'Callback', v: 'Requested ✓' }] : []),
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-700 text-right max-w-52 truncate">{v}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Q&A */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Survey Answers</p>
          <div className="space-y-2">
            {[
              { q: 'Q1', label: 'Water came every day?',   val: r.q1_answer, evidence: r.q1_evidence, extra: r.days_without_water ? `Days without water: ${r.days_without_water}` : null },
              { q: 'Q2', label: 'Water quality clean?',    val: r.q2_answer, evidence: r.q2_evidence, extra: r.quality_issue_details },
              { q: 'Q3', label: 'Sufficient quantity?',    val: r.q3_answer, evidence: r.q3_evidence, extra: r.quantity_issue_details },
              { q: 'Q4', label: 'Consistent timing?',      val: r.q4_answer, evidence: r.q4_evidence, extra: null },
              { q: 'Q5', label: 'Overall satisfied?',      val: r.q5_answer, evidence: r.q5_evidence, extra: r.satisfaction_reason ?? r.dissatisfaction_reason },
            ].map(({ q, label, val, evidence, extra }) => {
              const isYes = val === 'yes'
              const isNo  = val === 'no'
              const isNA  = !val || val === 'not_asked'
              const bg    = isNA ? 'bg-gray-50' : isYes ? 'bg-emerald-50' : 'bg-red-50'
              const textColor = isNA ? 'text-gray-300' : isYes ? 'text-emerald-600' : 'text-red-600'
              const displayVal = isNA ? (val === 'not_asked' ? 'N/A' : '—') : val === 'unknown' ? '?' : val!.charAt(0).toUpperCase() + val!.slice(1)
              return (
                <div key={q} className={`rounded-lg px-3 py-2 ${bg}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600"><span className="font-bold text-gray-700 font-mono mr-1.5">{q}</span>{label}</span>
                    <span className={`font-bold capitalize ${textColor}`}>{displayVal}</span>
                  </div>
                  {evidence && evidence !== 'NA' && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{evidence}"</p>
                  )}
                  {extra && extra !== 'NA' && extra !== 'unknown' && (
                    <p className="text-xs text-gray-500 mt-1">{extra}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Supply scope */}
        {r.supply_issue_scope && r.supply_issue_scope !== 'NA' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
            <p className="text-amber-700 font-medium">Supply issue scope: <span className="capitalize">{r.supply_issue_scope.replace('_', ' ')}</span></p>
          </div>
        )}

        {/* Additional feedback */}
        {r.additional_feedback && !['NA', 'none', 'unknown'].includes(r.additional_feedback.toLowerCase()) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Feedback</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-gray-600 leading-relaxed italic">
              "{r.additional_feedback}"
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Audio player ─────────────────────────────────────────────────────────────
function AudioPlayer({ url, duration }: { url: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [errored, setErrored] = useState(false)

  function toggle() {
    if (!audioRef.current || errored) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().catch(() => setErrored(true)); setPlaying(true) }
  }

  function onTimeUpdate() {
    if (!audioRef.current) return
    const d = audioRef.current.duration || duration || 1
    setCurrent(Math.floor(audioRef.current.currentTime))
    setProgress((audioRef.current.currentTime / d) * 100)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * (audioRef.current.duration || 0)
  }

  if (errored) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 text-center">
        Recording unavailable — the Raya API may require authentication to stream.
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-3">
      <audio ref={audioRef} src={url} onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)} onError={() => setErrored(true)} />
      <div className="flex items-center gap-3">
        <button onClick={toggle}
          className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center flex-shrink-0 transition-colors">
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden cursor-pointer" onClick={seek}>
            <div className="h-full bg-blue-400 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{fmtDur(current)}</span>
            <span>{fmtDur(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sortable header ──────────────────────────────────────────────────────────
function SortTh({ col, label, sortCol, sortDir, onSort, className = '' }: {
  col: SortCol; label: string; sortCol: SortCol; sortDir: SortDir
  onSort: (c: SortCol) => void; className?: string
}) {
  const active = sortCol === col
  return (
    <th
      className={`th cursor-pointer select-none hover:bg-gray-50 transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-300'}`}>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ r }: { r: CallRecord }) {
  const s = r.contact_status
  if (s === 'Completed')  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Completed</span>
  if (s === 'Pending')    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Pending</span>
  if (s === 'Unanswered') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Unanswered</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">{s ?? '—'}</span>
}

function SatBadge({ sat }: { sat: string | null }) {
  if (!sat || sat === 'No Q5') return <span className="text-gray-300 text-xs">—</span>
  const map: Record<string, string> = {
    Satisfied:    'bg-emerald-100 text-emerald-700',
    Neutral:      'bg-slate-100 text-slate-600',
    Dissatisfied: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[sat] ?? 'bg-gray-100 text-gray-500'}`}>{sat}</span>
}

function Q1Badge({ ans }: { ans: string | null }) {
  if (!ans || ans === 'not_asked') return <span className="text-gray-300 text-xs">—</span>
  if (ans === 'yes') return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Y</span>
  if (ans === 'no')  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">N</span>
  return <span className="text-gray-400 text-xs">?</span>
}

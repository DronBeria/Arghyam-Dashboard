import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

const ZONES = ['All Zones', 'North Assam', 'Upper Assam', 'Lower Assam', 'BTAD', 'Barak Valley', 'KAAC']
const STATUSES = ['All', 'Completed', 'Unanswered', 'Pending']
const SATISFACTIONS = ['All', 'Satisfied', 'Neutral', 'Dissatisfied', 'No Q5']

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
  const [records, setRecords]   = useState<CallRecord[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [zone, setZone]         = useState('All Zones')
  const [status, setStatus]     = useState('Completed')
  const [sat, setSat]           = useState('All')
  const [page, setPage]         = useState(0)
  const [selected, setSelected] = useState<CallRecord | null>(null)
  const PAGE_SIZE = 50

  useEffect(() => { fetch() }, [zone, status, sat, page])

  async function fetch() {
    setLoading(true)
    let q = supabase
      .from('call_records')
      .select('*', { count: 'exact' })
      .order('call_start_time', { ascending: false, nullsFirst: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (zone !== 'All Zones') q = q.eq('zone', zone)
    if (status !== 'All')     q = q.eq('contact_status', status)
    if (sat === 'No Q5')      q = q.is('q5_answer', null)
    else if (sat !== 'All')   q = q.eq('satisfaction', sat)

    const { data, count, error } = await q
    if (!error && data) { setRecords(data); setTotal(count ?? 0) }
    setLoading(false)
  }

  const filtered = search.trim()
    ? records.filter(r =>
        String(r.call_id).includes(search) ||
        String(r.contact_id).includes(search) ||
        r.call_summary?.toLowerCase().includes(search.toLowerCase()) ||
        r.scheme_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.district?.toLowerCase().includes(search.toLowerCase())
      )
    : records

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total in DB',    val: total.toLocaleString(),       color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'With Recording', val: '8,782',                      color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
          { label: 'Survey Usable',  val: '9,224',                      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Zone',           val: zone === 'All Zones' ? 'All' : zone, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3 ${c.bg}`}>
            <div className={`text-lg font-bold ${c.color}`}>{c.val}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1 font-medium">Search</label>
            <input
              type="text"
              placeholder="Call ID, contact ID, summary keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Zone</label>
            <select value={zone} onChange={e => { setZone(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Q5 Satisfaction</label>
            <select value={sat} onChange={e => { setSat(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              {SATISFACTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => { setZone('All Zones'); setStatus('Completed'); setSat('All'); setSearch(''); setPage(0) }}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Reset
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${selected ? 'hidden lg:flex lg:flex-col lg:flex-1' : 'flex-1'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Call Records
              {!loading && <span className="ml-2 text-xs font-normal text-gray-400">{total.toLocaleString()} total · showing {filtered.length}</span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Page {page + 1}</span>
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">←</button>
              <button onClick={() => { setPage(page + 1); setSelected(null) }} disabled={records.length < PAGE_SIZE}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <span className="animate-spin">⟳</span> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Call ID</th>
                    <th className="th hidden sm:table-cell">Date</th>
                    <th className="th hidden lg:table-cell">Summary (preview)</th>
                    <th className="th text-center">Status</th>
                    <th className="th text-center">Q5</th>
                    <th className="th text-right hidden md:table-cell">Duration</th>
                    <th className="th text-center">🎙️</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${selected?.id === r.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                      <td className="td">
                        <div className="font-mono text-xs text-blue-600 font-semibold">{r.call_id ?? r.contact_id}</div>
                        {r.zone && <div className="text-xs text-gray-400">{r.zone}</div>}
                      </td>
                      <td className="td text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">{fmtDate(r.call_start_time)}</td>
                      <td className="td text-xs text-gray-500 hidden lg:table-cell max-w-xs">
                        <p className="truncate">{r.call_summary ?? '—'}</p>
                      </td>
                      <td className="td text-center"><StatusBadge r={r} /></td>
                      <td className="td text-center"><SatBadge sat={r.satisfaction} /></td>
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
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-56 gap-3 text-center px-6">
      <span className="text-4xl">📭</span>
      <p className="text-sm font-medium text-gray-600">No records loaded yet</p>
      <ol className="text-xs text-gray-400 space-y-1 text-left list-decimal list-inside">
        <li>Paste <code className="bg-gray-100 px-1 rounded">supabase/call_records_schema.sql</code> into Supabase SQL Editor</li>
        <li>Run <code className="bg-gray-100 px-1 rounded">python scripts/import_call_records.py</code></li>
        <li>Refresh this page</li>
      </ol>
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
          <div className="flex gap-1.5 mt-1">
            <StatusBadge r={r} />
            <SatBadge sat={r.satisfaction} />
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
              { k: 'Consented',    v: r.consented === true ? 'Yes ✓' : r.consented === false ? 'No ✗' : '—' },
              ...(r.call_ended_early ? [{ k: 'Ended Early', v: r.early_end_reason ?? 'Yes' }] : []),
              ...(r.callback_requested ? [{ k: 'Callback', v: 'Requested' }] : []),
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
              { q: 'Q1', label: 'Water came every day?',       val: r.q1_answer, evidence: r.q1_evidence, extra: r.days_without_water ? `Days without: ${r.days_without_water}` : null },
              { q: 'Q2', label: 'Water quality clean?',        val: r.q2_answer, evidence: r.q2_evidence, extra: r.quality_issue_details },
              { q: 'Q3', label: 'Sufficient quantity?',        val: r.q3_answer, evidence: r.q3_evidence, extra: r.quantity_issue_details },
              { q: 'Q4', label: 'Consistent timing?',          val: r.q4_answer, evidence: r.q4_evidence, extra: r.q4_answer === 'no' ? r.dissatisfaction_reason : null },
              { q: 'Q5', label: 'Overall satisfied?',          val: r.q5_answer, evidence: r.q5_evidence, extra: r.satisfaction_reason ?? r.dissatisfaction_reason },
            ].map(({ q, label, val, evidence, extra }) => {
              const isYes = val === 'yes'
              const isNo  = val === 'no'
              const isNA  = !val || val === 'not_asked'
              const bg    = isNA ? 'bg-gray-50' : isYes ? 'bg-emerald-50' : 'bg-red-50'
              const textColor = isNA ? 'text-gray-300' : isYes ? 'text-emerald-600' : 'text-red-600'
              const displayVal = isNA ? (val === 'not_asked' ? 'N/A' : '—') : val === 'unknown' ? '?' : val?.charAt(0).toUpperCase() + val!.slice(1)
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

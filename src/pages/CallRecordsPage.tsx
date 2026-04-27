import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CallRecord {
  id: number
  call_id: string
  phone: string
  scheme_id: string
  scheme_name: string
  district: string
  zone: string
  attempt_number: number
  call_date: string
  call_duration: number
  consented: boolean
  q1_answer: boolean | null
  q2_answer: boolean | null
  q3_answer: boolean | null
  q4_answer: boolean | null
  q5_answer: string | null
  questions_answered: number | null
  is_usable: boolean
  is_completed: boolean
  satisfaction: string | null
  recording_url: string | null
  recording_duration: number | null
}

const ZONES = ['All Zones', 'North Assam', 'Upper Assam', 'Lower Assam', 'BTAD', 'Barak Valley', 'KAAC']
const STATUSES = ['All', 'Completed', 'Usable (partial)', 'No consent']
const SATISFACTIONS = ['All', 'Satisfied', 'Neutral', 'Dissatisfied', 'No Q5']

function fmt(sec: number | null) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function CallRecordsPage() {
  const [records, setRecords]       = useState<CallRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [zone, setZone]             = useState('All Zones')
  const [status, setStatus]         = useState('All')
  const [satisfaction, setSatisfaction] = useState('All')
  const [selected, setSelected]     = useState<CallRecord | null>(null)
  const [page, setPage]             = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    fetchRecords()
  }, [zone, status, satisfaction, page])

  async function fetchRecords() {
    setLoading(true)
    let q = supabase
      .from('call_records')
      .select('*')
      .order('call_date', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (zone !== 'All Zones')          q = q.eq('zone', zone)
    if (status === 'Completed')        q = q.eq('is_completed', true)
    if (status === 'Usable (partial)') q = q.eq('is_usable', true).eq('is_completed', false)
    if (status === 'No consent')       q = q.eq('consented', false)
    if (satisfaction !== 'All' && satisfaction !== 'No Q5') q = q.eq('satisfaction', satisfaction)
    if (satisfaction === 'No Q5')      q = q.is('q5_answer', null)

    const { data, error } = await q
    if (!error && data) setRecords(data)
    setLoading(false)
  }

  const filtered = search.trim()
    ? records.filter(r =>
        r.call_id.toLowerCase().includes(search.toLowerCase()) ||
        r.scheme_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.district?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search)
      )
    : records

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1 font-medium">Search</label>
            <input
              type="text"
              placeholder="Call ID, scheme, district, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Zone</label>
            <select value={zone} onChange={e => { setZone(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Call Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Satisfaction</label>
            <select value={satisfaction} onChange={e => { setSatisfaction(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              {SATISFACTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => { setZone('All Zones'); setStatus('All'); setSatisfaction('All'); setSearch(''); setPage(0) }}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Reset
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${selected ? 'hidden lg:block lg:flex-1' : 'flex-1'}`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Call Records
              {!loading && <span className="ml-2 text-xs text-gray-400 font-normal">{filtered.length} shown · page {page + 1}</span>}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(page + 1)} disabled={records.length < PAGE_SIZE}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading records…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <span className="text-3xl">📭</span>
              <p>No records found.</p>
              <p className="text-xs">Run <code className="bg-gray-100 px-1 rounded">supabase/call_records_schema.sql</code> in Supabase to load data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Call ID</th>
                    <th className="th hidden sm:table-cell">Date</th>
                    <th className="th hidden md:table-cell">Scheme</th>
                    <th className="th hidden sm:table-cell">District</th>
                    <th className="th text-center">Status</th>
                    <th className="th text-center">Q5</th>
                    <th className="th text-right hidden md:table-cell">Duration</th>
                    <th className="th text-center">Rec.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="td font-mono text-xs text-blue-600 font-semibold">{r.call_id}</td>
                      <td className="td text-xs text-gray-500 hidden sm:table-cell">{r.call_date}</td>
                      <td className="td text-xs text-gray-600 hidden md:table-cell max-w-xs truncate">{r.scheme_name}</td>
                      <td className="td text-xs text-gray-500 hidden sm:table-cell">{r.district}</td>
                      <td className="td text-center">
                        <CallStatusBadge record={r} />
                      </td>
                      <td className="td text-center">
                        <SatBadge sat={r.satisfaction} />
                      </td>
                      <td className="td-mono text-right text-xs text-gray-400 hidden md:table-cell">{fmt(r.call_duration)}</td>
                      <td className="td text-center">
                        {r.recording_url
                          ? <span className="text-emerald-500 text-xs">▶</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
          <div className="w-full lg:w-96 flex-shrink-0">
            <CallDetail record={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Call detail panel ────────────────────────────────────────────────────────
function CallDetail({ record: r, onClose }: { record: CallRecord; onClose: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <p className="text-xs text-gray-400">Call Detail</p>
          <p className="text-sm font-bold text-gray-800 font-mono">{r.call_id}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500">×</button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Audio player */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recording</p>
          {r.recording_url ? (
            <AudioPlayer url={r.recording_url} duration={r.recording_duration} />
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎙️</p>
              <p className="text-xs text-gray-400 font-medium">No recording uploaded</p>
              <p className="text-xs text-gray-400 mt-1">Upload to Supabase Storage and add URL to <code>recording_url</code></p>
            </div>
          )}
        </div>

        {/* Basic info */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Call Info</p>
          <dl className="space-y-1.5">
            {[
              { k: 'Date',        v: r.call_date },
              { k: 'Phone',       v: r.phone || '—' },
              { k: 'Duration',    v: fmt(r.call_duration) },
              { k: 'Attempt #',   v: `Attempt ${r.attempt_number}` },
              { k: 'Consented',   v: r.consented ? 'Yes ✓' : 'No ✗' },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-700">{v}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Scheme info */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scheme</p>
          <dl className="space-y-1.5">
            {[
              { k: 'Scheme',   v: r.scheme_name },
              { k: 'ID',       v: r.scheme_id },
              { k: 'District', v: r.district },
              { k: 'Zone',     v: r.zone },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-700 text-right max-w-48 truncate">{v || '—'}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Q&A */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Survey Responses</p>
          <div className="space-y-2">
            {[
              { q: 'Q1', label: 'Water came every day?',         val: r.q1_answer },
              { q: 'Q2', label: 'Water is clean enough?',        val: r.q2_answer },
              { q: 'Q3', label: 'Enough water supplied?',        val: r.q3_answer },
              { q: 'Q4', label: 'Arrives at consistent time?',   val: r.q4_answer },
            ].map(({ q, label, val }) => (
              <div key={q} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                val === null ? 'bg-gray-50' :
                val ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <span className="text-gray-500">
                  <span className="font-bold text-gray-700 font-mono mr-2">{q}</span>
                  {label}
                </span>
                <span className={`font-bold ${
                  val === null ? 'text-gray-300' :
                  val ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {val === null ? 'N/A' : val ? 'Yes' : 'No'}
                </span>
              </div>
            ))}

            {/* Q5 three-way */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
              !r.q5_answer ? 'bg-gray-50' :
              r.q5_answer === 'satisfied' ? 'bg-emerald-50' :
              r.q5_answer === 'dissatisfied' ? 'bg-red-50' : 'bg-amber-50'
            }`}>
              <span className="text-gray-500">
                <span className="font-bold text-gray-700 font-mono mr-2">Q5</span>
                Overall satisfied with supply?
              </span>
              <span className={`font-bold capitalize ${
                !r.q5_answer ? 'text-gray-300' :
                r.q5_answer === 'satisfied' ? 'text-emerald-600' :
                r.q5_answer === 'dissatisfied' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {r.q5_answer || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Overall outcome */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">Overall outcome</span>
          <div className="flex items-center gap-2">
            <CallStatusBadge record={r} />
            <SatBadge sat={r.satisfaction} />
          </div>
        </div>
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

  function toggle() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
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

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <audio ref={audioRef} src={url} onTimeUpdate={onTimeUpdate} onEnded={() => setPlaying(false)} />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1">
          <div
            className="h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
            onClick={seek}
          >
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function CallStatusBadge({ record: r }: { record: CallRecord }) {
  if (r.is_completed) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Completed</span>
  if (r.is_usable)    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partial</span>
  if (r.consented)    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Consented</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No consent</span>
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

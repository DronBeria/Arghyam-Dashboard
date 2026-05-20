import { useState } from 'react'
import {
  downloadStatePDF, downloadZonePDF,
  downloadDistrictCSV, downloadZoneCSV,
  downloadSurveyCSV, downloadCallAttemptsCSV,
  downloadFilteredCallsCSV,
  type CallExportFilters,
} from '../utils/reports'
import { ZONE_SCORES } from '../data/csatData'

interface Props {
  onClose: () => void
  userEmail?: string
}

const ZONES_LIST = ZONE_SCORES
  .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .map(z => z.zone)

const ZONE_OPTIONS = ['All Zones', 'Critical Zones', ...ZONES_LIST]
const SAT_OPTIONS  = ['All', 'Satisfied', 'Neutral', 'Dissatisfied']
const Q1_OPTIONS   = ['All', 'Yes', 'No']

const PDF_SECTIONS = [
  { id: 'overview',  label: 'Executive Overview & Score' },
  { id: 'service',   label: 'Service Area Breakdown (Q1–Q5)' },
  { id: 'zones',     label: 'Zone Rankings Table' },
  { id: 'districts', label: 'All 31 Districts Table' },
  { id: 'schemes',   label: 'Scheme Coverage + Recommendations' },
]

type TaskId = 'state_pdf' | 'zone_pdf' | 'districts_csv' | 'zones_csv' | 'survey_csv' | 'attempts_csv' | 'calls_csv'

export function DownloadModal({ onClose, userEmail }: Props) {
  const [generating, setGenerating] = useState<TaskId | null>(null)
  const [done, setDone]             = useState<TaskId | null>(null)
  const [errorMsg, setErrorMsg]     = useState('')

  // State PDF section toggles
  const [pdfSections, setPdfSections] = useState<Record<string, boolean>>(
    Object.fromEntries(PDF_SECTIONS.map(s => [s.id, true]))
  )
  const [selectedZone, setSelectedZone] = useState(ZONES_LIST[0])

  // Call records export filters
  const [callZone, setCallZone]           = useState('All Zones')
  const [callSat, setCallSat]             = useState('All')
  const [callQ1, setCallQ1]               = useState('All')
  const [callRecording, setCallRecording] = useState<boolean | null>(null)
  const [callCallback, setCallCallback]   = useState(false)
  const [callMinDur, setCallMinDur]       = useState<number | null>(null)
  const [callDateFrom, setCallDateFrom]   = useState('')
  const [callDateTo, setCallDateTo]       = useState('')
  const [callRowCount, setCallRowCount]   = useState<number | null>(null)
  const [showCallOpts, setShowCallOpts]   = useState(false)

  function markDone(id: TaskId) {
    setDone(id); setTimeout(() => setDone(null), 2500)
  }

  async function run(id: TaskId) {
    setGenerating(id); setErrorMsg('')
    try {
      if (id === 'state_pdf')     await downloadStatePDF(userEmail)
      else if (id === 'zone_pdf') await downloadZonePDF(selectedZone)
      else if (id === 'districts_csv') downloadDistrictCSV()
      else if (id === 'zones_csv')     downloadZoneCSV()
      else if (id === 'survey_csv')    downloadSurveyCSV()
      else if (id === 'attempts_csv')  downloadCallAttemptsCSV()
      else if (id === 'calls_csv') {
        const filters: CallExportFilters = {
          zone: callZone, sat: callSat, q1: callQ1,
          hasRecording: callRecording, callbackOnly: callCallback,
          minDuration: callMinDur,
          dateFrom: callDateFrom || undefined,
          dateTo: callDateTo || undefined,
        }
        const parts: string[] = []
        if (callZone !== 'All Zones') parts.push(callZone.replace(/\s/g, ''))
        if (callSat !== 'All') parts.push(callSat)
        if (callQ1 !== 'All') parts.push(`Q1_${callQ1}`)
        const count = await downloadFilteredCallsCSV(filters, parts.join('_') || 'All')
        setCallRowCount(count)
        if (count === 0) { setErrorMsg('No records matched these filters — try broader criteria.'); return }
      }
      markDone(id)
    } catch (e) {
      setErrorMsg('Download failed. Please try again.')
      console.error(e)
    } finally {
      setGenerating(null)
    }
  }

  const allOn = PDF_SECTIONS.every(s => pdfSections[s.id])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto z-50
        bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-white font-bold text-sm">Download Reports & Data</p>
            <p className="text-slate-400 text-xs mt-0.5">PDFs, CSVs and filtered exports · Arghyam CSAT AI Phase 1</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            ×
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-b border-red-100 px-5 py-2 text-red-600 text-xs flex items-center gap-2">
            <span>⚠</span> {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* PDF Reports */}
          <SectionHeading icon="📄" title="PDF Reports" desc="Formatted reports ready for sharing or printing" />

          {/* State PDF with section selector */}
          <div className="border border-gray-200 rounded-xl p-3.5 hover:border-gray-300 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🇮🇳</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">Full State Summary</p>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">PDF</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">5-page A4: Score overview, service areas, zones, all 31 districts, scheme coverage & recommendations</p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500 font-medium">Sections to include:</p>
                    <button onClick={() => setPdfSections(Object.fromEntries(PDF_SECTIONS.map(s => [s.id, !allOn])))}
                      className="text-xs text-blue-600 hover:underline">{allOn ? 'Deselect all' : 'Select all'}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {PDF_SECTIONS.map(s => (
                      <label key={s.id} className="flex items-center gap-1.5 cursor-pointer group">
                        <input type="checkbox" checked={pdfSections[s.id]}
                          onChange={e => setPdfSections(prev => ({ ...prev, [s.id]: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                        <span className="text-xs text-gray-600 group-hover:text-gray-800">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Btn id="state_pdf" generating={generating} done={done} onRun={run} />
            </div>
          </div>

          {/* Zone PDF */}
          <div className="border border-gray-200 rounded-xl p-3.5 hover:border-gray-300 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🗺️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">Zone Report</p>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">PDF</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Single-zone summary with all district Score breakdowns</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Zone:</span>
                  <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300">
                    {ZONES_LIST.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <Btn id="zone_pdf" generating={generating} done={done} onRun={run} />
            </div>
          </div>

          {/* Data Exports */}
          <SectionHeading icon="📊" title="Data Exports" desc="CSV files ready for Excel or Google Sheets" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              ['districts_csv', '📍', 'District Data',   'All 31 districts — Score, quality, quantity, schemes, usable calls'],
              ['zones_csv',     '🌐', 'Zone Data',        '6 zones + state average with Score components and status'],
              ['survey_csv',    '📋', 'Survey KPIs',      'Q1–Q5 yes/no counts, percentages, weights and status'],
              ['attempts_csv',  '📞', 'Call Attempts',    'Per-attempt: consent rates, Q5 respondents, satisfaction'],
            ] as [TaskId, string, string, string][]).map(([id, icon, label, desc]) => (
              <div key={id} className="border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition-all flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-800">{label}</p>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">CSV</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
                  <div className="mt-2">
                    <Btn id={id} generating={generating} done={done} onRun={run} small />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Call Records Export */}
          <SectionHeading icon="🎙️" title="Call Records Export" desc="Query live database and download filtered results as CSV (max 10,000 rows)" />

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-base">📥</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Export Filtered Call Records</p>
                  {done === 'calls_csv' && callRowCount !== null && (
                    <p className="text-xs text-emerald-600 font-medium">{callRowCount.toLocaleString()} rows exported</p>
                  )}
                  {done !== 'calls_csv' && (
                    <p className="text-xs text-gray-400">Filters applied server-side before download</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCallOpts(!showCallOpts)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    showCallOpts ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  Filters {showCallOpts ? '▲' : '▼'}
                </button>
                <Btn id="calls_csv" generating={generating} done={done} onRun={run} />
              </div>
            </div>

            {showCallOpts && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Zone</label>
                    <select value={callZone} onChange={e => setCallZone(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                      {ZONE_OPTIONS.map(z => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Q5 Satisfaction</label>
                    <select value={callSat} onChange={e => setCallSat(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                      {SAT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Q1 Daily Water</label>
                    <select value={callQ1} onChange={e => setCallQ1(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                      {Q1_OPTIONS.map(q => <option key={q}>{q}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Recording</label>
                    <div className="flex gap-1">
                      {([['Any', null], ['Has', true], ['None', false]] as [string, boolean | null][]).map(([lbl, val]) => (
                        <button key={lbl} onClick={() => setCallRecording(val)}
                          className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${callRecording === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Min Duration</label>
                    <div className="flex gap-1">
                      {([['Any', null], ['>1m', 60], ['>3m', 180], ['>5m', 300]] as [string, number | null][]).map(([lbl, val]) => (
                        <button key={lbl} onClick={() => setCallMinDur(val)}
                          className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${callMinDur === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={callCallback} onChange={e => setCallCallback(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                      <span className="text-xs text-gray-600">Callback only</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium flex-shrink-0">Date range:</span>
                  <input type="date" value={callDateFrom} onChange={e => setCallDateFrom(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  <span className="text-xs text-gray-400">to</span>
                  <input type="date" value={callDateTo} onChange={e => setCallDateTo(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                  {(callDateFrom || callDateTo) && (
                    <button onClick={() => { setCallDateFrom(''); setCallDateTo('') }}
                      className="text-xs text-gray-400 hover:text-gray-600">clear</button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            PDFs are A4 portrait. CSVs are UTF-8 encoded. Call records export queries live data (max 10,000 rows).
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeading({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

function Btn({ id, generating, done, onRun, small }: {
  id: TaskId
  generating: TaskId | null
  done: TaskId | null
  onRun: (id: TaskId) => void
  small?: boolean
}) {
  const isLoading = generating === id
  const isDone    = done === id
  const cls = small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs flex-shrink-0'
  return (
    <button onClick={() => onRun(id)} disabled={!!generating}
      className={`${cls} rounded-lg font-semibold transition-all whitespace-nowrap ${
        isDone    ? 'bg-emerald-100 text-emerald-700' :
        isLoading ? 'bg-blue-100 text-blue-600 cursor-wait' :
                    'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
      }`}>
      {isDone ? '✓ Saved' : isLoading
        ? <span className="flex items-center gap-1"><span className="animate-spin inline-block">⟳</span> Gen…</span>
        : '↓ Download'}
    </button>
  )
}

import { useState } from 'react'
import {
  downloadStatePDF, downloadZonePDF,
  downloadDistrictCSV, downloadZoneCSV,
  downloadSurveyCSV, downloadCallAttemptsCSV,
} from '../utils/reports'
import { ZONE_SCORES } from '../data/csatData'

interface Props {
  onClose: () => void
  userEmail?: string
}

const ZONES_LIST = ZONE_SCORES
  .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
  .map(z => z.zone)

type ReportId = 'state_pdf' | 'zone_pdf' | 'districts_csv' | 'zones_csv' | 'survey_csv' | 'attempts_csv'

const REPORTS = [
  {
    id: 'state_pdf' as ReportId,
    icon: '📄',
    label: 'Full State Summary',
    desc: '5-page PDF: BSI, service areas, zones, 31 districts, scheme coverage, recommendations',
    format: 'PDF',
    badge: 'bg-blue-100 text-blue-700',
    requiresZone: false,
  },
  {
    id: 'zone_pdf' as ReportId,
    icon: '🗺️',
    label: 'Zone Report',
    desc: 'Single-zone PDF with BSI summary and all district breakdowns for the selected zone',
    format: 'PDF',
    badge: 'bg-blue-100 text-blue-700',
    requiresZone: true,
  },
  {
    id: 'districts_csv' as ReportId,
    icon: '📊',
    label: 'District Data',
    desc: 'All 31 districts with BSI, quality, quantity, scheme count, usable calls',
    format: 'CSV',
    badge: 'bg-emerald-100 text-emerald-700',
    requiresZone: false,
  },
  {
    id: 'zones_csv' as ReportId,
    icon: '📊',
    label: 'Zone Data',
    desc: 'All 6 zones + state average with BSI components and status',
    format: 'CSV',
    badge: 'bg-emerald-100 text-emerald-700',
    requiresZone: false,
  },
  {
    id: 'survey_csv' as ReportId,
    icon: '📋',
    label: 'Survey KPI Data',
    desc: 'Q1–Q5 yes/no counts, percentages, weights and status',
    format: 'CSV',
    badge: 'bg-emerald-100 text-emerald-700',
    requiresZone: false,
  },
  {
    id: 'attempts_csv' as ReportId,
    icon: '📞',
    label: 'Call Attempts Data',
    desc: 'Per-attempt breakdown: consent rates, Q5 respondents, satisfaction by attempt',
    format: 'CSV',
    badge: 'bg-emerald-100 text-emerald-700',
    requiresZone: false,
  },
]

export function DownloadModal({ onClose, userEmail }: Props) {
  const [selectedZone, setSelectedZone] = useState(ZONES_LIST[0])
  const [generating, setGenerating] = useState<ReportId | null>(null)
  const [done, setDone] = useState<ReportId | null>(null)

  async function generate(id: ReportId) {
    setGenerating(id)
    try {
      if (id === 'state_pdf')     await downloadStatePDF(userEmail)
      if (id === 'zone_pdf')      await downloadZonePDF(selectedZone)
      if (id === 'districts_csv') downloadDistrictCSV()
      if (id === 'zones_csv')     downloadZoneCSV()
      if (id === 'survey_csv')    downloadSurveyCSV()
      if (id === 'attempts_csv')  downloadCallAttemptsCSV()
      setDone(id)
      setTimeout(() => setDone(null), 2500)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-xl mx-auto z-50
        bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-white font-bold text-base">Download Reports</p>
            <p className="text-slate-400 text-xs mt-0.5">PDF reports and CSV data exports · Araghyam CSAT AI Phase 1</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors flex-shrink-0">×</button>
        </div>

        {/* Zone selector (for zone PDF) */}
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-semibold text-blue-700">Zone for zone report:</span>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {ZONES_LIST.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>

        {/* Report list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {REPORTS.map(r => {
            const isLoading = generating === r.id
            const isDone    = done === r.id
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group">
                <span className="text-2xl flex-shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${r.badge}`}>{r.format}</span>
                    {r.requiresZone && (
                      <span className="text-xs text-blue-500">· {selectedZone}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
                <button
                  onClick={() => generate(r.id)}
                  disabled={!!generating}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isLoading
                      ? 'bg-blue-100 text-blue-600 cursor-wait'
                      : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  {isDone ? '✓ Saved' : isLoading ? (
                    <span className="flex items-center gap-1"><span className="animate-spin">⟳</span> Gen…</span>
                  ) : '↓ Download'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            PDFs include cover page, executive summary, tables, and recommendations.
            CSVs are UTF-8 encoded and ready for Excel / Google Sheets.
          </p>
        </div>
      </div>
    </>
  )
}

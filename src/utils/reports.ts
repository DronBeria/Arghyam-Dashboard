// Report generation utilities — PDF (jsPDF + autotable) and CSV
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — jspdf-autotable types conflict; suppress for the whole file
import jsPDF from 'jspdf'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import autoTable from 'jspdf-autotable'

// Suppress CellHook type mismatches from jspdf-autotable
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  KPI_HEADLINE, KPI_QUESTIONS, SCHEME_COVERAGE,
  ZONE_SCORES, DISTRICT_SCORES, CALL_ATTEMPTS, Q5_SPLIT,
} from '../data/csatData'

const GENERATED = new Date().toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric',
})

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  blue:    [30,  64,  175] as [number,number,number],
  blueLight: [219,234,254] as [number,number,number],
  dark:    [15,  23,  42]  as [number,number,number],
  gray:    [100, 116, 139] as [number,number,number],
  grayBg:  [248, 250, 252] as [number,number,number],
  white:   [255, 255, 255] as [number,number,number],
  emerald: [5,   150, 105] as [number,number,number],
  amber:   [217, 119, 6]   as [number,number,number],
  red:     [220, 38,  38]  as [number,number,number],
  border:  [226, 232, 240] as [number,number,number],
}

function statusColor(status: string | null): [number,number,number] {
  if (status === 'Good')     return C.emerald
  if (status === 'Critical') return C.red
  if (status === 'No Data')  return C.gray
  return C.amber
}

function bsi5(v: number | null) { return v !== null ? (v * 5).toFixed(3) : '—' }

// ─── Full State Summary PDF ───────────────────────────────────────────────────
export async function downloadStatePDF(userEmail?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16 // page width, margin
  let y = 0

  // ── Cover page ──────────────────────────────────────────────────────────────
  doc.setFillColor(...C.dark)
  doc.rect(0, 0, W, 297, 'F')

  // Logo block
  doc.setFillColor(...C.blue)
  doc.roundedRect(M, 32, 14, 14, 2, 2, 'F')
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('A', M + 7, 41, { align: 'center' })

  // Title
  doc.setFontSize(26); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Arghyam', M + 18, 41)

  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('CSAT AI · Assam Jal Jeevan Mission', M + 18, 47)

  // Divider
  doc.setDrawColor(...C.blue)
  doc.setLineWidth(0.5)
  doc.line(M, 58, W - M, 58)

  // Main title
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Citizen Satisfaction Survey', M, 76)
  doc.text('State-Level Summary Report', M, 86)

  doc.setFontSize(11); doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Phase 1 · Assam · April 2026', M, 96)

  // BSI hero box
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(M, 110, W - M*2, 52, 3, 3, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.setTextColor(148, 163, 184)
  doc.text('STATE CITIZEN SATISFACTION SURVEY SCORE', M + 6, 121)
  doc.setFontSize(32); doc.setFont('helvetica', 'bold')
  doc.setTextColor(251, 191, 36)
  doc.text(`${(KPI_HEADLINE.stateBSI * 5).toFixed(2)} / 5.0`, M + 6, 140)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.setTextColor(251, 146, 60)
  doc.text('⚠  NEEDS ATTENTION  ·  Target ≥ 3.50', M + 6, 150)
  doc.setFontSize(9); doc.setTextColor(100, 116, 139)
  doc.text('Benchmark: Good ≥ 3.50  ·  Needs Attention: 2.00–3.49  ·  Critical < 2.00', M + 6, 157)

  // Key stats row
  const stats = [
    { label: 'Total Calls', val: '45,863' },
    { label: 'Usable Calls', val: '9,224' },
    { label: 'Reached Q5', val: '4,410' },
    { label: 'Districts Covered', val: '31' },
  ]
  const boxW = (W - M*2) / 4
  stats.forEach((s, i) => {
    const bx = M + i * boxW
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(bx, 170, boxW - 2, 22, 2, 2, 'F')
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
    doc.text(s.val, bx + boxW/2 - 1, 179, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(s.label, bx + boxW/2 - 1, 185, { align: 'center' })
  })

  // Footer
  doc.setFontSize(8); doc.setTextColor(...C.gray)
  doc.text(`Generated: ${GENERATED}${userEmail ? `  ·  ${userEmail}` : ''}`, M, 280)
  doc.text('Confidential — Arghyam · Not for public distribution', W - M, 280, { align: 'right' })

  // ── Page 2: Service Area Breakdown ─────────────────────────────────────────
  doc.addPage()
  y = _pageHeader(doc, 'Service Area Breakdown', '% of households satisfied per question', W, M)
  y += 4

  const qaRows = [
    ['Gets Water Every Day',         '30.95%', `${(2855).toLocaleString()} of ${(9224).toLocaleString()}`, 'Critical'],
    ['Happy with Water Quality',     '72.33%', `${(3293).toLocaleString()} of ${(4553).toLocaleString()}`, 'Good'],
    ['Satisfied with Water Quantity','62.23%', `${(2953).toLocaleString()} of ${(4745).toLocaleString()}`, 'Needs Attention'],
    ['Water Comes at Fixed Time',    '57.2%',  `${(1289).toLocaleString()} of ${(2254).toLocaleString()}`, 'Needs Attention'],
    ['Overall Satisfaction (Q5)',    '51.7%',  `${(2281).toLocaleString()} of ${(4410).toLocaleString()}`, 'Needs Attention'],
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Service Area', '% Yes', 'Responses', 'Status']],
    body: qaRows,
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const s = data.cell.text[0]
        data.cell.styles.textColor = s === 'Good' ? C.emerald : s === 'Critical' ? C.red : C.amber
        data.cell.styles.fontStyle = 'bold'
      }
    },
    alternateRowStyles: { fillColor: C.grayBg },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Q5 3-way split box
  doc.setFillColor(...C.grayBg)
  doc.roundedRect(M, y, W - M*2, 24, 2, 2, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark)
  doc.text('Q5 — Overall Satisfaction 3-Way Split  (base: 4,410 respondents)', M + 4, y + 7)
  const splitData = [
    { label: '😊 Satisfied',    pct: '51.7%', n: '2,281', color: C.emerald },
    { label: '😐 Neutral',      pct: '22.7%', n: '1,002', color: C.gray   },
    { label: '😞 Dissatisfied', pct: '25.6%', n: '1,127', color: C.red    },
  ]
  splitData.forEach((s, i) => {
    const bx = M + 4 + i * 58
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...s.color)
    doc.text(s.pct, bx, y + 17)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(`${s.label} · n=${s.n}`, bx, y + 22)
  })
  y += 30

  // ── Page 3: Zone Rankings ────────────────────────────────────────────────────
  doc.addPage()
  y = _pageHeader(doc, 'Zone Score Rankings', 'Scale 0–5.0 · Target ≥ 3.50 · 0 of 6 zones qualify', W, M)
  y += 4

  const zoneRows = ZONE_SCORES.map(z => [
    z.zone,
    bsi5(z.bsi),
    z.quality !== null ? z.quality.toFixed(3) : '—',
    z.quantity !== null ? z.quantity.toFixed(3) : '—',
    z.daily !== null ? z.daily.toFixed(3) : '—',
    z.usableCalls !== null ? z.usableCalls.toLocaleString() : '—',
    z.status ?? '—',
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Zone', 'Score (/5.0)', 'Quality', 'Quantity', 'Daily', 'Usable Calls', 'Status']],
    body: zoneRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const z = ZONE_SCORES[data.row.index]
        if (data.column.index === 1) {
          data.cell.styles.textColor = statusColor(z?.status ?? null)
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 6) {
          data.cell.styles.textColor = statusColor(z?.status ?? null)
          data.cell.styles.fontStyle = 'bold'
        }
        if (z?.zone === 'Assam (State)') {
          data.cell.styles.fillColor = C.blueLight
        }
      }
    },
    alternateRowStyles: { fillColor: C.grayBg },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Page 4: District Table ──────────────────────────────────────────────────
  doc.addPage()
  y = _pageHeader(doc, 'District Score Rankings', '31 districts · Sorted by Score descending', W, M)
  y += 4

  const distRows = [...DISTRICT_SCORES]
    .sort((a, b) => b.bsi - a.bsi)
    .map((d, i) => [
      String(i + 1),
      d.district,
      d.zone,
      bsi5(d.bsi),
      d.quality.toFixed(3),
      d.quantity.toFixed(3),
      String(d.validSchemes),
      d.usableCalls.toLocaleString(),
      d.status,
    ])

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'District', 'Zone', 'Score (/5.0)', 'Quality', 'Quantity', 'Schemes', 'Calls', 'Status']],
    body: distRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 26 },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const d = [...DISTRICT_SCORES].sort((a, b) => b.bsi - a.bsi)[data.row.index]
        if (data.column.index === 3 || data.column.index === 8) {
          data.cell.styles.textColor = statusColor(d?.status ?? null)
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    alternateRowStyles: { fillColor: C.grayBg },
  })

  // ── Page 5: Scheme Coverage + Recommendations ───────────────────────────────
  doc.addPage()
  y = _pageHeader(doc, 'Scheme Coverage & Recommendations', '2,373 IMIS schemes analysed', W, M)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Category', 'Count', 'Percentage', 'Note']],
    body: [
      ['Total IMIS Schemes', '2,373', '100%', 'All schemes registered under JJM Assam'],
      ['Valid Schemes', '615', '25.9%', 'Sufficient usable calls (≥6) for analysis'],
      ['Flagged Schemes', '1,426', '60.1%', 'Insufficient calls — data quality concern'],
      ['No Data', '332', '14.0%', 'Zero calls connected'],
      ['Regular Supply (of valid)', '108', '17.6%', 'Households report receiving water regularly'],
      ['Irregular Supply (of valid)', '507', '82.4%', 'Households report irregular or no daily supply'],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: C.grayBg },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Recommendations
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark)
  doc.text('Phase 2 Recommendations', M, y); y += 7

  const recs = [
    {
      n: '01', title: 'Address Daily Supply Gap',
      body: 'Q1 (Gets Water Daily) at 30.95% is the single largest contributor to low Citizen Satisfaction Survey Score. Target re-calling households in lowest-Score districts. Prioritise BTAD and Barak Valley zones for operational intervention.',
    },
    {
      n: '02', title: 'Address Irregular Supply Schemes',
      body: '507 of 615 valid schemes (82.4%) report irregular water supply. Field verification needed. 1,426 flagged schemes require re-calling to gather sufficient data. Recommend scheme-level audit in Phase 2.',
    },
    {
      n: '03', title: 'Zone-Targeted Phase 2 Campaigns',
      body: 'BTAD (Score 1.92/5.0) and Barak Valley (Score 1.89/5.0) are Critical. Dedicated re-call campaigns with higher attempt frequency recommended. DHAC excluded from Phase 1 — must be included in Phase 2.',
    },
  ]

  recs.forEach(r => {
    doc.setFillColor(...C.grayBg)
    doc.roundedRect(M, y, W - M*2, 26, 2, 2, 'F')
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 210, 230)
    doc.text(r.n, M + 4, y + 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark)
    doc.text(r.title, M + 16, y + 8)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    const lines: string[] = doc.splitTextToSize(r.body, W - M*2 - 22)
    doc.text(lines.slice(0, 2), M + 16, y + 14)
    y += 30
  })

  // Page numbers
  const totalPages: number = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(`Page ${i} of ${totalPages}`, W - M, 290, { align: 'right' })
    if (i > 1) {
      doc.text('Arghyam · CSAT AI Phase 1 · Assam JJM · Confidential', M, 290)
    }
  }

  doc.save(`Arghyam_CSAT_Phase1_State_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── Zone-level PDF ────────────────────────────────────────────────────────────
export async function downloadZonePDF(zoneName: string) {
  const zoneData = ZONE_SCORES.find(z => z.zone === zoneName)
  const districtData = DISTRICT_SCORES.filter(d => d.zone === zoneName)
  if (!zoneData) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16
  let y = 0

  // Header
  doc.setFillColor(...C.dark)
  doc.rect(0, 0, W, 38, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
  doc.text('Arghyam · CSAT AI Phase 1', M, 14)
  doc.setFontSize(16); doc.text(`${zoneName} — Zone Report`, M, 25)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(`Generated ${GENERATED}  ·  Score Target ≥ 3.50`, M, 32)

  y = 46

  // Zone summary box
  doc.setFillColor(...C.grayBg)
  doc.roundedRect(M, y, W - M*2, 28, 2, 2, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gray)
  doc.text('ZONE CITIZEN SATISFACTION SURVEY SCORE', M + 6, y + 8)
  doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  const bsiVal = bsi5(zoneData.bsi)
  doc.setTextColor(...statusColor(zoneData.status))
  doc.text(`${bsiVal} / 5.0`, M + 6, y + 20)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
  doc.text(`Status: ${zoneData.status ?? '—'}  ·  Usable Calls: ${zoneData.usableCalls?.toLocaleString() ?? '—'}`, M + 60, y + 18)

  y += 36

  // District table
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark)
  doc.text(`Districts in ${zoneName} (${districtData.length})`, M, y); y += 5

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'District', 'Score (/5.0)', 'Quality', 'Quantity', 'Schemes', 'Usable Calls', 'Status']],
    body: districtData.sort((a, b) => b.bsi - a.bsi).map((d, i) => [
      String(i + 1), d.district, bsi5(d.bsi),
      d.quality.toFixed(3), d.quantity.toFixed(3),
      String(d.validSchemes), d.usableCalls.toLocaleString(), d.status,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: C.grayBg },
  })

  doc.save(`Arghyam_${zoneName.replace(/ /g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── CSV utilities ────────────────────────────────────────────────────────────
function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
}

function downloadCSVFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  a.click(); URL.revokeObjectURL(url)
}

export function downloadDistrictCSV() {
  const headers = ['District', 'Zone', 'Score_out_of_5', 'Quality_1.5', 'Quantity_1.5', 'Daily_0.75', 'Valid_Schemes', 'Usable_Calls', 'Status']
  const rows = [...DISTRICT_SCORES]
    .sort((a, b) => b.bsi - a.bsi)
    .map(d => [d.district, d.zone, (d.bsi * 5).toFixed(3), d.quality.toFixed(3), d.quantity.toFixed(3), '—', d.validSchemes, d.usableCalls, d.status])
  downloadCSVFile(toCSV(headers, rows), `Arghyam_Districts_${new Date().toISOString().split('T')[0]}.csv`)
}

export function downloadZoneCSV() {
  const headers = ['Zone', 'Score_out_of_5', 'Quality_1.5', 'Quantity_1.5', 'Daily_0.75', 'Usable_Calls', 'Status']
  const rows = ZONE_SCORES.map(z => [
    z.zone, z.bsi !== null ? (z.bsi * 5).toFixed(3) : '—',
    z.quality?.toFixed(3) ?? '—', z.quantity?.toFixed(3) ?? '—',
    z.daily?.toFixed(3) ?? '—', z.usableCalls ?? '—', z.status,
  ])
  downloadCSVFile(toCSV(headers, rows), `Arghyam_Zones_${new Date().toISOString().split('T')[0]}.csv`)
}

export function downloadSurveyCSV() {
  const headers = ['Question_ID', 'Service_Area', 'Yes_Count', 'No_Count', 'Base', 'Yes_Pct', 'Weight_of_5', 'Status']
  const rows = KPI_QUESTIONS.map(q => [
    q.id, q.label, q.yesCount, q.noCount, q.base, q.yesPct.toFixed(2), q.weight, q.status,
  ])
  downloadCSVFile(toCSV(headers, rows), `Arghyam_Survey_KPIs_${new Date().toISOString().split('T')[0]}.csv`)
}

export function downloadCallAttemptsCSV() {
  const headers = ['Attempt', 'Total_Calls', 'Pct_of_All', 'Consented_N', 'Consent_Pct', 'Q5_Respondents', 'Satisfied_N', 'Satisfied_Pct']
  const rows = CALL_ATTEMPTS.map(a => [
    a.attempt, a.totalCalls, a.pctOfAll, a.consentedN, a.consentPct, a.q5Respondents, a.satisfiedN, a.satisfiedPct,
  ])
  downloadCSVFile(toCSV(headers, rows), `Arghyam_Call_Attempts_${new Date().toISOString().split('T')[0]}.csv`)
}

// ─── Helper: page header ──────────────────────────────────────────────────────
function _pageHeader(doc: jsPDF, title: string, sub: string, W: number, M: number): number {
  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 22, 'F')
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
  doc.text(title, M, 12)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(sub, M, 18)
  doc.setFontSize(8); doc.setTextColor(200, 210, 230)
  doc.text('Arghyam · CSAT AI Phase 1 · April 2026', W - M, 18, { align: 'right' })
  return 26
}

// ─── Filtered call records CSV export ────────────────────────────────────────
export interface CallExportFilters {
  zone?: string          // 'All Zones' | 'Critical Zones' | specific zone
  sat?: string           // 'All' | 'Satisfied' | 'Neutral' | 'Dissatisfied'
  q1?: string            // 'All' | 'Yes' | 'No'
  hasRecording?: boolean | null
  callbackOnly?: boolean
  minDuration?: number | null
  dateFrom?: string      // ISO date string yyyy-mm-dd
  dateTo?: string
}

export async function downloadFilteredCallsCSV(filters: CallExportFilters, label?: string): Promise<number> {
  // Lazy import supabase so reports.ts stays usable without it
  const { supabase } = await import('../lib/supabase')

  let q = supabase
    .from('call_records')
    .select('call_id,contact_id,call_start_time,zone,district,scheme_name,contact_status,contact_attempts,call_duration,consented,satisfaction,q1_answer,q2_answer,q3_answer,q4_answer,q5_answer,callback_requested,call_recording_url,call_summary')
    .order('call_start_time', { ascending: false, nullsFirst: false })
    .limit(10000)

  if (filters.zone === 'Critical Zones') q = q.in('zone', ['BTAD', 'Barak Valley'])
  else if (filters.zone && filters.zone !== 'All Zones') q = q.eq('zone', filters.zone)

  if (filters.sat === 'No Q5') q = q.is('q5_answer', null)
  else if (filters.sat && filters.sat !== 'All') q = q.eq('satisfaction', filters.sat)

  if (filters.q1 === 'Yes') q = q.eq('q1_answer', 'yes')
  else if (filters.q1 === 'No') q = q.eq('q1_answer', 'no')

  if (filters.hasRecording === true)  q = q.not('call_recording_url', 'is', null)
  if (filters.hasRecording === false) q = q.is('call_recording_url', null)
  if (filters.callbackOnly) q = q.eq('callback_requested', true)
  if (filters.minDuration)  q = q.gte('call_duration', filters.minDuration)
  if (filters.dateFrom) q = q.gte('call_start_time', filters.dateFrom)
  if (filters.dateTo)   q = q.lte('call_start_time', filters.dateTo + 'T23:59:59')

  const { data } = await q
  if (!data || data.length === 0) return 0

  const headers = ['Call_ID','Contact_ID','Date_Time','Zone','District','Scheme','Status','Attempt','Duration_sec','Consented','Satisfaction','Q1_Daily_Water','Q2_Quality','Q3_Quantity','Q4_Timing','Q5_Overall','Callback_Requested','Has_Recording','AI_Summary']
  const rows: (string | number | null)[][] = data.map((r: Record<string, unknown>) => {
    const s = (v: unknown) => (v as string | null) ?? ''
    const n = (v: unknown) => (v as number | null) ?? null
    return [
      n(r.call_id) ?? n(r.contact_id),
      n(r.contact_id),
      r.call_start_time ? new Date(r.call_start_time as string).toLocaleString('en-IN') : '',
      s(r.zone), s(r.district), s(r.scheme_name), s(r.contact_status),
      n(r.contact_attempts), n(r.call_duration),
      r.consented === true ? 'Yes' : r.consented === false ? 'No' : '',
      s(r.satisfaction), s(r.q1_answer), s(r.q2_answer), s(r.q3_answer),
      s(r.q4_answer), s(r.q5_answer),
      r.callback_requested ? 'Yes' : 'No',
      r.call_recording_url ? 'Yes' : 'No',
      (s(r.call_summary)).replace(/\n/g, ' '),
    ]
  })

  const slug = label ? label.replace(/\s+/g, '_') : 'Filtered'
  downloadCSVFile(toCSV(headers, rows), `Arghyam_Calls_${slug}_${new Date().toISOString().split('T')[0]}.csv`)
  return data.length
}

// Re-export for convenience
export { KPI_HEADLINE, SCHEME_COVERAGE, Q5_SPLIT }

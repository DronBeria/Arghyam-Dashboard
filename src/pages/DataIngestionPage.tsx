import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:8000'

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Column definitions ───────────────────────────────────────────────────────
const REQUIRED_COLUMNS = [
  { key: 'consent',               label: 'Consent',         desc: 'yes / no / unknown / invalid_response' },
  { key: 'water_received_daily',  label: 'Q1 Daily Water',  desc: 'yes / no' },
  { key: 'quality_satisfied',     label: 'Q2 Quality',      desc: 'yes / no' },
  { key: 'quantity_satisfied',    label: 'Q3 Quantity',     desc: 'yes / no' },
  { key: 'consistent_timing',     label: 'Q1A Timing',      desc: 'yes / no · follow-up to Q1, asked when Q1 = Yes' },
  { key: 'overall_satisfaction',  label: 'Q5 Overall',      desc: 'satisfied / neutral / dissatisfied' },
  { key: 'district',              label: 'District',        desc: 'District name string' },
  { key: 'zone',                  label: 'Zone',            desc: 'Zone name string' },
]

const OPTIONAL_COLUMNS = [
  { key: 'Imis_id',           label: 'IMIS ID',          desc: 'Scheme identifier (for scheme coverage)' },
  { key: 'contact_attempts',  label: 'Contact Attempts', desc: 'Integer 1–5' },
  { key: 'call_duration',     label: 'Call Duration',    desc: 'Seconds (integer)' },
  { key: 'HHID',             label: 'Household ID',     desc: 'Unique household identifier' },
]

// ─── Pipeline steps with Python script details ────────────────────────────────
const PIPELINE_STEPS = [
  {
    key: 'validating',
    n: 1,
    label: 'Validate',
    desc: 'Column structure check + data type inspection',
    scriptTitle: 'Step 1 — Column Validation Script',
    scriptLang: 'Python 3 · pandas',
    script: `import pandas as pd

def validate_csv(content: bytes) -> dict:
    df = pd.read_csv(io.BytesIO(content), dtype=str)
    df.columns = df.columns.str.strip()

    REQUIRED = [
        'consent', 'water_received_daily', 'quality_satisfied',
        'quantity_satisfied', 'consistent_timing', 'overall_satisfaction',
        'district', 'zone',
    ]

    # Case-insensitive column matching
    col_map = {c.lower(): c for c in df.columns}
    for req in REQUIRED:
        if req.lower() in col_map:
            df = df.rename(columns={col_map[req.lower()]: req})

    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Normalise string values
    for col in df.select_dtypes(include='object'):
        df[col] = df[col].str.strip().str.lower().fillna('none')

    print(f"Rows detected    : {len(df):,}")
    print(f"Columns detected : {len(df.columns)}")
    print(f"Missing required : {missing or 'None — all present'}")
    return df`,
    output: `Rows detected    : 45,863
Columns detected : 37
Missing required : None — all present
✓ Validation passed`,
  },
  {
    key: 'processing',
    n: 2,
    label: 'Compute BSI',
    desc: 'Weighted BSI formula applied at state, zone, and district level',
    scriptTitle: 'Step 2 — BSI Computation Script',
    scriptLang: 'Python 3 · pandas · numpy',
    script: `def compute_bsi(df: pd.DataFrame) -> float:
    """
    BSI = Σ(weight × score) / Σ(weights)
    Weights match Phase 1 methodology:
      Q1  Daily Water  : 0.75  (base = all usable calls)
      Q1A Timing       : 0.75  (base = Q1=Yes callers only — follow-up to Q1)
      Q2  Quality      : 1.50  (base = consented only)
      Q3  Quantity     : 1.50  (base = consented only)
      Q5  Overall      : 0.50  (base = consented; satisfied=1)
    Total weight      : 5.0   (0.75+0.75+1.5+1.5+0.5 = 5.0)
    """
    usable    = df[df['water_received_daily'].isin(['yes', 'no'])]
    consented = df[df['consent'] == 'yes']
    q1_yes    = usable[usable['water_received_daily'] == 'yes']

    def pct(subset, col, yes_vals=('yes',)):
        valid = subset[subset[col].isin(list(yes_vals) + ['no'])]
        if len(valid) == 0:
            return 0.0
        return (valid[col].isin(yes_vals)).sum() / len(valid)

    q1  = pct(usable,    'water_received_daily')
    q1a = pct(q1_yes,   'consistent_timing')
    q2  = pct(consented, 'quality_satisfied')
    q3  = pct(consented, 'quantity_satisfied')
    q5  = pct(consented, 'overall_satisfaction', ('satisfied',))

    bsi = (q1*0.75 + q1a*0.75 + q2*1.5 + q3*1.5 + q5*0.5) / 5.0
    return round(bsi, 4)

# Run across all scopes
state_bsi = compute_bsi(df)
zone_bsi  = {z: compute_bsi(g) for z, g in df.groupby('zone')}
dist_bsi  = {d: compute_bsi(g) for d, g in df.groupby('district')}

print(f"State BSI : {state_bsi}")
print(f"Zones     : {len(zone_bsi)} computed")
print(f"Districts : {len(dist_bsi)} computed")`,
    output: `State BSI : 0.XXXX   (computed from uploaded data)
Zones     : N computed
Districts : N computed
✓ BSI computation complete`,
  },
  {
    key: 'inserting',
    n: 3,
    label: 'Aggregate & Insert',
    desc: 'Call summary, district scores, zone scores → Supabase Phase 2 tables',
    scriptTitle: 'Step 3 — Supabase Insert Script',
    scriptLang: 'Python 3 · supabase-py',
    script: `from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 1. KPI Summary
kpi = {
    'upload_id'          : job_id,
    'total_calls'        : len(df),
    'consented'          : len(consented),
    'usable_calls'       : len(usable),
    'completed_all_5'    : len(df_completed),
    'state_bsi'          : state_bsi,
    'q1_yes_pct'         : safe_pct(usable, 'water_received_daily'),
    'q2_yes_pct'         : safe_pct(consented, 'quality_satisfied'),
    'q3_yes_pct'         : safe_pct(consented, 'quantity_satisfied'),
    'q4_yes_pct'         : safe_pct(consented, 'consistent_timing'),
    'q5_satisfied_pct'   : safe_pct(consented, 'overall_satisfaction', ('satisfied',)),
    'is_active'          : True,
}
# Deactivate old summaries, insert new
supabase.table('phase2_kpi_summary').update({'is_active': False}).eq('is_active', True).execute()
supabase.table('phase2_kpi_summary').insert(kpi).execute()

# 2. District scores
districts = [
    {'upload_id': job_id, 'district': d, 'zone': z,
     'total_calls': len(g), 'bsi': compute_bsi(g), 'is_active': True}
    for (d, z), g in df.groupby(['district', 'zone'])
]
supabase.table('phase2_district_scores').update({'is_active': False}).eq('is_active', True).execute()
supabase.table('phase2_district_scores').insert(districts).execute()

# 3. Zone scores
zones = [
    {'upload_id': job_id, 'zone': z,
     'total_calls': len(g), 'bsi': compute_bsi(g), 'is_active': True}
    for z, g in df.groupby('zone')
]
supabase.table('phase2_zone_scores').update({'is_active': False}).eq('is_active', True).execute()
supabase.table('phase2_zone_scores').insert(zones).execute()

print(f"✓ Inserted KPI summary, {len(districts)} district rows, {len(zones)} zone rows")`,
    output: `✓ Inserted KPI summary
✓ Inserted N district rows
✓ Inserted N zone rows
✓ phase2_uploads job marked complete`,
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface UploadJob {
  id: string
  filename: string
  file_size_bytes: number
  row_count: number | null
  status: 'queued' | 'validating' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
  error_detail: string | null
  created_at: string
  completed_at: string | null
}

interface FilePreview {
  columns: string[]
  rowCount: number
  sampleRows: Record<string, string>[]
  missingRequired: string[]
}

type UploadState = 'idle' | 'previewing' | 'ready' | 'uploading' | 'processing' | 'complete' | 'error'

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScriptViewer({ step }: { step: typeof PIPELINE_STEPS[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        View Python script
      </button>
      {open && (
        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          {/* Script header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 ml-1">{step.scriptTitle}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">{step.scriptLang}</span>
          </div>
          {/* Code */}
          <pre className="bg-slate-950 px-5 py-4 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">{step.script}</pre>
          {/* Expected output */}
          <div className="border-t border-white/5">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1117] border-b border-white/5">
              <span className="text-[10px] font-mono text-slate-500">$ python processor.py  →  expected output</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-400">✓ Expected pass</span>
            </div>
            <pre className="bg-[#0d1117] px-5 py-3 text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre">{step.output}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusStep({
  step, currentStatus, jobMessage,
}: {
  step: typeof PIPELINE_STEPS[0]
  currentStatus: UploadJob['status'] | null
  jobMessage: string
}) {
  const order: UploadJob['status'][] = ['queued', 'validating', 'processing', 'complete']
  const stepStatusMap: Record<number, UploadJob['status']> = { 1: 'validating', 2: 'processing', 3: 'complete' }
  const myStatus = stepStatusMap[step.n]
  const myIdx    = order.indexOf(myStatus)
  const curIdx   = order.indexOf(currentStatus ?? 'queued')

  const isDone   = myIdx < curIdx || currentStatus === 'complete'
  const isActive = myIdx === curIdx && currentStatus !== 'complete' && currentStatus !== 'error'

  return (
    <div className="space-y-0">
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-black ${
          isDone   ? 'bg-emerald-500 text-white' :
          isActive ? 'bg-blue-500 text-white' :
          currentStatus === 'error' && myIdx <= curIdx ? 'bg-red-500 text-white' :
          'bg-slate-200 text-slate-400'
        }`}>
          {isDone ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          ) : isActive ? (
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          ) : step.n}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-semibold ${isDone || isActive ? 'text-slate-700' : 'text-slate-400'}`}>
            {step.label}
          </p>
          <p className="text-[11px] text-slate-400 leading-snug">
            {isActive ? jobMessage || step.desc : step.desc}
          </p>
          <ScriptViewer step={step} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DataIngestionPage({ onUploaded }: { onUploaded?: () => void } = {}) {
  const [uploadState, setUploadState]   = useState<UploadState>('idle')
  const [dragActive, setDragActive]     = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview]           = useState<FilePreview | null>(null)
  const [jobId, setJobId]               = useState<string | null>(null)
  const [jobStatus, setJobStatus]       = useState<UploadJob | null>(null)
  const [uploadHistory, setUploadHistory] = useState<UploadJob[]>([])
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)
  const [backendOk, setBackendOk]       = useState<boolean | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check backend health + load history on mount
  useEffect(() => {
    checkBackend()
    fetchHistory()
  }, [])

  // Poll job status while active
  useEffect(() => {
    if (jobId && (uploadState === 'uploading' || uploadState === 'processing')) {
      pollRef.current = setInterval(() => pollStatus(jobId), 2000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [jobId, uploadState])

  async function checkBackend() {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(4000) })
      setBackendOk(res.ok)
    } catch {
      setBackendOk(false)
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/uploads`, { headers: await authHeaders() })
      if (res.ok) setUploadHistory(await res.json())
    } catch { /* backend offline — silently skip */ }
  }

  async function pollStatus(id: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status/${id}`, { headers: await authHeaders() })
      if (!res.ok) return
      const job: UploadJob = await res.json()
      setJobStatus(job)
      if (job.status === 'complete') {
        setUploadState('complete')
        clearInterval(pollRef.current!)
        fetchHistory()
        onUploaded?.()
      } else if (job.status === 'error') {
        setUploadState('error')
        setErrorMsg(job.error_detail || job.message)
        clearInterval(pollRef.current!)
        fetchHistory()
      } else {
        setUploadState('processing')
      }
    } catch { /* transient error — keep polling */ }
  }

  function parseCSVPreview(text: string): FilePreview {
    const lines   = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const sample  = lines.slice(1, 6).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    })
    const lower = headers.map(h => h.toLowerCase())
    return {
      columns: headers,
      rowCount: lines.length - 1,
      sampleRows: sample,
      missingRequired: REQUIRED_COLUMNS.filter(c => !lower.includes(c.key.toLowerCase())).map(c => c.key),
    }
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { setErrorMsg('Only CSV files are supported.'); return }
    setSelectedFile(file)
    setUploadState('previewing')
    setErrorMsg(null)
    const reader = new FileReader()
    reader.onload = e => {
      const p = parseCSVPreview(e.target?.result as string)
      setPreview(p)
      setUploadState('ready')
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function uploadFile() {
    if (!selectedFile) return
    setUploadState('uploading')
    setErrorMsg(null)
    const form = new FormData()
    form.append('file', selectedFile)
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: form, headers: await authHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setUploadState('error')
        setErrorMsg((err as { detail?: string }).detail || 'Upload failed. Check the backend logs.')
        return
      }
      const { job_id } = (await res.json()) as { job_id: string }
      setJobId(job_id)
      setUploadState('processing')
    } catch {
      setUploadState('error')
      setErrorMsg(`Could not reach backend at ${BACKEND_URL}. Is it running?`)
    }
  }

  function reset() {
    setUploadState('idle')
    setSelectedFile(null)
    setPreview(null)
    setJobId(null)
    setJobStatus(null)
    setErrorMsg(null)
    clearInterval(pollRef.current!)
  }

  function downloadTemplate() {
    const headers  = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map(c => c.key).join(',')
    const example  = 'yes,yes,yes,yes,yes,satisfied,Kamrup,Lower Assam,12345,3,180,HH001'
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'phase2_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const pipelineStatusOrder = ['queued', 'validating', 'processing', 'complete'] as const
  const progressPct = jobStatus?.progress ?? 0

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border border-slate-200" style={{ background: '#0f172a' }}>
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1.5">Phase 2 · Data Pipeline</p>
            <h1 className="text-lg font-black text-white">Data Ingestion</h1>
            <p className="text-[12px] text-slate-400 mt-1 max-w-lg leading-relaxed">
              Upload Phase 2 CSAT survey CSV files. The system validates columns, runs Python processing scripts,
              computes BSI scores by zone &amp; district, and inserts everything into the Phase 2 dashboard automatically.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              backendOk === true  ? 'bg-emerald-500/10 border-emerald-500/20' :
              backendOk === false ? 'bg-red-500/10 border-red-500/20' :
              'bg-white/5 border-white/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendOk === true ? 'bg-emerald-400 animate-pulse' :
                backendOk === false ? 'bg-red-400' : 'bg-slate-500'
              }`} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                backendOk === true ? 'text-emerald-400' :
                backendOk === false ? 'text-red-400' : 'text-slate-500'
              }`}>
                {backendOk === true ? 'Backend Online' : backendOk === false ? 'Backend Offline' : 'Checking…'}
              </span>
            </div>
            <button onClick={downloadTemplate}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download CSV Template
            </button>
          </div>
        </div>

        {/* Pipeline step indicators */}
        <div className="grid grid-cols-4 border-t border-white/5">
          {[
            { n: 1, label: 'Upload CSV',       active: uploadState !== 'idle' },
            { n: 2, label: 'Validate',          active: ['ready','uploading','processing','complete'].includes(uploadState) },
            { n: 3, label: 'Process & Insert',  active: ['processing','complete'].includes(uploadState) },
            { n: 4, label: 'Dashboard Ready',   active: uploadState === 'complete' },
          ].map(s => (
            <div key={s.n} className={`px-5 py-3 border-r border-white/5 last:border-0 flex items-center gap-2.5 transition-opacity ${s.active ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${s.active ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                {s.active && uploadState === 'complete' ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : s.n}
              </div>
              <p className={`text-[11px] font-semibold ${s.active ? 'text-slate-200' : 'text-slate-600'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Backend offline warning ───────────────────────────────────────── */}
      {backendOk === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <p className="text-[12px] font-bold text-amber-800">Backend not reachable at <span className="font-mono">{BACKEND_URL}</span></p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Start the FastAPI server: <span className="font-mono bg-amber-100 px-1 rounded">cd backend &amp;&amp; uvicorn main:app --reload</span>.
              Set <span className="font-mono">VITE_BACKEND_URL</span> in <span className="font-mono">.env</span> if running on a different port.
            </p>
            <button onClick={checkBackend} className="mt-2 text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline">
              Retry connection
            </button>
          </div>
        </div>
      )}

      {/* ── Upload zone ───────────────────────────────────────────────────── */}
      {['idle', 'previewing', 'ready'].includes(uploadState) && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="panel-title">Upload CSV File</p>
              <p className="panel-sub mt-0.5">Drag &amp; drop or click to browse — CSV only</p>
            </div>
            {selectedFile && (
              <button onClick={reset} className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Clear
              </button>
            )}
          </div>
          <div className="p-5 space-y-4">

            {/* Drop zone */}
            {!selectedFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl py-14 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <svg className={`w-7 h-7 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-slate-600">{dragActive ? 'Drop to upload' : 'Drag CSV file here'}</p>
                <p className="text-[11px] text-slate-400 mt-1">or click to browse your files</p>
                <p className="text-[10px] text-slate-300 mt-3 font-mono tracking-wide">Accepts: .csv · Any size</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-700 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB · CSV</p>
                </div>
                <span className="badge badge-good">Ready</span>
              </div>
            )}

            {/* Preview + validation */}
            {preview && (
              <div className="space-y-4">

                {/* Column check */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      <p className="text-[11px] font-bold text-slate-600">Required Columns</p>
                      {preview.missingRequired.length === 0
                        ? <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">All present</span>
                        : <span className="ml-auto text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">{preview.missingRequired.length} missing</span>
                      }
                    </div>
                    <div className="p-3 space-y-1.5">
                      {REQUIRED_COLUMNS.map(col => {
                        const present = !preview.missingRequired.includes(col.key)
                        return (
                          <div key={col.key} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${present ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {present ? '✓' : '✗'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-600">{col.key}</span>
                            <span className="text-[10px] text-slate-400 truncate">{col.desc}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600">File Summary</p>
                    </div>
                    <div className="p-3 space-y-2.5">
                      {[
                        { label: 'Rows detected',      value: preview.rowCount.toLocaleString(), color: 'text-slate-700' },
                        { label: 'Columns detected',   value: String(preview.columns.length), color: 'text-slate-700' },
                        { label: 'Missing required',   value: preview.missingRequired.length === 0 ? 'None ✓' : String(preview.missingRequired.length), color: preview.missingRequired.length === 0 ? 'text-emerald-600' : 'text-red-600' },
                        { label: 'Optional present',   value: `${OPTIONAL_COLUMNS.filter(c => preview.columns.map(x=>x.toLowerCase()).includes(c.key.toLowerCase())).length} / ${OPTIONAL_COLUMNS.length}`, color: 'text-slate-500' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">{r.label}</span>
                          <span className={`font-bold ${r.color}`}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Missing required warning */}
                {preview.missingRequired.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-[11px] text-red-700 leading-relaxed">
                    <strong>Missing required columns:</strong> {preview.missingRequired.map(c => <code key={c} className="mx-0.5 px-1 py-0.5 bg-red-100 rounded font-mono">{c}</code>)}.
                    Fix the CSV or download the template above.
                  </div>
                )}

                {/* Data preview table */}
                {preview.sampleRows.length > 0 && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-600">Data Preview — first {preview.sampleRows.length} rows</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            {preview.columns.slice(0, 9).map(col => (
                              <th key={col} className="th text-left text-[10px] whitespace-nowrap">{col}</th>
                            ))}
                            {preview.columns.length > 9 && <th className="th text-slate-300 text-[10px]">+{preview.columns.length - 9}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.sampleRows.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0">
                              {preview.columns.slice(0, 9).map(col => (
                                <td key={col} className="td text-[10px] font-mono whitespace-nowrap max-w-[120px] truncate">{row[col]}</td>
                              ))}
                              {preview.columns.length > 9 && <td className="td text-slate-300 text-[10px]">…</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Upload CTA */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    {preview.missingRequired.length === 0
                      ? `${preview.rowCount.toLocaleString()} rows ready — all required columns detected`
                      : `Fix ${preview.missingRequired.length} missing column(s) before uploading`}
                  </p>
                  <button onClick={uploadFile} disabled={preview.missingRequired.length > 0 || backendOk === false}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Upload &amp; Process
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-[11px] text-red-700">{errorMsg}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Processing status ─────────────────────────────────────────────── */}
      {['uploading', 'processing', 'complete', 'error'].includes(uploadState) && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="panel-title">Processing Pipeline</p>
              <p className="panel-sub mt-0.5">{selectedFile?.name}</p>
            </div>
            {uploadState === 'complete' && (
              <span className="badge badge-good text-[11px]">Complete</span>
            )}
            {uploadState === 'error' && (
              <span className="badge badge-critical text-[11px]">Failed</span>
            )}
          </div>
          <div className="p-5 space-y-5">

            {/* Progress bar */}
            {!['complete', 'error'].includes(uploadState) && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{jobStatus?.message || 'Uploading…'}</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct || (uploadState === 'uploading' ? 5 : 0)}%` }} />
                </div>
              </div>
            )}

            {/* Step-by-step with script viewers */}
            <div className="space-y-5">
              {PIPELINE_STEPS.map(step => (
                <StatusStep key={step.key} step={step} currentStatus={jobStatus?.status ?? null} jobMessage={jobStatus?.message ?? ''} />
              ))}
            </div>

            {/* Complete */}
            {uploadState === 'complete' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">Processing Complete</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {jobStatus?.row_count?.toLocaleString() ?? '—'} rows processed and inserted.
                    Phase 2 dashboard is now populated.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {uploadState === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                <p className="text-[12px] font-bold text-red-800">Processing Failed</p>
                <pre className="text-[11px] text-red-700 font-mono whitespace-pre-wrap">{errorMsg}</pre>
                <button onClick={reset} className="text-[11px] font-semibold text-red-700 hover:text-red-900 underline">Try again</button>
              </div>
            )}

            {uploadState === 'complete' && (
              <div className="flex gap-2 pt-1">
                <button onClick={reset}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Upload Another File
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'overview' }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  View Phase 2 Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload History ────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <p className="panel-title">Upload History</p>
            <p className="panel-sub mt-0.5">All Phase 2 data ingestion jobs</p>
          </div>
          <button onClick={fetchHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>
        {uploadHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-[12px] font-semibold text-slate-500">No uploads yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Upload your first Phase 2 CSV above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th text-left">File</th>
                  <th className="th text-right">Rows</th>
                  <th className="th text-right">Size</th>
                  <th className="th text-center">Status</th>
                  <th className="th text-left hidden md:table-cell">Message</th>
                  <th className="th text-right">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map(job => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                    <td className="td font-mono text-[11px] text-slate-700 max-w-[160px] truncate">{job.filename}</td>
                    <td className="td-mono text-right">{job.row_count?.toLocaleString() ?? '—'}</td>
                    <td className="td-mono text-right">{job.file_size_bytes ? `${(job.file_size_bytes / 1024).toFixed(0)} KB` : '—'}</td>
                    <td className="td text-center">
                      <span className={`badge ${
                        job.status === 'complete'   ? 'badge-good' :
                        job.status === 'error'      ? 'badge-critical' :
                        job.status === 'processing' || job.status === 'validating' ? 'badge-moderate' :
                        'text-slate-500 bg-slate-100'
                      }`}>
                        {['processing','validating'].includes(job.status) && <span className="mr-1">⟳</span>}
                        {job.status}
                      </span>
                    </td>
                    <td className="td text-[11px] text-slate-500 max-w-[200px] truncate hidden md:table-cell">{job.message}</td>
                    <td className="td-mono text-right text-[10px] text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Column reference ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <p className="panel-title">Expected CSV Format</p>
          <p className="panel-sub mt-0.5">Column reference — mirrors Phase 1 source structure</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Required columns</p>
            <div className="space-y-2">
              {REQUIRED_COLUMNS.map(col => (
                <div key={col.key} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-slate-700">{col.key}</span>
                    <span className="text-[11px] text-slate-400 ml-2">{col.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Optional columns</p>
            <div className="space-y-2">
              {OPTIONAL_COLUMNS.map(col => (
                <div key={col.key} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">{col.key}</span>
                    <span className="text-[11px] text-slate-400 ml-2">{col.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Optional columns enhance scheme coverage analysis and call attempt breakdown.
                The dashboard computes BSI and all KPIs from required columns alone.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

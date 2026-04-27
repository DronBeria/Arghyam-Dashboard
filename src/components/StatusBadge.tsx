export function statusColor(status: string | null) {
  if (!status) return 'text-slate-400'
  if (status === 'Good')    return 'text-emerald-400'
  if (status === 'Critical') return 'text-red-400'
  if (status === 'No Data') return 'text-slate-500'
  return 'text-amber-400' // Moderate
}

export function statusBg(status: string | null) {
  if (!status) return 'bg-slate-800 text-slate-400'
  if (status === 'Good')    return 'bg-emerald-950 text-emerald-300 border border-emerald-800'
  if (status === 'Critical') return 'bg-red-950 text-red-300 border border-red-800'
  if (status === 'No Data') return 'bg-slate-800 text-slate-400 border border-slate-700'
  return 'bg-amber-950 text-amber-300 border border-amber-800'
}

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBg(status)}`}>
      {status ?? '—'}
    </span>
  )
}

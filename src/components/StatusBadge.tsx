export function statusColor(status: string | null) {
  if (!status) return 'text-gray-400'
  if (status === 'Good')     return 'text-emerald-600'
  if (status === 'Critical') return 'text-red-600'
  if (status === 'No Data')  return 'text-gray-400'
  return 'text-amber-600'
}

export function statusBg(status: string | null) {
  if (!status) return 'bg-gray-100 text-gray-500'
  if (status === 'Good')     return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'Critical') return 'bg-red-50 text-red-700 border border-red-200'
  if (status === 'No Data')  return 'bg-gray-100 text-gray-500 border border-gray-200'
  return 'bg-amber-50 text-amber-700 border border-amber-200'
}

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${statusBg(status)}`}>
      {status ?? '—'}
    </span>
  )
}

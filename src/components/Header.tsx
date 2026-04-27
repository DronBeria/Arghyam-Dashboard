interface HeaderProps {
  pageTitle: string
}

export function Header({ pageTitle }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Araghyam · CSAT AI Phase 1</p>
        <h2 className="text-base font-bold text-gray-800 leading-tight">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · April 2026
        </span>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full">
          45,863 calls
        </span>
      </div>
    </div>
  )
}

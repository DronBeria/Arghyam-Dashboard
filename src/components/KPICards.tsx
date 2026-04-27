import { KPI_HEADLINE } from '../data/csatData'

const cards = [
  {
    label: 'Total Calls',
    value: '45,863',
    sub: '2,373 IMIS schemes · Assam',
    accent: 'border-t-blue-600',
    valueColor: 'text-blue-700',
    icon: '📞',
    bg: 'bg-blue-50',
  },
  {
    label: 'State BSI Score',
    value: '0.4406',
    sub: 'Moderate · Target ≥ 0.70',
    accent: 'border-t-amber-500',
    valueColor: 'text-amber-700',
    icon: '📊',
    bg: 'bg-amber-50',
  },
  {
    label: 'Overall Satisfied',
    value: `${KPI_HEADLINE.satisfied}%`,
    sub: 'Of 4,284 Q5 respondents',
    accent: 'border-t-amber-500',
    valueColor: 'text-amber-700',
    icon: '✓',
    bg: 'bg-amber-50',
  },
  {
    label: 'Functional Schemes',
    value: `${KPI_HEADLINE.functionalSchemes}%`,
    sub: '108 of 615 valid schemes',
    accent: 'border-t-red-500',
    valueColor: 'text-red-600',
    icon: '⚠',
    bg: 'bg-red-50',
  },
  {
    label: 'Consent Rate',
    value: `${KPI_HEADLINE.consentRate}%`,
    sub: '12,583 of 45,863 agreed',
    accent: 'border-t-gray-400',
    valueColor: 'text-gray-700',
    icon: '🤝',
    bg: 'bg-gray-50',
  },
]

export function KPICards() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Key Performance Indicators — Phase 1 Summary
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">April 2026</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white border border-gray-200 border-t-4 ${c.accent} rounded-xl p-4 shadow-sm flex flex-col gap-1.5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                {c.label}
              </span>
              <span className={`text-lg w-7 h-7 rounded-full flex items-center justify-center ${c.bg}`}>
                {c.icon}
              </span>
            </div>
            <span className={`text-3xl font-bold tracking-tight ${c.valueColor}`}>{c.value}</span>
            <span className="text-xs text-gray-400 leading-snug">{c.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

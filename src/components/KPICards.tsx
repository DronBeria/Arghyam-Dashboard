import { KPI_HEADLINE } from '../data/csatData'

const cards = [
  {
    label: 'Total Calls',
    value: '45,863',
    sub: '2,373 IMIS schemes · Assam',
    color: 'border-blue-700',
    textColor: 'text-blue-300',
  },
  {
    label: 'State BSI',
    value: '0.4406',
    sub: 'Moderate · Target ≥ 0.70',
    color: 'border-amber-700',
    textColor: 'text-amber-300',
  },
  {
    label: 'Satisfied (Q5)',
    value: `${KPI_HEADLINE.satisfied}%`,
    sub: 'Of 4,284 Q5 respondents',
    color: 'border-amber-700',
    textColor: 'text-amber-300',
  },
  {
    label: 'Functional Schemes',
    value: `${KPI_HEADLINE.functionalSchemes}%`,
    sub: '108 of 615 valid schemes',
    color: 'border-red-700',
    textColor: 'text-red-300',
  },
  {
    label: 'Consent Rate',
    value: `${KPI_HEADLINE.consentRate}%`,
    sub: '12,583 of 45,863 agreed',
    color: 'border-slate-600',
    textColor: 'text-slate-300',
  },
]

export function KPICards() {
  return (
    <section id="kpi-cards" className="px-6 pt-6 pb-2">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Key Performance Indicators
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-slate-900 border-t-2 ${c.color} rounded-lg p-4 flex flex-col gap-1`}
          >
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {c.label}
            </span>
            <span className={`text-2xl font-bold ${c.textColor}`}>{c.value}</span>
            <span className="text-xs text-slate-500 leading-snug">{c.sub}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

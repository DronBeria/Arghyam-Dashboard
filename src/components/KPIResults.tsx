import { KPI_QUESTIONS, Q5_SPLIT } from '../data/csatData'
import { StatusBadge } from './StatusBadge'

function fmt(n: number) { return n.toLocaleString() }

const QUESTION_DESCRIPTIONS: Record<string, string> = {
  Q1:  'Were you receiving water every day in the last 7 days?',
  Q1A: 'Did the water come at a consistent / fixed time? (asked only if Q1 = Yes)',
  Q2:  'Was the water clean and of acceptable quality?',
  Q3:  'Was the quantity of water sufficient for your needs?',
  Q5:  'Overall, are you satisfied with your water supply?',
}

export function KPIResults() {
  return (
    <div>
      <h2 className="section-title">2. Survey KPI Results</h2>
      <p className="section-sub">
        Questions asked in survey flow order · Yes% = satisfied respondents ÷ total who answered ·
        Target ≥ 70% = Good
      </p>

      {/* KPI rows */}
      <div className="space-y-3 mt-4">
        {KPI_QUESTIONS.map((q) => {
          const isGood     = q.status === 'Good'
          const isCritical = q.status === 'Critical'
          const barColor   = isGood ? 'bg-emerald-500' : isCritical ? 'bg-red-500' : 'bg-amber-400'
          const pctColor   = isGood ? 'text-emerald-700' : isCritical ? 'text-red-600' : 'text-amber-600'
          const bgColor    = isGood ? 'bg-emerald-50 border-emerald-100' : isCritical ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'

          return (
            <div key={q.id} className={`rounded-xl border p-4 ${bgColor}`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${
                    isGood ? 'bg-emerald-200 text-emerald-800' :
                    isCritical ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                  }`}>{q.id}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{q.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{QUESTION_DESCRIPTIONS[q.id]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-2xl font-black ${pctColor}`}>{q.yesPct.toFixed(1)}%</span>
                  <StatusBadge status={q.status} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-3 bg-white/60 rounded-full overflow-hidden border border-white/40">
                <div className={`h-full ${barColor} rounded-full transition-all`}
                  style={{ width: `${q.yesPct}%` }} />
                {/* 70% target marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-600/40"
                  style={{ left: '70%' }} />
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-emerald-700 font-semibold">✓ {fmt(q.yesCount)} yes</span>
                  <span className="text-red-500">✗ {fmt(q.noCount)} no</span>
                  <span className="text-gray-400">of {fmt(q.base)} answered</span>
                  {(q as any).askedOf && (
                    <span className="text-blue-500">· asked to {fmt((q as any).askedOf)} Q1=Yes callers</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">Weight: {q.weight}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Q5 3-way split */}
      <div className="mt-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-600 mb-3">
          Q5 — Overall Satisfaction Breakdown
          <span className="text-gray-400 font-normal ml-2">({fmt(Q5_SPLIT.base)} respondents)</span>
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Satisfied',    data: Q5_SPLIT.satisfied,    bg: 'bg-emerald-50 border-emerald-200', val: 'text-emerald-700', icon: '😊' },
            { label: 'Neutral',      data: Q5_SPLIT.neutral,      bg: 'bg-gray-50 border-gray-200',       val: 'text-gray-600',   icon: '😐' },
            { label: 'Dissatisfied', data: Q5_SPLIT.dissatisfied, bg: 'bg-red-50 border-red-200',         val: 'text-red-700',    icon: '😞' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-xl font-black ${s.val}`}>{s.data.pct}%</div>
              <div className={`text-xs font-semibold mt-0.5 ${s.val}`}>{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{fmt(s.data.count)} people</div>
            </div>
          ))}
        </div>

        {/* Stacked bar */}
        <div className="mt-3 h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full" style={{ width: `${Q5_SPLIT.satisfied.pct}%` }} />
          <div className="bg-gray-300 h-full"    style={{ width: `${Q5_SPLIT.neutral.pct}%` }} />
          <div className="bg-red-400 h-full"     style={{ width: `${Q5_SPLIT.dissatisfied.pct}%` }} />
        </div>
      </div>
    </div>
  )
}

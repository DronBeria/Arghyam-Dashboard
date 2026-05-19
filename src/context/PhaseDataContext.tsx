import { createContext, useContext } from 'react'
import * as p1 from '../data/csatData'
import * as p2 from '../data/csatData2'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConsentBreakdownItem {
  label: string; pct: string; n: string; dot: string; color: string
}
export interface AttemptChartItem {
  attempt: string; consent: number; satisfied: number; calls: number
}
export interface PathItem {
  label: string; val: number; pct: number; note: string
}
export interface OutcomeItem {
  label: string; val: number; pct: number; color: string
}
export interface FunnelCard {
  label: string; val: string; sub: string; color: string; bg: string
}
export interface LiftCard {
  label: string; first: number; repeat: number; unit: string; color: string; bg: string
}
export interface TrendItem {
  name: string; first: number; repeat: number
}

export interface PhaseData {
  // Raw data (same shape as csatData exports)
  KPI_HEADLINE: typeof p1.KPI_HEADLINE
  CALL_SUMMARY: typeof p1.CALL_SUMMARY
  CALL_SUMMARY_NOTE: string
  KPI_QUESTIONS: typeof p1.KPI_QUESTIONS
  Q5_SPLIT: typeof p1.Q5_SPLIT
  SCHEME_COVERAGE: typeof p1.SCHEME_COVERAGE
  ZONE_SCORES: typeof p1.ZONE_SCORES
  DISTRICT_SCORES: typeof p1.DISTRICT_SCORES
  REPEAT_CALLERS: typeof p1.REPEAT_CALLERS
  CALL_ATTEMPTS: typeof p1.CALL_ATTEMPTS
  QUESTION_FUNNEL: typeof p1.QUESTION_FUNNEL

  // Phase identity
  phase: 'phase1' | 'phase2'
  phaseLabel: string
  dateLabel: string
  hasSchemeSearch: boolean

  // Derived for OverviewPage
  stateInsightCalls: string
  stateInsightQuality: string
  usableCallsLabel: string
  usableInsightText: string
  usableYieldText: string
  baseConsented: number
  stateScopeText: string
  consentBreakdown: ConsentBreakdownItem[]
  consentNoteText: string
  validSchemesText: string
  bestDistrict: { name: string; bsi5: string }
  worstDistrict: { name: string; bsi5: string }
  districtCountLabel: string
  dhacNote: string

  // Derived for CallAnalysisPage
  ATTEMPT_CHART: AttemptChartItem[]
  CONSENT_PATH: PathItem[]
  USABLE_PATH: PathItem[]
  OUTCOME_BREAKDOWN: OutcomeItem[]
  attemptsInsight: string
  repeatInsight: string
  funnelCards: FunnelCard[]
  liftCards: LiftCard[]
  repeatTrend: TrendItem[]
  q5NoteText: string

  // Derived for SurveyResultsPage
  q5BaseLabel: string
  q5BaseNote: string

  // For CallRecordsPage — Supabase date filter to isolate this phase
  phaseGteDate: string | null   // gte filter (Phase 2: '2026-05-01', Phase 1: null)
  phaseLtDate:  string | null   // lt  filter (Phase 1: '2026-05-01', Phase 2: null)
  dbRecordCount: number         // actual records in Supabase for this phase
}

// ─── Phase 1 full data ────────────────────────────────────────────────────────
const PHASE1_DATA: PhaseData = {
  ...p1,
  phase: 'phase1',
  phaseLabel: 'Phase 1',
  dateLabel: 'Apr 2026',
  hasSchemeSearch: true,

  stateInsightCalls:   '27.4% consented · 72.6% refused or no response',
  stateInsightQuality: '51.7% satisfied · 25.6% dissatisfied · 22.7% neutral',
  usableCallsLabel:    '9,224',
  usableInsightText:   '20.1% of 45,863 dialled · Q1 answered yes or no',
  usableYieldText:     '20.1% yield',
  baseConsented:       12583,
  stateScopeText:      '45,863 calls · 35 districts · 7 zones',
  consentBreakdown: [
    { label: 'Consented',       pct: '27.4%', n: '12,583', dot: 'bg-indigo-500', color: 'text-indigo-700' },
    { label: 'Refused',         pct: '69.1%', n: '31,710', dot: 'bg-red-400',    color: 'text-red-600'   },
    { label: 'No response',     pct: '2.6%',  n: '1,208',  dot: 'bg-amber-300',  color: 'text-amber-600' },
    { label: 'Unknown/invalid', pct: '0.8%',  n: '362',    dot: 'bg-gray-300',   color: 'text-gray-500'  },
  ],
  consentNoteText:   '27.4 + 69.1 + 2.6 + 0.8 = 100% ✓',
  validSchemesText:  'Of 615 valid schemes:',
  bestDistrict:      { name: 'Sivasagar',  bsi5: '2.660' },
  worstDistrict:     { name: 'Hailakandi', bsi5: '1.393' },
  districtCountLabel:'31',
  dhacNote:          'DHAC excluded: only 95 calls made · 1.1% consent rate · to be re-called in Phase 2 · BSI shown out of 5.0 (Good ≥ 3.50)',

  ATTEMPT_CHART: [
    { attempt: '1st', consent: 28, satisfied: 52.3, calls: 39633 },
    { attempt: '2nd', consent: 25, satisfied: 51.7, calls: 4224  },
    { attempt: '3rd', consent: 23, satisfied: 47.5, calls: 1220  },
    { attempt: '4th', consent: 22, satisfied: 38.5, calls: 479   },
    { attempt: '5th', consent: 23, satisfied: 63.0, calls: 307   },
  ],
  CONSENT_PATH: [
    { label: 'Total Dialled',      val: 45863, pct: 100,  note: 'All calls attempted' },
    { label: 'Consented',          val: 12583, pct: 27.4, note: 'consent = "yes" · Q2–Q5 base' },
    { label: 'Completed All 5 Q',  val: 1578,  pct: 12.5, note: '12.5% of consented · not % of total' },
  ],
  USABLE_PATH: [
    { label: 'Total Dialled', val: 45863, pct: 100,  note: 'All calls attempted' },
    { label: 'Q1 Answered',   val: 9224,  pct: 20.1, note: 'Q1 base · 8,327 consented + 897 not' },
  ],
  OUTCOME_BREAKDOWN: [
    { label: 'Answered – Consented',        val: 12583, pct: 27.4, color: 'bg-emerald-400' },
    { label: 'Answered – Refused (usable)', val: 897,   pct: 2.0,  color: 'bg-amber-400'   },
    { label: 'Answered – Refused (clean)',  val: 30813, pct: 67.2, color: 'bg-orange-400'  },
    { label: 'No Response (blank)',          val: 1208,  pct: 2.6,  color: 'bg-red-300'     },
    { label: 'Unknown / Invalid',            val: 362,   pct: 0.8,  color: 'bg-gray-300'    },
  ],
  attemptsInsight: "Attempt 4 shows the lowest satisfaction (38.5%) — households requiring 4+ calls may be less engaged or have worse service. Attempt 5's 63.0% is based on a very small sample (27 respondents) and is not statistically reliable.",
  repeatInsight:   'Repeat callers yield nearly double the data at 37.1% usable rate vs 20.0% for first-time calls. Phase 2 should prioritize re-contacting non-responding households from Phase 1.',
  funnelCards: [
    { label: 'Consented base (Q2–Q5)', val: '12,583', sub: 'Agreed to survey',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200'   },
    { label: 'Usable base (Q1)',        val: '9,224',  sub: 'Answered Q1',         color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'       },
    { label: 'Q5 respondents',          val: '4,410',  sub: '35.1% of consented',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'     },
    { label: 'Completed all 5',         val: '1,578',  sub: '12.5% of consented',  color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
  ],
  liftCards: [
    { label: 'Consent Rate', first: 27.4, repeat: 44.7, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Usable Calls', first: 20.0, repeat: 37.1, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Completion',   first: 3.4,  repeat: 5.9,  unit: '%', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
  ],
  repeatTrend: [
    { name: 'Consent',    first: 27.4, repeat: 44.7 },
    { name: 'Usable',     first: 20.0, repeat: 37.1 },
    { name: 'Completion', first: 3.4,  repeat: 5.9  },
  ],
  q5NoteText: 'The table uses consented-only Q5 respondents per attempt (4,284 total, 52.1% satisfied). The global Q5 figure shown elsewhere (4,410 respondents, 51.7% satisfied) is higher because 126 non-consented callers also reached Q5 but cannot be attributed to a specific attempt number.',
  q5BaseLabel: '4,410 respondents',
  q5BaseNote:  '4,410 total reached Q5 (4,284 consented + 126 non-consented who answered). The 9,224 usable calls are the Q1 base — a separate population. Of those who answered Q5: 51.7% satisfied · 25.6% dissatisfied · 22.7% neutral.',

  phaseGteDate:  null,
  phaseLtDate:   '2026-05-01',
  dbRecordCount: 45863,
}

// ─── Phase 2 full data ────────────────────────────────────────────────────────
const PHASE2_DATA: PhaseData = {
  ...p2,
  phase: 'phase2',
  phaseLabel: 'Phase 2',
  dateLabel: 'May 2026',
  hasSchemeSearch: false,

  stateInsightCalls:   '20.4% consented · 79.6% refused or no response',
  stateInsightQuality: '53.1% satisfied · 24.7% dissatisfied · 22.1% neutral',
  usableCallsLabel:    '15,660',
  usableInsightText:   '12.5% of 125,588 dialled · Q1 answered yes or no',
  usableYieldText:     '12.5% yield',
  baseConsented:       25617,
  stateScopeText:      '125,588 calls · 33 districts · 7 zones',
  consentBreakdown: [
    { label: 'Consented',       pct: '20.4%', n: '25,617', dot: 'bg-indigo-500', color: 'text-indigo-700' },
    { label: 'Refused',         pct: '77.7%', n: '97,611', dot: 'bg-red-400',    color: 'text-red-600'   },
    { label: 'No response',     pct: '1.0%',  n: '1,257',  dot: 'bg-amber-300',  color: 'text-amber-600' },
    { label: 'Unknown/invalid', pct: '0.9%',  n: '1,103',  dot: 'bg-gray-300',   color: 'text-gray-500'  },
  ],
  consentNoteText:   '20.4 + 77.7 + 1.0 + 0.9 = 100.0% ✓',
  validSchemesText:  'Of 882 valid schemes:',
  bestDistrict:      { name: 'Dhubri',     bsi5: '3.305' },
  worstDistrict:     { name: 'Hailakandi', bsi5: '1.539' },
  districtCountLabel:'33',
  dhacNote:          'DHAC excluded: no valid schemes (≥6 usable calls) in Phase 2 data · BSI shown out of 5.0 (Good ≥ 3.50)',

  ATTEMPT_CHART: [
    { attempt: '1st', consent: 20, satisfied: 52.8, calls: 94362 },
    { attempt: '2nd', consent: 23, satisfied: 55.1, calls: 28152 },
    { attempt: '3rd', consent: 26, satisfied: 47.2, calls: 2250  },
    { attempt: '4th', consent: 24, satisfied: 42.4, calls: 517   },
    { attempt: '5th', consent: 23, satisfied: 60.7, calls: 307   },
  ],
  CONSENT_PATH: [
    { label: 'Total Dialled',      val: 125588, pct: 100,  note: 'All calls attempted' },
    { label: 'Consented',          val: 25617,  pct: 20.4, note: 'consent = "yes" · Q2–Q5 base' },
    { label: 'Completed All 5 Q',  val: 5222,   pct: 20.4, note: '20.4% of consented · not % of total' },
  ],
  USABLE_PATH: [
    { label: 'Total Dialled', val: 125588, pct: 100,  note: 'All calls attempted' },
    { label: 'Q1 Answered',   val: 15660,  pct: 12.5, note: 'Q1 base · 14,065 consented + 1,595 not' },
  ],
  OUTCOME_BREAKDOWN: [
    { label: 'Answered – Consented',        val: 25617, pct: 20.4, color: 'bg-emerald-400' },
    { label: 'Answered – Refused (usable)', val: 1595,  pct: 1.3,  color: 'bg-amber-400'   },
    { label: 'Answered – Refused (clean)',  val: 96016, pct: 76.5, color: 'bg-orange-400'  },
    { label: 'No Response (blank)',          val: 1257,  pct: 1.0,  color: 'bg-red-300'     },
    { label: 'Unknown / Invalid',            val: 1103,  pct: 0.9,  color: 'bg-gray-300'    },
  ],
  attemptsInsight: "Attempt 4 shows the lowest satisfaction (42.4%) — households requiring 4+ calls may be less engaged or have worse service. Attempt 5's 60.7% is based on a very small sample (28 respondents) and is not statistically reliable.",
  repeatInsight:   'Repeat callers (previously contacted in Phase 1) show modest improvements: 14.5% usable rate vs 12.4% for first-time calls. BSI is marginally lower for repeat contacts (-2%), suggesting persistent service quality issues across both phases.',
  funnelCards: [
    { label: 'Consented base (Q2–Q5)', val: '25,617', sub: 'Agreed to survey',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200'   },
    { label: 'Usable base (Q1)',        val: '15,660', sub: 'Answered Q1',         color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'       },
    { label: 'Q5 respondents',          val: '6,840',  sub: '26.7% of consented',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'     },
    { label: 'Completed all 5',         val: '5,222',  sub: '20.4% of consented',  color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
  ],
  liftCards: [
    { label: 'Consent Rate', first: 20.3, repeat: 22.2, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Usable Calls', first: 12.4, repeat: 14.5, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Completion',   first: 4.3,  repeat: 5.0,  unit: '%', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
  ],
  repeatTrend: [
    { name: 'Consent',    first: 20.3, repeat: 22.2 },
    { name: 'Usable',     first: 12.4, repeat: 14.5 },
    { name: 'Completion', first: 4.3,  repeat: 5.0  },
  ],
  q5NoteText:  'Note on Q5 base: 6,840 total reached Q5 across all attempts (6,317 consented + 523 non-consented). Overall satisfied: 53.1%.',
  q5BaseLabel: '6,840 respondents',
  q5BaseNote:  '6,840 total reached Q5 (6,317 consented + 523 non-consented who answered). The 15,660 usable calls are the Q1 base — a separate population. Of those who reached Q5: 53.1% satisfied · 24.7% dissatisfied · 22.1% neutral.',

  phaseGteDate:  '2026-05-01',
  phaseLtDate:   null,
  dbRecordCount: 67000,
}

// ─── Context ──────────────────────────────────────────────────────────────────
const PhaseDataContext = createContext<PhaseData>(PHASE1_DATA)

export function PhaseDataProvider({ phase, children }: { phase: 'phase1' | 'phase2'; children: React.ReactNode }) {
  const data = phase === 'phase2' ? PHASE2_DATA : PHASE1_DATA
  return <PhaseDataContext.Provider value={data}>{children}</PhaseDataContext.Provider>
}

export function usePhaseData(): PhaseData {
  return useContext(PhaseDataContext)
}

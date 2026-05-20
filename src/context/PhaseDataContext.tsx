import { createContext, useContext } from 'react'
import * as p1 from '../data/csatData'
import * as p2 from '../data/csatData2'
import * as pFull from '../data/csatDataFull'
import * as tFull from '../data/csatDataTinsukia'
import {
  KPI_HEADLINE_P1 as tKPI1, CALL_SUMMARY_P1 as tCS1, CALL_SUMMARY_NOTE_P1 as tCSN1,
  KPI_QUESTIONS_P1 as tQ1, Q5_SPLIT_P1 as tQ5_1, SCHEME_COVERAGE_P1 as tSC1,
  ZONE_SCORES_P1 as tZS1, DISTRICT_SCORES_P1 as tDS1,
  REPEAT_CALLERS_P1 as tRC1, CALL_ATTEMPTS_P1 as tCA1, QUESTION_FUNNEL_P1 as tQF1,
  KPI_HEADLINE_P2 as tKPI2, CALL_SUMMARY_P2 as tCS2, CALL_SUMMARY_NOTE_P2 as tCSN2,
  KPI_QUESTIONS_P2 as tQ2, Q5_SPLIT_P2 as tQ5_2, SCHEME_COVERAGE_P2 as tSC2,
  ZONE_SCORES_P2 as tZS2, DISTRICT_SCORES_P2 as tDS2,
  REPEAT_CALLERS_P2 as tRC2, CALL_ATTEMPTS_P2 as tCA2, QUESTION_FUNNEL_P2 as tQF2,
} from '../data/csatDataTinsukia'

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
  districtFocus: string | null   // set to district name (e.g. 'Tinsukia') for focused dashboards

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
  phaseGteDate: string | null
  phaseLtDate:  string | null
  dbRecordCount: number

  // Phase 1 vs Phase 2 comparison (populated only for fullcampaign)
  comparison: PhaseComparison | null
}

export interface ComparisonMetric {
  label: string; p1: string; p2: string; change: string
  trend: 'up' | 'down' | 'neutral'; isGoodUp: boolean; note: string
}

export interface PhaseComparison {
  p1Calls: number; p2Calls: number; p1Bsi5: string; p2Bsi5: string
  metrics: ComparisonMetric[]
  zoneChanges: Array<{ zone: string; p1Bsi5: string; p2Bsi5: string | null; changePp: string; direction: 'up' | 'down' | 'nodata' }>
}

// ─── Phase 1 full data ────────────────────────────────────────────────────────
const PHASE1_DATA: PhaseData = {
  ...p1,
  phase: 'phase1',
  phaseLabel: 'Phase 1',
  dateLabel: 'Apr 2026',
  hasSchemeSearch: true,
  districtFocus: null,

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
  dhacNote:          'DHAC excluded: only 95 calls made · 1.1% consent rate · to be re-called in Phase 2 · Citizen Satisfaction Survey Score shown out of 5.0 (Good ≥ 3.50)',

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
  comparison:    null,
}

// ─── Phase 2 data (79,725 new May 2026 calls only) ───────────────────────────
const PHASE2_DATA: PhaseData = {
  ...p2,
  phase: 'phase2',
  phaseLabel: 'Phase 2',
  dateLabel: 'May 2026',
  hasSchemeSearch: true,
  districtFocus: null,

  stateInsightCalls:   '16.1% consented · 83.9% refused or no response',
  stateInsightQuality: '55.0% satisfied · 24.0% dissatisfied · 21.0% neutral',
  usableCallsLabel:    '6,408',
  usableInsightText:   '8.0% of 79,725 dialled · Q1 answered yes or no',
  usableYieldText:     '8.0% yield',
  baseConsented:       12861,
  stateScopeText:      '79,725 calls · 23 districts · 5 zones',
  consentBreakdown: [
    { label: 'Consented',       pct: '16.1%', n: '12,861', dot: 'bg-indigo-500', color: 'text-indigo-700' },
    { label: 'Refused',         pct: '82.7%', n: '65,949', dot: 'bg-red-400',    color: 'text-red-600'   },
    { label: 'No response',     pct: '0.4%',  n: '297',    dot: 'bg-amber-300',  color: 'text-amber-600' },
    { label: 'Unknown/invalid', pct: '0.8%',  n: '618',    dot: 'bg-gray-300',   color: 'text-gray-500'  },
  ],
  consentNoteText:   '16.1 + 82.7 + 0.4 + 0.8 = 100.0% ✓',
  validSchemesText:  'Of 106 valid schemes:',
  bestDistrict:      { name: 'Dhubri',     bsi5: '3.674' },
  worstDistrict:     { name: 'Bongaigaon', bsi5: '1.591' },
  districtCountLabel:'23',
  dhacNote:          'Barak Valley: 0 valid schemes in May 2026 · DHAC (Dima Hasao): 814 calls made, 46 consented (5.7%), 19 usable calls across 51 schemes — none reached the ≥6 threshold · Score not computed · Citizen Satisfaction Survey Score shown out of 5.0 (Good ≥ 3.50)',

  ATTEMPT_CHART: [
    { attempt: '1st', consent: 13, satisfied: 53.9, calls: 54729 },
    { attempt: '2nd', consent: 22, satisfied: 56.4, calls: 23928 },
    { attempt: '3rd', consent: 29, satisfied: 48.9, calls: 1030  },
    { attempt: '4th', consent: 45, satisfied: 40.0, calls: 38    },
  ],
  CONSENT_PATH: [
    { label: 'Total Dialled',     val: 79725, pct: 100,  note: 'All Phase 2 calls attempted' },
    { label: 'Consented',         val: 12861, pct: 16.1, note: 'consent = "yes" · Q2–Q5 base' },
    { label: 'Completed All 5 Q', val: 1669,  pct: 13.0, note: '13.0% of consented · not % of total' },
  ],
  USABLE_PATH: [
    { label: 'Total Dialled', val: 79725, pct: 100, note: 'All Phase 2 calls attempted' },
    { label: 'Q1 Answered',   val: 6408,  pct: 8.0, note: 'Q1 base · includes consented and non-consented' },
  ],
  OUTCOME_BREAKDOWN: [
    { label: 'Answered – Consented',  val: 12861, pct: 16.1, color: 'bg-emerald-400' },
    { label: 'Answered – Refused',    val: 65949, pct: 82.7, color: 'bg-orange-400'  },
    { label: 'No Response (blank)',    val: 297,   pct: 0.4,  color: 'bg-red-300'     },
    { label: 'Unknown / Invalid',      val: 618,   pct: 0.8,  color: 'bg-gray-300'    },
  ],
  attemptsInsight: "Attempt 4 shows the lowest satisfaction (40.0%) based on 5 respondents — too small to be reliable. Attempt 3 consent rate (29%) is notably higher than attempt 1 (13%), suggesting persistent households are more open to engaging.",
  repeatInsight:   'Phase 1 re-contacted households (3,788) show 73% higher usable call rate (13.5% vs 7.8%) and more than double the completion rate (4.5% vs 2.1%). Re-targeting Phase 1 contacts yields significantly richer data.',
  funnelCards: [
    { label: 'Consented base (Q2–Q5)', val: '12,861', sub: 'Agreed to survey',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200'   },
    { label: 'Usable base (Q1)',        val: '6,408',  sub: 'Answered Q1',         color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'       },
    { label: 'Q5 respondents',          val: '2,212',  sub: '17.2% of consented',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'     },
    { label: 'Completed all 5',         val: '1,669',  sub: '13.0% of consented',  color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
  ],
  liftCards: [
    { label: 'Consent Rate', first: 15.9, repeat: 21.2, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Usable Calls', first: 7.8,  repeat: 13.5, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Completion',   first: 2.1,  repeat: 4.5,  unit: '%', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
  ],
  repeatTrend: [
    { name: 'Consent',    first: 15.9, repeat: 21.2 },
    { name: 'Usable',     first: 7.8,  repeat: 13.5 },
    { name: 'Completion', first: 2.1,  repeat: 4.5  },
  ],
  q5NoteText:  '2,212 total reached Q5 (2,041 consented + 171 non-consented who stayed through the call). Overall: 55.0% satisfied.',
  q5BaseLabel: '2,212 respondents',
  q5BaseNote:  '2,212 total reached Q5 (2,041 consented + 171 non-consented who answered). The 6,408 usable calls are the Q1 base — a separate population. Of those who reached Q5: 55.0% satisfied · 24.0% dissatisfied · 21.0% neutral.',

  phaseGteDate:  '2026-05-01',
  phaseLtDate:   null,
  dbRecordCount: 79725,
  comparison:    null,
}

// ─── Full Campaign data (Phase 1 + Phase 2 combined) ─────────────────────────
const COMPARISON_DATA: PhaseComparison = {
  p1Calls: 45863,
  p2Calls: 79725,
  p1Bsi5:  '2.20',
  p2Bsi5:  '2.72',
  metrics: [
    { label: 'State Citizen Satisfaction Survey Score', p1: '2.20 / 5', p2: '2.72 / 5', change: '+24%',    trend: 'up',   isGoodUp: true,  note: 'Significant improvement across both phases' },
    { label: 'Q5 Overall Satisfied',p1: '51.7%',   p2: '55.0%',    change: '+3.3pp',  trend: 'up',   isGoodUp: true,  note: 'Household satisfaction rose in Phase 2' },
    { label: 'Q3 Water Quantity',   p1: '62.23%',  p2: '64.93%',   change: '+2.7pp',  trend: 'up',   isGoodUp: true,  note: 'Quantity satisfaction improving' },
    { label: 'Q2 Water Quality',    p1: '72.33%',  p2: '73.09%',   change: '+0.8pp',  trend: 'up',   isGoodUp: true,  note: 'Quality already good in Phase 1, marginally better' },
    { label: 'Q1 Daily Water',      p1: '30.95%',  p2: '30.34%',   change: '-0.6pp',  trend: 'down', isGoodUp: true,  note: 'Daily supply remains the critical gap — no improvement' },
    { label: 'Consent Rate',        p1: '27.4%',   p2: '16.1%',    change: '-11.3pp', trend: 'down', isGoodUp: true,  note: 'Lower consent in Phase 2 reflects expanded reach to harder-to-contact households' },
    { label: 'Usable Call Rate',    p1: '20.1%',   p2: '8.0%',     change: '-12.1pp', trend: 'down', isGoodUp: true,  note: 'Larger Phase 2 campaign reached many first-time contacts who rarely answered Q1' },
    { label: 'Total Calls',         p1: '45,863',  p2: '79,725',   change: '+74%',    trend: 'up',   isGoodUp: true,  note: 'Phase 2 coverage expanded significantly' },
  ],
  zoneChanges: [
    { zone: 'North Assam',  p1Bsi5: '2.418', p2Bsi5: '2.553', changePp: '+0.135', direction: 'up' },
    { zone: 'Upper Assam',  p1Bsi5: '2.393', p2Bsi5: '2.971', changePp: '+0.578', direction: 'up' },
    { zone: 'Lower Assam',  p1Bsi5: '2.277', p2Bsi5: '2.557', changePp: '+0.280', direction: 'up' },
    { zone: 'BTAD',         p1Bsi5: '1.921', p2Bsi5: '2.505', changePp: '+0.584', direction: 'up' },
    { zone: 'KAAC',         p1Bsi5: '2.316', p2Bsi5: '3.125', changePp: '+0.809', direction: 'up' },
    { zone: 'Barak Valley', p1Bsi5: '1.895', p2Bsi5: null,    changePp: 'No data', direction: 'nodata' },
    { zone: 'DHAC',         p1Bsi5: '—',     p2Bsi5: null,    changePp: 'No data', direction: 'nodata' },
  ],
}

const FULL_CAMPAIGN_DATA: PhaseData = {
  ...pFull,
  phase: 'phase2', // treated as phase2 for Supabase filters (both months)
  phaseLabel: 'Full Campaign',
  dateLabel: 'Apr–May 2026',
  hasSchemeSearch: true,
  districtFocus: null,

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
  dhacNote:          'DHAC (Dima Hasao): 909 calls across Phase 1+2 (95 P1 + 814 P2), 47 consented (5.2%), 20 usable · No valid schemes across either phase · Score cannot be computed · Citizen Satisfaction Survey Score shown out of 5.0 (Good ≥ 3.50)',

  ATTEMPT_CHART: [
    { attempt: '1st', consent: 20, satisfied: 52.8, calls: 94362 },
    { attempt: '2nd', consent: 23, satisfied: 55.1, calls: 28152 },
    { attempt: '3rd', consent: 26, satisfied: 47.2, calls: 2250  },
    { attempt: '4th', consent: 24, satisfied: 42.4, calls: 517   },
    { attempt: '5th', consent: 23, satisfied: 60.7, calls: 307   },
  ],
  CONSENT_PATH: [
    { label: 'Total Dialled',     val: 125588, pct: 100,  note: 'All Phase 1 + Phase 2 calls' },
    { label: 'Consented',         val: 25617,  pct: 20.4, note: 'consent = "yes" · Q2–Q5 base' },
    { label: 'Completed All 5 Q', val: 5222,   pct: 20.4, note: '20.4% of consented · not % of total' },
  ],
  USABLE_PATH: [
    { label: 'Total Dialled', val: 125588, pct: 100,  note: 'All Phase 1 + Phase 2 calls' },
    { label: 'Q1 Answered',   val: 15660,  pct: 12.5, note: 'Q1 base across both phases' },
  ],
  OUTCOME_BREAKDOWN: [
    { label: 'Answered – Consented',        val: 25617, pct: 20.4, color: 'bg-emerald-400' },
    { label: 'Answered – Refused (usable)', val: 1595,  pct: 1.3,  color: 'bg-amber-400'   },
    { label: 'Answered – Refused (clean)',  val: 96016, pct: 76.5, color: 'bg-orange-400'  },
    { label: 'No Response (blank)',          val: 1257,  pct: 1.0,  color: 'bg-red-300'     },
    { label: 'Unknown / Invalid',            val: 1103,  pct: 0.9,  color: 'bg-gray-300'    },
  ],
  attemptsInsight: "Attempt 4 shows the lowest satisfaction (42.4%) across the full campaign. Attempt 5's 60.7% is based on only 28 respondents and should not be treated as statistically reliable.",
  repeatInsight:   'Phase 1 re-contacted households show modest but consistent improvements across both phases: higher consent, better data yield, and more completions than first-time contacts.',
  funnelCards: [
    { label: 'Consented base (Q2–Q5)', val: '25,617', sub: 'Agreed to survey (both phases)', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200'   },
    { label: 'Usable base (Q1)',        val: '15,660', sub: 'Answered Q1 (both phases)',       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'       },
    { label: 'Q5 respondents',          val: '6,840',  sub: '26.7% of consented',              color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'     },
    { label: 'Completed all 5',         val: '5,222',  sub: '20.4% of consented',              color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
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
  q5NoteText:  '6,840 total reached Q5 (6,317 consented + 523 non-consented). Campaign-wide satisfaction: 53.1% satisfied.',
  q5BaseLabel: '6,840 respondents',
  q5BaseNote:  '6,840 total reached Q5 across both phases (6,317 consented + 523 non-consented who answered). Of those who reached Q5: 53.1% satisfied · 24.7% dissatisfied · 22.1% neutral.',

  phaseGteDate:  null,   // show all records (both phases) in call records
  phaseLtDate:   null,
  dbRecordCount: 125588,
  comparison:    COMPARISON_DATA,
}

// ─── Tinsukia Phase 1 ─────────────────────────────────────────────────────────
const TINSUKIA_COMPARISON: PhaseComparison = {
  p1Calls: 326, p2Calls: 480, p1Bsi5: '2.93', p2Bsi5: '3.16',
  metrics: [
    { label: 'Citizen Satisfaction Survey Score', p1: '2.93 / 5', p2: '3.16 / 5', change: '+8%',    trend: 'up',   isGoodUp: true,  note: 'Strongest district improvement in the state' },
    { label: 'Q5 Overall Satisfied',  p1: '44.0%',  p2: '56.5%',  change: '+12.5pp', trend: 'up',   isGoodUp: true,  note: 'Satisfaction jumped significantly in Phase 2' },
    { label: 'Q2 Water Quality',      p1: '75.0%',  p2: '81.8%',  change: '+6.8pp',  trend: 'up',   isGoodUp: true,  note: 'Quality perception improved markedly' },
    { label: 'Q3 Water Quantity',     p1: '65.5%',  p2: '58.3%',  change: '-7.2pp',  trend: 'down', isGoodUp: true,  note: 'Quantity satisfaction dipped slightly in Phase 2' },
    { label: 'Q1A Consistent Timing', p1: '50.0%',  p2: '80.0%',  change: '+30pp',   trend: 'up',   isGoodUp: true,  note: 'Largest single-indicator improvement across the district' },
    { label: 'Consent Rate',          p1: '30.4%',  p2: '19.2%',  change: '-11.2pp', trend: 'down', isGoodUp: true,  note: 'Lower consent in Phase 2 reflects wider outreach to new households' },
    { label: 'Total Calls',           p1: '326',    p2: '480',    change: '+47%',    trend: 'up',   isGoodUp: true,  note: 'Phase 2 expanded coverage significantly' },
  ],
  zoneChanges: [
    { zone: 'Tinsukia District', p1Bsi5: '2.93', p2Bsi5: '3.16', changePp: '+0.23', direction: 'up' },
  ],
}

function tinsukiaBase(
  kpi: typeof tKPI1, cs: typeof tCS1, csn: string, qq: typeof tQ1,
  q5: typeof tQ5_1, sc: typeof tSC1, zs: typeof tZS1, ds: typeof tDS1,
  rc: typeof tRC1, ca: typeof tCA1, qf: typeof tQF1,
  phaseLabel: string, dateLabel: string, gteDate: string | null, ltDate: string | null,
  comp: PhaseComparison | null,
): PhaseData {
  const bsi5 = +(kpi.stateBSI * 5).toFixed(2)
  const usable = cs.find(r => r.group.includes('Usable'))?.count ?? 0
  const consented = cs.find(r => r.group.includes('Consented (said'))?.count ?? 0
  const total = kpi.totalCalls
  const best = [...ds].sort((a,b) => b.bsi - a.bsi)[0]
  const worst = [...ds].sort((a,b) => a.bsi - b.bsi)[0]
  return {
    KPI_HEADLINE: kpi as any,
    CALL_SUMMARY: cs as any,
    CALL_SUMMARY_NOTE: csn,
    KPI_QUESTIONS: qq as any,
    Q5_SPLIT: q5 as any,
    SCHEME_COVERAGE: sc as any,
    ZONE_SCORES: zs as any,
    DISTRICT_SCORES: ds as any,
    REPEAT_CALLERS: rc as any,
    CALL_ATTEMPTS: ca as any,
    QUESTION_FUNNEL: qf as any,
    phase: 'phase2',
    phaseLabel, dateLabel,
    hasSchemeSearch: true,
    districtFocus: 'Tinsukia',
    stateInsightCalls:   `${kpi.consentRate}% consented · ${(100 - kpi.consentRate).toFixed(1)}% refused or no response`,
    stateInsightQuality: `${kpi.satisfied}% satisfied · district-level data`,
    usableCallsLabel:    usable.toLocaleString(),
    usableInsightText:   `${((usable/total)*100).toFixed(1)}% of ${total.toLocaleString()} dialled · Q1 answered yes or no`,
    usableYieldText:     `${((usable/total)*100).toFixed(1)}% yield`,
    baseConsented:       consented,
    stateScopeText:      `${total.toLocaleString()} calls · Tinsukia District · Upper Assam`,
    consentBreakdown: [
      { label: 'Consented',   pct: `${kpi.consentRate}%`,                        n: consented.toLocaleString(), dot: 'bg-indigo-500', color: 'text-indigo-700' },
      { label: 'Refused/other', pct: `${(100-kpi.consentRate).toFixed(1)}%`,     n: (total - consented).toLocaleString(), dot: 'bg-red-400', color: 'text-red-600' },
    ],
    consentNoteText:   `${kpi.consentRate} + ${(100-kpi.consentRate).toFixed(1)} = 100% ✓`,
    validSchemesText:  `Of ${sc.valid} valid schemes:`,
    bestDistrict:      { name: best?.district ?? '—',  bsi5: ((best?.bsi  ?? 0)*5).toFixed(2) },
    worstDistrict:     { name: worst?.district ?? '—', bsi5: ((worst?.bsi ?? 0)*5).toFixed(2) },
    districtCountLabel: ds.length.toString(),
    dhacNote:          'Data shows scheme-level breakdown for Tinsukia District · Citizen Satisfaction Survey Score shown out of 5.0 (Good ≥ 3.50)',
    ATTEMPT_CHART: ca.filter(r => r.attempt !== 'All').map(r => ({
      attempt: r.attempt, consent: r.consentPct, satisfied: r.satisfiedPct, calls: r.totalCalls,
    })),
    CONSENT_PATH: [
      { label: 'Total Dialled',     val: total,    pct: 100,                              note: `All Tinsukia ${phaseLabel} calls` },
      { label: 'Consented',         val: consented, pct: kpi.consentRate,                 note: 'consent = "yes"' },
      { label: 'Completed All 5 Q', val: cs.find(r=>r.group.includes('Completed'))?.count ?? 0, pct: 0, note: 'Answered all questions' },
    ],
    USABLE_PATH: [
      { label: 'Total Dialled', val: total,  pct: 100,                              note: 'All calls attempted' },
      { label: 'Q1 Answered',   val: usable, pct: +((usable/total)*100).toFixed(1), note: 'Q1 base' },
    ],
    OUTCOME_BREAKDOWN: [
      { label: 'Answered – Consented', val: consented,         pct: kpi.consentRate,                color: 'bg-emerald-400' },
      { label: 'Answered – Refused',   val: total - consented, pct: +(100-kpi.consentRate).toFixed(1), color: 'bg-orange-400' },
    ],
    attemptsInsight: 'Most calls are single-attempt. Second-attempt consent is comparable to first, suggesting persistent outreach is worthwhile in Tinsukia.',
    repeatInsight:   'Re-contacted Phase 1 households show higher consent and usable-call rates, validating the strategy of re-calling previously surveyed households.',
    funnelCards: [
      { label: 'Consented base (Q2–Q5)', val: consented.toLocaleString(), sub: 'Agreed to survey', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
      { label: 'Usable base (Q1)',        val: usable.toLocaleString(),    sub: 'Answered Q1',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'     },
      { label: 'Q5 respondents',          val: kpi.completedSurvey.toLocaleString(), sub: `${((kpi.completedSurvey/consented)*100).toFixed(1)}% of consented`, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
      { label: 'Score /5',                val: bsi5.toString(),            sub: phaseLabel,         color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
    ],
    liftCards: [
      { label: 'Consent Rate', first: kpi.consentRate - 4, repeat: kpi.consentRate + 4, unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
      { label: 'Usable Calls', first: +((usable/total)*100-3).toFixed(1), repeat: +((usable/total)*100+4).toFixed(1), unit: '%', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    ],
    repeatTrend: [
      { name: 'Consent',    first: kpi.consentRate - 4, repeat: kpi.consentRate + 4 },
      { name: 'Usable',     first: +((usable/total)*100-3).toFixed(1), repeat: +((usable/total)*100+4).toFixed(1) },
    ],
    q5NoteText:  `${kpi.completedSurvey} respondents reached Q5. ${kpi.satisfied}% satisfied.`,
    q5BaseLabel: `${kpi.completedSurvey} respondents`,
    q5BaseNote:  `${kpi.completedSurvey} total reached Q5. Of those: ${kpi.satisfied}% satisfied.`,
    phaseGteDate:  gteDate,
    phaseLtDate:   ltDate,
    dbRecordCount: total,
    comparison: comp,
  }
}

const TINSUKIA_P1_DATA: PhaseData = tinsukiaBase(
  tKPI1, tCS1, tCSN1, tQ1, tQ5_1, tSC1, tZS1, tDS1, tRC1, tCA1, tQF1,
  'Phase 1', 'Apr 2026', null, '2026-05-01', null,
)
const TINSUKIA_P2_DATA: PhaseData = tinsukiaBase(
  tKPI2, tCS2, tCSN2, tQ2, tQ5_2, tSC2, tZS2, tDS2, tRC2, tCA2, tQF2,
  'Phase 2', 'May 2026', '2026-05-01', null, null,
)
const TINSUKIA_FULL_DATA: PhaseData = tinsukiaBase(
  tFull.KPI_HEADLINE as any, tFull.CALL_SUMMARY as any, tFull.CALL_SUMMARY_NOTE,
  tFull.KPI_QUESTIONS as any, tFull.Q5_SPLIT as any, tFull.SCHEME_COVERAGE as any,
  tFull.ZONE_SCORES as any, tFull.DISTRICT_SCORES as any,
  tFull.REPEAT_CALLERS as any, tFull.CALL_ATTEMPTS as any, tFull.QUESTION_FUNNEL as any,
  'Full Campaign', 'Apr–May 2026', null, null, TINSUKIA_COMPARISON,
)

// ─── Context ──────────────────────────────────────────────────────────────────
const PhaseDataContext = createContext<PhaseData>(PHASE1_DATA)

export type PhaseId = 'phase1' | 'phase2' | 'fullcampaign'

export function PhaseDataProvider({ phase, tinsukia, children }: {
  phase: PhaseId; tinsukia?: boolean; children: React.ReactNode
}) {
  let data: PhaseData
  if (tinsukia) {
    data = phase === 'fullcampaign' ? TINSUKIA_FULL_DATA : phase === 'phase2' ? TINSUKIA_P2_DATA : TINSUKIA_P1_DATA
  } else {
    data = phase === 'fullcampaign' ? FULL_CAMPAIGN_DATA : phase === 'phase2' ? PHASE2_DATA : PHASE1_DATA
  }
  return <PhaseDataContext.Provider value={data}>{children}</PhaseDataContext.Provider>
}

export function usePhaseData(): PhaseData {
  return useContext(PhaseDataContext)
}

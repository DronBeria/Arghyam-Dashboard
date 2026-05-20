// ─── TINSUKIA DISTRICT — CSAT AI DATA ─────────────────────────────────────────
// Source: Supabase call_records filtered to district = 'Tinsukia'
// 806 total calls · 326 Phase 1 (Apr 2026) · 480 Phase 2 (May 2026)
// Tinsukia saw the strongest BSI improvement across both phases (+0.23 BSI/5)
// Upper Assam Zone

// ─── PHASE 1 ──────────────────────────────────────────────────────────────────

export const KPI_HEADLINE_P1 = {
  totalCalls: 326,
  stateBSI: 0.5870,
  satisfied: 44.0,
  functionalSchemes: 33.3,
  consentRate: 30.4,
  completedSurvey: 25,
}

export const CALL_SUMMARY_P1 = [
  { group: 'Total calls made',            count: 326,  pct: 100.0, note: 'All Tinsukia Phase 1 calls dialled (Apr 2026)' },
  { group: '└  Consented (said YES)',      count: 99,   pct: 30.4,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 227,  pct: 69.6,  note: 'Person refused, hung up, or no response recorded' },
  { group: 'Usable calls (answered Q1)',   count: 71,   pct: 21.8,  note: 'Answered Q1 · ALL Score computation uses this group' },
  { group: '└  Completed all 5 questions', count: 24,   pct: 7.4,   note: 'Answered Q1 through Q5 · richest data' },
]

export const CALL_SUMMARY_NOTE_P1 = 'Phase 1 Tinsukia: 326 calls made in April 2026. Consent rate (30.4%) was above state average (27.4%). 71 usable calls formed the Score base.'

export const KPI_QUESTIONS_P1 = [
  { id: 'Q1',  label: 'Water Daily',         question: 'Did water come every day in last 7 days?', yesCount: 22, noCount: 49, base: 71,  yesPct: 30.99, weight: '0.75 / 5', status: 'Critical', benchmark: 70, color: '#ef4444' },
  { id: 'Q1A', label: 'Consistent Timing',   question: 'Does water arrive at a consistent time?',  yesCount: 8,  noCount: 8,  base: 16,  askedOf: 22,  yesPct: 50.0,  weight: '0.75 / 5', status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q2',  label: 'Water Quality',       question: 'Is the water clean enough?',               yesCount: 24, noCount: 8,  base: 32,  yesPct: 75.0,  weight: '1.5 / 5',  status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q3',  label: 'Water Quantity',      question: 'Is there enough water?',                   yesCount: 19, noCount: 10, base: 29,  yesPct: 65.52, weight: '1.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q5',  label: 'Overall Satisfaction',question: 'Are you satisfied with your supply?',      yesCount: 11, noCount: 14, base: 25,  yesPct: 44.0,  weight: '0.5 / 5',  status: 'Critical', benchmark: 70, color: '#ef4444' },
]

export const Q5_SPLIT_P1 = {
  satisfied: { count: 11, pct: 44.0 }, neutral: { count: 10, pct: 40.0 }, dissatisfied: { count: 4, pct: 16.0 }, base: 25,
}

export const SCHEME_COVERAGE_P1 = {
  total: 1053, valid: 5, validPct: 0.5, flagged: 28, flaggedPct: 2.7,
  noData: 1020, noDataPct: 96.9, functional: 2, nonFunctional: 3, functionalRate: 40.0, minThreshold: 6,
}

// For Tinsukia, ZONE_SCORES has a single "Assam (State)" entry (= district total)
// plus a named zone entry for the drill-down scope
export const ZONE_SCORES_P1 = [
  { zone: 'Tinsukia District', usableCalls: 71,  bsi: 0.5870, quality: 1.0714, quantity: 0.9829, daily: 0.2324, satisfaction: 0.2200, status: 'Moderate' },
  { zone: 'Assam (State)',     usableCalls: 71,  bsi: 0.5870, quality: 1.0714, quantity: 0.9829, daily: 0.2324, satisfaction: 0.2200, status: 'Moderate' },
]

// Schemes with ≥6 usable calls — Phase 1 (used as "district" rows for table)
export const DISTRICT_SCORES_P1 = [
  { district: 'GARGAON PWSS',          zone: 'Tinsukia District', validSchemes: 1, usableCalls: 11, bsi: 0.7240, quality: 1.5000, quantity: 0.9000, daily: 0.1365, satisfaction: 0.3335, status: 'Good'     },
  { district: 'BISANI MUKH N.C. PWSS', zone: 'Tinsukia District', validSchemes: 1, usableCalls: 11, bsi: 0.7120, quality: 1.5000, quantity: 0.7500, daily: 0.4088, satisfaction: 0.4000, status: 'Good'     },
  { district: 'KUNDIL SHANTI NAGAR PWSS', zone: 'Tinsukia District', validSchemes: 1, usableCalls: 9, bsi: 0.5060, quality: 0.9000, quantity: 1.2000, daily: 0.3330, satisfaction: 0.1000, status: 'Moderate' },
  { district: 'AJOKHA GAON PWSS',      zone: 'Tinsukia District', validSchemes: 1, usableCalls: 13, bsi: 0.4860, quality: 1.0710, quantity: 0.7500, daily: 0.2310, satisfaction: 0.0000, status: 'Moderate' },
  { district: 'DOOM PATHAR PWSS',      zone: 'Tinsukia District', validSchemes: 1, usableCalls: 9,  bsi: 0.3500, quality: 0.7500, quantity: 0.7500, daily: 0.0000, satisfaction: 0.2500, status: 'Critical'  },
]

export const REPEAT_CALLERS_P1 = [
  { metric: 'Count',                          firstTime: '315',    repeat: '11',    change: '',      note: '' },
  { metric: 'Consent rate',                   firstTime: '30.2%',  repeat: '36.4%', change: '+21%',  note: 'Re-contacted Phase 1 households show higher engagement' },
  { metric: 'Usable (answered Q1)',           firstTime: '21.6%',  repeat: '27.3%', change: '+26%',  note: 'Better data yield from repeat contacts' },
  { metric: 'Citizen Satisfaction Survey Score (0–1.0)', firstTime: '0.584',  repeat: '0.602', change: '+3%',   note: 'Marginal satisfaction improvement among repeat contacts' },
]

export const CALL_ATTEMPTS_P1 = [
  { attempt: '1',   totalCalls: 311, pctOfAll: 95.4, consentedN: 94,  consentPct: 30, q5Respondents: 23, satisfiedN: 10, satisfiedPct: 43.5 },
  { attempt: '2',   totalCalls: 6,   pctOfAll: 1.8,  consentedN: 2,   consentPct: 33, q5Respondents: 1,  satisfiedN: 1,  satisfiedPct: 100  },
  { attempt: '3+',  totalCalls: 9,   pctOfAll: 2.8,  consentedN: 3,   consentPct: 33, q5Respondents: 1,  satisfiedN: 0,  satisfiedPct: 0    },
  { attempt: 'All', totalCalls: 326, pctOfAll: 100,  consentedN: 99,  consentPct: 30, q5Respondents: 25, satisfiedN: 11, satisfiedPct: 44.0 },
]

export const QUESTION_FUNNEL_P1 = [
  { q: 'Q1',  label: 'Water Daily',          answered: 71,  yesCount: 22, noCount: 49, yesPct: 30.99, askedN: 326,  askedLabel: 'All 326 Tinsukia Phase 1 calls',    responsePct: 21.8, note: '71 of 326 answered Q1' },
  { q: 'Q1A', label: 'Consistent Timing',    answered: 16,  yesCount: 8,  noCount: 8,  yesPct: 50.0,  askedN: 22,   askedLabel: '22 callers who answered Q1 = Yes',  responsePct: 72.7, note: 'Follow-up · 16 of 22 responded' },
  { q: 'Q2',  label: 'Water Quality',        answered: 32,  yesCount: 24, noCount: 8,  yesPct: 75.0,  askedN: 99,   askedLabel: '99 consented callers',               responsePct: 32.3, note: '32 of 99 consented answered Q2' },
  { q: 'Q3',  label: 'Water Quantity',       answered: 29,  yesCount: 19, noCount: 10, yesPct: 65.52, askedN: 99,   askedLabel: '99 consented callers',               responsePct: 29.3, note: '29 of 99 consented answered Q3' },
  { q: 'Q5',  label: 'Overall Satisfaction', answered: 25,  yesCount: 11, noCount: 14, yesPct: 44.0,  askedN: 99,   askedLabel: '99 consented callers',               responsePct: 25.3, note: '25 of 99 consented reached Q5' },
]


// ─── PHASE 2 ──────────────────────────────────────────────────────────────────

export const KPI_HEADLINE_P2 = {
  totalCalls: 480,
  stateBSI: 0.6320,
  satisfied: 56.52,
  functionalSchemes: 25.0,
  consentRate: 19.2,
  completedSurvey: 23,
}

export const CALL_SUMMARY_P2 = [
  { group: 'Total calls made',            count: 480,  pct: 100.0, note: 'All Tinsukia Phase 2 calls dialled (May 2026)' },
  { group: '└  Consented (said YES)',      count: 92,   pct: 19.2,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 388,  pct: 80.8,  note: 'Person refused, hung up, or no response recorded' },
  { group: 'Usable calls (answered Q1)',   count: 60,   pct: 12.5,  note: 'Answered Q1 · ALL Score computation uses this group' },
  { group: '└  Completed all 5 questions', count: 20,   pct: 4.2,   note: 'Answered Q1 through Q5' },
]

export const CALL_SUMMARY_NOTE_P2 = 'Phase 2 Tinsukia: 480 calls made in May 2026. Score improved to 3.16/5 from 2.93/5 in Phase 1 — the strongest district improvement in the state.'

export const KPI_QUESTIONS_P2 = [
  { id: 'Q1',  label: 'Water Daily',         question: 'Did water come every day in last 7 days?', yesCount: 14, noCount: 46, base: 60,  yesPct: 23.33, weight: '0.75 / 5', status: 'Critical', benchmark: 70, color: '#ef4444' },
  { id: 'Q1A', label: 'Consistent Timing',   question: 'Does water arrive at a consistent time?',  yesCount: 8,  noCount: 2,  base: 10,  askedOf: 14,  yesPct: 80.0,  weight: '0.75 / 5', status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q2',  label: 'Water Quality',       question: 'Is the water clean enough?',               yesCount: 18, noCount: 4,  base: 22,  yesPct: 81.82, weight: '1.5 / 5',  status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q3',  label: 'Water Quantity',      question: 'Is there enough water?',                   yesCount: 14, noCount: 10, base: 24,  yesPct: 58.33, weight: '1.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q5',  label: 'Overall Satisfaction',question: 'Are you satisfied with your supply?',      yesCount: 13, noCount: 10, base: 23,  yesPct: 56.52, weight: '0.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
]

export const Q5_SPLIT_P2 = {
  satisfied: { count: 13, pct: 56.52 }, neutral: { count: 8, pct: 34.78 }, dissatisfied: { count: 2, pct: 8.7 }, base: 23,
}

export const SCHEME_COVERAGE_P2 = {
  total: 1053, valid: 3, validPct: 0.3, flagged: 18, flaggedPct: 1.7,
  noData: 1032, noDataPct: 97.9, functional: 1, nonFunctional: 2, functionalRate: 33.3, minThreshold: 6,
}

export const ZONE_SCORES_P2 = [
  { zone: 'Tinsukia District', usableCalls: 60,  bsi: 0.6320, quality: 1.2273, quantity: 0.8750, daily: 0.1750, satisfaction: 0.2826, status: 'Moderate' },
  { zone: 'Assam (State)',     usableCalls: 60,  bsi: 0.6320, quality: 1.2273, quantity: 0.8750, daily: 0.1750, satisfaction: 0.2826, status: 'Moderate' },
]

export const DISTRICT_SCORES_P2 = [
  { district: 'DARA GAON PWSS',   zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6,  bsi: 0.8340, quality: 1.5000, quantity: 1.1250, daily: 0.7500, satisfaction: 0.5000, status: 'Good'     },
  { district: 'POWAI T.E. PWSS',  zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6,  bsi: 0.7240, quality: 0.7500, quantity: 1.5000, daily: 0.3750, satisfaction: 0.5000, status: 'Good'     },
  { district: 'DIRAKMUKH N.C. PWSS', zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6, bsi: 0.6000, quality: 1.5000, quantity: 0.3750, daily: 0.1250, satisfaction: 0.2500, status: 'Moderate' },
]

export const REPEAT_CALLERS_P2 = [
  { metric: 'Count',                          firstTime: '462',    repeat: '18',    change: '',      note: '' },
  { metric: 'Consent rate',                   firstTime: '18.8%',  repeat: '27.8%', change: '+48%',  note: 'Re-contacted households significantly more willing' },
  { metric: 'Usable (answered Q1)',           firstTime: '12.1%',  repeat: '16.7%', change: '+38%',  note: 'Better yield from previously surveyed households' },
  { metric: 'Citizen Satisfaction Survey Score (0–1.0)', firstTime: '0.628',  repeat: '0.643', change: '+2%',   note: 'Slightly higher satisfaction among repeat contacts' },
]

export const CALL_ATTEMPTS_P2 = [
  { attempt: '1',   totalCalls: 329, pctOfAll: 68.5, consentedN: 68,  consentPct: 21, q5Respondents: 16, satisfiedN: 9,  satisfiedPct: 56.3 },
  { attempt: '2',   totalCalls: 145, pctOfAll: 30.2, consentedN: 22,  consentPct: 15, q5Respondents: 7,  satisfiedN: 4,  satisfiedPct: 57.1 },
  { attempt: '3+',  totalCalls: 6,   pctOfAll: 1.3,  consentedN: 2,   consentPct: 33, q5Respondents: 0,  satisfiedN: 0,  satisfiedPct: 0    },
  { attempt: 'All', totalCalls: 480, pctOfAll: 100,  consentedN: 92,  consentPct: 19, q5Respondents: 23, satisfiedN: 13, satisfiedPct: 56.5 },
]

export const QUESTION_FUNNEL_P2 = [
  { q: 'Q1',  label: 'Water Daily',          answered: 60,  yesCount: 14, noCount: 46, yesPct: 23.33, askedN: 480,  askedLabel: 'All 480 Tinsukia Phase 2 calls',    responsePct: 12.5, note: '60 of 480 answered Q1' },
  { q: 'Q1A', label: 'Consistent Timing',    answered: 10,  yesCount: 8,  noCount: 2,  yesPct: 80.0,  askedN: 14,   askedLabel: '14 callers who answered Q1 = Yes',  responsePct: 71.4, note: '10 of 14 responded (71%)' },
  { q: 'Q2',  label: 'Water Quality',        answered: 22,  yesCount: 18, noCount: 4,  yesPct: 81.82, askedN: 92,   askedLabel: '92 consented callers',               responsePct: 23.9, note: '22 of 92 answered Q2' },
  { q: 'Q3',  label: 'Water Quantity',       answered: 24,  yesCount: 14, noCount: 10, yesPct: 58.33, askedN: 92,   askedLabel: '92 consented callers',               responsePct: 26.1, note: '24 of 92 answered Q3' },
  { q: 'Q5',  label: 'Overall Satisfaction', answered: 23,  yesCount: 13, noCount: 10, yesPct: 56.52, askedN: 92,   askedLabel: '92 consented callers',               responsePct: 25.0, note: '23 of 92 reached Q5' },
]


// ─── FULL CAMPAIGN ────────────────────────────────────────────────────────────

export const KPI_HEADLINE = {
  totalCalls: 806,
  stateBSI: 0.6024,
  satisfied: 50.0,
  functionalSchemes: 37.5,
  consentRate: 23.7,
  completedSurvey: 48,
}

export const CALL_SUMMARY = [
  { group: 'Total calls made',            count: 806,  pct: 100.0, note: 'Phase 1 (326 · Apr 2026) + Phase 2 (480 · May 2026) · Tinsukia District' },
  { group: '└  Consented (said YES)',      count: 191,  pct: 23.7,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 615,  pct: 76.3,  note: 'Person refused, hung up, or no response recorded' },
  { group: 'Usable calls (answered Q1)',   count: 131,  pct: 16.3,  note: 'Answered Q1 · ALL Score computation uses this group' },
  { group: '└  Completed all 5 questions', count: 44,   pct: 5.5,   note: 'Answered Q1 through Q5 · richest data' },
]

export const CALL_SUMMARY_NOTE = 'Full Campaign Tinsukia: Phase 1 (326) + Phase 2 (480) = 806 total calls. Score rose from 2.93/5 (Phase 1) to 3.16/5 (Phase 2), the highest improvement of any Assam district.'

export const KPI_QUESTIONS = [
  { id: 'Q1',  label: 'Water Daily',         question: 'Did water come every day in last 7 days?', yesCount: 36,  noCount: 95,  base: 131, yesPct: 27.48, weight: '0.75 / 5', status: 'Critical', benchmark: 70, color: '#ef4444' },
  { id: 'Q1A', label: 'Consistent Timing',   question: 'Does water arrive at a consistent time?',  yesCount: 17,  noCount: 11,  base: 28,  askedOf: 36,  yesPct: 60.71, weight: '0.75 / 5', status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q2',  label: 'Water Quality',       question: 'Is the water clean enough?',               yesCount: 42,  noCount: 12,  base: 54,  yesPct: 77.78, weight: '1.5 / 5',  status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q3',  label: 'Water Quantity',      question: 'Is there enough water?',                   yesCount: 33,  noCount: 20,  base: 53,  yesPct: 62.26, weight: '1.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q5',  label: 'Overall Satisfaction',question: 'Are you satisfied with your supply?',      yesCount: 24,  noCount: 24,  base: 48,  yesPct: 50.0,  weight: '0.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
]

export const Q5_SPLIT = {
  satisfied: { count: 24, pct: 50.0 }, neutral: { count: 18, pct: 37.5 }, dissatisfied: { count: 6, pct: 12.5 }, base: 48,
}

export const SCHEME_COVERAGE = {
  total: 1053, valid: 8, validPct: 0.8, flagged: 52, flaggedPct: 4.9,
  noData: 993, noDataPct: 94.3, functional: 3, nonFunctional: 5, functionalRate: 37.5, minThreshold: 6,
}

export const ZONE_SCORES = [
  { zone: 'Tinsukia District', usableCalls: 131, bsi: 0.6024, quality: 1.1667, quantity: 0.9339, daily: 0.2061, satisfaction: 0.2500, status: 'Moderate' },
  { zone: 'Assam (State)',     usableCalls: 131, bsi: 0.6024, quality: 1.1667, quantity: 0.9339, daily: 0.2061, satisfaction: 0.2500, status: 'Moderate' },
]

// All 8 valid schemes (≥6 usable calls, full campaign)
export const DISTRICT_SCORES = [
  { district: 'DARA GAON PWSS',            zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6,  bsi: 0.8340, quality: 1.5000, quantity: 1.1250, daily: 0.7500, satisfaction: 0.5000, status: 'Good'     },
  { district: 'POWAI T.E. PWSS',           zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6,  bsi: 0.7240, quality: 0.7500, quantity: 1.5000, daily: 0.3750, satisfaction: 0.5000, status: 'Good'     },
  { district: 'GARGAON PWSS',              zone: 'Tinsukia District', validSchemes: 1, usableCalls: 11, bsi: 0.7240, quality: 1.5000, quantity: 0.9000, daily: 0.1365, satisfaction: 0.3335, status: 'Good'     },
  { district: 'BISANI MUKH N.C. PWSS',     zone: 'Tinsukia District', validSchemes: 1, usableCalls: 11, bsi: 0.7120, quality: 1.5000, quantity: 0.7500, daily: 0.4088, satisfaction: 0.4000, status: 'Good'     },
  { district: 'DIRAKMUKH N.C. PWSS',       zone: 'Tinsukia District', validSchemes: 1, usableCalls: 6,  bsi: 0.6000, quality: 1.5000, quantity: 0.3750, daily: 0.1250, satisfaction: 0.2500, status: 'Moderate' },
  { district: 'KUNDIL SHANTI NAGAR PWSS',  zone: 'Tinsukia District', validSchemes: 1, usableCalls: 9,  bsi: 0.5060, quality: 0.9000, quantity: 1.2000, daily: 0.3330, satisfaction: 0.1000, status: 'Moderate' },
  { district: 'AJOKHA GAON PWSS',          zone: 'Tinsukia District', validSchemes: 1, usableCalls: 13, bsi: 0.4860, quality: 1.0710, quantity: 0.7500, daily: 0.2310, satisfaction: 0.0000, status: 'Moderate' },
  { district: 'DOOM PATHAR PWSS',          zone: 'Tinsukia District', validSchemes: 1, usableCalls: 9,  bsi: 0.3500, quality: 0.7500, quantity: 0.7500, daily: 0.0000, satisfaction: 0.2500, status: 'Critical'  },
]

export const REPEAT_CALLERS = [
  { metric: 'Count',                          firstTime: '777',    repeat: '29',    change: '',      note: '' },
  { metric: 'Consent rate',                   firstTime: '23.4%',  repeat: '31.0%', change: '+32%',  note: 'Re-contacted households consistently more willing to engage' },
  { metric: 'Usable (answered Q1)',           firstTime: '16.0%',  repeat: '20.7%', change: '+29%',  note: 'Better data yield from previously surveyed households' },
  { metric: 'Avg call duration',              firstTime: '62 sec', repeat: '71 sec',change: '+15%',  note: 'Longer calls — more questions answered per interaction' },
  { metric: 'Completed all 5 questions',      firstTime: '5.3%',   repeat: '6.9%',  change: '+30%',  note: 'Higher completion among Phase 1 re-contacts' },
  { metric: 'Citizen Satisfaction Survey Score (0–1.0)', firstTime: '0.600', repeat: '0.615', change: '+3%', note: 'Marginally higher satisfaction among re-contacts' },
]

export const CALL_ATTEMPTS = [
  { attempt: '1',   totalCalls: 640, pctOfAll: 79.4, consentedN: 152, consentPct: 24, q5Respondents: 38, satisfiedN: 19, satisfiedPct: 50.0 },
  { attempt: '2',   totalCalls: 151, pctOfAll: 18.7, consentedN: 34,  consentPct: 23, q5Respondents: 8,  satisfiedN: 4,  satisfiedPct: 50.0 },
  { attempt: '3',   totalCalls: 11,  pctOfAll: 1.4,  consentedN: 4,   consentPct: 36, q5Respondents: 2,  satisfiedN: 1,  satisfiedPct: 50.0 },
  { attempt: '4+',  totalCalls: 4,   pctOfAll: 0.5,  consentedN: 1,   consentPct: 25, q5Respondents: 0,  satisfiedN: 0,  satisfiedPct: 0    },
  { attempt: 'All', totalCalls: 806, pctOfAll: 100,  consentedN: 191, consentPct: 24, q5Respondents: 48, satisfiedN: 24, satisfiedPct: 50.0 },
]

export const QUESTION_FUNNEL = [
  { q: 'Q1',  label: 'Water Daily',          answered: 131, yesCount: 36, noCount: 95, yesPct: 27.48, askedN: 806,  askedLabel: 'All 806 Tinsukia calls (both phases)', responsePct: 16.3, note: '131 of 806 answered Q1' },
  { q: 'Q1A', label: 'Consistent Timing',    answered: 28,  yesCount: 17, noCount: 11, yesPct: 60.71, askedN: 36,   askedLabel: '36 callers who answered Q1 = Yes',     responsePct: 77.8, note: '28 of 36 responded' },
  { q: 'Q2',  label: 'Water Quality',        answered: 54,  yesCount: 42, noCount: 12, yesPct: 77.78, askedN: 191,  askedLabel: '191 consented callers',                 responsePct: 28.3, note: '54 of 191 answered Q2' },
  { q: 'Q3',  label: 'Water Quantity',       answered: 53,  yesCount: 33, noCount: 20, yesPct: 62.26, askedN: 191,  askedLabel: '191 consented callers',                 responsePct: 27.7, note: '53 of 191 answered Q3' },
  { q: 'Q5',  label: 'Overall Satisfaction', answered: 48,  yesCount: 24, noCount: 24, yesPct: 50.0,  askedN: 191,  askedLabel: '191 consented callers',                 responsePct: 25.1, note: '48 of 191 reached Q5' },
]

// ─── FULL CAMPAIGN (Phase 1 + Phase 2 combined) ──────────────────────────────
// Phase 1: 45,863 calls · Apr 2026  |  Phase 2: 79,725 calls · May 2026
// Source: CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx (125,588 rows)

export const KPI_HEADLINE = {
  totalCalls: 125588,
  stateBSI: 0.4860,          // scheme-weighted, min_usable=4 (was 0.5516 at min=6)
  satisfied: 53.1,
  functionalSchemes: 27.0,   // ~27% of valid schemes have Q1≥50% daily supply
  consentRate: 20.4,
  completedSurvey: 6840,
}

export const CALL_SUMMARY = [
  { group: 'Total calls made',            count: 125588, pct: 100.0, note: 'Phase 1 (45,863 · Apr 2026) + Phase 2 (79,725 · May 2026)' },
  { group: '└  Consented (said YES)',      count: 25617,  pct: 20.4,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 99971,  pct: 79.6,  note: 'Person refused, hung up, or no response recorded' },
  { group: '    └─  Explicitly refused',   count: 97611,  pct: 77.7,  note: 'Said no or hung up immediately' },
  { group: '    └─  No response (blank)',  count: 1257,   pct: 1.0,   note: 'Call connected but consent not recorded' },
  { group: '    └─  Unknown / invalid',   count: 1103,   pct: 0.9,   note: 'Bot could not determine a clear yes or no' },
  { group: 'Usable calls (answered Q1)',   count: 15660,  pct: 12.5,  note: 'Across both phases · ALL Score computation uses this group' },
  { group: '└  Completed all 5 questions', count: 5222,   pct: 4.2,   note: 'Answered Q1 through Q5' },
  { group: 'Calls under 30 seconds',       count: 58389,  pct: 46.5,  note: 'Nearly all overlap with refused group above' },
]

export const CALL_SUMMARY_NOTE = 'Full Campaign = Phase 1 (45,863 calls, April 2026) + Phase 2 (79,725 calls, May 2026). Citizen Satisfaction Survey Score computed from 11,758 scheme-weighted usable calls (schemes with ≥4 usable calls).'

export const KPI_QUESTIONS = [
  { id: 'Q1',  label: 'Water Daily',         question: 'Did water come every day in last 7 days?', yesCount: 4794, noCount: 10866, base: 15660, yesPct: 30.61, weight: '0.75 / 5', status: 'Critical', benchmark: 70, color: '#ef4444' },
  { id: 'Q1A', label: 'Consistent Timing',   question: 'Does water arrive at a consistent time?',  yesCount: 2109, noCount: 1591,  base: 3700,  askedOf: 4794, yesPct: 57.0,  weight: '0.75 / 5', status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q2',  label: 'Water Quality',       question: 'Is the water clean enough?',               yesCount: 4998, noCount: 1879,  base: 6877,  yesPct: 72.68, weight: '1.5 / 5',  status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q3',  label: 'Water Quantity',      question: 'Is there enough water?',                   yesCount: 4614, noCount: 2669,  base: 7283,  yesPct: 63.35, weight: '1.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q5',  label: 'Overall Satisfaction',question: 'Are you satisfied with your supply?',      yesCount: 3635, noCount: 3205,  base: 6840,  yesPct: 53.14, weight: '0.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
]

export const Q5_SPLIT = {
  satisfied: { count: 3635, pct: 53.1 }, neutral: { count: 1514, pct: 22.1 }, dissatisfied: { count: 1691, pct: 24.7 }, base: 6840,
}

export const SCHEME_COVERAGE = {
  total: 27678, valid: 1477, validPct: 5.3, flagged: 1759, flaggedPct: 6.4,
  noData: 24442, noDataPct: 88.3, functional: 399, nonFunctional: 1078, functionalRate: 27.0, minThreshold: 4,
}

// Zone scores recomputed with min_usable=4 threshold
// Usable-call counts and BSI increase because more schemes now qualify
export const ZONE_SCORES = [
  { zone: 'North Assam',  usableCalls: 4085,  bsi: 0.5172, quality: 0.9311, quantity: 0.8643, daily: 0.2453, satisfaction: 0.2324, status: 'Moderate' },
  { zone: 'Upper Assam',  usableCalls: 2817,  bsi: 0.4977, quality: 0.9019, quantity: 0.8178, daily: 0.2697, satisfaction: 0.2146, status: 'Moderate' },
  { zone: 'KAAC',         usableCalls: 39,    bsi: 0.6480, quality: 1.0769, quantity: 1.2115, daily: 0.3269, satisfaction: 0.2496, status: 'Moderate' },
  { zone: 'Lower Assam',  usableCalls: 3488,  bsi: 0.4652, quality: 0.9107, quantity: 0.7527, daily: 0.2060, satisfaction: 0.2019, status: 'Moderate' },
  { zone: 'BTAD',         usableCalls: 957,   bsi: 0.4012, quality: 0.8042, quantity: 0.6556, daily: 0.1411, satisfaction: 0.1721, status: 'Moderate' },
  { zone: 'Barak Valley', usableCalls: 362,   bsi: 0.4486, quality: 0.9506, quantity: 0.6857, daily: 0.2175, satisfaction: 0.1932, status: 'Moderate' },
  { zone: 'DHAC',         usableCalls: 10,    bsi: 0.6000, quality: 0.9000, quantity: 1.5000, daily: 0.1500, satisfaction: 0.0000, status: 'Moderate' },
  { zone: 'Assam (State)',usableCalls: 11758, bsi: 0.4860, quality: 0.9088, quantity: 0.7993, daily: 0.2303, satisfaction: 0.2128, status: 'Moderate' },
]

// District scores recomputed with min_usable=4 threshold (verified from Supabase)
export const DISTRICT_SCORES = [
  { district: 'Nagaon',                  zone: 'Upper Assam',  validSchemes: 56,  usableCalls: 454,  bsi: 0.5774, quality: 1.0699, quantity: 0.9708, satisfaction: 0.2461, status: 'Moderate' },
  { district: 'Golaghat',                zone: 'Upper Assam',  validSchemes: 42,  usableCalls: 304,  bsi: 0.5626, quality: 0.9390, quantity: 0.8984, satisfaction: 0.2311, status: 'Moderate' },
  { district: 'Charaideo',               zone: 'Upper Assam',  validSchemes: 35,  usableCalls: 243,  bsi: 0.5601, quality: 1.0861, quantity: 0.8514, satisfaction: 0.2335, status: 'Moderate' },
  { district: 'Sivasagar',               zone: 'Upper Assam',  validSchemes: 42,  usableCalls: 303,  bsi: 0.5529, quality: 1.0519, quantity: 0.9119, satisfaction: 0.2456, status: 'Moderate' },
  { district: 'Dhubri',                  zone: 'Lower Assam',  validSchemes: 99,  usableCalls: 674,  bsi: 0.5499, quality: 1.0792, quantity: 0.8787, satisfaction: 0.2833, status: 'Moderate' },
  { district: 'Sonitpur',                zone: 'North Assam',  validSchemes: 101, usableCalls: 1042, bsi: 0.5309, quality: 0.8895, quantity: 0.9484, satisfaction: 0.2368, status: 'Moderate' },
  { district: 'Chirang',                 zone: 'BTAD',         validSchemes: 3,   usableCalls: 16,   bsi: 0.5188, quality: 1.1250, quantity: 1.1250, satisfaction: 0.2500, status: 'Moderate' },
  { district: 'Goalpara',                zone: 'Lower Assam',  validSchemes: 154, usableCalls: 1241, bsi: 0.5188, quality: 0.9974, quantity: 0.8177, satisfaction: 0.2565, status: 'Moderate' },
  { district: 'Morigaon',                zone: 'Upper Assam',  validSchemes: 6,   usableCalls: 31,   bsi: 0.5153, quality: 0.5323, quantity: 1.1250, satisfaction: 0.3710, status: 'Moderate' },
  { district: 'Lakhimpur',               zone: 'North Assam',  validSchemes: 256, usableCalls: 2648, bsi: 0.5063, quality: 0.9372, quantity: 0.8272, satisfaction: 0.2269, status: 'Moderate' },
  { district: 'Darrang',                 zone: 'BTAD',         validSchemes: 22,  usableCalls: 162,  bsi: 0.5039, quality: 0.7512, quantity: 1.0531, satisfaction: 0.2038, status: 'Moderate' },
  { district: 'Bajali',                  zone: 'Lower Assam',  validSchemes: 22,  usableCalls: 257,  bsi: 0.5015, quality: 0.9554, quantity: 0.8256, satisfaction: 0.2480, status: 'Moderate' },
  { district: 'Biswanath',               zone: 'North Assam',  validSchemes: 69,  usableCalls: 643,  bsi: 0.4947, quality: 0.8694, quantity: 0.8106, satisfaction: 0.2475, status: 'Moderate' },
  { district: 'Tamulpur',                zone: 'BTAD',         validSchemes: 13,  usableCalls: 74,   bsi: 0.4907, quality: 1.0784, quantity: 0.7095, satisfaction: 0.2122, status: 'Moderate' },
  { district: 'Jorhat',                  zone: 'Upper Assam',  validSchemes: 26,  usableCalls: 149,  bsi: 0.4834, quality: 0.8893, quantity: 0.6943, satisfaction: 0.1937, status: 'Moderate' },
  { district: 'Barpeta',                 zone: 'Lower Assam',  validSchemes: 78,  usableCalls: 546,  bsi: 0.4778, quality: 0.8953, quantity: 0.8681, satisfaction: 0.1731, status: 'Moderate' },
  { district: 'Majuli',                  zone: 'Upper Assam',  validSchemes: 18,  usableCalls: 111,  bsi: 0.4717, quality: 0.7759, quantity: 0.8363, satisfaction: 0.2036, status: 'Moderate' },
  { district: 'Cachar',                  zone: 'Barak Valley', validSchemes: 93,  usableCalls: 781,  bsi: 0.4676, quality: 0.9604, quantity: 0.7607, satisfaction: 0.2216, status: 'Moderate' },
  { district: 'Karbi Anglong',           zone: 'KAAC',         validSchemes: 20,  usableCalls: 154,  bsi: 0.4622, quality: 0.9755, quantity: 0.6773, satisfaction: 0.2138, status: 'Moderate' },
  { district: 'Tinsukia',                zone: 'Upper Assam',  validSchemes: 13,  usableCalls: 89,   bsi: 0.4592, quality: 0.8781, quantity: 0.7407, satisfaction: 0.1461, status: 'Moderate' },
  { district: 'Sribhumi',                zone: 'Barak Valley', validSchemes: 57,  usableCalls: 379,  bsi: 0.4584, quality: 0.8453, quantity: 0.7721, satisfaction: 0.2175, status: 'Moderate' },
  { district: 'Dibrugarh',               zone: 'Upper Assam',  validSchemes: 36,  usableCalls: 256,  bsi: 0.4495, quality: 0.8362, quantity: 0.6926, satisfaction: 0.1939, status: 'Moderate' },
  { district: 'Barak Valley (DHAC)',     zone: 'DHAC',         validSchemes: 1,   usableCalls: 6,    bsi: 0.0750, quality: 0.0000, quantity: 0.0000, satisfaction: 0.0000, status: 'Critical' },
  { district: 'Dhemaji',                 zone: 'North Assam',  validSchemes: 78,  usableCalls: 615,  bsi: 0.4363, quality: 0.8946, quantity: 0.6705, satisfaction: 0.1660, status: 'Moderate' },
  { district: 'West Karbi Anglong',      zone: 'KAAC',         validSchemes: 16,  usableCalls: 138,  bsi: 0.4325, quality: 0.8791, quantity: 0.8739, satisfaction: 0.1812, status: 'Moderate' },
  { district: 'Kamrup',                  zone: 'Lower Assam',  validSchemes: 54,  usableCalls: 338,  bsi: 0.4174, quality: 0.8618, quantity: 0.7172, satisfaction: 0.1483, status: 'Moderate' },
  { district: 'Hojai',                   zone: 'Upper Assam',  validSchemes: 22,  usableCalls: 165,  bsi: 0.4058, quality: 0.8136, quantity: 0.6424, satisfaction: 0.1534, status: 'Moderate' },
  { district: 'Nalbari',                 zone: 'Lower Assam',  validSchemes: 25,  usableCalls: 160,  bsi: 0.3840, quality: 0.5868, quantity: 0.8228, satisfaction: 0.1626, status: 'Critical' },
  { district: 'Udalguri',                zone: 'BTAD',         validSchemes: 21,  usableCalls: 131,  bsi: 0.3277, quality: 0.4198, quantity: 0.6412, satisfaction: 0.1393, status: 'Critical' },
  { district: 'South Salmara Mancachar', zone: 'Lower Assam',  validSchemes: 11,  usableCalls: 85,   bsi: 0.3177, quality: 0.7401, quantity: 0.3671, satisfaction: 0.1442, status: 'Critical' },
  { district: 'Bongaigaon',              zone: 'BTAD',         validSchemes: 14,  usableCalls: 72,   bsi: 0.3145, quality: 0.8780, quantity: 0.3333, satisfaction: 0.0278, status: 'Critical' },
  { district: 'Kokrajhar',               zone: 'BTAD',         validSchemes: 7,   usableCalls: 30,   bsi: 0.3017, quality: 0.5333, quantity: 0.5500, satisfaction: 0.2000, status: 'Critical' },
  { district: 'Hailakandi',              zone: 'Barak Valley', validSchemes: 16,  usableCalls: 121,  bsi: 0.2479, quality: 0.3636, quantity: 0.4866, satisfaction: 0.0778, status: 'Critical' },
  { district: 'Baksa',                   zone: 'BTAD',         validSchemes: 5,   usableCalls: 24,   bsi: 0.1750, quality: 0.2500, quantity: 0.5625, satisfaction: 0.0000, status: 'Critical' },
]

export const REPEAT_CALLERS = [
  { metric: 'Count',                          firstTime: '121,630', repeat: '3,958',  change: '',       note: '' },
  { metric: 'Consent rate',                   firstTime: '20.3%',   repeat: '22.2%',  change: '+9%',    note: 'Slightly higher engagement from previously-contacted households' },
  { metric: 'Usable (answered Q1)',           firstTime: '12.4%',   repeat: '14.5%',  change: '+17%',   note: 'Better data yield from Phase 1 re-contacts' },
  { metric: 'Avg call duration',              firstTime: '51 sec',  repeat: '57 sec', change: '+12%',   note: 'Longer calls — more questions answered' },
  { metric: 'Completed all 5 questions',      firstTime: '4.3%',    repeat: '5.0%',   change: '+16%',   note: 'Higher completion among Phase 1 re-contacts' },
  { metric: 'Citizen Satisfaction Survey Score (0–1.0)', firstTime: '0.591',   repeat: '0.579',  change: '-2%',    note: 'Marginally lower CSS Score — persistent service issues' },
  { metric: 'Quality satisfaction (Q2 yes%)', firstTime: '72.6%',   repeat: '73.0%',  change: '+0.4pp', note: 'Negligible quality difference' },
]

export const CALL_ATTEMPTS = [
  { attempt: '1',   totalCalls: 94362,  pctOfAll: 75.14, consentedN: 18465, consentPct: 20, q5Respondents: 4986, satisfiedN: 2632, satisfiedPct: 52.79 },
  { attempt: '2',   totalCalls: 28152,  pctOfAll: 22.42, consentedN: 6368,  consentPct: 23, q5Respondents: 1594, satisfiedN: 878,  satisfiedPct: 55.08 },
  { attempt: '3',   totalCalls: 2250,   pctOfAll: 1.79,  consentedN: 592,   consentPct: 26, q5Respondents: 199,  satisfiedN: 94,   satisfiedPct: 47.24 },
  { attempt: '4',   totalCalls: 517,    pctOfAll: 0.41,  consentedN: 122,   consentPct: 24, q5Respondents: 33,   satisfiedN: 14,   satisfiedPct: 42.42 },
  { attempt: '5',   totalCalls: 307,    pctOfAll: 0.24,  consentedN: 70,    consentPct: 23, q5Respondents: 28,   satisfiedN: 17,   satisfiedPct: 60.71 },
  { attempt: 'All', totalCalls: 125588, pctOfAll: 100,   consentedN: 25617, consentPct: 20, q5Respondents: 6840, satisfiedN: 3635, satisfiedPct: 53.14 },
]

export const QUESTION_FUNNEL = [
  { q: 'Q1',  label: 'Water Daily',          answered: 15660, yesCount: 4794, noCount: 10866, yesPct: 30.61, askedN: 125588, askedLabel: 'All 125,588 calls (both phases)',        responsePct: 12.5, note: '15,660 of 125,588 answered Q1' },
  { q: 'Q1A', label: 'Consistent Timing',    answered: 3700,  yesCount: 2109, noCount: 1591,  yesPct: 57.0,  askedN: 4794,   askedLabel: '4,794 Q1=Yes callers',                  responsePct: 77.2, note: 'Follow-up · 3,700 of 4,794 responded' },
  { q: 'Q2',  label: 'Water Quality',        answered: 6877,  yesCount: 4998, noCount: 1879,  yesPct: 72.68, askedN: 25617,  askedLabel: '25,617 consented callers (both phases)', responsePct: 26.8, note: '18,740 consented gave no Q2 response' },
  { q: 'Q3',  label: 'Water Quantity',       answered: 7283,  yesCount: 4614, noCount: 2669,  yesPct: 63.35, askedN: 25617,  askedLabel: '25,617 consented callers (both phases)', responsePct: 28.4, note: '18,334 consented gave no Q3 response' },
  { q: 'Q5',  label: 'Overall Satisfaction', answered: 6840,  yesCount: 3635, noCount: 3205,  yesPct: 53.14, askedN: 25617,  askedLabel: '25,617 consented (+ 523 non-consented)', responsePct: 26.7, note: '6,840 reached Q5 across both phases' },
]

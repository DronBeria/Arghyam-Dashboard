// ─── PHASE 2 VERIFIED DATA (May 2026 only — new calls) ───────────────────────
// 79,725 calls · May 2026 · excludes Phase 1 re-contacts' Phase 1 data
// Source: CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx (May rows only)

export const KPI_HEADLINE = {
  totalCalls: 79725,
  stateBSI: 0.5431,        // scheme-weighted BSI across Phase 2 valid schemes (800 usable calls)
  satisfied: 55.0,          // 1,217 of 2,212 who reached Q5
  functionalSchemes: 25.5,  // 27 of 106 valid schemes have majority Q1=yes
  consentRate: 16.1,        // 12,861 / 79,725
  completedSurvey: 2212,    // all who reached Q5
}

// ─── CALL SUMMARY ─────────────────────────────────────────────────────────────
export const CALL_SUMMARY = [
  { group: 'Total calls made',            count: 79725,  pct: 100.0, note: 'All Phase 2 calls dialled (May 2026) · expanded geographical coverage' },
  { group: '└  Consented (said YES)',      count: 12861,  pct: 16.1,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 66864,  pct: 83.9,  note: 'Person refused, hung up, or no response recorded' },
  { group: '    └─  Explicitly refused',   count: 65949,  pct: 82.7,  note: 'Said no or hung up immediately' },
  { group: '    └─  No response (blank)',  count: 297,    pct: 0.4,   note: 'Call connected but consent not recorded' },
  { group: '    └─  Unknown / invalid',   count: 618,    pct: 0.8,   note: 'Bot could not determine a clear yes or no' },
  { group: 'Usable calls (answered Q1)',   count: 6408,   pct: 8.0,   note: 'Answered Q1 · ALL BSI scoring uses this group' },
  { group: '└  Completed all 5 questions', count: 1669,   pct: 2.1,   note: 'Answered Q1 through Q5 · richest data' },
  { group: 'Calls under 30 seconds',       count: 35265,  pct: 44.2,  note: 'Nearly all overlap with refused group above' },
]

export const CALL_SUMMARY_NOTE = 'Phase 2 expanded to new households across Assam (May 2026). 3,788 re-contacts from Phase 1 are included; their Phase 1 calls are tracked separately. Lower consent rate (16.1% vs Phase 1 27.4%) reflects broader first-time outreach.'

// ─── KPI RESULTS (Q1–Q5) ──────────────────────────────────────────────────────
export const KPI_QUESTIONS = [
  { id: 'Q1',  label: 'Water Daily',         question: 'Did water come every day in last 7 days?', yesCount: 1944, noCount: 4464, base: 6408,  yesPct: 30.34, weight: '0.75 / 5', status: 'Critical', benchmark: 70, color: '#ef4444' },
  { id: 'Q1A', label: 'Consistent Timing',   question: 'Does water arrive at a consistent time?',  yesCount: 816,  noCount: 623,  base: 1439,  askedOf: 1944, yesPct: 56.7,  weight: '0.75 / 5', status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q2',  label: 'Water Quality',       question: 'Is the water clean enough?',               yesCount: 1695, noCount: 624,  base: 2319,  yesPct: 73.09, weight: '1.5 / 5',  status: 'Good',     benchmark: 70, color: '#22c55e' },
  { id: 'Q3',  label: 'Water Quantity',      question: 'Is there enough water?',                   yesCount: 1644, noCount: 888,  base: 2532,  yesPct: 64.93, weight: '1.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
  { id: 'Q5',  label: 'Overall Satisfaction',question: 'Are you satisfied with your supply?',      yesCount: 1217, noCount: 995,  base: 2212,  yesPct: 55.02, weight: '0.5 / 5',  status: 'Moderate', benchmark: 70, color: '#f59e0b' },
]

// Q5 3-way split — base = 2,212 (1,217 + 464 + 531)
export const Q5_SPLIT = {
  satisfied:    { count: 1217, pct: 55.0 },
  neutral:      { count: 464,  pct: 21.0 },
  dissatisfied: { count: 531,  pct: 24.0 },
  base: 2212,
}

// ─── SCHEME COVERAGE ──────────────────────────────────────────────────────────
export const SCHEME_COVERAGE = {
  total: 5503,
  valid: 106,
  validPct: 1.9,
  flagged: 3014,
  flaggedPct: 54.8,
  noData: 2383,
  noDataPct: 43.3,
  functional: 27,
  nonFunctional: 79,
  functionalRate: 25.5,
  minThreshold: 6,
}

// ─── ZONE SCORES — Phase 2 new calls only (800 scheme-weighted usable calls) ─
// Note: Barak Valley and DHAC had no valid schemes (≥6 usable calls) in May 2026
export const ZONE_SCORES = [
  { zone: 'North Assam',  usableCalls: 202, bsi: 0.5106, quality: 0.9851, quantity: 0.8639, daily: 0.2190, satisfaction: 0.2042, status: 'Moderate' },
  { zone: 'Upper Assam',  usableCalls: 308, bsi: 0.5942, quality: 1.0397, quantity: 0.9399, daily: 0.2971, satisfaction: 0.2812, status: 'Moderate' },
  { zone: 'KAAC',         usableCalls: 6,   bsi: 0.6250, quality: 1.5000, quantity: 0.7500, daily: 0.1250, satisfaction: 0.0000, status: 'Moderate' },
  { zone: 'Lower Assam',  usableCalls: 219, bsi: 0.5114, quality: 0.9595, quantity: 0.7842, daily: 0.2363, satisfaction: 0.2027, status: 'Moderate' },
  { zone: 'BTAD',         usableCalls: 65,  bsi: 0.5009, quality: 1.0565, quantity: 0.7600, daily: 0.1385, satisfaction: 0.2564, status: 'Moderate' },
  { zone: 'Barak Valley', usableCalls: 0,   bsi: null,   quality: null,   quantity: null,   daily: null,   satisfaction: null,   status: 'No Data' },
  { zone: 'DHAC',         usableCalls: 0,   bsi: null,   quality: null,   quantity: null,   daily: null,   satisfaction: null,   status: 'No Data' },
  { zone: 'Assam (State)',usableCalls: 800, bsi: 0.5431, quality: 1.0088, quantity: 0.8620, daily: 0.2466, satisfaction: 0.2361, status: 'Moderate' },
]

// ─── DISTRICT SCORES — 23 districts with ≥6 usable Phase 2 calls ─────────────
export const DISTRICT_SCORES = [
  // BTAD
  { district: 'Baksa',          zone: 'BTAD',        validSchemes: 2,  usableCalls: 19,  bsi: 0.6034, quality: 0.9248, quantity: 1.1316, satisfaction: 0.1842, status: 'Moderate' },
  { district: 'Udalguri',       zone: 'BTAD',        validSchemes: 6,  usableCalls: 46,  bsi: 0.4586, quality: 1.1109, quantity: 0.6065, satisfaction: 0.2862, status: 'Moderate' },
  // KAAC
  { district: 'Karbi Anglong',  zone: 'KAAC',        validSchemes: 1,  usableCalls: 6,   bsi: 0.6250, quality: 1.5000, quantity: 0.7500, satisfaction: 0.0000, status: 'Moderate' },
  // Lower Assam
  { district: 'Bajali',                  zone: 'Lower Assam', validSchemes: 1,  usableCalls: 7,   bsi: 0.7643, quality: 1.5000, quantity: 1.5000, satisfaction: 0.5000, status: 'Good' },
  { district: 'Barpeta',                 zone: 'Lower Assam', validSchemes: 4,  usableCalls: 28,  bsi: 0.4634, quality: 0.9062, quantity: 0.7188, satisfaction: 0.2500, status: 'Moderate' },
  { district: 'Bongaigaon',              zone: 'Lower Assam', validSchemes: 3,  usableCalls: 22,  bsi: 0.3182, quality: 0.6818, quantity: 0.4091, satisfaction: 0.0909, status: 'Critical' },
  { district: 'Darrang',                 zone: 'Lower Assam', validSchemes: 2,  usableCalls: 18,  bsi: 0.5156, quality: 0.9500, quantity: 0.8361, satisfaction: 0.1358, status: 'Moderate' },
  { district: 'Dhubri',                  zone: 'Lower Assam', validSchemes: 4,  usableCalls: 25,  bsi: 0.7347, quality: 1.4280, quantity: 1.0900, satisfaction: 0.3453, status: 'Good' },
  { district: 'Goalpara',                zone: 'Lower Assam', validSchemes: 12, usableCalls: 96,  bsi: 0.5010, quality: 0.8875, quantity: 0.7356, satisfaction: 0.1786, status: 'Moderate' },
  { district: 'Nalbari',                 zone: 'Lower Assam', validSchemes: 2,  usableCalls: 16,  bsi: 0.6170, quality: 1.0000, quantity: 1.2000, satisfaction: 0.2291, status: 'Moderate' },
  // North Assam
  { district: 'Biswanath',               zone: 'North Assam', validSchemes: 5,  usableCalls: 43,  bsi: 0.5103, quality: 0.9709, quantity: 1.0727, satisfaction: 0.2287, status: 'Moderate' },
  { district: 'Dhemaji',                 zone: 'North Assam', validSchemes: 2,  usableCalls: 14,  bsi: 0.4500, quality: 1.5000, quantity: 0.7500, satisfaction: 0.0000, status: 'Moderate' },
  { district: 'Lakhimpur',               zone: 'North Assam', validSchemes: 13, usableCalls: 91,  bsi: 0.4653, quality: 0.8571, quantity: 0.7184, satisfaction: 0.1539, status: 'Moderate' },
  { district: 'Sonitpur',                zone: 'North Assam', validSchemes: 6,  usableCalls: 54,  bsi: 0.6030, quality: 1.0787, quantity: 0.9722, satisfaction: 0.3222, status: 'Moderate' },
  // Upper Assam
  { district: 'Charaideo',               zone: 'Upper Assam', validSchemes: 4,  usableCalls: 25,  bsi: 0.5020, quality: 0.6000, quantity: 0.9600, satisfaction: 0.3800, status: 'Moderate' },
  { district: 'Dibrugarh',               zone: 'Upper Assam', validSchemes: 4,  usableCalls: 32,  bsi: 0.6555, quality: 1.2188, quantity: 0.9766, satisfaction: 0.3203, status: 'Moderate' },
  { district: 'Golaghat',                zone: 'Upper Assam', validSchemes: 8,  usableCalls: 56,  bsi: 0.6787, quality: 1.1021, quantity: 0.9500, satisfaction: 0.3168, status: 'Moderate' },
  { district: 'Hojai',                   zone: 'Upper Assam', validSchemes: 8,  usableCalls: 59,  bsi: 0.5501, quality: 0.6949, quantity: 1.0487, satisfaction: 0.2717, status: 'Moderate' },
  { district: 'Jorhat',                  zone: 'Upper Assam', validSchemes: 4,  usableCalls: 36,  bsi: 0.4875, quality: 0.9861, quantity: 0.6786, satisfaction: 0.2436, status: 'Moderate' },
  { district: 'Nagaon',                  zone: 'Upper Assam', validSchemes: 11, usableCalls: 82,  bsi: 0.6346, quality: 1.2317, quantity: 1.0363, satisfaction: 0.2417, status: 'Moderate' },
  { district: 'Sivasagar',               zone: 'Upper Assam', validSchemes: 2,  usableCalls: 12,  bsi: 0.4875, quality: 1.5000, quantity: 0.6250, satisfaction: 0.2500, status: 'Moderate' },
  { district: 'Tinsukia',                zone: 'Upper Assam', validSchemes: 1,  usableCalls: 6,   bsi: 0.6000, quality: 1.5000, quantity: 0.3750, satisfaction: 0.2500, status: 'Moderate' },
  { district: 'Kamrup',                  zone: 'Lower Assam', validSchemes: 1,  usableCalls: 7,   bsi: 0.1500, quality: 0.7500, quantity: 0.0000, satisfaction: 0.0000, status: 'Critical' },
]

// ─── REPEAT CALLERS — Phase 1 re-contacts in Phase 2 ─────────────────────────
export const REPEAT_CALLERS = [
  { metric: 'Count',                          firstTime: '75,937',  repeat: '3,788',  change: '',      note: '' },
  { metric: 'Consent rate',                   firstTime: '15.9%',   repeat: '21.2%',  change: '+33%',  note: 'Phase 1 contacts show higher willingness to engage again' },
  { metric: 'Usable (answered Q1)',           firstTime: '7.8%',    repeat: '13.5%',  change: '+73%',  note: 'Nearly double the data yield from Phase 1 re-contacts' },
  { metric: 'Avg call duration',              firstTime: '48 sec',  repeat: '57 sec', change: '+19%',  note: 'Longer calls — more questions answered per interaction' },
  { metric: 'Completed all 5 questions',      firstTime: '2.1%',    repeat: '4.5%',   change: '+114%', note: 'More than twice as likely to complete the full survey' },
  { metric: 'BSI score (0–1.0)',              firstTime: '~0.540',  repeat: '~0.560', change: '+4%',   note: 'Slightly higher satisfaction among re-contacted households' },
  { metric: 'Quality satisfaction (Q2 yes%)', firstTime: '~73%',    repeat: '~73%',   change: '≈same', note: 'Water quality scores comparable across both groups' },
]

// ─── CALL ATTEMPTS ────────────────────────────────────────────────────────────
// Phase 2 max attempt = 4 (no attempt 5 in this campaign)
export const CALL_ATTEMPTS = [
  { attempt: '1',   totalCalls: 54729, pctOfAll: 68.65, consentedN: 7258,  consentPct: 13, q5Respondents: 904,  satisfiedN: 487,  satisfiedPct: 53.87 },
  { attempt: '2',   totalCalls: 23928, pctOfAll: 30.01, consentedN: 5284,  consentPct: 22, q5Respondents: 1215, satisfiedN: 685,  satisfiedPct: 56.38 },
  { attempt: '3',   totalCalls: 1030,  pctOfAll: 1.29,  consentedN: 302,   consentPct: 29, q5Respondents: 88,   satisfiedN: 43,   satisfiedPct: 48.86 },
  { attempt: '4',   totalCalls: 38,    pctOfAll: 0.05,  consentedN: 17,    consentPct: 45, q5Respondents: 5,    satisfiedN: 2,    satisfiedPct: 40.00 },
  { attempt: 'All', totalCalls: 79725, pctOfAll: 100,   consentedN: 12861, consentPct: 16, q5Respondents: 2212, satisfiedN: 1217, satisfiedPct: 55.02 },
]

// ─── QUESTION FUNNEL ──────────────────────────────────────────────────────────
export const QUESTION_FUNNEL = [
  { q: 'Q1',  label: 'Water Daily',          answered: 6408,  yesCount: 1944, noCount: 4464, yesPct: 30.34, askedN: 79725, askedLabel: 'All 79,725 Phase 2 calls',               responsePct: 8.0,  note: '6,408 of 79,725 answered Q1' },
  { q: 'Q1A', label: 'Consistent Timing',    answered: 1439,  yesCount: 816,  noCount: 623,  yesPct: 56.7,  askedN: 1944,  askedLabel: '1,944 callers who answered Q1 = Yes',    responsePct: 74.0, note: 'Follow-up · 1,439 of 1,944 responded (74%)' },
  { q: 'Q2',  label: 'Water Quality',        answered: 2319,  yesCount: 1695, noCount: 624,  yesPct: 73.09, askedN: 12861, askedLabel: '12,861 consented callers',               responsePct: 18.0, note: '10,542 consented callers gave no Q2 response' },
  { q: 'Q3',  label: 'Water Quantity',       answered: 2532,  yesCount: 1644, noCount: 888,  yesPct: 64.93, askedN: 12861, askedLabel: '12,861 consented callers',               responsePct: 19.7, note: '10,329 consented callers gave no Q3 response' },
  { q: 'Q5',  label: 'Overall Satisfaction', answered: 2212,  yesCount: 1217, noCount: 995,  yesPct: 55.02, askedN: 12861, askedLabel: '12,861 consented (+ 171 non-consented)', responsePct: 17.2, note: '2,041 consented + 171 non-consented = 2,212 reached Q5' },
]

// ─── VERIFIED SOURCE DATA ────────────────────────────────────────────────────
// All numbers verified from JJM_CSAT_Phase1_Final.xlsx (primary source)

export const KPI_HEADLINE = {
  totalCalls: 45863,
  stateBSI: 0.4406,
  satisfied: 52.1,
  functionalSchemes: 17.6,
  consentRate: 27.4,
  completedSurvey: 4284,
}

// ─── CALL SUMMARY ─────────────────────────────────────────────────────────────
export const CALL_SUMMARY = [
  { group: 'Total calls made',            count: 45863, pct: 100.0, note: 'All calls dialled to JJM-registered households across Assam in Phase 1' },
  { group: '└  Consented (said YES)',      count: 12583, pct: 27.4,  note: 'Person picked up and agreed to participate' },
  { group: '└  Did NOT consent',           count: 33280, pct: 72.6,  note: 'Person refused, hung up, or no response recorded' },
  { group: '    └─  Explicitly refused',   count: 31710, pct: 69.1,  note: 'Said no or hung up immediately' },
  { group: '    └─  No response (blank)',  count: 1208,  pct: 2.6,   note: 'Call connected but consent not recorded' },
  { group: '    └─  Unknown / invalid',    count: 362,   pct: 0.8,   note: 'Bot could not determine a clear yes or no' },
  { group: 'Usable calls (answered Q1)',   count: 9224,  pct: 20.1,  note: '8,327 consented + 897 non-consented who answered Q1 · ALL BSI scoring uses this group' },
  { group: '└  Completed all 5 questions', count: 1578,  pct: 3.4,   note: 'Answered Q1 through Q5 · 17.1% of 9,224 usable calls · richest data' },
  { group: 'Calls under 30 seconds',       count: 19909, pct: 43.4,  note: 'Nearly all overlap with refused group above' },
]

export const CALL_SUMMARY_NOTE = 'Why usable = 9,224 and not 8,327? — 897 calls logged as "refused" lasted long enough (median 133 sec) that Q1 was answered before hang-up. Rule: any call where Q1 was answered = usable. 8,327 + 897 = 9,224 ✓'

// ─── KPI RESULTS (Q1–Q5) — verified from Excel ────────────────────────────────
// Order matches survey flow. Weights sum to 5.0; BSI = Σ(w×score)/5.0
// Q1(0.75) + Q1A(0.75) + Q2(1.5) + Q3(1.5) + Q5(0.5) = 5.0
export const KPI_QUESTIONS = [
  {
    id: 'Q1',
    label: 'Water Daily',
    question: 'Did water come every day in last 7 days?',
    yesCount: 2855,
    noCount: 6369,
    base: 9224,
    yesPct: 30.95,
    weight: '0.75 / 5',
    status: 'Critical',
    benchmark: 70,
    color: '#ef4444',
  },
  {
    id: 'Q1A',
    label: 'Consistent Timing',
    question: 'Does water arrive at a consistent time? (follow-up to Q1)',
    yesCount: 1222,
    noCount: 920,
    base: 2142,
    askedOf: 2855,
    yesPct: 57.05,
    weight: '0.75 / 5',
    status: 'Moderate',
    benchmark: 70,
    color: '#f59e0b',
  },
  {
    id: 'Q2',
    label: 'Water Quality',
    question: 'Is the water clean enough?',
    yesCount: 3293,
    noCount: 1260,
    base: 4553,
    yesPct: 72.33,
    weight: '1.5 / 5',
    status: 'Good',
    benchmark: 70,
    color: '#22c55e',
  },
  {
    id: 'Q3',
    label: 'Water Quantity',
    question: 'Is there enough water?',
    yesCount: 2953,
    noCount: 1792,
    base: 4745,
    yesPct: 62.23,
    weight: '1.5 / 5',
    status: 'Moderate',
    benchmark: 70,
    color: '#f59e0b',
  },
  {
    id: 'Q5',
    label: 'Overall Satisfaction',
    question: 'Are you satisfied with your supply?',
    yesCount: 2233,
    noCount: 2051,
    base: 4284,
    yesPct: 52.12,
    weight: '0.5 / 5',
    status: 'Moderate',
    benchmark: 70,
    color: '#f59e0b',
  },
]

// Q5 3-way split
export const Q5_SPLIT = {
  satisfied:    { count: 2233, pct: 52.1 },
  neutral:      { count: 990,  pct: 23.1 },
  dissatisfied: { count: 1061, pct: 24.8 },
  base: 4284,
}

// ─── SCHEME COVERAGE ──────────────────────────────────────────────────────────
export const SCHEME_COVERAGE = {
  total: 2373,
  valid: 615,
  validPct: 25.9,
  flagged: 1426,
  flaggedPct: 60.1,
  noData: 332,
  noDataPct: 14.0,
  functional: 108,
  nonFunctional: 507,
  functionalRate: 17.6,
  minThreshold: 6,
}

// ─── ZONE SCORES — verified from Excel ────────────────────────────────────────
// Quality out of 1.5 | Quantity out of 1.5 | Daily out of 0.75 | BSI out of 1.0
export const ZONE_SCORES = [
  { zone: 'North Assam',  usableCalls: 2330, bsi: 0.4836, quality: 0.902, quantity: 0.870, daily: 0.345, status: 'Moderate' },
  { zone: 'Upper Assam',  usableCalls: 951,  bsi: 0.4786, quality: 0.965, quantity: 0.863, daily: 0.292, status: 'Moderate' },
  { zone: 'KAAC',         usableCalls: 97,   bsi: 0.4632, quality: 0.989, quantity: 0.911, daily: 0.220, status: 'Moderate' },
  { zone: 'Lower Assam',  usableCalls: 1487, bsi: 0.4553, quality: 0.913, quantity: 0.807, daily: 0.312, status: 'Moderate' },
  { zone: 'BTAD',         usableCalls: 142,  bsi: 0.3841, quality: 0.869, quantity: 0.725, daily: 0.198, status: 'Critical' },
  { zone: 'Barak Valley', usableCalls: 339,  bsi: 0.3789, quality: 0.706, quantity: 0.720, daily: 0.314, status: 'Critical' },
  { zone: 'DHAC',         usableCalls: null, bsi: null,   quality: null,  quantity: null,  daily: null,  status: 'No Data' },
  { zone: 'Assam (State)',usableCalls: 9224, bsi: 0.4406, quality: 0.8905,quantity: 0.8158,daily: 0.2803,status: 'Moderate' },
]

// ─── DISTRICT SCORES — verified from Excel ────────────────────────────────────
export const DISTRICT_SCORES = [
  // BTAD
  { district: 'Darrang',                 zone: 'BTAD',         validSchemes: 7,   usableCalls: 80,   bsi: 0.4644, quality: 0.960, quantity: 0.909, status: 'Moderate' },
  { district: 'Chirang',                 zone: 'BTAD',         validSchemes: 1,   usableCalls: 6,    bsi: 0.4000, quality: 1.000, quantity: 0.750, status: 'Moderate' },
  { district: 'Udalguri',                zone: 'BTAD',         validSchemes: 1,   usableCalls: 7,    bsi: 0.3714, quality: 0.750, quantity: 0.643, status: 'Critical' },
  { district: 'Baksa',                   zone: 'BTAD',         validSchemes: 5,   usableCalls: 30,   bsi: 0.3552, quality: 0.850, quantity: 0.725, status: 'Critical' },
  { district: 'Tamulpur',                zone: 'BTAD',         validSchemes: 3,   usableCalls: 19,   bsi: 0.3293, quality: 0.786, quantity: 0.595, status: 'Critical' },
  // Barak Valley
  { district: 'Cachar',                  zone: 'Barak Valley', validSchemes: 35,  usableCalls: 252,  bsi: 0.4542, quality: 0.905, quantity: 0.797, status: 'Moderate' },
  { district: 'Sribhumi',                zone: 'Barak Valley', validSchemes: 11,  usableCalls: 75,   bsi: 0.4041, quality: 0.774, quantity: 0.799, status: 'Moderate' },
  { district: 'Hailakandi',              zone: 'Barak Valley', validSchemes: 2,   usableCalls: 12,   bsi: 0.2785, quality: 0.438, quantity: 0.562, status: 'Critical' },
  // KAAC
  { district: 'Karbi Anglong',           zone: 'KAAC',         validSchemes: 10,  usableCalls: 75,   bsi: 0.5200, quality: 1.052, quantity: 0.927, status: 'Good' },
  { district: 'West Karbi Anglong',      zone: 'KAAC',         validSchemes: 3,   usableCalls: 22,   bsi: 0.4063, quality: 0.927, quantity: 0.896, status: 'Moderate' },
  // Lower Assam
  { district: 'Dhubri',                  zone: 'Lower Assam',  validSchemes: 36,  usableCalls: 318,  bsi: 0.5213, quality: 1.039, quantity: 0.906, status: 'Good' },
  { district: 'Goalpara',                zone: 'Lower Assam',  validSchemes: 34,  usableCalls: 262,  bsi: 0.4882, quality: 0.981, quantity: 0.873, status: 'Moderate' },
  { district: 'Bajali',                  zone: 'Lower Assam',  validSchemes: 15,  usableCalls: 154,  bsi: 0.4865, quality: 0.947, quantity: 0.840, status: 'Moderate' },
  { district: 'Kamrup',                  zone: 'Lower Assam',  validSchemes: 35,  usableCalls: 278,  bsi: 0.4835, quality: 0.992, quantity: 0.871, status: 'Moderate' },
  { district: 'Barpeta',                 zone: 'Lower Assam',  validSchemes: 44,  usableCalls: 391,  bsi: 0.4429, quality: 0.923, quantity: 0.827, status: 'Moderate' },
  { district: 'Nalbari',                 zone: 'Lower Assam',  validSchemes: 8,   usableCalls: 75,   bsi: 0.3855, quality: 0.756, quantity: 0.747, status: 'Critical' },
  { district: 'South Salmara Mancachar', zone: 'Lower Assam',  validSchemes: 1,   usableCalls: 9,    bsi: 0.3794, quality: 0.750, quantity: 0.583, status: 'Critical' },
  // North Assam
  { district: 'Biswanath',               zone: 'North Assam',  validSchemes: 25,  usableCalls: 240,  bsi: 0.5060, quality: 0.917, quantity: 0.886, status: 'Good' },
  { district: 'Majuli',                  zone: 'North Assam',  validSchemes: 10,  usableCalls: 82,   bsi: 0.4929, quality: 0.879, quantity: 0.892, status: 'Moderate' },
  { district: 'Sonitpur',                zone: 'North Assam',  validSchemes: 67,  usableCalls: 604,  bsi: 0.4812, quality: 0.904, quantity: 0.863, status: 'Moderate' },
  { district: 'Dhemaji',                 zone: 'North Assam',  validSchemes: 21,  usableCalls: 166,  bsi: 0.4800, quality: 0.925, quantity: 0.877, status: 'Moderate' },
  { district: 'Lakhimpur',               zone: 'North Assam',  validSchemes: 129, usableCalls: 1238, bsi: 0.4578, quality: 0.883, quantity: 0.830, status: 'Moderate' },
  // Upper Assam
  { district: 'Sivasagar',               zone: 'Upper Assam',  validSchemes: 31,  usableCalls: 262,  bsi: 0.5320, quality: 0.973, quantity: 0.933, status: 'Good' },
  { district: 'Jorhat',                  zone: 'Upper Assam',  validSchemes: 19,  usableCalls: 166,  bsi: 0.5274, quality: 0.978, quantity: 0.881, status: 'Good' },
  { district: 'Golaghat',                zone: 'Upper Assam',  validSchemes: 12,  usableCalls: 92,   bsi: 0.5172, quality: 0.995, quantity: 0.905, status: 'Good' },
  { district: 'Dibrugarh',               zone: 'Upper Assam',  validSchemes: 17,  usableCalls: 138,  bsi: 0.4971, quality: 0.997, quantity: 0.890, status: 'Moderate' },
  { district: 'Morigaon',                zone: 'Upper Assam',  validSchemes: 1,   usableCalls: 14,   bsi: 0.4827, quality: 1.018, quantity: 0.911, status: 'Moderate' },
  { district: 'Nagaon',                  zone: 'Upper Assam',  validSchemes: 4,   usableCalls: 37,   bsi: 0.4744, quality: 0.995, quantity: 0.938, status: 'Moderate' },
  { district: 'Tinsukia',                zone: 'Upper Assam',  validSchemes: 5,   usableCalls: 46,   bsi: 0.4466, quality: 0.930, quantity: 0.849, status: 'Moderate' },
  { district: 'Charaideo',               zone: 'Upper Assam',  validSchemes: 19,  usableCalls: 152,  bsi: 0.4238, quality: 0.875, quantity: 0.750, status: 'Moderate' },
  { district: 'Hojai',                   zone: 'Upper Assam',  validSchemes: 4,   usableCalls: 44,   bsi: 0.4065, quality: 0.921, quantity: 0.712, status: 'Moderate' },
]

// ─── REPEAT CALLERS — verified from Excel ─────────────────────────────────────
export const REPEAT_CALLERS = [
  { metric: 'Count',                          firstTime: '45,693',  repeat: '170',    change: '',      note: '' },
  { metric: 'Consent rate',                   firstTime: '27.4%',   repeat: '44.7%',  change: '+63%',  note: 'Familiarity increases willingness to participate' },
  { metric: 'Usable (answered Q1)',           firstTime: '20.0%',   repeat: '37.1%',  change: '+86%',  note: 'Nearly double the data yield from same number of calls' },
  { metric: 'Avg call duration',              firstTime: '60 sec',  repeat: '82 sec', change: '+37%',  note: 'Longer calls = more questions answered = richer data' },
  { metric: 'Completed all 5 questions',      firstTime: '3.4%',    repeat: '5.9%',   change: '≈ 2×',  note: 'Almost twice as likely to finish the full survey' },
  { metric: 'BSI score (0–1.0)',              firstTime: '0.410',   repeat: '0.449',  change: '+9%',   note: 'Slightly higher satisfaction score on second contact' },
  { metric: 'Quality satisfaction (Q2 yes%)', firstTime: '72.2%',   repeat: '89.3%',  change: '+17pp', note: 'Strong improvement in positive reporting' },
]

// ─── CALL ATTEMPTS — verified from Excel ──────────────────────────────────────
export const CALL_ATTEMPTS = [
  { attempt: '1',   totalCalls: 39633, pctOfAll: 86.42, consentedN: 11050, consentPct: 28,   q5Respondents: 3776, satisfiedN: 1975, satisfiedPct: 52.30 },
  { attempt: '2',   totalCalls: 4224,  pctOfAll: 9.21,  consentedN: 1075,  consentPct: 25,   q5Respondents: 356,  satisfiedN: 184,  satisfiedPct: 51.69 },
  { attempt: '3',   totalCalls: 1220,  pctOfAll: 2.66,  consentedN: 285,   consentPct: 23,   q5Respondents: 99,   satisfiedN: 47,   satisfiedPct: 47.47 },
  { attempt: '4',   totalCalls: 479,   pctOfAll: 1.04,  consentedN: 103,   consentPct: 22,   q5Respondents: 26,   satisfiedN: 10,   satisfiedPct: 38.46 },
  { attempt: '5',   totalCalls: 307,   pctOfAll: 0.67,  consentedN: 70,    consentPct: 23,   q5Respondents: 27,   satisfiedN: 17,   satisfiedPct: 62.96 },
  { attempt: 'All', totalCalls: 45863, pctOfAll: 100,   consentedN: 12583, consentPct: 27.4, q5Respondents: 4284, satisfiedN: 2233, satisfiedPct: 52.12 },
]

// ─── QUESTION FUNNEL — verified from Excel ────────────────────────────────────
// base = who was ASKED the question (denominator of response-rate)
// answered = who actually responded (denominator of yes%)
// yesPct = yesCount / answered  (NOT yesCount / base)
export const QUESTION_FUNNEL = [
  { q: 'Q1',  label: 'Water Daily',         answered: 9224, yesCount: 2855, noCount: 6369, yesPct: 30.95, askedN: 45863, askedLabel: 'All 45,863 calls (any call where Q1 was captured)',       responsePct: 20.1, note: 'Only answered calls counted (yes or no) — 9,224 of 45,863' },
  { q: 'Q1A', label: 'Consistent Timing',   answered: 2142, yesCount: 1222, noCount: 920,  yesPct: 57.05, askedN: 2855,  askedLabel: '2,855 callers who answered Q1 = Yes (follow-up only)', responsePct: 75.0, note: 'Asked only when Q1 = Yes · 75% of Q1=Yes callers responded' },
  { q: 'Q2',  label: 'Water Quality',       answered: 4553, yesCount: 3293, noCount: 1260, yesPct: 72.33, askedN: 12583, askedLabel: '12,583 consented callers',                               responsePct: 36.2, note: '7,030 consented callers gave no Q2 response' },
  { q: 'Q3',  label: 'Water Quantity',      answered: 4745, yesCount: 2953, noCount: 1792, yesPct: 62.23, askedN: 12583, askedLabel: '12,583 consented callers',                               responsePct: 37.7, note: '7,838 consented callers gave no Q3 response' },
  { q: 'Q5',  label: 'Overall Satisfaction',answered: 4284, yesCount: 2233, noCount: 2051, yesPct: 52.12, askedN: 12583, askedLabel: '12,583 consented callers',                               responsePct: 34.1, note: '8,299 consented callers gave no Q5 response' },
]

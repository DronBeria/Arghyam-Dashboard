// ─── FULL CAMPAIGN (Phase 1 + Phase 2 combined) ──────────────────────────────
// Phase 1: 45,863 calls · Apr 2026  |  Phase 2: 79,725 calls · May 2026
// Source: CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx (125,588 rows)

export const KPI_HEADLINE = {
  totalCalls: 125588,
  stateBSI: 0.5516,
  satisfied: 53.1,
  functionalSchemes: 27.1,
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

export const CALL_SUMMARY_NOTE = 'Full Campaign = Phase 1 (45,863 calls, April 2026) + Phase 2 (79,725 calls, May 2026). Citizen Satisfaction Survey Score computed from 7,843 scheme-weighted usable calls across both phases.'

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
  total: 5968, valid: 882, validPct: 14.8, flagged: 3407, flaggedPct: 57.1,
  noData: 1679, noDataPct: 28.1, functional: 239, nonFunctional: 643, functionalRate: 27.1, minThreshold: 6,
}

export const ZONE_SCORES = [
  { zone: 'North Assam',  usableCalls: 2978, bsi: 0.5508, quality: 1.0089, quantity: 0.8903, daily: 0.2420, satisfaction: 0.2427, status: 'Moderate' },
  { zone: 'Upper Assam',  usableCalls: 1780, bsi: 0.5814, quality: 1.0769, quantity: 0.9148, daily: 0.2912, satisfaction: 0.2565, status: 'Moderate' },
  { zone: 'KAAC',         usableCalls: 129,  bsi: 0.5359, quality: 1.0374, quantity: 0.9280, daily: 0.1919, satisfaction: 0.2303, status: 'Moderate' },
  { zone: 'Lower Assam',  usableCalls: 2354, bsi: 0.5532, quality: 1.0746, quantity: 0.8885, daily: 0.2116, satisfaction: 0.2528, status: 'Moderate' },
  { zone: 'BTAD',         usableCalls: 178,  bsi: 0.4090, quality: 0.9743, quantity: 0.5837, daily: 0.1095, satisfaction: 0.1831, status: 'Moderate' },
  { zone: 'Barak Valley', usableCalls: 424,  bsi: 0.4875, quality: 0.8897, quantity: 0.7865, daily: 0.2388, satisfaction: 0.2396, status: 'Moderate' },
  { zone: 'DHAC',         usableCalls: 20,   bsi: null,   quality: null,   quantity: null,   daily: null,   satisfaction: null,   status: 'No Data' },
  { zone: 'Assam (State)',usableCalls: 7843, bsi: 0.5516, quality: 1.0373, quantity: 0.8834, daily: 0.2400, satisfaction: 0.2471, status: 'Moderate' },
]

export const DISTRICT_SCORES = [
  { district: 'Baksa',                   zone: 'BTAD',         validSchemes: 9,   usableCalls: 65,   bsi: 0.3487, quality: 0.7126, quantity: 0.6308, satisfaction: 0.1269, status: 'Critical' },
  { district: 'Chirang',                 zone: 'BTAD',         validSchemes: 2,   usableCalls: 14,   bsi: 0.4155, quality: 1.5000, quantity: 0.4286, satisfaction: 0.0953, status: 'Moderate' },
  { district: 'Kokrajhar',               zone: 'BTAD',         validSchemes: 1,   usableCalls: 6,    bsi: 0.4417, quality: 1.1250, quantity: 0.7500, satisfaction: 0.3333, status: 'Moderate' },
  { district: 'Tamulpur',                zone: 'BTAD',         validSchemes: 5,   usableCalls: 37,   bsi: 0.4627, quality: 1.1014, quantity: 0.5270, satisfaction: 0.2122, status: 'Moderate' },
  { district: 'Udalguri',                zone: 'BTAD',         validSchemes: 7,   usableCalls: 56,   bsi: 0.4383, quality: 1.0464, quantity: 0.5875, satisfaction: 0.2351, status: 'Moderate' },
  { district: 'Cachar',                  zone: 'Barak Valley', validSchemes: 42,  usableCalls: 303,  bsi: 0.4931, quality: 0.9676, quantity: 0.7577, satisfaction: 0.2455, status: 'Moderate' },
  { district: 'Hailakandi',              zone: 'Barak Valley', validSchemes: 2,   usableCalls: 13,   bsi: 0.3077, quality: 0.2692, quantity: 0.5000, satisfaction: 0.1346, status: 'Critical' },
  { district: 'Sribhumi',                zone: 'Barak Valley', validSchemes: 15,  usableCalls: 108,  bsi: 0.4933, quality: 0.7458, quantity: 0.9016, satisfaction: 0.2358, status: 'Moderate' },
  { district: 'Karbi Anglong',           zone: 'KAAC',         validSchemes: 13,  usableCalls: 107,  bsi: 0.5685, quality: 1.0713, quantity: 0.9554, satisfaction: 0.2464, status: 'Moderate' },
  { district: 'West Karbi Anglong',      zone: 'KAAC',         validSchemes: 3,   usableCalls: 22,   bsi: 0.3774, quality: 0.8727, quantity: 0.7948, satisfaction: 0.1515, status: 'Critical' },
  { district: 'Bajali',                  zone: 'Lower Assam',  validSchemes: 17,  usableCalls: 198,  bsi: 0.5287, quality: 1.0162, quantity: 0.8772, satisfaction: 0.2512, status: 'Moderate' },
  { district: 'Barpeta',                 zone: 'Lower Assam',  validSchemes: 61,  usableCalls: 561,  bsi: 0.5463, quality: 1.0570, quantity: 0.8755, satisfaction: 0.2617, status: 'Moderate' },
  { district: 'Bongaigaon',              zone: 'Lower Assam',  validSchemes: 4,   usableCalls: 29,   bsi: 0.3534, quality: 0.7888, quantity: 0.4009, satisfaction: 0.0690, status: 'Critical' },
  { district: 'Darrang',                 zone: 'Lower Assam',  validSchemes: 9,   usableCalls: 115,  bsi: 0.5344, quality: 0.9530, quantity: 0.9980, satisfaction: 0.2402, status: 'Moderate' },
  { district: 'Dhubri',                  zone: 'Lower Assam',  validSchemes: 48,  usableCalls: 407,  bsi: 0.6500, quality: 1.2666, quantity: 1.0422, satisfaction: 0.3167, status: 'Moderate' },
  { district: 'Goalpara',                zone: 'Lower Assam',  validSchemes: 68,  usableCalls: 539,  bsi: 0.5376, quality: 1.0345, quantity: 0.8416, satisfaction: 0.2345, status: 'Moderate' },
  { district: 'Kamrup',                  zone: 'Lower Assam',  validSchemes: 45,  usableCalls: 383,  bsi: 0.5332, quality: 1.0858, quantity: 0.8448, satisfaction: 0.2336, status: 'Moderate' },
  { district: 'Nalbari',                 zone: 'Lower Assam',  validSchemes: 12,  usableCalls: 106,  bsi: 0.4655, quality: 0.8118, quantity: 0.9232, satisfaction: 0.1693, status: 'Moderate' },
  { district: 'South Salmara Mancachar', zone: 'Lower Assam',  validSchemes: 2,   usableCalls: 18,   bsi: 0.4733, quality: 1.2000, quantity: 0.6250, satisfaction: 0.1875, status: 'Moderate' },
  { district: 'Biswanath',               zone: 'North Assam',  validSchemes: 33,  usableCalls: 311,  bsi: 0.5689, quality: 1.0213, quantity: 0.9502, satisfaction: 0.2404, status: 'Moderate' },
  { district: 'Dhemaji',                 zone: 'North Assam',  validSchemes: 29,  usableCalls: 252,  bsi: 0.5715, quality: 1.1584, quantity: 0.9108, satisfaction: 0.2113, status: 'Moderate' },
  { district: 'Lakhimpur',               zone: 'North Assam',  validSchemes: 164, usableCalls: 1604, bsi: 0.5324, quality: 0.9886, quantity: 0.8408, satisfaction: 0.2321, status: 'Moderate' },
  { district: 'Sonitpur',                zone: 'North Assam',  validSchemes: 86,  usableCalls: 811,  bsi: 0.5737, quality: 0.9976, quantity: 0.9589, satisfaction: 0.2742, status: 'Moderate' },
  { district: 'Charaideo',               zone: 'Upper Assam',  validSchemes: 30,  usableCalls: 255,  bsi: 0.5302, quality: 1.0203, quantity: 0.8093, satisfaction: 0.2242, status: 'Moderate' },
  { district: 'Dibrugarh',               zone: 'Upper Assam',  validSchemes: 25,  usableCalls: 211,  bsi: 0.5873, quality: 1.1541, quantity: 0.9414, satisfaction: 0.2549, status: 'Moderate' },
  { district: 'Golaghat',                zone: 'Upper Assam',  validSchemes: 24,  usableCalls: 189,  bsi: 0.6220, quality: 1.0825, quantity: 0.9755, satisfaction: 0.2689, status: 'Moderate' },
  { district: 'Hojai',                   zone: 'Upper Assam',  validSchemes: 12,  usableCalls: 105,  bsi: 0.5138, quality: 0.8629, quantity: 0.9334, satisfaction: 0.2474, status: 'Moderate' },
  { district: 'Jorhat',                  zone: 'Upper Assam',  validSchemes: 33,  usableCalls: 291,  bsi: 0.5705, quality: 1.0507, quantity: 0.8298, satisfaction: 0.2689, status: 'Moderate' },
  { district: 'Majuli',                  zone: 'Upper Assam',  validSchemes: 12,  usableCalls: 103,  bsi: 0.5214, quality: 0.9379, quantity: 0.8940, satisfaction: 0.2300, status: 'Moderate' },
  { district: 'Morigaon',                zone: 'Upper Assam',  validSchemes: 1,   usableCalls: 19,   bsi: 0.6505, quality: 1.2273, quantity: 1.0385, satisfaction: 0.3750, status: 'Moderate' },
  { district: 'Nagaon',                  zone: 'Upper Assam',  validSchemes: 15,  usableCalls: 123,  bsi: 0.6144, quality: 1.1951, quantity: 1.0404, satisfaction: 0.2133, status: 'Moderate' },
  { district: 'Sivasagar',               zone: 'Upper Assam',  validSchemes: 46,  usableCalls: 413,  bsi: 0.6137, quality: 1.1163, quantity: 0.9588, satisfaction: 0.2800, status: 'Moderate' },
  { district: 'Tinsukia',                zone: 'Upper Assam',  validSchemes: 8,   usableCalls: 71,   bsi: 0.6070, quality: 1.1866, quantity: 0.8979, satisfaction: 0.2507, status: 'Moderate' },
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

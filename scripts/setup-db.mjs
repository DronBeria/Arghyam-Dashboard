// ============================================================
// JJM CSAT Dashboard — Supabase Database Setup Script
// Runs schema creation + full data seed via service role key
// Usage: node scripts/setup-db.mjs
// ============================================================

const SUPABASE_URL = 'https://ubdgohqafxdugonrchkv.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZGdvaHFhZnhkdWdvbnJjaGt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyODM0NCwiZXhwIjoyMDkyOTA0MzQ0fQ.a2Glerx0gX_cAhFtsrLYtyRLmLhGIwg8ayYWBSWZ4Q8'

const headers = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey':        SERVICE_KEY,
  'Prefer':        'return=minimal',
}

// Helper: upsert rows into a table
async function upsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${table}: HTTP ${res.status} — ${txt}`)
  }
  console.log(`  ✓ ${table} (${rows.length} rows)`)
}

// Helper: delete all rows from a table first
async function clear(table) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gte.0`, {
    method: 'DELETE',
    headers,
  })
  // also try text-keyed tables
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?metric=neq.NONE`, {
    method: 'DELETE',
    headers,
  })
}

// ─── DATA ──────────────────────────────────────────────────────────────────

const kpiHeadlines = [
  { metric: 'Total Calls',         value: 45863,  unit: 'count', description: '2,373 IMIS schemes · Assam' },
  { metric: 'State BSI',           value: 0.4406, unit: 'score', description: 'Moderate · Target >= 0.70' },
  { metric: 'Satisfied (Q5)',      value: 52.1,   unit: '%',     description: 'Of 4,284 Q5 respondents' },
  { metric: 'Functional Schemes',  value: 17.6,   unit: '%',     description: '108 of 615 valid schemes' },
  { metric: 'Consent Rate',        value: 27.4,   unit: '%',     description: '12,583 of 45,863 agreed' },
]

const callSummary = [
  { sort_order: 1, call_group: 'Total calls made',             call_count: 45863, pct_of_total: 100.0, note: 'All calls dialled to JJM-registered households across Assam in Phase 1' },
  { sort_order: 2, call_group: 'Consented (said YES)',          call_count: 12583, pct_of_total: 27.4,  note: 'Person picked up and agreed to participate' },
  { sort_order: 3, call_group: 'Did NOT consent',              call_count: 33280, pct_of_total: 72.6,  note: 'Person refused, hung up, or no response recorded' },
  { sort_order: 4, call_group: 'Explicitly refused',           call_count: 31710, pct_of_total: 69.1,  note: 'Said no or hung up immediately' },
  { sort_order: 5, call_group: 'No response (blank)',           call_count: 1208,  pct_of_total: 2.6,   note: 'Call connected but consent not recorded' },
  { sort_order: 6, call_group: 'Unknown / invalid',             call_count: 362,   pct_of_total: 0.8,   note: 'Bot could not determine a clear yes or no' },
  { sort_order: 7, call_group: 'Usable calls (answered Q1)',    call_count: 9224,  pct_of_total: 20.1,  note: '8,327 consented + 897 non-consented who answered Q1' },
  { sort_order: 8, call_group: 'Completed all 5 questions',     call_count: 1578,  pct_of_total: 3.4,   note: 'Answered Q1 through Q5 · richest data' },
  { sort_order: 9, call_group: 'Calls under 30 seconds',        call_count: 19909, pct_of_total: 43.4,  note: 'Nearly all overlap with refused group above' },
]

const kpiQuestions = [
  { sort_order: 1, question_id: 'Q2', label: 'Water Quality',       question_text: 'Is the water clean enough?',                yes_count: 3293, no_count: 1260, base: 4553, yes_pct: 72.33, weight: '1.5 / 5', status: 'Good',     benchmark: 70 },
  { sort_order: 2, question_id: 'Q3', label: 'Water Quantity',      question_text: 'Is there enough water?',                    yes_count: 2953, no_count: 1792, base: 4745, yes_pct: 62.23, weight: '1.5 / 5', status: 'Moderate', benchmark: 70 },
  { sort_order: 3, question_id: 'Q4', label: 'Consistent Timing',   question_text: 'Does it arrive at a fixed time?',           yes_count: 1222, no_count: 920,  base: 2142, yes_pct: 57.05, weight: '0.75 / 5',status: 'Moderate', benchmark: 70 },
  { sort_order: 4, question_id: 'Q5', label: 'Overall Satisfaction',question_text: 'Are you satisfied with your supply?',       yes_count: 2233, no_count: 2051, base: 4284, yes_pct: 52.12, weight: '0.5 / 5', status: 'Moderate', benchmark: 70 },
  { sort_order: 5, question_id: 'Q1', label: 'Water Daily',         question_text: 'Did water come every day in last 7 days?',  yes_count: 2855, no_count: 6369, base: 9224, yes_pct: 30.95, weight: '0.75 / 5',status: 'Critical', benchmark: 70 },
]

const schemeCoverage = [
  { category: 'Valid (>= 6 usable calls)', scheme_count: 615,  pct_of_total: 25.9, used_in_scoring: true,  explanation: 'Statistically valid · used in all district, zone and state averages' },
  { category: 'Flagged (1-5 usable calls)',scheme_count: 1426, pct_of_total: 60.1, used_in_scoring: false, explanation: 'Scored individually but excluded from aggregated totals' },
  { category: 'No data (0 usable calls)',  scheme_count: 332,  pct_of_total: 14.0, used_in_scoring: false, explanation: 'Bot did not reach any household - must re-call in Phase 2' },
]

const zoneScores = [
  { sort_order: 1, zone: 'North Assam',   usable_calls: 2330, bsi: 0.4836, quality: 0.902,  quantity: 0.870,  daily: 0.345,  status: 'Moderate', note: null },
  { sort_order: 2, zone: 'Upper Assam',   usable_calls: 951,  bsi: 0.4786, quality: 0.965,  quantity: 0.863,  daily: 0.292,  status: 'Moderate', note: null },
  { sort_order: 3, zone: 'KAAC',          usable_calls: 97,   bsi: 0.4632, quality: 0.989,  quantity: 0.911,  daily: 0.220,  status: 'Moderate', note: null },
  { sort_order: 4, zone: 'Lower Assam',   usable_calls: 1487, bsi: 0.4553, quality: 0.913,  quantity: 0.807,  daily: 0.312,  status: 'Moderate', note: null },
  { sort_order: 5, zone: 'BTAD',          usable_calls: 142,  bsi: 0.3841, quality: 0.869,  quantity: 0.725,  daily: 0.198,  status: 'Critical', note: null },
  { sort_order: 6, zone: 'Barak Valley',  usable_calls: 339,  bsi: 0.3789, quality: 0.706,  quantity: 0.720,  daily: 0.314,  status: 'Critical', note: null },
  { sort_order: 7, zone: 'DHAC',          usable_calls: null, bsi: null,   quality: null,   quantity: null,   daily: null,   status: 'No Data',  note: 'Only 95 calls made · 1.1% consent rate · excluded from scoring' },
  { sort_order: 8, zone: 'Assam (State)', usable_calls: 5346, bsi: 0.4406, quality: 0.8905, quantity: 0.8158, daily: 0.2803, status: 'Moderate', note: 'Benchmark >= 0.70 = Good' },
]

const districtScores = [
  { district: 'Darrang',                 zone: 'BTAD',         valid_schemes: 7,   usable_calls: 80,   bsi: 0.4644, quality: 0.960, quantity: 0.909, status: 'Moderate' },
  { district: 'Chirang',                 zone: 'BTAD',         valid_schemes: 1,   usable_calls: 6,    bsi: 0.4000, quality: 1.000, quantity: 0.750, status: 'Moderate' },
  { district: 'Udalguri',                zone: 'BTAD',         valid_schemes: 1,   usable_calls: 7,    bsi: 0.3714, quality: 0.750, quantity: 0.643, status: 'Critical' },
  { district: 'Baksa',                   zone: 'BTAD',         valid_schemes: 5,   usable_calls: 30,   bsi: 0.3552, quality: 0.850, quantity: 0.725, status: 'Critical' },
  { district: 'Tamulpur',                zone: 'BTAD',         valid_schemes: 3,   usable_calls: 19,   bsi: 0.3293, quality: 0.786, quantity: 0.595, status: 'Critical' },
  { district: 'Cachar',                  zone: 'Barak Valley', valid_schemes: 35,  usable_calls: 252,  bsi: 0.4542, quality: 0.905, quantity: 0.797, status: 'Moderate' },
  { district: 'Sribhumi',                zone: 'Barak Valley', valid_schemes: 11,  usable_calls: 75,   bsi: 0.4041, quality: 0.774, quantity: 0.799, status: 'Moderate' },
  { district: 'Hailakandi',              zone: 'Barak Valley', valid_schemes: 2,   usable_calls: 12,   bsi: 0.2785, quality: 0.438, quantity: 0.562, status: 'Critical' },
  { district: 'Karbi Anglong',           zone: 'KAAC',         valid_schemes: 10,  usable_calls: 75,   bsi: 0.5200, quality: 1.052, quantity: 0.927, status: 'Good'     },
  { district: 'West Karbi Anglong',      zone: 'KAAC',         valid_schemes: 3,   usable_calls: 22,   bsi: 0.4063, quality: 0.927, quantity: 0.896, status: 'Moderate' },
  { district: 'Dhubri',                  zone: 'Lower Assam',  valid_schemes: 36,  usable_calls: 318,  bsi: 0.5213, quality: 1.039, quantity: 0.906, status: 'Good'     },
  { district: 'Goalpara',                zone: 'Lower Assam',  valid_schemes: 34,  usable_calls: 262,  bsi: 0.4882, quality: 0.981, quantity: 0.873, status: 'Moderate' },
  { district: 'Bajali',                  zone: 'Lower Assam',  valid_schemes: 15,  usable_calls: 154,  bsi: 0.4865, quality: 0.947, quantity: 0.840, status: 'Moderate' },
  { district: 'Kamrup',                  zone: 'Lower Assam',  valid_schemes: 32,  usable_calls: 278,  bsi: 0.4835, quality: 0.992, quantity: 0.871, status: 'Moderate' },
  { district: 'Barpeta',                 zone: 'Lower Assam',  valid_schemes: 44,  usable_calls: 391,  bsi: 0.4429, quality: 0.923, quantity: 0.827, status: 'Moderate' },
  { district: 'Nalbari',                 zone: 'Lower Assam',  valid_schemes: 8,   usable_calls: 75,   bsi: 0.3855, quality: 0.756, quantity: 0.747, status: 'Critical' },
  { district: 'South Salmara Mancachar', zone: 'Lower Assam',  valid_schemes: 1,   usable_calls: 9,    bsi: 0.3794, quality: 0.750, quantity: 0.583, status: 'Critical' },
  { district: 'Biswanath',               zone: 'North Assam',  valid_schemes: 25,  usable_calls: 240,  bsi: 0.5060, quality: 0.917, quantity: 0.886, status: 'Good'     },
  { district: 'Majuli',                  zone: 'North Assam',  valid_schemes: 10,  usable_calls: 82,   bsi: 0.4929, quality: 0.879, quantity: 0.892, status: 'Moderate' },
  { district: 'Sonitpur',                zone: 'North Assam',  valid_schemes: 67,  usable_calls: 604,  bsi: 0.4812, quality: 0.904, quantity: 0.863, status: 'Moderate' },
  { district: 'Dhemaji',                 zone: 'North Assam',  valid_schemes: 21,  usable_calls: 166,  bsi: 0.4800, quality: 0.925, quantity: 0.877, status: 'Moderate' },
  { district: 'Lakhimpur',               zone: 'North Assam',  valid_schemes: 129, usable_calls: 1238, bsi: 0.4578, quality: 0.883, quantity: 0.830, status: 'Moderate' },
  { district: 'Sivasagar',               zone: 'Upper Assam',  valid_schemes: 31,  usable_calls: 262,  bsi: 0.5320, quality: 0.973, quantity: 0.933, status: 'Good'     },
  { district: 'Jorhat',                  zone: 'Upper Assam',  valid_schemes: 19,  usable_calls: 166,  bsi: 0.5274, quality: 0.978, quantity: 0.881, status: 'Good'     },
  { district: 'Golaghat',                zone: 'Upper Assam',  valid_schemes: 12,  usable_calls: 92,   bsi: 0.5172, quality: 0.995, quantity: 0.905, status: 'Good'     },
  { district: 'Dibrugarh',               zone: 'Upper Assam',  valid_schemes: 17,  usable_calls: 138,  bsi: 0.4971, quality: 0.997, quantity: 0.890, status: 'Moderate' },
  { district: 'Morigaon',                zone: 'Upper Assam',  valid_schemes: 1,   usable_calls: 14,   bsi: 0.4827, quality: 1.018, quantity: 0.911, status: 'Moderate' },
  { district: 'Nagaon',                  zone: 'Upper Assam',  valid_schemes: 4,   usable_calls: 37,   bsi: 0.4744, quality: 0.995, quantity: 0.938, status: 'Moderate' },
  { district: 'Tinsukia',                zone: 'Upper Assam',  valid_schemes: 5,   usable_calls: 46,   bsi: 0.4466, quality: 0.930, quantity: 0.849, status: 'Moderate' },
  { district: 'Charaideo',               zone: 'Upper Assam',  valid_schemes: 19,  usable_calls: 152,  bsi: 0.4238, quality: 0.875, quantity: 0.750, status: 'Moderate' },
  { district: 'Hojai',                   zone: 'Upper Assam',  valid_schemes: 4,   usable_calls: 44,   bsi: 0.4065, quality: 0.921, quantity: 0.712, status: 'Moderate' },
]

const repeatCallers = [
  { sort_order: 1, metric: 'Count',                          first_time: '45,693',  repeat: '170',    change_val: '',      note: '' },
  { sort_order: 2, metric: 'Consent rate',                   first_time: '27.4%',   repeat: '44.7%',  change_val: '+63%',  note: 'Familiarity increases willingness to participate' },
  { sort_order: 3, metric: 'Usable (answered Q1)',           first_time: '20.0%',   repeat: '37.1%',  change_val: '+86%',  note: 'Nearly double the data yield from same number of calls' },
  { sort_order: 4, metric: 'Avg call duration',              first_time: '60 sec',  repeat: '82 sec', change_val: '+37%',  note: 'Longer calls = more questions answered' },
  { sort_order: 5, metric: 'Completed all 5 questions',      first_time: '3.4%',    repeat: '5.9%',   change_val: '~2x',   note: 'Almost twice as likely to finish the full survey' },
  { sort_order: 6, metric: 'BSI score (0-1.0)',              first_time: '0.410',   repeat: '0.449',  change_val: '+9%',   note: 'Slightly higher satisfaction score on second contact' },
  { sort_order: 7, metric: 'Quality satisfaction (Q2 yes%)', first_time: '72.2%',   repeat: '89.3%',  change_val: '+17pp', note: 'Strong improvement in positive reporting' },
]

const callAttempts = [
  { attempt: '1',   total_calls: 39633, pct_of_all: 86.42, consented_n: 11050, consent_pct: 28.0,  q5_respondents: 3776, satisfied_n: 1975, satisfied_pct: 52.30 },
  { attempt: '2',   total_calls: 4224,  pct_of_all: 9.21,  consented_n: 1075,  consent_pct: 25.0,  q5_respondents: 356,  satisfied_n: 184,  satisfied_pct: 51.69 },
  { attempt: '3',   total_calls: 1220,  pct_of_all: 2.66,  consented_n: 285,   consent_pct: 23.0,  q5_respondents: 99,   satisfied_n: 47,   satisfied_pct: 47.47 },
  { attempt: '4',   total_calls: 479,   pct_of_all: 1.04,  consented_n: 103,   consent_pct: 22.0,  q5_respondents: 26,   satisfied_n: 10,   satisfied_pct: 38.46 },
  { attempt: '5',   total_calls: 307,   pct_of_all: 0.67,  consented_n: 70,    consent_pct: 23.0,  q5_respondents: 27,   satisfied_n: 17,   satisfied_pct: 62.96 },
  { attempt: 'All', total_calls: 45863, pct_of_all: 100.0, consented_n: 12583, consent_pct: 27.4,  q5_respondents: 4284, satisfied_n: 2233, satisfied_pct: 52.12 },
]

const questionFunnel = [
  { sort_order: 1, question_id: 'Q1', label: 'Water Daily',          answered: 9224, yes_count: 2855, no_count: 6369, yes_pct: 30.95, base_desc: '9,224 usable calls',  note: 'Entry point - base of all usable calls' },
  { sort_order: 2, question_id: 'Q2', label: 'Water Quality',        answered: 4553, yes_count: 3293, no_count: 1260, yes_pct: 72.33, base_desc: '12,583 consented',    note: 'Q2-Q5 share the 12,583 consented base' },
  { sort_order: 3, question_id: 'Q3', label: 'Water Quantity',       answered: 4745, yes_count: 2953, no_count: 1792, yes_pct: 62.23, base_desc: '12,583 consented',    note: '' },
  { sort_order: 4, question_id: 'Q4', label: 'Consistent Timing',    answered: 2142, yes_count: 1222, no_count: 920,  yes_pct: 57.05, base_desc: '12,583 consented',    note: '-2,603 fewer answers than Q3' },
  { sort_order: 5, question_id: 'Q5', label: 'Overall Satisfaction', answered: 4284, yes_count: 2233, no_count: 2051, yes_pct: 52.12, base_desc: '12,583 consented',    note: '8,299 unknown / not captured' },
]

const q5Split = [
  { category: 'satisfied',    count_n: 2233, pct: 52.1, base: 4284 },
  { category: 'neutral',      count_n: 990,  pct: 23.1, base: 4284 },
  { category: 'dissatisfied', count_n: 1061, pct: 24.8, base: 4284 },
]

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('JJM CSAT Dashboard — Supabase Seed')
  console.log('Project: ubdgohqafxdugonrchkv')
  console.log('='.repeat(45))

  // Test connection
  const ping = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers })
  if (!ping.ok) {
    console.error('Cannot reach Supabase. Check URL and key.')
    process.exit(1)
  }
  console.log('Connection OK\n')

  console.log('Seeding tables...')
  try {
    await upsert('kpi_headlines',  kpiHeadlines)
    await upsert('call_summary',   callSummary)
    await upsert('kpi_questions',  kpiQuestions)
    await upsert('scheme_coverage',schemeCoverage)
    await upsert('zone_scores',    zoneScores)
    await upsert('district_scores',districtScores)
    await upsert('repeat_callers', repeatCallers)
    await upsert('call_attempts',  callAttempts)
    await upsert('question_funnel',questionFunnel)
    await upsert('q5_split',       q5Split)
    console.log('\nAll data seeded successfully.')
  } catch (err) {
    console.error('\nError:', err.message)
    console.error('\nMake sure you have run supabase/schema.sql in the Supabase SQL Editor first.')
    process.exit(1)
  }
}

main()

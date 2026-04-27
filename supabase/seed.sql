-- ============================================================
-- JJM CSAT AI Phase 1 — Seed Data
-- All values verified from JJM_CSAT_Phase1_Final.xlsx
-- ============================================================

-- KPI Headlines
INSERT INTO kpi_headlines (metric, value, unit, description) VALUES
  ('Total Calls',          45863,  'count',   '2,373 IMIS schemes · Assam'),
  ('State BSI',            0.4406, 'score',   'Moderate · Target >= 0.70'),
  ('Satisfied (Q5)',       52.1,   '%',        'Of 4,284 Q5 respondents'),
  ('Functional Schemes',   17.6,   '%',        '108 of 615 valid schemes'),
  ('Consent Rate',         27.4,   '%',        '12,583 of 45,863 agreed');

-- Call Summary
INSERT INTO call_summary (sort_order, call_group, call_count, pct_of_total, note) VALUES
  (1,  'Total calls made',             45863, 100.0, 'All calls dialled to JJM-registered households across Assam in Phase 1'),
  (2,  'Consented (said YES)',          12583, 27.4,  'Person picked up and agreed to participate'),
  (3,  'Did NOT consent',              33280, 72.6,  'Person refused, hung up, or no response recorded'),
  (4,  'Explicitly refused',           31710, 69.1,  'Said no or hung up immediately'),
  (5,  'No response (blank)',           1208,  2.6,  'Call connected but consent not recorded'),
  (6,  'Unknown / invalid',             362,   0.8,  'Bot could not determine a clear yes or no'),
  (7,  'Usable calls (answered Q1)',    9224,  20.1, '8,327 consented + 897 non-consented who answered Q1 · ALL BSI scoring uses this group'),
  (8,  'Completed all 5 questions',     1578,   3.4, 'Answered Q1 through Q5 · 17.1% of 9,224 usable calls · richest data'),
  (9,  'Calls under 30 seconds',       19909,  43.4, 'Nearly all overlap with refused group above');

-- KPI Questions (sorted strongest to weakest)
INSERT INTO kpi_questions (sort_order, question_id, label, question_text, yes_count, no_count, base, yes_pct, weight, status, benchmark) VALUES
  (1, 'Q2', 'Water Quality',       'Is the water clean enough?',                3293, 1260, 4553, 72.33, '1.5 / 5', 'Good',     70),
  (2, 'Q3', 'Water Quantity',      'Is there enough water?',                    2953, 1792, 4745, 62.23, '1.5 / 5', 'Moderate', 70),
  (3, 'Q4', 'Consistent Timing',   'Does it arrive at a fixed time?',           1222,  920, 2142, 57.05, '0.75 / 5','Moderate', 70),
  (4, 'Q5', 'Overall Satisfaction','Are you satisfied with your supply?',       2233, 2051, 4284, 52.12, '0.5 / 5', 'Moderate', 70),
  (5, 'Q1', 'Water Daily',         'Did water come every day in last 7 days?',  2855, 6369, 9224, 30.95, '0.75 / 5','Critical', 70);

-- Scheme Coverage
INSERT INTO scheme_coverage (category, scheme_count, pct_of_total, used_in_scoring, explanation) VALUES
  ('Valid (>= 6 usable calls)', 615,  25.9, true,  'Statistically valid · used in all district, zone and state averages'),
  ('Flagged (1–5 usable calls)',1426, 60.1, false, 'Scored individually but excluded from aggregated totals'),
  ('No data (0 usable calls)',   332, 14.0, false, 'Bot did not reach any household · must re-call in Phase 2');

-- Zone Scores
INSERT INTO zone_scores (sort_order, zone, usable_calls, bsi, quality, quantity, daily, status, note) VALUES
  (1, 'North Assam',   2330, 0.4836, 0.902,  0.870,  0.345,  'Moderate', NULL),
  (2, 'Upper Assam',    951, 0.4786, 0.965,  0.863,  0.292,  'Moderate', NULL),
  (3, 'KAAC',            97, 0.4632, 0.989,  0.911,  0.220,  'Moderate', NULL),
  (4, 'Lower Assam',   1487, 0.4553, 0.913,  0.807,  0.312,  'Moderate', NULL),
  (5, 'BTAD',           142, 0.3841, 0.869,  0.725,  0.198,  'Critical', NULL),
  (6, 'Barak Valley',   339, 0.3789, 0.706,  0.720,  0.314,  'Critical', NULL),
  (7, 'DHAC',          NULL, NULL,   NULL,   NULL,   NULL,   'No Data',  'Only 95 calls made · 1.1% consent rate · excluded from scoring'),
  (8, 'Assam (State)', 5346, 0.4406, 0.8905, 0.8158, 0.2803, 'Moderate', 'Benchmark >= 0.70 = Good');

-- District Scores (all 31)
INSERT INTO district_scores (district, zone, valid_schemes, usable_calls, bsi, quality, quantity, status) VALUES
  ('Darrang',                 'BTAD',         7,   80,   0.4644, 0.960, 0.909, 'Moderate'),
  ('Chirang',                 'BTAD',         1,   6,    0.4000, 1.000, 0.750, 'Moderate'),
  ('Udalguri',                'BTAD',         1,   7,    0.3714, 0.750, 0.643, 'Critical'),
  ('Baksa',                   'BTAD',         5,   30,   0.3552, 0.850, 0.725, 'Critical'),
  ('Tamulpur',                'BTAD',         3,   19,   0.3293, 0.786, 0.595, 'Critical'),
  ('Cachar',                  'Barak Valley', 35,  252,  0.4542, 0.905, 0.797, 'Moderate'),
  ('Sribhumi',                'Barak Valley', 11,  75,   0.4041, 0.774, 0.799, 'Moderate'),
  ('Hailakandi',              'Barak Valley', 2,   12,   0.2785, 0.438, 0.562, 'Critical'),
  ('Karbi Anglong',           'KAAC',         10,  75,   0.5200, 1.052, 0.927, 'Good'),
  ('West Karbi Anglong',      'KAAC',         3,   22,   0.4063, 0.927, 0.896, 'Moderate'),
  ('Dhubri',                  'Lower Assam',  36,  318,  0.5213, 1.039, 0.906, 'Good'),
  ('Goalpara',                'Lower Assam',  34,  262,  0.4882, 0.981, 0.873, 'Moderate'),
  ('Bajali',                  'Lower Assam',  15,  154,  0.4865, 0.947, 0.840, 'Moderate'),
  ('Kamrup',                  'Lower Assam',  32,  278,  0.4835, 0.992, 0.871, 'Moderate'),
  ('Barpeta',                 'Lower Assam',  44,  391,  0.4429, 0.923, 0.827, 'Moderate'),
  ('Nalbari',                 'Lower Assam',  8,   75,   0.3855, 0.756, 0.747, 'Critical'),
  ('South Salmara Mancachar', 'Lower Assam',  1,   9,    0.3794, 0.750, 0.583, 'Critical'),
  ('Biswanath',               'North Assam',  25,  240,  0.5060, 0.917, 0.886, 'Good'),
  ('Majuli',                  'North Assam',  10,  82,   0.4929, 0.879, 0.892, 'Moderate'),
  ('Sonitpur',                'North Assam',  67,  604,  0.4812, 0.904, 0.863, 'Moderate'),
  ('Dhemaji',                 'North Assam',  21,  166,  0.4800, 0.925, 0.877, 'Moderate'),
  ('Lakhimpur',               'North Assam',  129, 1238, 0.4578, 0.883, 0.830, 'Moderate'),
  ('Sivasagar',               'Upper Assam',  31,  262,  0.5320, 0.973, 0.933, 'Good'),
  ('Jorhat',                  'Upper Assam',  19,  166,  0.5274, 0.978, 0.881, 'Good'),
  ('Golaghat',                'Upper Assam',  12,  92,   0.5172, 0.995, 0.905, 'Good'),
  ('Dibrugarh',               'Upper Assam',  17,  138,  0.4971, 0.997, 0.890, 'Moderate'),
  ('Morigaon',                'Upper Assam',  1,   14,   0.4827, 1.018, 0.911, 'Moderate'),
  ('Nagaon',                  'Upper Assam',  4,   37,   0.4744, 0.995, 0.938, 'Moderate'),
  ('Tinsukia',                'Upper Assam',  5,   46,   0.4466, 0.930, 0.849, 'Moderate'),
  ('Charaideo',               'Upper Assam',  19,  152,  0.4238, 0.875, 0.750, 'Moderate'),
  ('Hojai',                   'Upper Assam',  4,   44,   0.4065, 0.921, 0.712, 'Moderate');

-- Repeat Callers
INSERT INTO repeat_callers (sort_order, metric, first_time, repeat, change_val, note) VALUES
  (1, 'Count',                          '45,693',  '170',    '',      ''),
  (2, 'Consent rate',                   '27.4%',   '44.7%',  '+63%',  'Familiarity increases willingness to participate'),
  (3, 'Usable (answered Q1)',           '20.0%',   '37.1%',  '+86%',  'Nearly double the data yield from same number of calls'),
  (4, 'Avg call duration',              '60 sec',  '82 sec', '+37%',  'Longer calls = more questions answered = richer data'),
  (5, 'Completed all 5 questions',      '3.4%',    '5.9%',   '≈ 2×',  'Almost twice as likely to finish the full survey'),
  (6, 'BSI score (0–1.0)',              '0.410',   '0.449',  '+9%',   'Slightly higher satisfaction score on second contact'),
  (7, 'Quality satisfaction (Q2 yes%)', '72.2%',   '89.3%',  '+17pp', 'Strong improvement in positive reporting');

-- Call Attempts
INSERT INTO call_attempts (attempt, total_calls, pct_of_all, consented_n, consent_pct, q5_respondents, satisfied_n, satisfied_pct) VALUES
  ('1',   39633, 86.42, 11050, 28.0,  3776, 1975, 52.30),
  ('2',   4224,  9.21,  1075,  25.0,  356,  184,  51.69),
  ('3',   1220,  2.66,  285,   23.0,  99,   47,   47.47),
  ('4',   479,   1.04,  103,   22.0,  26,   10,   38.46),
  ('5',   307,   0.67,  70,    23.0,  27,   17,   62.96),
  ('All', 45863, 100.0, 12583, 27.4,  4284, 2233, 52.12);

-- Question Funnel
INSERT INTO question_funnel (sort_order, question_id, label, answered, yes_count, no_count, yes_pct, base_desc, note) VALUES
  (1, 'Q1', 'Water Daily',          9224, 2855, 6369, 30.95, '9,224 usable calls',  'Entry point — base of all usable calls'),
  (2, 'Q2', 'Water Quality',        4553, 3293, 1260, 72.33, '12,583 consented',    'Q2–Q5 share the 12,583 consented base'),
  (3, 'Q3', 'Water Quantity',       4745, 2953, 1792, 62.23, '12,583 consented',    ''),
  (4, 'Q4', 'Consistent Timing',    2142, 1222,  920, 57.05, '12,583 consented',    '−2,603 fewer answers than Q3'),
  (5, 'Q5', 'Overall Satisfaction', 4284, 2233, 2051, 52.12, '12,583 consented',    '8,299 unknown / not captured');

-- Q5 3-way split
INSERT INTO q5_split (category, count_n, pct, base) VALUES
  ('satisfied',    2233, 52.1, 4284),
  ('neutral',       990, 23.1, 4284),
  ('dissatisfied', 1061, 24.8, 4284);

-- ============================================================
-- JJM CSAT AI Phase 1 Dashboard — Supabase Schema
-- Assam Jal Jeevan Mission · April 2026
-- ============================================================

-- KPI headline numbers (5 top-level metrics)
CREATE TABLE IF NOT EXISTS kpi_headlines (
  id              serial PRIMARY KEY,
  metric          text NOT NULL,
  value           numeric NOT NULL,
  unit            text,           -- '%', 'score', 'count'
  description     text,
  updated_at      timestamptz DEFAULT now()
);

-- Full call summary breakdown
CREATE TABLE IF NOT EXISTS call_summary (
  id              serial PRIMARY KEY,
  call_group      text NOT NULL,
  call_count      integer NOT NULL,
  pct_of_total    numeric(5,1),
  note            text,
  sort_order      integer NOT NULL
);

-- KPI question results (Q1–Q5)
CREATE TABLE IF NOT EXISTS kpi_questions (
  id              serial PRIMARY KEY,
  question_id     text NOT NULL UNIQUE,  -- 'Q1' .. 'Q5'
  label           text NOT NULL,
  question_text   text NOT NULL,
  yes_count       integer NOT NULL,
  no_count        integer NOT NULL,
  base            integer NOT NULL,
  yes_pct         numeric(5,2) NOT NULL,
  weight          text,
  status          text NOT NULL,         -- 'Good' | 'Moderate' | 'Critical'
  benchmark       numeric(5,1) DEFAULT 70,
  sort_order      integer NOT NULL
);

-- Scheme coverage
CREATE TABLE IF NOT EXISTS scheme_coverage (
  id              serial PRIMARY KEY,
  category        text NOT NULL UNIQUE,  -- 'valid' | 'flagged' | 'no_data'
  scheme_count    integer NOT NULL,
  pct_of_total    numeric(5,1) NOT NULL,
  used_in_scoring boolean NOT NULL,
  explanation     text
);

-- Zone BSI scores
CREATE TABLE IF NOT EXISTS zone_scores (
  id              serial PRIMARY KEY,
  zone            text NOT NULL UNIQUE,
  usable_calls    integer,
  bsi             numeric(6,4),
  quality         numeric(6,4),   -- out of 1.5
  quantity        numeric(6,4),   -- out of 1.5
  daily           numeric(6,4),   -- out of 0.75
  status          text,
  note            text,
  sort_order      integer NOT NULL
);

-- District BSI scores
CREATE TABLE IF NOT EXISTS district_scores (
  id              serial PRIMARY KEY,
  district        text NOT NULL UNIQUE,
  zone            text NOT NULL,
  valid_schemes   integer NOT NULL,
  usable_calls    integer NOT NULL,
  bsi             numeric(6,4) NOT NULL,
  quality         numeric(6,4),
  quantity        numeric(6,4),
  status          text NOT NULL
);

-- Repeat vs first-time caller comparison
CREATE TABLE IF NOT EXISTS repeat_callers (
  id              serial PRIMARY KEY,
  metric          text NOT NULL,
  first_time      text NOT NULL,
  repeat          text NOT NULL,
  change_val      text,
  note            text,
  sort_order      integer NOT NULL
);

-- Per-attempt call breakdown (1–5 + All)
CREATE TABLE IF NOT EXISTS call_attempts (
  id              serial PRIMARY KEY,
  attempt         text NOT NULL UNIQUE,  -- '1'..'5' | 'All'
  total_calls     integer NOT NULL,
  pct_of_all      numeric(6,2),
  consented_n     integer,
  consent_pct     numeric(5,1),
  q5_respondents  integer,
  satisfied_n     integer,
  satisfied_pct   numeric(5,2)
);

-- Question response funnel
CREATE TABLE IF NOT EXISTS question_funnel (
  id              serial PRIMARY KEY,
  question_id     text NOT NULL UNIQUE,
  label           text NOT NULL,
  answered        integer NOT NULL,
  yes_count       integer NOT NULL,
  no_count        integer NOT NULL,
  yes_pct         numeric(5,2) NOT NULL,
  base_desc       text,
  note            text,
  sort_order      integer NOT NULL
);

-- Q5 3-way satisfaction split
CREATE TABLE IF NOT EXISTS q5_split (
  id              serial PRIMARY KEY,
  category        text NOT NULL UNIQUE,  -- 'satisfied' | 'neutral' | 'dissatisfied'
  count_n         integer NOT NULL,
  pct             numeric(5,1) NOT NULL,
  base            integer NOT NULL
);

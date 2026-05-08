-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2 Schema — JJM CSAT AI
-- Run this in the Supabase SQL editor AFTER the existing Phase 1 schema.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Upload job tracking ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_uploads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         TEXT        NOT NULL,
  file_size_bytes  INTEGER,
  row_count        INTEGER,
  status           TEXT        NOT NULL DEFAULT 'queued'
                               CHECK (status IN ('queued','validating','processing','complete','error')),
  progress         INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  message          TEXT,
  error_detail     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- ── KPI summary (one active row at a time) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_kpi_summary (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id               UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  total_calls             INTEGER,
  consented               INTEGER,
  usable_calls            INTEGER,
  completed_all_5         INTEGER,
  state_bsi               NUMERIC(6,4),
  q1_yes_pct              NUMERIC(6,2),
  q2_yes_pct              NUMERIC(6,2),
  q3_yes_pct              NUMERIC(6,2),
  q1a_yes_pct             NUMERIC(6,2),
  q5_satisfied_pct        NUMERIC(6,2),
  q5_satisfied_count      INTEGER,
  q5_neutral_count        INTEGER,
  q5_dissatisfied_count   INTEGER,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── District-level BSI scores ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_district_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  district      TEXT        NOT NULL,
  zone          TEXT        NOT NULL,
  total_calls   INTEGER,
  consented     INTEGER,
  usable_calls  INTEGER,
  bsi           NUMERIC(6,4),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Zone-level BSI scores ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_zone_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  zone          TEXT        NOT NULL,
  total_calls   INTEGER,
  consented     INTEGER,
  usable_calls  INTEGER,
  bsi           NUMERIC(6,4),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Scheme-level BSI scores ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_scheme_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  imis_id       TEXT        NOT NULL,
  district      TEXT,
  zone          TEXT,
  total_calls   INTEGER,
  consented     INTEGER,
  usable_calls  INTEGER,
  bsi           NUMERIC(6,4),
  q1_yes_pct    NUMERIC(6,2),
  q1a_yes_pct   NUMERIC(6,2),
  q2_yes_pct    NUMERIC(6,2),
  q3_yes_pct    NUMERIC(6,2),
  q5_sat_pct    NUMERIC(6,2),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Useful indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_phase2_uploads_status      ON phase2_uploads(status);
CREATE INDEX IF NOT EXISTS idx_phase2_kpi_active          ON phase2_kpi_summary(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_phase2_district_active     ON phase2_district_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_phase2_zone_active         ON phase2_zone_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_phase2_scheme_active       ON phase2_scheme_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_phase2_scheme_imis         ON phase2_scheme_scores(imis_id);

-- ── Row Level Security (read-only for anon/authenticated) ─────────────────────
ALTER TABLE phase2_uploads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_kpi_summary      ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_district_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_zone_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_scheme_scores    ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all phase2 data
CREATE POLICY "authenticated read phase2_uploads"
  ON phase2_uploads FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated read phase2_kpi_summary"
  ON phase2_kpi_summary FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated read phase2_district_scores"
  ON phase2_district_scores FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated read phase2_zone_scores"
  ON phase2_zone_scores FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "authenticated read phase2_scheme_scores"
  ON phase2_scheme_scores FOR SELECT TO authenticated USING (TRUE);

-- The backend uses the SERVICE ROLE key which bypasses RLS for inserts/updates.
-- Do NOT add insert/update policies for the anon or authenticated role.

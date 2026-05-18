-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2 Schema v2 — JJM CSAT AI
-- Run this in the Supabase SQL editor AFTER phase2_schema.sql.
-- Safe to run multiple times (IF NOT EXISTS / IF NOT column).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add new columns to phase2_uploads ─────────────────────────────────────
ALTER TABLE phase2_uploads ADD COLUMN IF NOT EXISTS column_map     JSONB;
ALTER TABLE phase2_uploads ADD COLUMN IF NOT EXISTS quality_report JSONB;
ALTER TABLE phase2_uploads ADD COLUMN IF NOT EXISTS mode           TEXT DEFAULT 'replace';

-- ── 2. Raw call records (one row per survey call) ─────────────────────────────
CREATE TABLE IF NOT EXISTS phase2_call_records (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id            UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  row_number           INTEGER,
  -- Survey responses
  consent              TEXT,
  water_received_daily TEXT,         -- Q1
  quality_satisfied    TEXT,         -- Q2
  quantity_satisfied   TEXT,         -- Q3
  consistent_timing    TEXT,         -- Q4 / Q1A
  overall_satisfaction TEXT,         -- Q5
  -- Geography
  district             TEXT,
  zone                 TEXT,
  -- Optional identifiers
  imis_id              TEXT,
  contact_attempts     INTEGER,
  call_duration        INTEGER,
  hhid                 TEXT,
  -- Derived flags (auto-set by backend on insert/update)
  is_consented         BOOLEAN,
  is_usable            BOOLEAN,
  -- Any extra columns from the source file
  extra_data           JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Add Q-percentage columns to aggregate tables ───────────────────────────
-- district scores
ALTER TABLE phase2_district_scores ADD COLUMN IF NOT EXISTS q1_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_district_scores ADD COLUMN IF NOT EXISTS q2_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_district_scores ADD COLUMN IF NOT EXISTS q3_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_district_scores ADD COLUMN IF NOT EXISTS q1a_yes_pct NUMERIC(6,2);
ALTER TABLE phase2_district_scores ADD COLUMN IF NOT EXISTS q5_sat_pct  NUMERIC(6,2);

-- zone scores
ALTER TABLE phase2_zone_scores ADD COLUMN IF NOT EXISTS q1_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_zone_scores ADD COLUMN IF NOT EXISTS q2_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_zone_scores ADD COLUMN IF NOT EXISTS q3_yes_pct  NUMERIC(6,2);
ALTER TABLE phase2_zone_scores ADD COLUMN IF NOT EXISTS q1a_yes_pct NUMERIC(6,2);
ALTER TABLE phase2_zone_scores ADD COLUMN IF NOT EXISTS q5_sat_pct  NUMERIC(6,2);

-- scheme scores
ALTER TABLE phase2_scheme_scores ADD COLUMN IF NOT EXISTS q1a_yes_pct NUMERIC(6,2);
ALTER TABLE phase2_scheme_scores ADD COLUMN IF NOT EXISTS q5_sat_pct  NUMERIC(6,2);

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_p2_records_upload   ON phase2_call_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_p2_records_district ON phase2_call_records(district);
CREATE INDEX IF NOT EXISTS idx_p2_records_zone     ON phase2_call_records(zone);
CREATE INDEX IF NOT EXISTS idx_p2_records_imis     ON phase2_call_records(imis_id);
CREATE INDEX IF NOT EXISTS idx_p2_records_consent  ON phase2_call_records(is_consented);
CREATE INDEX IF NOT EXISTS idx_p2_records_usable   ON phase2_call_records(is_usable);

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE phase2_call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated read phase2_call_records"
  ON phase2_call_records FOR SELECT TO authenticated USING (TRUE);

-- ── 6. Auto-update updated_at on edits ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_p2_records_updated_at ON phase2_call_records;
CREATE TRIGGER trg_p2_records_updated_at
  BEFORE UPDATE ON phase2_call_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

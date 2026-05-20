-- ─── scheme_detail table ────────────────────────────────────────────────────
-- Combines:
--   1. Scheme master data  (Copy of 1.scheme_master_data_all 21 Nov.xlsx)
--   2. CSAT AI summaries   (CSAT_Scheme_Summaries_v3.xlsx)
--
-- Primary key: centre_scheme_id  (= Imis_id in CSAT summaries file)
-- imis_id     = state_scheme_id  (the government IMIS ID, 4-5 digit)
-- blocks      = all unique blocks for this scheme, comma-separated
--
-- Run this once in the Supabase SQL editor before running ingest_scheme_data.py

CREATE TABLE IF NOT EXISTS public.scheme_detail (
  centre_scheme_id   BIGINT        PRIMARY KEY,
  imis_id            INTEGER,                        -- state IMIS ID (state_scheme_id)
  scheme_name        TEXT,
  district           TEXT,
  division           TEXT,
  blocks             TEXT,                           -- all blocks comma-separated
  sub_divisions      TEXT,                           -- all sub-divisions comma-separated
  planned_fhtc       INTEGER,
  achieved_fhtc      INTEGER,
  scheme_summary     TEXT,                           -- AI narrative (from CSAT_Scheme_Summaries_v3)
  key_issues         TEXT,                           -- semicolon-separated tags
  has_summary        BOOLEAN GENERATED ALWAYS AS (scheme_summary IS NOT NULL) STORED,
  created_at         TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_sd_scheme_name  ON public.scheme_detail (lower(scheme_name));
CREATE INDEX IF NOT EXISTS idx_sd_imis_id      ON public.scheme_detail (imis_id);
CREATE INDEX IF NOT EXISTS idx_sd_district     ON public.scheme_detail (district);
CREATE INDEX IF NOT EXISTS idx_sd_has_summary  ON public.scheme_detail (has_summary);

-- Enable row-level security (RLS) — allow authenticated reads
ALTER TABLE public.scheme_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read"
  ON public.scheme_detail
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role all"
  ON public.scheme_detail
  FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE public.scheme_detail IS
  'Scheme master data (centre_scheme_id ↔ IMIS ID mapping + block geography) joined with CSAT AI narrative summaries.';
COMMENT ON COLUMN public.scheme_detail.centre_scheme_id IS
  'Central government scheme ID (= Imis_id column in CSAT_Scheme_Summaries_v3.xlsx)';
COMMENT ON COLUMN public.scheme_detail.imis_id IS
  'State IMIS ID (state_scheme_id in scheme master). 47 schemes share an IMIS ID across multiple centre IDs — each row is still unique by centre_scheme_id.';
COMMENT ON COLUMN public.scheme_detail.blocks IS
  'All administrative blocks this scheme serves, comma-separated.';
COMMENT ON COLUMN public.scheme_detail.scheme_summary IS
  'AI-generated narrative summary of citizen feedback aggregated across all calls for this scheme.';

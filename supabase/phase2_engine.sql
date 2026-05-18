-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2 Complete SQL Setup — JJM CSAT AI
--
-- SELF-CONTAINED: run this ONE file in the Supabase SQL editor.
-- Creates all tables, functions, and views from scratch.
-- Safe to re-run (CREATE IF NOT EXISTS / CREATE OR REPLACE everywhere).
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 1: BASE TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- Upload job tracking
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
  column_map       JSONB,
  quality_report   JSONB,
  mode             TEXT        DEFAULT 'replace',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- KPI summary (one active row at a time per upload)
CREATE TABLE IF NOT EXISTS phase2_kpi_summary (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id               UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  total_calls             INTEGER,
  consented               INTEGER,
  usable_calls            INTEGER,
  completed_all_5         INTEGER,
  state_bsi               NUMERIC(6,4),
  q1_yes_pct              NUMERIC(6,2),
  q1a_yes_pct             NUMERIC(6,2),
  q2_yes_pct              NUMERIC(6,2),
  q3_yes_pct              NUMERIC(6,2),
  q5_satisfied_pct        NUMERIC(6,2),
  q5_satisfied_count      INTEGER,
  q5_neutral_count        INTEGER,
  q5_dissatisfied_count   INTEGER,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- District-level BSI scores
CREATE TABLE IF NOT EXISTS phase2_district_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  district      TEXT        NOT NULL,
  zone          TEXT        NOT NULL,
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

-- Zone-level BSI scores
CREATE TABLE IF NOT EXISTS phase2_zone_scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  zone          TEXT        NOT NULL,
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

-- Scheme-level BSI scores
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

-- Typed call records (one row per survey call, with named columns)
CREATE TABLE IF NOT EXISTS phase2_call_records (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id            UUID        REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  row_number           INTEGER,
  consent              TEXT,
  water_received_daily TEXT,
  quality_satisfied    TEXT,
  quantity_satisfied   TEXT,
  consistent_timing    TEXT,
  overall_satisfaction TEXT,
  district             TEXT,
  zone                 TEXT,
  imis_id              TEXT,
  contact_attempts     INTEGER,
  call_duration        INTEGER,
  hhid                 TEXT,
  is_consented         BOOLEAN,
  is_usable            BOOLEAN,
  extra_data           JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw JSONB records (accepts any column structure — source of truth for SQL engine)
CREATE TABLE IF NOT EXISTS phase2_raw_records (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id  UUID        NOT NULL REFERENCES phase2_uploads(id) ON DELETE CASCADE,
  row_num    INTEGER,
  data       JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 2: INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_p2_uploads_status      ON phase2_uploads(status);
CREATE INDEX IF NOT EXISTS idx_p2_kpi_active          ON phase2_kpi_summary(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_p2_district_active     ON phase2_district_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_p2_zone_active         ON phase2_zone_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_p2_scheme_active       ON phase2_scheme_scores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_p2_scheme_imis         ON phase2_scheme_scores(imis_id);
CREATE INDEX IF NOT EXISTS idx_p2_records_upload      ON phase2_call_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_p2_records_district    ON phase2_call_records(district);
CREATE INDEX IF NOT EXISTS idx_p2_records_zone        ON phase2_call_records(zone);
CREATE INDEX IF NOT EXISTS idx_p2_raw_upload          ON phase2_raw_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_p2_raw_data_gin        ON phase2_raw_records USING gin(data);


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 3: ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE phase2_uploads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_kpi_summary     ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_district_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_zone_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_scheme_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_call_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase2_raw_records     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_uploads'         AND policyname='auth read phase2_uploads')         THEN CREATE POLICY "auth read phase2_uploads"         ON phase2_uploads         FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_kpi_summary'     AND policyname='auth read phase2_kpi_summary')     THEN CREATE POLICY "auth read phase2_kpi_summary"     ON phase2_kpi_summary     FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_district_scores' AND policyname='auth read phase2_district_scores') THEN CREATE POLICY "auth read phase2_district_scores" ON phase2_district_scores FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_zone_scores'     AND policyname='auth read phase2_zone_scores')     THEN CREATE POLICY "auth read phase2_zone_scores"     ON phase2_zone_scores     FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_scheme_scores'   AND policyname='auth read phase2_scheme_scores')   THEN CREATE POLICY "auth read phase2_scheme_scores"   ON phase2_scheme_scores   FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_call_records'    AND policyname='auth read phase2_call_records')    THEN CREATE POLICY "auth read phase2_call_records"    ON phase2_call_records    FOR SELECT TO authenticated USING (TRUE); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='phase2_raw_records'     AND policyname='auth read phase2_raw_records')     THEN CREATE POLICY "auth read phase2_raw_records"     ON phase2_raw_records     FOR SELECT TO authenticated USING (TRUE); END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 4: TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_p2_raw_updated_at     ON phase2_raw_records;
DROP TRIGGER IF EXISTS trg_p2_records_updated_at ON phase2_call_records;

CREATE TRIGGER trg_p2_raw_updated_at
  BEFORE UPDATE ON phase2_raw_records
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

CREATE TRIGGER trg_p2_records_updated_at
  BEFORE UPDATE ON phase2_call_records
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 5: FIELD EXTRACTION HELPER
--  p2_field(data, key1, key2, ...) — returns first non-empty value for any key.
--  Works case-insensitively. Treats 'nan', 'none', 'null', 'n/a' as empty.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION p2_field(data JSONB, VARIADIC keys TEXT[])
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
AS $$
DECLARE
  k   TEXT;
  v   TEXT;
  raw TEXT;
BEGIN
  FOREACH k IN ARRAY keys LOOP
    raw := COALESCE(data->>k, data->>lower(k));
    IF raw IS NOT NULL THEN
      v := lower(trim(raw));
      IF v NOT IN ('', 'nan', 'none', 'null', 'na', 'n/a', 'nil') THEN
        RETURN v;
      END IF;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 6: NORMALISED VIEW
--  phase2_records — maps any column naming to canonical names automatically.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW phase2_records AS
SELECT
  r.id, r.upload_id, r.row_num, r.created_at, r.updated_at,

  p2_field(r.data, 'consent','consented','agreed','survey_consent',
    'consent_given','respondent_consent','call_consent','has_consented','consent_status')
    AS consent,

  p2_field(r.data, 'water_received_daily','water_daily','q1','q1_answer','q1_response',
    'daily_water','water_supply_daily','water_received','daily_supply',
    'receives_water_daily','water_q1','q1_daily_water','daily_water_supply')
    AS water_received_daily,

  p2_field(r.data, 'quality_satisfied','water_quality','q2','q2_answer','q2_response',
    'quality','water_quality_satisfied','satisfied_quality','quality_ok',
    'q2_quality','water_q2','q2_water_quality','quality_of_water')
    AS quality_satisfied,

  p2_field(r.data, 'quantity_satisfied','water_quantity','q3','q3_answer','q3_response',
    'quantity','water_quantity_satisfied','enough_water','sufficient_water',
    'q3_quantity','quantity_ok','water_q3','q3_water_quantity')
    AS quantity_satisfied,

  p2_field(r.data, 'consistent_timing','timing','q4','q1a','q4_answer','q1a_answer',
    'q4_response','q1a_response','consistent','water_timing',
    'regular_timing','supply_timing','water_q4','q4_consistent_timing')
    AS consistent_timing,

  p2_field(r.data, 'overall_satisfaction','satisfaction','q5','q5_answer','q5_response',
    'overall','overall_sat','q5_satisfaction','total_satisfaction',
    'rating','water_q5','q5_overall','overall_rating','csat_score')
    AS overall_satisfaction,

  p2_field(r.data, 'district','district_name','dist','district_id','district_code','taluka','block','mandal')
    AS district,

  p2_field(r.data, 'zone','zone_name','region','zone_id','zone_code','circle','division','cluster','area')
    AS zone,

  p2_field(r.data, 'imis_id','Imis_id','IMIS_ID','imis','scheme_id','scheme_code',
    'pwsid','wss_id','scheme_imis','water_scheme_id','imis_scheme_id')
    AS imis_id,

  p2_field(r.data, 'hhid','HHID','household_id','hh_id','beneficiary_id','respondent_id','hh_code')
    AS hhid,

  (p2_field(r.data, 'contact_attempts','attempts','call_attempts','retries'))::INTEGER    AS contact_attempts,
  (p2_field(r.data, 'call_duration','duration','call_length','duration_seconds'))::INTEGER AS call_duration,

  p2_field(r.data, 'consent','consented','agreed','survey_consent','consent_given') = 'yes'
    AS is_consented,

  p2_field(r.data, 'water_received_daily','water_daily','q1','q1_answer','daily_water','water_received')
    IN ('yes','no') AS is_usable,

  r.data AS raw_data

FROM phase2_raw_records r;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 7: BSI FORMULA FUNCTION
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION p2_bsi_score(
  q1 NUMERIC, q1a NUMERIC, q2 NUMERIC, q3 NUMERIC, q5 NUMERIC
) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT round((q1*0.75 + q1a*0.75 + q2*1.5 + q3*1.5 + q5*0.5) / 5.0, 4);
$$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 8: MAIN AGGREGATION RPC
--  recompute_phase2_aggregates(upload_id)
--  Call once after any insert/edit/delete. Recomputes all BSI scores in SQL.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION recompute_phase2_aggregates(p_upload_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_total  INTEGER;
  v_bsi    NUMERIC;
  v_bsi5   NUMERIC;
  v_n_dist INTEGER := 0;
  v_n_zone INTEGER := 0;
  v_n_schem INTEGER := 0;
BEGIN

  -- Deactivate old aggregates for this upload
  UPDATE phase2_kpi_summary     SET is_active = FALSE WHERE upload_id = p_upload_id;
  UPDATE phase2_district_scores SET is_active = FALSE WHERE upload_id = p_upload_id;
  UPDATE phase2_zone_scores     SET is_active = FALSE WHERE upload_id = p_upload_id;
  UPDATE phase2_scheme_scores   SET is_active = FALSE WHERE upload_id = p_upload_id;

  -- State KPI
  WITH
  all_rec   AS (SELECT * FROM phase2_records WHERE upload_id = p_upload_id),
  usable    AS (SELECT * FROM all_rec WHERE water_received_daily IN ('yes','no')),
  consented AS (SELECT * FROM all_rec WHERE consent = 'yes'),
  q1_yes    AS (SELECT * FROM usable WHERE water_received_daily = 'yes'),
  sf AS (
    SELECT
      CASE WHEN COUNT(*) FILTER (WHERE q1.water_received_daily IN ('yes','no')) > 0
           THEN COUNT(*) FILTER (WHERE q1.water_received_daily = 'yes')::NUMERIC
                / COUNT(*) FILTER (WHERE q1.water_received_daily IN ('yes','no')) ELSE 0 END AS f_q1,
      CASE WHEN COUNT(*) FILTER (WHERE q1a.consistent_timing IN ('yes','no')) > 0
           THEN COUNT(*) FILTER (WHERE q1a.consistent_timing = 'yes')::NUMERIC
                / COUNT(*) FILTER (WHERE q1a.consistent_timing IN ('yes','no')) ELSE 0 END  AS f_q1a,
      CASE WHEN COUNT(*) FILTER (WHERE con.quality_satisfied IN ('yes','no')) > 0
           THEN COUNT(*) FILTER (WHERE con.quality_satisfied = 'yes')::NUMERIC
                / COUNT(*) FILTER (WHERE con.quality_satisfied IN ('yes','no')) ELSE 0 END  AS f_q2,
      CASE WHEN COUNT(*) FILTER (WHERE con.quantity_satisfied IN ('yes','no')) > 0
           THEN COUNT(*) FILTER (WHERE con.quantity_satisfied = 'yes')::NUMERIC
                / COUNT(*) FILTER (WHERE con.quantity_satisfied IN ('yes','no')) ELSE 0 END AS f_q3,
      CASE WHEN COUNT(*) FILTER (WHERE con.overall_satisfaction IN ('satisfied','neutral','dissatisfied')) > 0
           THEN COUNT(*) FILTER (WHERE con.overall_satisfaction = 'satisfied')::NUMERIC
                / COUNT(*) FILTER (WHERE con.overall_satisfaction IN ('satisfied','neutral','dissatisfied')) ELSE 0 END AS f_q5,
      (SELECT COUNT(*) FROM all_rec)   AS n_total,
      (SELECT COUNT(*) FROM usable)    AS n_usable,
      (SELECT COUNT(*) FROM consented) AS n_consented
    FROM usable q1
    CROSS JOIN q1_yes q1a
    CROSS JOIN consented con
  )
  INSERT INTO phase2_kpi_summary (
    upload_id, total_calls, consented, usable_calls,
    state_bsi, q1_yes_pct, q1a_yes_pct, q2_yes_pct, q3_yes_pct, q5_satisfied_pct,
    q5_satisfied_count, q5_neutral_count, q5_dissatisfied_count, completed_all_5, is_active
  )
  SELECT
    p_upload_id,
    sf.n_total, sf.n_consented, sf.n_usable,
    p2_bsi_score(sf.f_q1, sf.f_q1a, sf.f_q2, sf.f_q3, sf.f_q5),
    round(sf.f_q1*100,2), round(sf.f_q1a*100,2), round(sf.f_q2*100,2),
    round(sf.f_q3*100,2), round(sf.f_q5*100,2),
    (SELECT COUNT(*) FROM consented WHERE overall_satisfaction = 'satisfied'),
    (SELECT COUNT(*) FROM consented WHERE overall_satisfaction = 'neutral'),
    (SELECT COUNT(*) FROM consented WHERE overall_satisfaction = 'dissatisfied'),
    (SELECT COUNT(*) FROM all_rec
     WHERE water_received_daily IN ('yes','no') AND quality_satisfied IN ('yes','no')
       AND quantity_satisfied IN ('yes','no') AND consistent_timing IN ('yes','no')
       AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')),
    TRUE
  FROM sf
  LIMIT 1;

  SELECT total_calls, state_bsi INTO v_total, v_bsi
  FROM phase2_kpi_summary WHERE upload_id = p_upload_id AND is_active = TRUE
  ORDER BY created_at DESC LIMIT 1;
  v_bsi5 := round(COALESCE(v_bsi, 0) * 5, 2);

  -- District aggregates
  INSERT INTO phase2_district_scores (
    upload_id, district, zone, total_calls, consented, usable_calls, bsi,
    q1_yes_pct, q1a_yes_pct, q2_yes_pct, q3_yes_pct, q5_sat_pct, is_active
  )
  SELECT
    p_upload_id,
    initcap(district), initcap(zone), COUNT(*),
    COUNT(*) FILTER (WHERE consent = 'yes'),
    COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),
    p2_bsi_score(
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) ELSE 0 END
    ),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')),0),2),
    TRUE
  FROM phase2_records
  WHERE upload_id = p_upload_id AND district IS NOT NULL AND zone IS NOT NULL
  GROUP BY district, zone;
  GET DIAGNOSTICS v_n_dist = ROW_COUNT;

  -- Zone aggregates
  INSERT INTO phase2_zone_scores (
    upload_id, zone, total_calls, consented, usable_calls, bsi,
    q1_yes_pct, q1a_yes_pct, q2_yes_pct, q3_yes_pct, q5_sat_pct, is_active
  )
  SELECT
    p_upload_id, initcap(zone), COUNT(*),
    COUNT(*) FILTER (WHERE consent = 'yes'),
    COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),
    p2_bsi_score(
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) ELSE 0 END
    ),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')),0),2),
    TRUE
  FROM phase2_records
  WHERE upload_id = p_upload_id AND zone IS NOT NULL
  GROUP BY zone;
  GET DIAGNOSTICS v_n_zone = ROW_COUNT;

  -- Scheme aggregates
  INSERT INTO phase2_scheme_scores (
    upload_id, imis_id, district, zone, total_calls, consented, usable_calls, bsi,
    q1_yes_pct, q1a_yes_pct, q2_yes_pct, q3_yes_pct, q5_sat_pct, is_active
  )
  SELECT
    p_upload_id, imis_id,
    initcap(mode() WITHIN GROUP (ORDER BY district)),
    initcap(mode() WITHIN GROUP (ORDER BY zone)),
    COUNT(*),
    COUNT(*) FILTER (WHERE consent = 'yes'),
    COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),
    p2_bsi_score(
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')) ELSE 0 END,
      CASE WHEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) > 0 THEN COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')) ELSE 0 END
    ),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE water_received_daily='yes' AND consistent_timing IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quality_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied='yes')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND quantity_satisfied IN ('yes','no')),0),2),
    round(100.0*COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction='satisfied')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE consent='yes' AND overall_satisfaction IN ('satisfied','neutral','dissatisfied')),0),2),
    TRUE
  FROM phase2_records
  WHERE upload_id = p_upload_id AND imis_id IS NOT NULL
  GROUP BY imis_id;
  GET DIAGNOSTICS v_n_schem = ROW_COUNT;

  UPDATE phase2_uploads SET
    status = 'complete', progress = 100,
    message = format('Done — %s rows · BSI %s/5 · %s districts · %s zones · %s schemes',
                     v_total, v_bsi5, v_n_dist, v_n_zone, v_n_schem),
    completed_at = NOW()
  WHERE id = p_upload_id;

  RETURN jsonb_build_object(
    'upload_id', p_upload_id, 'total_rows', v_total,
    'bsi', v_bsi, 'bsi_5', v_bsi5,
    'districts', v_n_dist, 'zones', v_n_zone, 'schemes', v_n_schem
  );
END;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 9: DATA QUALITY REPORT
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION p2_quality_report(p_upload_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH r AS (SELECT * FROM phase2_records WHERE upload_id = p_upload_id),
  n AS (SELECT COUNT(*) AS total FROM r)
  SELECT jsonb_build_object(
    'total_rows', n.total,
    'usable_rows',    COUNT(*) FILTER (WHERE r.is_usable),
    'consented_rows', COUNT(*) FILTER (WHERE r.is_consented),
    'consent_breakdown', jsonb_build_object(
      'yes', COUNT(*) FILTER (WHERE r.consent='yes'),
      'no',  COUNT(*) FILTER (WHERE r.consent='no'),
      'unknown', COUNT(*) FILTER (WHERE r.consent='unknown'),
      'invalid_response', COUNT(*) FILTER (WHERE r.consent='invalid_response')
    ),
    'completeness', jsonb_build_object(
      'consent',              round(100.0*COUNT(*) FILTER (WHERE r.consent IS NOT NULL)/NULLIF(n.total,0),1),
      'water_received_daily', round(100.0*COUNT(*) FILTER (WHERE r.water_received_daily IS NOT NULL)/NULLIF(n.total,0),1),
      'quality_satisfied',    round(100.0*COUNT(*) FILTER (WHERE r.quality_satisfied IS NOT NULL)/NULLIF(n.total,0),1),
      'quantity_satisfied',   round(100.0*COUNT(*) FILTER (WHERE r.quantity_satisfied IS NOT NULL)/NULLIF(n.total,0),1),
      'consistent_timing',    round(100.0*COUNT(*) FILTER (WHERE r.consistent_timing IS NOT NULL)/NULLIF(n.total,0),1),
      'overall_satisfaction', round(100.0*COUNT(*) FILTER (WHERE r.overall_satisfaction IS NOT NULL)/NULLIF(n.total,0),1),
      'district',             round(100.0*COUNT(*) FILTER (WHERE r.district IS NOT NULL)/NULLIF(n.total,0),1),
      'zone',                 round(100.0*COUNT(*) FILTER (WHERE r.zone IS NOT NULL)/NULLIF(n.total,0),1),
      'imis_id',              round(100.0*COUNT(*) FILTER (WHERE r.imis_id IS NOT NULL)/NULLIF(n.total,0),1)
    ),
    'valid_rates', jsonb_build_object(
      'water_received_daily',  round(100.0*COUNT(*) FILTER (WHERE r.water_received_daily IN ('yes','no'))/NULLIF(COUNT(*) FILTER (WHERE r.water_received_daily IS NOT NULL),0),1),
      'quality_satisfied',     round(100.0*COUNT(*) FILTER (WHERE r.quality_satisfied IN ('yes','no'))/NULLIF(COUNT(*) FILTER (WHERE r.quality_satisfied IS NOT NULL),0),1),
      'quantity_satisfied',    round(100.0*COUNT(*) FILTER (WHERE r.quantity_satisfied IN ('yes','no'))/NULLIF(COUNT(*) FILTER (WHERE r.quantity_satisfied IS NOT NULL),0),1),
      'consistent_timing',     round(100.0*COUNT(*) FILTER (WHERE r.consistent_timing IN ('yes','no'))/NULLIF(COUNT(*) FILTER (WHERE r.consistent_timing IS NOT NULL),0),1),
      'overall_satisfaction',  round(100.0*COUNT(*) FILTER (WHERE r.overall_satisfaction IN ('satisfied','neutral','dissatisfied'))/NULLIF(COUNT(*) FILTER (WHERE r.overall_satisfaction IS NOT NULL),0),1)
    ),
    'geographic_coverage', jsonb_build_object(
      'districts', COUNT(DISTINCT r.district),
      'zones',     COUNT(DISTINCT r.zone),
      'schemes',   COUNT(DISTINCT r.imis_id)
    )
  )
  FROM r, n GROUP BY n.total;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 10: DELETE FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Delete one upload and all its data
CREATE OR REPLACE FUNCTION delete_phase2_upload(p_upload_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_raw INTEGER; v_dist INTEGER; v_zone INTEGER; v_schem INTEGER; v_kpi INTEGER;
BEGIN
  DELETE FROM phase2_raw_records     WHERE upload_id = p_upload_id; GET DIAGNOSTICS v_raw   = ROW_COUNT;
  DELETE FROM phase2_call_records    WHERE upload_id = p_upload_id;
  DELETE FROM phase2_district_scores WHERE upload_id = p_upload_id; GET DIAGNOSTICS v_dist  = ROW_COUNT;
  DELETE FROM phase2_zone_scores     WHERE upload_id = p_upload_id; GET DIAGNOSTICS v_zone  = ROW_COUNT;
  DELETE FROM phase2_scheme_scores   WHERE upload_id = p_upload_id; GET DIAGNOSTICS v_schem = ROW_COUNT;
  DELETE FROM phase2_kpi_summary     WHERE upload_id = p_upload_id; GET DIAGNOSTICS v_kpi   = ROW_COUNT;
  DELETE FROM phase2_uploads         WHERE id         = p_upload_id;
  RETURN jsonb_build_object('deleted_upload', p_upload_id, 'raw_records', v_raw,
    'district_rows', v_dist, 'zone_rows', v_zone, 'scheme_rows', v_schem, 'kpi_rows', v_kpi);
END; $$;

-- Wipe ALL Phase 2 data
CREATE OR REPLACE FUNCTION delete_all_phase2_data()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_raw INTEGER; v_rec INTEGER; v_dist INTEGER; v_zone INTEGER; v_schem INTEGER; v_kpi INTEGER; v_jobs INTEGER;
BEGIN
  DELETE FROM phase2_raw_records;     GET DIAGNOSTICS v_raw   = ROW_COUNT;
  DELETE FROM phase2_call_records;    GET DIAGNOSTICS v_rec   = ROW_COUNT;
  DELETE FROM phase2_district_scores; GET DIAGNOSTICS v_dist  = ROW_COUNT;
  DELETE FROM phase2_zone_scores;     GET DIAGNOSTICS v_zone  = ROW_COUNT;
  DELETE FROM phase2_scheme_scores;   GET DIAGNOSTICS v_schem = ROW_COUNT;
  DELETE FROM phase2_kpi_summary;     GET DIAGNOSTICS v_kpi   = ROW_COUNT;
  DELETE FROM phase2_uploads;         GET DIAGNOSTICS v_jobs  = ROW_COUNT;
  RETURN jsonb_build_object('raw_records', v_raw, 'typed_records', v_rec,
    'districts', v_dist, 'zones', v_zone, 'schemes', v_schem, 'kpi_rows', v_kpi, 'uploads', v_jobs);
END; $$;

-- Delete rows within an upload matching a field filter, then call recompute_phase2_aggregates()
CREATE OR REPLACE FUNCTION delete_phase2_records_where(p_upload_id UUID, p_filter JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ids UUID[]; v_deleted INTEGER := 0;
BEGIN
  SELECT array_agg(id) INTO v_ids
  FROM phase2_records
  WHERE upload_id = p_upload_id
    AND (SELECT bool_and(p2_field(d.data, k) = lower(trim(p_filter->>k)))
         FROM phase2_raw_records d, jsonb_object_keys(p_filter) k
         WHERE d.id = phase2_records.id);
  IF v_ids IS NOT NULL THEN
    DELETE FROM phase2_raw_records  WHERE id = ANY(v_ids); GET DIAGNOSTICS v_deleted = ROW_COUNT;
    DELETE FROM phase2_call_records WHERE upload_id = p_upload_id AND id = ANY(v_ids);
  END IF;
  RETURN jsonb_build_object('deleted_rows', v_deleted, 'filter', p_filter,
    'note', 'Call recompute_phase2_aggregates() to refresh BSI scores');
END; $$;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 11: ANALYTICAL VIEWS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_phase2_districts AS
  SELECT *, round(bsi*5,2) AS bsi_5 FROM phase2_district_scores WHERE is_active=TRUE ORDER BY bsi DESC;

CREATE OR REPLACE VIEW v_phase2_zones AS
  SELECT *, round(bsi*5,2) AS bsi_5 FROM phase2_zone_scores WHERE is_active=TRUE ORDER BY bsi DESC;

CREATE OR REPLACE VIEW v_phase2_schemes AS
  SELECT *, round(bsi*5,2) AS bsi_5 FROM phase2_scheme_scores WHERE is_active=TRUE ORDER BY bsi DESC;

CREATE OR REPLACE VIEW v_phase2_bottom_districts AS
  SELECT district, zone, round(bsi*5,2) AS bsi_5, total_calls, q1_yes_pct, q2_yes_pct, q3_yes_pct
  FROM phase2_district_scores WHERE is_active=TRUE ORDER BY bsi ASC LIMIT 10;

CREATE OR REPLACE VIEW v_phase2_top_districts AS
  SELECT district, zone, round(bsi*5,2) AS bsi_5, total_calls, q1_yes_pct, q2_yes_pct, q3_yes_pct
  FROM phase2_district_scores WHERE is_active=TRUE ORDER BY bsi DESC LIMIT 10;


-- ══════════════════════════════════════════════════════════════════════════════
--  SECTION 12: GRANTS
-- ══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION recompute_phase2_aggregates(UUID)             TO authenticated;
GRANT EXECUTE ON FUNCTION p2_quality_report(UUID)                       TO authenticated;
GRANT EXECUTE ON FUNCTION p2_field(JSONB, TEXT[])                       TO authenticated;
GRANT EXECUTE ON FUNCTION p2_bsi_score(NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_phase2_upload(UUID)                    TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_phase2_data()                      TO authenticated;
GRANT EXECUTE ON FUNCTION delete_phase2_records_where(UUID, JSONB)      TO authenticated;

GRANT SELECT ON phase2_records            TO authenticated;
GRANT SELECT ON v_phase2_districts        TO authenticated;
GRANT SELECT ON v_phase2_zones            TO authenticated;
GRANT SELECT ON v_phase2_schemes          TO authenticated;
GRANT SELECT ON v_phase2_bottom_districts TO authenticated;
GRANT SELECT ON v_phase2_top_districts    TO authenticated;

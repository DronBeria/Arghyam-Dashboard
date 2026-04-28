-- ─── Call Records — Full IVR Schema ─────────────────────────────────────────
-- Run this ONCE in Supabase SQL Editor
-- Drops and recreates the table with all Raya IVR fields

DROP TABLE IF EXISTS call_records CASCADE;

CREATE TABLE call_records (
  id                  BIGSERIAL PRIMARY KEY,

  -- Identifiers
  contact_id          BIGINT,
  call_id             BIGINT UNIQUE,

  -- Call metadata
  contact_status      TEXT,                -- Pending | Unanswered | Completed
  contact_attempts    INT DEFAULT 1,
  call_duration       INT,                 -- seconds
  call_start_time     TIMESTAMPTZ,
  call_end_time       TIMESTAMPTZ,
  zone                TEXT DEFAULT 'Upper Assam',
  district            TEXT,
  scheme_id           TEXT,
  scheme_name         TEXT,
  phone               TEXT,

  -- Recording
  call_recording_url  TEXT,

  -- Consent
  consented           BOOLEAN,             -- true/false/null
  consent_evidence    TEXT,

  -- Call outcome flags
  call_ended_early    BOOLEAN,
  early_end_reason    TEXT,                -- user_refused|user_busy|off_topic_repeated|unclear_responses|unknown|NA
  user_busy_flag      BOOLEAN,
  callback_requested  BOOLEAN,
  callback_time       TEXT,

  -- Q1: Water received daily
  q1_answer           TEXT,                -- yes|no|unknown
  q1_evidence         TEXT,
  days_without_water  TEXT,                -- 1-7|unknown|NA
  days_without_water_evidence TEXT,

  -- Q2: Quality
  q2_answer           TEXT,                -- yes|no|unknown
  q2_evidence         TEXT,
  quality_issue_details TEXT,

  -- Q3: Quantity
  q3_answer           TEXT,                -- yes|no|unknown
  q3_evidence         TEXT,
  quantity_issue_details TEXT,

  -- Q4: Consistent timing
  q4_answer           TEXT,                -- yes|no|not_asked
  q4_evidence         TEXT,
  irregular_supply_reason TEXT,

  -- Q5: Overall satisfaction
  q5_answer           TEXT,                -- satisfied|neutral|dissatisfied|unknown
  q5_evidence         TEXT,
  satisfaction_reason TEXT,
  dissatisfaction_reason TEXT,

  -- Supply scope
  supply_issue_scope  TEXT,                -- household_only|village_wide|unknown|NA

  -- Call summary + feedback
  call_summary        TEXT,
  additional_feedback TEXT,

  -- Derived convenience fields
  is_usable           BOOLEAN DEFAULT false,   -- answered Q1 (yes/no/unknown, not null)
  is_completed        BOOLEAN DEFAULT false,   -- all 5 reached
  satisfaction        TEXT,                    -- Satisfied|Neutral|Dissatisfied|No Q5

  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX idx_cr_zone        ON call_records(zone);
CREATE INDEX idx_cr_district    ON call_records(district);
CREATE INDEX idx_cr_status      ON call_records(contact_status);
CREATE INDEX idx_cr_consented   ON call_records(consented);
CREATE INDEX idx_cr_q5          ON call_records(q5_answer);
CREATE INDEX idx_cr_usable      ON call_records(is_usable);
CREATE INDEX idx_cr_completed   ON call_records(is_completed);
CREATE INDEX idx_cr_satisfaction ON call_records(satisfaction);
CREATE INDEX idx_cr_date        ON call_records(call_start_time);

-- RLS: public read
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read call_records"
  ON call_records FOR SELECT USING (true);

-- ─── Individual Call Records ─────────────────────────────────────────────────
-- Run this in Supabase SQL Editor to add per-call records support

CREATE TABLE IF NOT EXISTS call_records (
  id              BIGSERIAL PRIMARY KEY,
  call_id         TEXT UNIQUE NOT NULL,          -- e.g. "CALL-00001"
  phone           TEXT,                          -- beneficiary phone (masked for privacy)
  scheme_id       TEXT,                          -- IMIS scheme ID
  scheme_name     TEXT,
  district        TEXT,
  zone            TEXT,
  attempt_number  INT DEFAULT 1,                 -- 1–5
  call_date       DATE,
  call_duration   INT,                           -- seconds
  consented       BOOLEAN,
  -- Q1–Q5 answers (null = not reached)
  q1_answer       BOOLEAN,
  q2_answer       BOOLEAN,
  q3_answer       BOOLEAN,
  q4_answer       BOOLEAN,
  q5_answer       TEXT,                          -- 'satisfied' | 'neutral' | 'dissatisfied' | null
  -- Derived
  questions_answered INT DEFAULT 0,
  is_usable       BOOLEAN DEFAULT false,         -- answered Q1
  is_completed    BOOLEAN DEFAULT false,         -- answered Q1–Q5
  satisfaction    TEXT,                          -- 'Satisfied' | 'Neutral' | 'Dissatisfied' | 'No Q5'
  -- Recording
  recording_url   TEXT,                          -- Supabase Storage URL or external URL
  recording_duration INT,                        -- seconds
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common filters
CREATE INDEX IF NOT EXISTS idx_call_records_zone     ON call_records(zone);
CREATE INDEX IF NOT EXISTS idx_call_records_district ON call_records(district);
CREATE INDEX IF NOT EXISTS idx_call_records_q5       ON call_records(q5_answer);
CREATE INDEX IF NOT EXISTS idx_call_records_usable   ON call_records(is_usable);
CREATE INDEX IF NOT EXISTS idx_call_records_completed ON call_records(is_completed);
CREATE INDEX IF NOT EXISTS idx_call_records_date     ON call_records(call_date);

-- RLS: public read
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read call_records" ON call_records FOR SELECT USING (true);

-- ─── Demo sample rows (replace with your real data) ──────────────────────────
-- These 10 rows show the expected format. Import your real 45,863 rows via CSV upload
-- or the Supabase dashboard "Import data from CSV" feature.

INSERT INTO call_records
  (call_id, phone, scheme_id, scheme_name, district, zone, attempt_number, call_date,
   call_duration, consented, q1_answer, q2_answer, q3_answer, q4_answer, q5_answer,
   questions_answered, is_usable, is_completed, satisfaction, recording_url, recording_duration)
VALUES
  ('CALL-00001','98XXXXX001','SCH-AS-001','Raha GP Scheme','Nagaon','Upper Assam',1,'2026-04-01',
   187,true,true,true,true,true,'satisfied',5,true,true,'Satisfied',NULL,187),

  ('CALL-00002','98XXXXX002','SCH-AS-002','Sonapur WSS','Kamrup','Lower Assam',1,'2026-04-01',
   145,true,false,true,true,false,'dissatisfied',5,true,true,'Dissatisfied',NULL,145),

  ('CALL-00003','98XXXXX003','SCH-AS-003','Bokakhat GP','Golaghat','Upper Assam',1,'2026-04-02',
   92,true,true,true,true,null,null,4,true,false,'No Q5',NULL,92),

  ('CALL-00004','98XXXXX004','SCH-AS-004','Lakhimpur WSP','Lakhimpur','North Assam',2,'2026-04-02',
   210,true,true,true,false,true,'satisfied',5,true,true,'Satisfied',NULL,210),

  ('CALL-00005','98XXXXX005','SCH-AS-005','Haflong WSS','Karbi Anglong','KAAC',1,'2026-04-03',
   18,false,null,null,null,null,null,0,false,false,'No Q5',NULL,18),

  ('CALL-00006','98XXXXX006','SCH-AS-006','Silchar Zone A','Cachar','Barak Valley',1,'2026-04-03',
   156,true,false,false,false,false,'dissatisfied',5,true,true,'Dissatisfied',NULL,156),

  ('CALL-00007','98XXXXX007','SCH-AS-007','Dibrugarh City','Dibrugarh','Upper Assam',1,'2026-04-04',
   98,true,true,true,true,null,null,4,true,false,'No Q5',NULL,98),

  ('CALL-00008','98XXXXX008','SCH-AS-008','Barpeta Rural','Barpeta','Lower Assam',3,'2026-04-04',
   175,true,true,true,true,true,'neutral',5,true,true,'Neutral',NULL,175),

  ('CALL-00009','98XXXXX009','SCH-AS-009','Sivasagar GP','Sivasagar','Upper Assam',1,'2026-04-05',
   203,true,true,true,true,true,'satisfied',5,true,true,'Satisfied',NULL,203),

  ('CALL-00010','98XXXXX010','SCH-AS-010','Chirang Block','Chirang','BTAD',1,'2026-04-05',
   44,false,null,null,null,null,null,0,false,false,'No Q5',NULL,44)
ON CONFLICT (call_id) DO NOTHING;

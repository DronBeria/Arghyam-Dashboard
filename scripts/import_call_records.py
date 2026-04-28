"""
Import Upper Assam IVR call records into Supabase call_records table.

Prerequisites:
  1. Run supabase/call_records_schema.sql in Supabase SQL Editor FIRST
  2. pip install pandas openpyxl requests

Usage:
  python scripts/import_call_records.py
"""

import os, sys, json, math
import pandas as pd
import requests
from datetime import datetime

# ─── Config ───────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://ubdgohqafxdugonrchkv.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZGdvaHFhZnhkdWdvbnJjaGt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyODM0NCwiZXhwIjoyMDkyOTA0MzQ0fQ.a2Glerx0gX_cAhFtsrLYtyRLmLhGIwg8ayYWBSWZ4Q8"
EXCEL_FILE   = "Upper Assam Test Batch.xlsx"
ZONE         = "Upper Assam"
BATCH_SIZE   = 500

HEADERS = {
    "apikey":        SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "resolution=merge-duplicates",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def yesno_bool(val) -> bool | None:
    """Map 'yes'/'no' strings to bool, anything else to None."""
    if pd.isna(val): return None
    s = str(val).strip().lower()
    if s == 'yes': return True
    if s == 'no':  return False
    return None  # 'unknown', 'not_asked', etc.

def clean_str(val) -> str | None:
    if pd.isna(val): return None
    s = str(val).strip()
    return s if s and s.lower() not in ('nan', 'na', 'none') else None

def clean_int(val) -> int | None:
    try:
        f = float(val)
        return int(f) if not math.isnan(f) else None
    except (TypeError, ValueError):
        return None

def parse_dt(val) -> str | None:
    """Parse '09/03/2026, 15:01:01' → ISO 8601 string."""
    if pd.isna(val): return None
    try:
        return datetime.strptime(str(val).strip(), "%d/%m/%Y, %H:%M:%S").isoformat()
    except ValueError:
        return None

def derive_satisfaction(q5: str | None) -> str:
    if not q5: return "No Q5"
    q5l = q5.lower()
    if q5l == 'satisfied':    return "Satisfied"
    if q5l == 'neutral':      return "Neutral"
    if q5l == 'dissatisfied': return "Dissatisfied"
    return "No Q5"

def row_to_record(r) -> dict:
    q1  = clean_str(r.get('water_received_daily: yes|no|unknown'))
    q2  = clean_str(r.get('quality_satisfied: yes|no|unknown'))
    q3  = clean_str(r.get('quantity_satisfied: yes|no|unknown'))
    q4  = clean_str(r.get('consistent_timing: yes|no|not_asked'))
    q5  = clean_str(r.get('overall_satisfaction: satisfied|neutral|dissatisfied|unknown'))
    consented = yesno_bool(r.get('consent: yes|no'))

    # A call is "usable" if Q1 was answered (yes/no/unknown) — not null
    is_usable   = q1 is not None
    # "Completed" = all 5 questions reached (even if answer is unknown)
    is_completed = all(x is not None for x in [q1, q2, q3, q4, q5])

    return {
        "contact_id":          clean_int(r.get('contact_id')),
        "call_id":             clean_int(r.get('call_id')),
        "contact_status":      clean_str(r.get('contact_status')),
        "contact_attempts":    clean_int(r.get('contact_attempts')) or 1,
        "call_duration":       clean_int(r.get('call_duration')),
        "call_start_time":     parse_dt(r.get('call_start_time_ist')),
        "call_end_time":       parse_dt(r.get('call_end_time_ist')),
        "zone":                ZONE,
        "call_recording_url":  clean_str(r.get('call_recording_url')),
        "consented":           consented,
        "consent_evidence":    clean_str(r.get('consent_evidence')),
        "call_ended_early":    yesno_bool(r.get('call_ended_early: yes|no')),
        "early_end_reason":    clean_str(r.get('early_end_reason: user_refused|user_busy|off_topic_repeated|unclear_responses|unknown|NA')),
        "user_busy_flag":      yesno_bool(r.get('user_busy_flag')),
        "callback_requested":  yesno_bool(r.get('callback_requested')),
        "callback_time":       clean_str(r.get('callback_time')),
        "q1_answer":           q1,
        "q1_evidence":         clean_str(r.get('water_received_daily_evidence: caller quote | NA | unknown')),
        "days_without_water":  clean_str(r.get('days_without_water: 1|2|3|4|5|6|7|unknown|NA')),
        "days_without_water_evidence": clean_str(r.get('days_without_water_evidence: caller quote | NA | unknown')),
        "q2_answer":           q2,
        "q2_evidence":         clean_str(r.get('quality_satisfied_evidence: caller quote | NA | unknown')),
        "quality_issue_details": clean_str(r.get('quality_issue_details: free text ENGLISH translation | unknown | NA')),
        "q3_answer":           q3,
        "q3_evidence":         clean_str(r.get('quantity_satisfied_evidence: caller quote | NA | unknown')),
        "quantity_issue_details": clean_str(r.get('quantity_issue_details: free text ENGLISH translation | unknown | NA')),
        "q4_answer":           q4,
        "q4_evidence":         clean_str(r.get('consistent_timing_evidence: caller quote | NA | unknown')),
        "irregular_supply_reason": clean_str(r.get('irregular_supply_reason: free text ENGLISH translation | unknown | NA')),
        "q5_answer":           q5,
        "q5_evidence":         clean_str(r.get('overall_satisfaction_evidence: caller quote | NA | unknown')),
        "satisfaction_reason": clean_str(r.get('satisfaction_reason: free text ENGLISH translation | unknown | NA')),
        "dissatisfaction_reason": clean_str(r.get('dissatisfaction_reason: free text ENGLISH translation | unknown | NA')),
        "supply_issue_scope":  clean_str(r.get('supply_issue_scope: household_only|village_wide|unknown|NA')),
        "call_summary":        clean_str(r.get('call_summary')),
        "additional_feedback": clean_str(r.get('additional_feedback: free text ENGLISH translation | none | unknown | NA')),
        "is_usable":           is_usable,
        "is_completed":        is_completed,
        "satisfaction":        derive_satisfaction(q5),
    }

# ─── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f"Reading {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE)
    print(f"  Total rows: {len(df):,}")

    print("Transforming rows...")
    records = [row_to_record(r) for _, r in df.iterrows()]

    total = len(records)
    batches = math.ceil(total / BATCH_SIZE)
    print(f"Uploading {total:,} rows in {batches} batches of {BATCH_SIZE}...")

    url = f"{SUPABASE_URL}/rest/v1/call_records"
    ok = 0
    errors = 0

    for i in range(batches):
        batch = records[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
        resp = requests.post(url, headers=HEADERS, data=json.dumps(batch, default=str))
        if resp.status_code in (200, 201):
            ok += len(batch)
        else:
            errors += len(batch)
            print(f"  ✗ Batch {i+1}/{batches} failed: {resp.status_code} — {resp.text[:200]}")
            continue

        # Progress every 10 batches
        if (i + 1) % 10 == 0 or (i + 1) == batches:
            pct = ((i + 1) / batches) * 100
            print(f"  {i+1}/{batches} batches done ({pct:.0f}%) — {ok:,} rows inserted")

    print()
    print(f"Done. {ok:,} inserted / {errors:,} errors.")

    # Quick stats
    df2 = pd.DataFrame(records)
    print()
    print("=== Upload summary ===")
    print(f"  contact_status breakdown:")
    for k, v in df2['contact_status'].value_counts().items():
        print(f"    {k}: {v:,}")
    print(f"  With recording URL: {df2['call_recording_url'].notna().sum():,}")
    print(f"  Usable (Q1 answered): {df2['is_usable'].sum():,}")
    print(f"  Completed (all Qs): {df2['is_completed'].sum():,}")
    print(f"  Satisfaction breakdown:")
    for k, v in df2['satisfaction'].value_counts().items():
        print(f"    {k}: {v:,}")

if __name__ == "__main__":
    main()

"""
Phase 2 ingestion script — inserts CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx
into Supabase call_records table via REST API (service role key).

Phase discrimination: Phase 1 records have call_start_time in April 2026;
Phase 2 records have call_start_time in May 2026 (or later).
"""
import sys, json, time
sys.stdout.reconfigure(encoding='utf-8')

import openpyxl
import requests

SUPABASE_URL = "https://ubdgohqafxdugonrchkv.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZGdvaHFhZnhkdWdvbnJjaGt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyODM0NCwiZXhwIjoyMDkyOTA0MzQ0fQ.a2Glerx0gX_cAhFtsrLYtyRLmLhGIwg8ayYWBSWZ4Q8"

HEADERS = {
    "apikey":          SERVICE_KEY,
    "Authorization":   f"Bearer {SERVICE_KEY}",
    "Content-Type":    "application/json",
    "Prefer":          "resolution=ignore-duplicates,return=minimal",
}

ZONE_MAP = {
    "North Assam Zone": "North Assam",
    "Upper Assam Zone": "Upper Assam",
    "Lower Assam Zone": "Lower Assam",
    "BTAD":             "BTAD",
    "KAAC":             "KAAC",
    "Barak Valley":     "Barak Valley",
    "DHAC":             "DHAC",
}

XLSX_PATH = r"C:\Users\Vibha Beria\OneDrive\Desktop\jjm dashboard\CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx"
BATCH_SIZE = 500


def parse_ts(raw):
    """Convert '2026-05-16 17:46:27 IST' → '2026-05-16T17:46:27+05:30'"""
    if not raw or str(raw) in ("NULL", "None", ""):
        return None
    s = str(raw).replace(" IST", "").strip()
    if " " in s:
        s = s.replace(" ", "T")
    return s + "+05:30"


def to_bool(v):
    if v is True or str(v).lower() in ("true", "yes", "1"):
        return True
    if v is False or str(v).lower() in ("false", "no", "0"):
        return False
    return None


def clean(v, null_vals=("NA", "NULL", "null", "none", "not_asked", "", None)):
    if v in null_vals:
        return None
    s = str(v).strip() if v is not None else None
    return s if s and s not in null_vals else None


def map_satisfaction(q5):
    if q5 == "satisfied":   return "Satisfied"
    if q5 == "neutral":     return "Neutral"
    if q5 == "dissatisfied": return "Dissatisfied"
    return "No Q5"


def map_row(r):
    q1  = clean(r.get("water_received_daily"))
    q2  = clean(r.get("quality_satisfied"))
    q3  = clean(r.get("quantity_satisfied"))
    q4  = clean(r.get("consistent_timing"))   # Q1A
    q5  = clean(r.get("overall_satisfaction"))

    is_usable   = q1 in ("yes", "no")
    is_completed = (q2 in ("yes", "no") and q3 in ("yes", "no") and q5 in ("satisfied", "dissatisfied", "neutral"))

    rec_url = clean(r.get("call_recording_url"))
    if rec_url and "getraya.app" not in rec_url:
        rec_url = None  # only keep real Raya URLs

    return {
        "contact_id":           r.get("contact_id"),
        "call_id":              r.get("call_id"),
        "contact_status":       "Completed",
        "contact_attempts":     r.get("contact_attempts", 1),
        "call_duration":        r.get("call_duration"),
        "call_start_time":      parse_ts(r.get("call_start_time_ist")),
        "call_end_time":        parse_ts(r.get("call_end_time_ist")),
        "zone":                 ZONE_MAP.get(str(r.get("Zone", "")), str(r.get("Zone", ""))),
        "district":             clean(r.get("District")),
        "scheme_id":            str(r.get("Imis_id")) if r.get("Imis_id") else None,
        "scheme_name":          clean(r.get("Scheme_name")),
        "call_recording_url":   rec_url,
        "consented":            to_bool(r.get("consent") == "yes"),
        "consent_evidence":     clean(r.get("consent_evidence")),
        "call_ended_early":     to_bool(r.get("call_ended_early")),
        "early_end_reason":     clean(r.get("early_end_reason")),
        "user_busy_flag":       to_bool(r.get("user_busy_flag")),
        "callback_requested":   to_bool(r.get("callback_requested")),
        "callback_time":        clean(r.get("callback_time")),
        "q1_answer":            q1,
        "days_without_water":   clean(r.get("days_without_water")),
        "q2_answer":            q2,
        "quality_issue_details": clean(r.get("quality_issue_details")),
        "q3_answer":            q3,
        "quantity_issue_details": clean(r.get("quantity_issue_details")),
        "q4_answer":            q4,
        "irregular_supply_reason": clean(r.get("irregular_supply_reason")),
        "q5_answer":            q5,
        "satisfaction_reason":  clean(r.get("satisfaction_reason")),
        "dissatisfaction_reason": clean(r.get("dissatisfaction_reason")),
        "supply_issue_scope":   clean(r.get("supply_issue_scope")),
        "call_summary":         clean(r.get("call_summary")),
        "additional_feedback":  clean(r.get("additional_feedback")),
        "is_usable":            is_usable,
        "is_completed":         is_completed,
        "satisfaction":         map_satisfaction(q5),
    }


def insert_batch(batch, batch_num, total_batches):
    url = f"{SUPABASE_URL}/rest/v1/call_records"
    resp = requests.post(url, headers=HEADERS, json=batch, timeout=60)
    if resp.status_code in (200, 201):
        print(f"  Batch {batch_num}/{total_batches} OK ({len(batch)} rows)")
        return True
    else:
        print(f"  Batch {batch_num}/{total_batches} FAILED: {resp.status_code} — {resp.text[:300]}")
        return False


def main():
    print("Reading Excel…")
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb["Full Campaign"]
    rows = list(ws.iter_rows(values_only=True))
    headers_raw = list(rows[0])
    data = [dict(zip(headers_raw, r)) for r in rows[1:]]
    print(f"Loaded {len(data):,} rows from Excel")

    print("Mapping rows…")
    mapped = [map_row(r) for r in data]

    batches = [mapped[i:i+BATCH_SIZE] for i in range(0, len(mapped), BATCH_SIZE)]
    total_batches = len(batches)
    print(f"Inserting {len(mapped):,} records in {total_batches} batches of {BATCH_SIZE}…\n")

    ok = 0
    fail = 0
    for i, batch in enumerate(batches, 1):
        success = insert_batch(batch, i, total_batches)
        if success:
            ok += len(batch)
        else:
            fail += len(batch)
        if i % 10 == 0:
            print(f"  → Progress: {ok:,} inserted, {fail:,} failed")
        time.sleep(0.1)  # gentle rate limiting

    print(f"\nDone. Inserted: {ok:,}  Failed: {fail:,}")


if __name__ == "__main__":
    main()

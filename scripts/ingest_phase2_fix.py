"""
Phase 2 fix — inserts the 58,588 records that failed due to call_id conflicts.

Strategy:
1. Fetch all Phase 1 call_ids from Supabase into a set
2. For Phase 2 records whose call_id matches a Phase 1 id → set call_id = NULL
   (PostgreSQL allows multiple NULLs in a UNIQUE column)
3. Insert only records not already in DB (call_start_time < 2026-05-01 = Phase 1)
"""
import sys, time, json
sys.stdout.reconfigure(encoding='utf-8')
import openpyxl, requests

SUPABASE_URL = "https://ubdgohqafxdugonrchkv.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZGdvaHFhZnhkdWdvbnJjaGt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyODM0NCwiZXhwIjoyMDkyOTA0MzQ0fQ.a2Glerx0gX_cAhFtsrLYtyRLmLhGIwg8ayYWBSWZ4Q8"
HEADERS = {
    "apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates,return=minimal",
}
ZONE_MAP = {
    "North Assam Zone": "North Assam", "Upper Assam Zone": "Upper Assam",
    "Lower Assam Zone": "Lower Assam", "BTAD": "BTAD", "KAAC": "KAAC",
    "Barak Valley": "Barak Valley", "DHAC": "DHAC",
}
XLSX_PATH = r"C:\Users\Vibha Beria\OneDrive\Desktop\jjm dashboard\CSAT-AI-Full-Campaign-Completed_Calls-Anonymized_v1.xlsx"
BATCH_SIZE = 500

def parse_ts(raw):
    if not raw or str(raw) in ("NULL", "None", ""): return None
    s = str(raw).replace(" IST", "").strip()
    if " " in s: s = s.replace(" ", "T")
    return s + "+05:30"

def to_bool(v):
    if v is True  or str(v).lower() in ("true","yes","1"):  return True
    if v is False or str(v).lower() in ("false","no","0"): return False
    return None

def clean(v, null_vals=("NA","NULL","null","none","not_asked","",None)):
    s = str(v).strip() if v is not None else None
    return s if s and s not in null_vals else None

def map_satisfaction(q5):
    return {"satisfied":"Satisfied","neutral":"Neutral","dissatisfied":"Dissatisfied"}.get(q5,"No Q5")

def map_row(r, p1_call_ids):
    q1 = clean(r.get("water_received_daily"))
    q2 = clean(r.get("quality_satisfied"))
    q3 = clean(r.get("quantity_satisfied"))
    q4 = clean(r.get("consistent_timing"))
    q5 = clean(r.get("overall_satisfaction"))
    raw_call_id = r.get("call_id")
    # Null call_id if it conflicts with a Phase 1 record
    call_id = None if (raw_call_id and raw_call_id in p1_call_ids) else raw_call_id
    rec_url = clean(r.get("call_recording_url"))
    if rec_url and "getraya.app" not in rec_url: rec_url = None
    return {
        "contact_id": r.get("contact_id"),
        "call_id": call_id,
        "contact_status": "Completed",
        "contact_attempts": r.get("contact_attempts", 1),
        "call_duration": r.get("call_duration"),
        "call_start_time": parse_ts(r.get("call_start_time_ist")),
        "call_end_time":   parse_ts(r.get("call_end_time_ist")),
        "zone":     ZONE_MAP.get(str(r.get("Zone","")), str(r.get("Zone",""))),
        "district": clean(r.get("District")),
        "scheme_id":   str(r.get("Imis_id")) if r.get("Imis_id") else None,
        "scheme_name": clean(r.get("Scheme_name")),
        "call_recording_url": rec_url,
        "consented":         to_bool(r.get("consent") == "yes"),
        "consent_evidence":  clean(r.get("consent_evidence")),
        "call_ended_early":  to_bool(r.get("call_ended_early")),
        "early_end_reason":  clean(r.get("early_end_reason")),
        "user_busy_flag":    to_bool(r.get("user_busy_flag")),
        "callback_requested":to_bool(r.get("callback_requested")),
        "callback_time":     clean(r.get("callback_time")),
        "q1_answer": q1, "days_without_water": clean(r.get("days_without_water")),
        "q2_answer": q2, "quality_issue_details":  clean(r.get("quality_issue_details")),
        "q3_answer": q3, "quantity_issue_details": clean(r.get("quantity_issue_details")),
        "q4_answer": q4, "irregular_supply_reason": clean(r.get("irregular_supply_reason")),
        "q5_answer": q5, "satisfaction_reason":    clean(r.get("satisfaction_reason")),
        "dissatisfaction_reason": clean(r.get("dissatisfaction_reason")),
        "supply_issue_scope": clean(r.get("supply_issue_scope")),
        "call_summary":       clean(r.get("call_summary")),
        "additional_feedback":clean(r.get("additional_feedback")),
        "is_usable":    q1 in ("yes","no"),
        "is_completed": q2 in ("yes","no") and q3 in ("yes","no") and q5 in ("satisfied","dissatisfied","neutral"),
        "satisfaction": map_satisfaction(q5),
    }


def fetch_p1_call_ids():
    """Fetch all Phase 1 call_ids (call_start_time < 2026-05-01) from Supabase."""
    print("Fetching Phase 1 call_ids from Supabase…")
    ids = set()
    page = 0
    page_size = 1000
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/call_records",
            headers={**HEADERS, "Range": f"{page*page_size}-{(page+1)*page_size-1}"},
            params={"select": "call_id", "call_start_time": "lt.2026-05-01"},
            timeout=30,
        )
        batch = r.json()
        if not batch: break
        for rec in batch:
            if rec.get("call_id") is not None:
                ids.add(rec["call_id"])
        print(f"  Fetched page {page+1}: {len(ids):,} Phase 1 call_ids so far")
        if len(batch) < page_size: break
        page += 1
        time.sleep(0.05)
    print(f"Total Phase 1 call_ids: {len(ids):,}")
    return ids


def fetch_existing_p2_call_ids():
    """Fetch call_ids already in DB for Phase 2 (May 2026+) to skip them."""
    print("Fetching existing Phase 2 call_ids to skip already-inserted records…")
    ids = set()
    page = 0
    page_size = 1000
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/call_records",
            headers={**HEADERS, "Range": f"{page*page_size}-{(page+1)*page_size-1}"},
            params={"select": "call_id,contact_id,call_start_time",
                    "call_start_time": "gte.2026-05-01"},
            timeout=30,
        )
        batch = r.json()
        if not batch: break
        for rec in batch:
            if rec.get("call_id") is not None:
                ids.add(rec["call_id"])
        if len(batch) < page_size: break
        page += 1
        time.sleep(0.05)
    print(f"Already in DB (Phase 2): {len(ids):,} records")
    return ids


def main():
    # Step 1: fetch Phase 1 call_ids (to know which P2 call_ids conflict)
    p1_ids = fetch_p1_call_ids()

    # Step 2: fetch already-inserted Phase 2 call_ids (to skip)
    p2_existing_ids = fetch_existing_p2_call_ids()

    # Step 3: read Excel
    print("\nReading Excel…")
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb["Full Campaign"]
    rows = list(ws.iter_rows(values_only=True))
    headers_raw = list(rows[0])
    data = [dict(zip(headers_raw, r)) for r in rows[1:]]
    print(f"Loaded {len(data):,} rows")

    # Step 4: filter to only rows NOT already in DB
    # A row is "already in DB" if its call_id exists in p2_existing_ids
    # (these were inserted in the first run)
    to_insert = []
    for r in data:
        raw_cid = r.get("call_id")
        if raw_cid and raw_cid in p2_existing_ids:
            continue  # already inserted, skip
        if raw_cid and raw_cid in p1_ids:
            to_insert.append(r)  # conflict → will be inserted with null call_id
        elif raw_cid and raw_cid not in p1_ids:
            # This case shouldn't exist (should have been inserted in first run)
            # but include as safety net
            to_insert.append(r)
        else:
            to_insert.append(r)  # null call_id in source

    print(f"Records to insert now: {len(to_insert):,}")

    # Step 5: map and insert
    print("Mapping and inserting…")
    mapped = [map_row(r, p1_ids) for r in to_insert]

    # Verify nulling worked
    null_cid = sum(1 for r in mapped if r["call_id"] is None)
    kept_cid = sum(1 for r in mapped if r["call_id"] is not None)
    print(f"  call_id nulled (conflict): {null_cid:,}")
    print(f"  call_id kept (unique):     {kept_cid:,}")

    batches = [mapped[i:i+BATCH_SIZE] for i in range(0, len(mapped), BATCH_SIZE)]
    ok = fail = 0
    for i, batch in enumerate(batches, 1):
        resp = requests.post(f"{SUPABASE_URL}/rest/v1/call_records",
                             headers=HEADERS, json=batch, timeout=60)
        if resp.status_code in (200, 201):
            ok += len(batch)
        else:
            fail += len(batch)
            print(f"  Batch {i} FAILED: {resp.status_code} — {resp.text[:200]}")
        if i % 20 == 0:
            print(f"  Progress {i}/{len(batches)}: {ok:,} OK, {fail:,} failed")
        time.sleep(0.1)

    print(f"\nDone. Inserted: {ok:,}  Failed: {fail:,}")
    print(f"Total in DB now: {67000 + ok:,} Phase 2 records")

if __name__ == "__main__":
    main()

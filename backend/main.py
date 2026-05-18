"""
JJM Phase 2 Data Pipeline — FastAPI Backend  (v2.0)
Industrial-grade: XLSX/CSV, fuzzy column detection, raw record storage,
quality reports, export, re-process, full CRUD on records.

Run locally:  cd backend && uvicorn main:app --reload --port 8000
Deploy:       push main branch → Render auto-deploys
"""

from fastapi import FastAPI, UploadFile, HTTPException, BackgroundTasks, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel
from supabase import create_client, Client
import asyncio
import httpx
import io
import json
import os
import uuid

load_dotenv(Path(__file__).parent / ".env", override=False)

SUPABASE_URL         = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL and/or SUPABASE_SERVICE_KEY. "
        "Set them in Render → Environment tab (use the service_role key)."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB

_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:4173,"
    "https://arghyam-dashboard.vercel.app",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


# ── Keep-alive (Render free-tier) ─────────────────────────────────────────────
async def _keep_alive():
    await asyncio.sleep(60)
    self_url = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
    if not self_url:
        return
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            try:
                await client.get(f"{self_url}/health")
            except Exception:
                pass
            await asyncio.sleep(600)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_keep_alive())
    yield
    task.cancel()


app = FastAPI(title="JJM Phase 2 Data Pipeline", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────
async def require_auth(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authorization required.")
    token = authorization[7:]
    try:
        resp = supabase.auth.get_user(token)
        if resp.user is None:
            raise HTTPException(401, "Invalid or expired token.")
        return resp.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Authentication failed.")


# ── Request / response models ─────────────────────────────────────────────────
class RecordUpdate(BaseModel):
    consent:               str | None = None
    water_received_daily:  str | None = None
    quality_satisfied:     str | None = None
    quantity_satisfied:    str | None = None
    consistent_timing:     str | None = None
    overall_satisfaction:  str | None = None
    district:              str | None = None
    zone:                  str | None = None
    imis_id:               str | None = None
    contact_attempts:      int | None = None
    call_duration:         int | None = None
    hhid:                  str | None = None

class BulkUpdateRequest(BaseModel):
    ids:    list[str]
    fields: RecordUpdate

class BulkDeleteRequest(BaseModel):
    ids: list[str]

class BulkAddRequest(BaseModel):
    upload_id: str
    records:   list[dict]    # each dict must have at minimum district + zone


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Column detection (preview before upload) ──────────────────────────────────
@app.post("/api/columns/detect")
async def detect_columns(
    file: UploadFile,
    _user=Depends(require_auth),
):
    """
    Upload a file and get back the auto-detected column mapping.
    Use this before /api/upload to preview and correct the mapping.
    """
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large.")
    if not content:
        raise HTTPException(400, "Empty file.")

    from processor import parse_file, detect_column_map, COLUMN_ALIASES, REQUIRED_CANONICAL, OPTIONAL_CANONICAL
    try:
        df = parse_file(content, file.filename or "")
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {e}")

    original_columns = list(df.columns)
    col_map = detect_column_map(original_columns)

    missing_required = [c for c in REQUIRED_CANONICAL if col_map.get(c) is None]
    missing_optional = [c for c in OPTIONAL_CANONICAL if col_map.get(c) is None]

    return {
        "original_columns":  original_columns,
        "detected_map":      col_map,
        "missing_required":  missing_required,
        "missing_optional":  missing_optional,
        "ready_to_upload":   len(missing_required) == 0,
        "total_rows":        len(df),
        "sample_rows":       df.head(3).fillna("").to_dict(orient="records"),
    }


# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(
    file:           UploadFile,
    background_tasks: BackgroundTasks,
    _user=Depends(require_auth),
    mode:           str  = Query("replace", enum=["replace", "append"]),
    column_map:     str  = Query(None, description="JSON object mapping canonical→original column names"),
):
    """
    Upload CSV or XLSX. BSI is computed by the SQL engine after upload.
    mode=replace (default): deactivates previous data. mode=append: keeps previous data.
    """
    fname = (file.filename or "").lower()
    if not (fname.endswith(".csv") or fname.endswith(".xlsx") or fname.endswith(".xls")):
        raise HTTPException(400, "Only CSV and XLSX files are accepted.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File too large ({len(content)/1_048_576:.1f} MB). Max: 100 MB.")
    if not content:
        raise HTTPException(400, "File is empty.")

    col_map_dict = json.loads(column_map) if column_map else None
    job_id       = str(uuid.uuid4())

    supabase.table("phase2_uploads").insert({
        "id":              job_id,
        "filename":        file.filename,
        "file_size_bytes": len(content),
        "status":          "queued",
        "progress":        0,
        "message":         "Queued — waiting to start",
        "mode":            mode,
    }).execute()

    from processor import process_file_background
    background_tasks.add_task(
        process_file_background,
        job_id, content, file.filename or "",
        col_map_dict, mode, supabase,
    )

    return {"job_id": job_id, "status": "queued", "mode": mode}


# ── Job status ────────────────────────────────────────────────────────────────
@app.get("/api/status/{job_id}")
def get_status(job_id: str, _user=Depends(require_auth)):
    r = supabase.table("phase2_uploads").select("*").eq("id", job_id).maybe_single().execute()
    if not r.data:
        raise HTTPException(404, "Job not found.")
    return r.data


# ── Upload history ────────────────────────────────────────────────────────────
@app.get("/api/uploads")
def list_uploads(
    _user=Depends(require_auth),
    limit:  int = Query(50,  ge=1, le=200),
    offset: int = Query(0,   ge=0),
    status: str | None = Query(None),
):
    q = (
        supabase.table("phase2_uploads")
        .select("id,filename,file_size_bytes,row_count,status,progress,message,"
                "mode,created_at,completed_at")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if status:
        q = q.eq("status", status)
    return q.execute().data or []


# ── Data quality report ───────────────────────────────────────────────────────
@app.get("/api/uploads/{job_id}/report")
def get_report(job_id: str, _user=Depends(require_auth)):
    """Return the data quality report and column map stored during processing."""
    r = (
        supabase.table("phase2_uploads")
        .select("id,filename,row_count,status,quality_report,column_map,mode,created_at")
        .eq("id", job_id)
        .maybe_single()
        .execute()
    )
    if not r.data:
        raise HTTPException(404, "Upload not found.")
    return r.data


# ── Re-process ────────────────────────────────────────────────────────────────
@app.post("/api/uploads/{job_id}/reprocess")
async def reprocess_upload(
    job_id: str,
    background_tasks: BackgroundTasks,
    _user=Depends(require_auth),
):
    """Re-run BSI computation from stored raw records via the SQL engine — no re-upload needed."""
    r = supabase.table("phase2_uploads").select("status").eq("id", job_id).maybe_single().execute()
    if not r.data:
        raise HTTPException(404, "Upload not found.")
    if r.data["status"] in ("queued", "validating", "processing"):
        raise HTTPException(409, "Job is already running.")

    from processor import reprocess_from_records
    background_tasks.add_task(reprocess_from_records, job_id, supabase)
    return {"job_id": job_id, "status": "reprocessing"}


# ── Export ─────────────────────────────────────────────────────────────────────
@app.get("/api/uploads/{job_id}/export")
def export_upload(
    job_id: str,
    _user=Depends(require_auth),
    fmt:        str = Query("csv",  enum=["csv", "xlsx"]),
    scope:      str = Query("records",  enum=["records", "districts", "zones", "schemes"]),
    district:   str | None = Query(None),
    zone:       str | None = Query(None),
):
    """
    Download processed data as CSV or XLSX.
    scope=records  → raw call records
    scope=districts / zones / schemes → aggregate scores
    """
    import pandas as pd

    if scope == "records":
        q = (
            supabase.table("phase2_call_records")
            .select("row_number,consent,water_received_daily,quality_satisfied,"
                    "quantity_satisfied,consistent_timing,overall_satisfaction,"
                    "district,zone,imis_id,contact_attempts,call_duration,hhid,"
                    "is_consented,is_usable")
            .eq("upload_id", job_id)
            .order("row_number")
        )
        if district:
            q = q.ilike("district", f"%{district}%")
        if zone:
            q = q.ilike("zone", f"%{zone}%")
        rows = q.execute().data or []

    elif scope == "districts":
        q = (supabase.table("phase2_district_scores")
             .select("district,zone,total_calls,consented,usable_calls,bsi,"
                     "q1_yes_pct,q2_yes_pct,q3_yes_pct,q1a_yes_pct,q5_sat_pct")
             .eq("upload_id", job_id).eq("is_active", True))
        if zone:
            q = q.ilike("zone", f"%{zone}%")
        rows = q.execute().data or []

    elif scope == "zones":
        rows = (
            supabase.table("phase2_zone_scores")
            .select("zone,total_calls,consented,usable_calls,bsi,"
                    "q1_yes_pct,q2_yes_pct,q3_yes_pct,q1a_yes_pct,q5_sat_pct")
            .eq("upload_id", job_id).eq("is_active", True)
            .execute().data or []
        )

    else:  # schemes
        q = (supabase.table("phase2_scheme_scores")
             .select("imis_id,district,zone,total_calls,consented,usable_calls,bsi,"
                     "q1_yes_pct,q2_yes_pct,q3_yes_pct,q1a_yes_pct,q5_sat_pct")
             .eq("upload_id", job_id).eq("is_active", True))
        if district:
            q = q.ilike("district", f"%{district}%")
        if zone:
            q = q.ilike("zone", f"%{zone}%")
        rows = q.execute().data or []

    if not rows:
        raise HTTPException(404, "No data found for this export.")

    df = pd.DataFrame(rows)
    fname_base = f"phase2_{scope}_{job_id[:8]}"

    if fmt == "xlsx":
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="xlsxwriter") as writer:
            df.to_excel(writer, index=False, sheet_name=scope.title())
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{fname_base}.xlsx"'},
        )
    else:
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)
        return StreamingResponse(
            io.BytesIO(buf.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{fname_base}.csv"'},
        )


# ── Delete one upload + all its data ─────────────────────────────────────────
@app.delete("/api/uploads/{job_id}")
def delete_upload(job_id: str, _user=Depends(require_auth)):
    """Delete a single upload and every row it produced (raw records + all aggregates)."""
    r = supabase.rpc("delete_phase2_upload", {"p_upload_id": job_id}).execute()
    return r.data or {"deleted": job_id}


# ── Delete ALL Phase 2 data ───────────────────────────────────────────────────
@app.delete("/api/phase2/all")
def delete_all_phase2(_user=Depends(require_auth)):
    """
    Wipe every upload, raw record, and aggregate from all Phase 2 tables.
    This cannot be undone.
    """
    r = supabase.rpc("delete_all_phase2_data", {}).execute()
    return r.data or {"status": "all Phase 2 data deleted"}


# ── Delete specific rows within an upload (by field filter) ──────────────────
class FilterDeleteRequest(BaseModel):
    filter: dict    # e.g. {"district": "Kamrup"} or {"zone": "Lower Assam", "consent": "no"}

@app.post("/api/uploads/{job_id}/delete-rows")
def delete_rows_by_filter(
    job_id: str,
    body:   FilterDeleteRequest,
    _user=Depends(require_auth),
):
    """
    Delete raw records within an upload that match specific field values.
    After deleting, call /reprocess to refresh BSI scores.
    Example body: {"filter": {"district": "Kamrup Metro", "consent": "no"}}
    """
    if not body.filter:
        raise HTTPException(400, "filter must not be empty.")
    r = supabase.rpc(
        "delete_phase2_records_where",
        {"p_upload_id": job_id, "p_filter": body.filter}
    ).execute()
    return r.data or {"deleted_rows": 0}


# ── Raw records — list ────────────────────────────────────────────────────────
@app.get("/api/records")
def list_records(
    _user=Depends(require_auth),
    upload_id:  str | None = Query(None),
    district:   str | None = Query(None),
    zone:       str | None = Query(None),
    imis_id:    str | None = Query(None),
    consent:    str | None = Query(None),
    is_usable:  bool | None = Query(None),
    limit:      int = Query(100, ge=1, le=1000),
    offset:     int = Query(0, ge=0),
):
    """Paginated, filterable list of raw call records."""
    q = (
        supabase.table("phase2_call_records")
        .select("id,upload_id,row_number,consent,water_received_daily,"
                "quality_satisfied,quantity_satisfied,consistent_timing,"
                "overall_satisfaction,district,zone,imis_id,"
                "contact_attempts,call_duration,hhid,is_consented,is_usable,created_at")
        .order("row_number")
        .range(offset, offset + limit - 1)
    )
    if upload_id:
        q = q.eq("upload_id", upload_id)
    if district:
        q = q.ilike("district", f"%{district}%")
    if zone:
        q = q.ilike("zone", f"%{zone}%")
    if imis_id:
        q = q.ilike("imis_id", f"%{imis_id}%")
    if consent:
        q = q.eq("consent", consent)
    if is_usable is not None:
        q = q.eq("is_usable", is_usable)

    rows = q.execute().data or []
    return {"records": rows, "limit": limit, "offset": offset, "count": len(rows)}


# ── Raw records — single ──────────────────────────────────────────────────────
@app.get("/api/records/{record_id}")
def get_record(record_id: str, _user=Depends(require_auth)):
    r = supabase.table("phase2_call_records").select("*").eq("id", record_id).maybe_single().execute()
    if not r.data:
        raise HTTPException(404, "Record not found.")
    return r.data


# ── Raw records — update single ───────────────────────────────────────────────
@app.patch("/api/records/{record_id}")
def update_record(record_id: str, body: RecordUpdate, _user=Depends(require_auth)):
    """Update any field on a single record. Derived flags (is_consented, is_usable) auto-update."""
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(400, "No fields to update.")

    # Re-derive boolean flags if relevant columns changed
    if "consent" in changes:
        changes["is_consented"] = changes["consent"] == "yes"
    if "water_received_daily" in changes:
        changes["is_usable"] = changes["water_received_daily"] in ("yes", "no")

    changes["updated_at"] = "now()"
    r = supabase.table("phase2_call_records").update(changes).eq("id", record_id).execute()
    if not r.data:
        raise HTTPException(404, "Record not found.")
    return r.data[0]


# ── Raw records — delete single ───────────────────────────────────────────────
@app.delete("/api/records/{record_id}")
def delete_record(record_id: str, _user=Depends(require_auth)):
    supabase.table("phase2_call_records").delete().eq("id", record_id).execute()
    return {"deleted": record_id}


# ── Raw records — bulk update ─────────────────────────────────────────────────
@app.post("/api/records/bulk-update")
def bulk_update_records(body: BulkUpdateRequest, _user=Depends(require_auth)):
    """Update the same set of fields across multiple records at once."""
    if not body.ids:
        raise HTTPException(400, "No record IDs provided.")
    if len(body.ids) > 500:
        raise HTTPException(400, "Maximum 500 records per bulk update.")

    changes = {k: v for k, v in body.fields.model_dump().items() if v is not None}
    if not changes:
        raise HTTPException(400, "No fields to update.")

    if "consent" in changes:
        changes["is_consented"] = changes["consent"] == "yes"
    if "water_received_daily" in changes:
        changes["is_usable"] = changes["water_received_daily"] in ("yes", "no")

    updated = 0
    for i in range(0, len(body.ids), 50):
        chunk = body.ids[i: i + 50]
        supabase.table("phase2_call_records").update(changes).in_("id", chunk).execute()
        updated += len(chunk)

    return {"updated": updated}


# ── Raw records — bulk delete ─────────────────────────────────────────────────
@app.post("/api/records/bulk-delete")
def bulk_delete_records(body: BulkDeleteRequest, _user=Depends(require_auth)):
    if not body.ids:
        raise HTTPException(400, "No record IDs provided.")
    if len(body.ids) > 500:
        raise HTTPException(400, "Maximum 500 records per bulk delete.")

    deleted = 0
    for i in range(0, len(body.ids), 50):
        chunk = body.ids[i: i + 50]
        supabase.table("phase2_call_records").delete().in_("id", chunk).execute()
        deleted += len(chunk)

    return {"deleted": deleted}


# ── Raw records — bulk add ────────────────────────────────────────────────────
@app.post("/api/records/bulk-add")
def bulk_add_records(body: BulkAddRequest, _user=Depends(require_auth)):
    """
    Add new records to an existing upload without re-uploading a file.
    After adding, trigger a /reprocess to update BSI scores.
    """
    if not body.records:
        raise HTTPException(400, "No records provided.")
    if len(body.records) > 5000:
        raise HTTPException(400, "Maximum 5,000 records per bulk add.")

    # Verify upload exists
    r = supabase.table("phase2_uploads").select("id").eq("id", body.upload_id).maybe_single().execute()
    if not r.data:
        raise HTTPException(404, "Upload not found.")

    from processor import COLUMN_ALIASES
    known = set(COLUMN_ALIASES.keys())
    rows = []
    for rec in body.records:
        def sv(k):
            v = rec.get(k)
            return str(v).strip().lower() if v else None

        extra = {k: str(v) for k, v in rec.items() if k not in known and v is not None}
        rows.append({
            "upload_id":             body.upload_id,
            "row_number":            None,
            "consent":               sv("consent"),
            "water_received_daily":  sv("water_received_daily"),
            "quality_satisfied":     sv("quality_satisfied"),
            "quantity_satisfied":    sv("quantity_satisfied"),
            "consistent_timing":     sv("consistent_timing"),
            "overall_satisfaction":  sv("overall_satisfaction"),
            "district":              sv("district"),
            "zone":                  sv("zone"),
            "imis_id":               sv("imis_id"),
            "contact_attempts":      int(rec["contact_attempts"]) if rec.get("contact_attempts") else None,
            "call_duration":         int(rec["call_duration"])    if rec.get("call_duration")    else None,
            "hhid":                  sv("hhid"),
            "is_consented":          sv("consent") == "yes",
            "is_usable":             sv("water_received_daily") in ("yes", "no"),
            "extra_data":            extra or None,
        })

    from processor import _batch_insert
    _batch_insert(supabase, "phase2_call_records", rows)
    return {
        "added": len(rows),
        "upload_id": body.upload_id,
        "note": "Call POST /api/uploads/{job_id}/reprocess to refresh BSI scores.",
    }


# ── Phase 2 dashboard data ────────────────────────────────────────────────────
@app.get("/api/phase2/kpi")
def get_phase2_kpi(_user=Depends(require_auth)):
    r = (
        supabase.table("phase2_kpi_summary")
        .select("*")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not r.data:
        raise HTTPException(404, "No active Phase 2 KPI data. Upload a file first.")
    return r.data[0]


@app.get("/api/phase2/zones")
def get_phase2_zones(_user=Depends(require_auth)):
    return supabase.table("phase2_zone_scores").select("*").eq("is_active", True).order("bsi", desc=True).execute().data or []


@app.get("/api/phase2/districts")
def get_phase2_districts(
    _user=Depends(require_auth),
    zone: str | None = Query(None),
):
    q = supabase.table("phase2_district_scores").select("*").eq("is_active", True).order("bsi", desc=True)
    if zone:
        q = q.ilike("zone", f"%{zone}%")
    return q.execute().data or []


@app.get("/api/phase2/schemes")
def get_phase2_schemes(
    _user=Depends(require_auth),
    district: str | None = Query(None),
    zone:     str | None = Query(None),
    limit:    int = Query(200, ge=1, le=1000),
    offset:   int = Query(0, ge=0),
):
    q = (
        supabase.table("phase2_scheme_scores")
        .select("*")
        .eq("is_active", True)
        .order("bsi", desc=True)
        .range(offset, offset + limit - 1)
    )
    if district:
        q = q.ilike("district", f"%{district}%")
    if zone:
        q = q.ilike("zone", f"%{zone}%")
    return q.execute().data or []


# ── Schema info ───────────────────────────────────────────────────────────────
@app.get("/api/schema/columns")
def schema_columns(_user=Depends(require_auth)):
    """Return the expected column schema with all accepted aliases."""
    from processor import COLUMN_ALIASES, REQUIRED_CANONICAL, OPTIONAL_CANONICAL, DEFAULT_BSI_WEIGHTS
    return {
        "required": [
            {"canonical": c, "aliases": COLUMN_ALIASES[c]}
            for c in REQUIRED_CANONICAL
        ],
        "optional": [
            {"canonical": c, "aliases": COLUMN_ALIASES[c]}
            for c in OPTIONAL_CANONICAL
        ],
        "default_bsi_weights": DEFAULT_BSI_WEIGHTS,
        "accepted_values": {
            "consent":               ["yes", "no", "unknown", "invalid_response"],
            "water_received_daily":  ["yes", "no"],
            "quality_satisfied":     ["yes", "no"],
            "quantity_satisfied":    ["yes", "no"],
            "consistent_timing":     ["yes", "no"],
            "overall_satisfaction":  ["satisfied", "neutral", "dissatisfied"],
        },
    }

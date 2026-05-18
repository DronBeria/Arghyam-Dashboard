"""
JJM Phase 2 Data Pipeline — FastAPI Backend
Deploy on Render: push to main branch
Run locally:      uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, UploadFile, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
import asyncio
import httpx
import os
import uuid

# Load backend/.env regardless of the working directory uvicorn is started from
load_dotenv(Path(__file__).parent / ".env", override=False)

SUPABASE_URL         = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY. "
        "Set them in Render → Environment tab (use the service_role key, not anon key)."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

MAX_UPLOAD_BYTES = 50 * 1024 * 1024   # 50 MB hard cap

# CORS — default allows local dev + Vercel deploy; override via ALLOWED_ORIGINS env var
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:4173,https://arghyam-dashboard.vercel.app"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


# ── Keep-alive loop (prevents Render free-tier spin-down) ─────────────────────
async def _keep_alive():
    """Ping own public URL every 10 minutes to keep Render free-tier awake.
    Render measures *external* requests; localhost pings do not count."""
    await asyncio.sleep(60)
    # RENDER_EXTERNAL_URL is set automatically by Render on all services
    self_url = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
    if not self_url:
        return   # not on Render — nothing to keep alive
    url = f"{self_url}/health"
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            try:
                await client.get(url)
            except Exception:
                pass
            await asyncio.sleep(600)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_keep_alive())
    yield
    task.cancel()


app = FastAPI(title="JJM Phase 2 Data Pipeline", version="1.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth dependency — verifies Supabase JWT from Authorization header ─────────
async def require_auth(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required. Pass your Supabase session token as 'Bearer <token>'.")
    token = authorization[7:]
    try:
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return response.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed.")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.1.0"}


# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_csv(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    _user=Depends(require_auth),
):
    # Validate file type
    fname = (file.filename or "").lower()
    if not fname.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted (.csv extension required).")

    content = await file.read()

    # Enforce size cap
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content) / 1_048_576:.1f} MB). Maximum allowed: 50 MB."
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    job_id = str(uuid.uuid4())

    supabase.table("phase2_uploads").insert({
        "id":              job_id,
        "filename":        file.filename,
        "file_size_bytes": len(content),
        "status":          "queued",
        "progress":        0,
        "message":         "Job queued — waiting to start",
    }).execute()

    from processor import process_csv_background
    background_tasks.add_task(process_csv_background, job_id, content, supabase)

    return {"job_id": job_id, "status": "queued"}


# ── Status ────────────────────────────────────────────────────────────────────
@app.get("/api/status/{job_id}")
def get_status(job_id: str, _user=Depends(require_auth)):
    result = supabase.table("phase2_uploads").select("*").eq("id", job_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found.")
    return result.data


# ── History ───────────────────────────────────────────────────────────────────
@app.get("/api/uploads")
def list_uploads(_user=Depends(require_auth)):
    result = (
        supabase.table("phase2_uploads")
        .select("*")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


# ── Delete a job + its data ───────────────────────────────────────────────────
@app.delete("/api/uploads/{job_id}")
def delete_upload(job_id: str, _user=Depends(require_auth)):
    for table in ["phase2_scheme_scores", "phase2_district_scores",
                  "phase2_zone_scores", "phase2_kpi_summary"]:
        supabase.table(table).delete().eq("upload_id", job_id).execute()
    supabase.table("phase2_uploads").delete().eq("id", job_id).execute()
    return {"deleted": job_id}


# ── Phase 2 data read endpoints (used by frontend Phase 2 toggle) ─────────────
@app.get("/api/phase2/kpi")
def get_phase2_kpi(_user=Depends(require_auth)):
    result = (
        supabase.table("phase2_kpi_summary")
        .select("*")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No active Phase 2 KPI data. Upload a CSV first.")
    return result.data[0]


@app.get("/api/phase2/zones")
def get_phase2_zones(_user=Depends(require_auth)):
    result = (
        supabase.table("phase2_zone_scores")
        .select("*")
        .eq("is_active", True)
        .order("bsi", desc=True)
        .execute()
    )
    return result.data or []


@app.get("/api/phase2/districts")
def get_phase2_districts(_user=Depends(require_auth)):
    result = (
        supabase.table("phase2_district_scores")
        .select("*")
        .eq("is_active", True)
        .order("bsi", desc=True)
        .execute()
    )
    return result.data or []


@app.get("/api/phase2/schemes")
def get_phase2_schemes(
    district: str | None = None,
    zone: str | None = None,
    _user=Depends(require_auth),
):
    q = (
        supabase.table("phase2_scheme_scores")
        .select("*")
        .eq("is_active", True)
        .order("bsi", desc=True)
    )
    if district:
        q = q.ilike("district", district)
    if zone:
        q = q.ilike("zone", zone)
    result = q.execute()
    return result.data or []

"""
JJM Phase 2 Data Pipeline — FastAPI Backend
Deploy on Render: push to main branch
Run locally:      uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
import asyncio
import httpx
import os
import uuid

load_dotenv()

SUPABASE_URL         = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY. "
        "Set them in Render → Environment tab (use the service_role key, not anon key)."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── Keep-alive loop (prevents Render free-tier spin-down) ─────────────────────
async def _keep_alive():
    """Ping own /health every 10 minutes so Render never marks the service idle."""
    # Wait 30s after startup before first ping (let the server fully boot)
    await asyncio.sleep(30)
    port = os.environ.get("PORT", "8000")
    url  = f"http://localhost:{port}/health"
    async with httpx.AsyncClient(timeout=10) as client:
        while True:
            try:
                await client.get(url)
            except Exception:
                pass   # silently ignore — server will retry next cycle
            await asyncio.sleep(600)   # 10 minutes


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_keep_alive())
    yield
    task.cancel()


app = FastAPI(title="JJM Phase 2 Data Pipeline", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://arghyam-dashboard.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Invite user ───────────────────────────────────────────────────────────────
@app.post("/api/invite")
async def invite_user(body: dict):
    email = (body.get("email") or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required.")
    try:
        supabase.auth.admin.invite_user_by_email(email)
        return {"invited": email}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_csv(file: UploadFile, background_tasks: BackgroundTasks):
    if not (file.filename or "").endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    job_id  = str(uuid.uuid4())

    # Create the job record in Supabase
    supabase.table("phase2_uploads").insert({
        "id":              job_id,
        "filename":        file.filename,
        "file_size_bytes": len(content),
        "status":          "queued",
        "progress":        0,
        "message":         "Job queued — waiting to start",
    }).execute()

    # Kick off background processing
    from processor import process_csv_background
    background_tasks.add_task(process_csv_background, job_id, content, supabase)

    return {"job_id": job_id, "status": "queued"}


# ── Status ────────────────────────────────────────────────────────────────────
@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    result = supabase.table("phase2_uploads").select("*").eq("id", job_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data


# ── History ───────────────────────────────────────────────────────────────────
@app.get("/api/uploads")
def list_uploads():
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
def delete_upload(job_id: str):
    for table in ["phase2_district_scores", "phase2_zone_scores", "phase2_kpi_summary"]:
        supabase.table(table).delete().eq("upload_id", job_id).execute()
    supabase.table("phase2_uploads").delete().eq("id", job_id).execute()
    return {"deleted": job_id}

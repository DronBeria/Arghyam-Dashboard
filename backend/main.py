"""
JJM Phase 2 Data Pipeline — FastAPI Backend
Deploy on Railway: railway up
Run locally:       uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import uuid

load_dotenv()

SUPABASE_URL         = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(title="JJM Phase 2 Data Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


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

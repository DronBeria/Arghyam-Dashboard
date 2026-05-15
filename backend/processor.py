"""
CSV Processing Pipeline — Phase 2 CSAT Data
Mirrors the exact BSI methodology used in Phase 1.

Pipeline steps:
  1. Parse CSV with pandas
  2. Validate required columns (case-insensitive match)
  3. Normalise string values (strip, lowercase)
  4. Compute BSI at state / zone / district level
  5. Aggregate call summary stats (Q1–Q5 counts, consent breakdown)
  6. Insert KPI summary, district scores, zone scores into Supabase
  7. Mark job complete (or error)
"""

import io
import traceback
from datetime import datetime, timezone
from typing import List

import pandas as pd
from supabase import Client

BATCH_SIZE = 200   # max rows per Supabase insert call


def _batch_insert(supabase: Client, table: str, records: List[dict]) -> None:
    """Insert records in chunks to avoid Supabase payload limits."""
    for i in range(0, len(records), BATCH_SIZE):
        supabase.table(table).insert(records[i : i + BATCH_SIZE]).execute()


# ── Column requirements ───────────────────────────────────────────────────────
REQUIRED_COLUMNS = [
    "consent",
    "water_received_daily",   # Q1
    "quality_satisfied",      # Q2
    "quantity_satisfied",     # Q3
    "consistent_timing",      # Q4
    "overall_satisfaction",   # Q5
    "district",
    "zone",
]

OPTIONAL_COLUMNS = ["Imis_id", "contact_attempts", "call_duration", "HHID"]


# ── Helpers ───────────────────────────────────────────────────────────────────
def _update_job(supabase: Client, job_id: str, **fields) -> None:
    supabase.table("phase2_uploads").update(fields).eq("id", job_id).execute()


def _safe_pct(subset: pd.DataFrame, col: str, yes_vals: tuple = ("yes",)) -> float:
    """Percentage of rows where col is in yes_vals, denominator = rows with yes or no."""
    valid = subset[subset[col].isin(list(yes_vals) + ["no"])]
    if len(valid) == 0:
        return 0.0
    yes = valid[col].isin(yes_vals).sum()
    return round(float(yes) / len(valid) * 100, 2)


def compute_bsi(df: pd.DataFrame) -> float:
    """
    BSI = Σ(weight × score) / 5.0   →  result is 0–1, display as × 5 for 0–5 scale

    Weights — total = 5.0:
      Q1  Daily Water  : 0.75  base = all usable calls (Q1 answered yes or no)
      Q1A Timing       : 0.75  base = Q1=yes callers (follow-up to Q1)
      Q2  Quality      : 1.50  base = consented only
      Q3  Quantity     : 1.50  base = consented only
      Q5  Overall      : 0.50  base = consented; satisfied counts as yes
    Total weight = 0.75+0.75+1.5+1.5+0.5 = 5.0
    """
    usable    = df[df["water_received_daily"].isin(["yes", "no"])]
    consented = df[df["consent"] == "yes"]
    q1_yes    = usable[usable["water_received_daily"] == "yes"]

    def pct(subset: pd.DataFrame, col: str, yes_vals: tuple = ("yes",)) -> float:
        valid = subset[subset[col].isin(list(yes_vals) + ["no"])]
        if len(valid) == 0:
            return 0.0
        return float(valid[col].isin(yes_vals).sum()) / len(valid)

    q1  = pct(usable,    "water_received_daily")
    q1a = pct(q1_yes,   "consistent_timing")
    q2  = pct(consented, "quality_satisfied")
    q3  = pct(consented, "quantity_satisfied")
    q5  = pct(consented, "overall_satisfaction", ("satisfied",))

    bsi = (q1 * 0.75 + q1a * 0.75 + q2 * 1.5 + q3 * 1.5 + q5 * 0.5) / 5.0
    return round(bsi, 4)


# ── Main background task ──────────────────────────────────────────────────────
def process_csv_background(job_id: str, content: bytes, supabase: Client) -> None:
    try:
        # ── Step 1: Parse ─────────────────────────────────────────────────
        _update_job(supabase, job_id, status="validating", progress=10,
                    message="Parsing CSV file…")

        df = pd.read_csv(io.BytesIO(content), dtype=str)
        df.columns = df.columns.str.strip()

        # ── Step 2: Validate columns (case-insensitive) ───────────────────
        _update_job(supabase, job_id, progress=20,
                    message="Validating column structure…")

        col_map = {c.lower(): c for c in df.columns}
        for req in REQUIRED_COLUMNS:
            if req.lower() in col_map and col_map[req.lower()] != req:
                df = df.rename(columns={col_map[req.lower()]: req})

        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            _update_job(supabase, job_id,
                        status="error", progress=0,
                        message=f"Missing required columns: {', '.join(missing)}",
                        error_detail=f"CSV is missing: {missing}. "
                                     f"Columns found: {list(df.columns)}")
            return

        # ── Step 3: Normalise ─────────────────────────────────────────────
        for col in df.select_dtypes(include="object").columns:
            df[col] = df[col].str.strip().str.lower().fillna("none")

        row_count = len(df)
        _update_job(supabase, job_id, row_count=row_count, status="processing",
                    progress=30,
                    message=f"Validated {row_count:,} rows — computing BSI scores…")

        # Derived subsets (same rules as Phase 1)
        consented = df[df["consent"] == "yes"]
        usable    = df[df["water_received_daily"].isin(["yes", "no"])]
        q1_yes    = usable[usable["water_received_daily"] == "yes"]

        completed_mask = (
            df["water_received_daily"].isin(["yes", "no"]) &
            df["quality_satisfied"].isin(["yes", "no"]) &
            df["quantity_satisfied"].isin(["yes", "no"]) &
            df["consistent_timing"].isin(["yes", "no"]) &
            df["overall_satisfaction"].isin(["satisfied", "neutral", "dissatisfied"])
        )
        completed_all_5 = int(completed_mask.sum())

        # ── Step 4: State BSI ─────────────────────────────────────────────
        _update_job(supabase, job_id, progress=40,
                    message="Computing state-level BSI…")
        state_bsi = compute_bsi(df)

        # Q5 three-way split — ALL who answered (consented + non-consented)
        # Matches Phase 1: 4,410 = 4,284 consented + 126 non-consented who reached Q5
        q5_base         = df[df["overall_satisfaction"].isin(["satisfied", "neutral", "dissatisfied"])]
        q5_satisfied    = int((q5_base["overall_satisfaction"] == "satisfied").sum())
        q5_neutral      = int((q5_base["overall_satisfaction"] == "neutral").sum())
        q5_dissatisfied = int((q5_base["overall_satisfaction"] == "dissatisfied").sum())

        # ── Step 5: Insert KPI summary ────────────────────────────────────
        _update_job(supabase, job_id, progress=55,
                    message="Inserting KPI summary…")

        kpi = {
            "upload_id":          job_id,
            "total_calls":        row_count,
            "consented":          len(consented),
            "usable_calls":       len(usable),
            "completed_all_5":    completed_all_5,
            "state_bsi":          state_bsi,
            "q1_yes_pct":         _safe_pct(usable,    "water_received_daily"),
            "q2_yes_pct":         _safe_pct(consented, "quality_satisfied"),
            "q3_yes_pct":         _safe_pct(consented, "quantity_satisfied"),
            "q1a_yes_pct":        _safe_pct(q1_yes, "consistent_timing"),
            "q5_satisfied_pct":   _safe_pct(df, "overall_satisfaction", ("satisfied",)),
            "q5_satisfied_count": q5_satisfied,
            "q5_neutral_count":   q5_neutral,
            "q5_dissatisfied_count": q5_dissatisfied,
            "is_active":          True,
        }
        # Deactivate previous active summaries
        supabase.table("phase2_kpi_summary").update({"is_active": False}) \
            .eq("is_active", True).execute()
        supabase.table("phase2_kpi_summary").insert(kpi).execute()

        # ── Step 6: District scores ───────────────────────────────────────
        _update_job(supabase, job_id, progress=70,
                    message="Aggregating by district…")

        districts = []
        for (district, zone), group in df.groupby(["district", "zone"]):
            g_consented = group[group["consent"] == "yes"]
            g_usable    = group[group["water_received_daily"].isin(["yes", "no"])]
            districts.append({
                "upload_id":    job_id,
                "district":     str(district).title(),
                "zone":         str(zone).title(),
                "total_calls":  len(group),
                "consented":    len(g_consented),
                "usable_calls": len(g_usable),
                "bsi":          compute_bsi(group),
                "is_active":    True,
            })

        if districts:
            supabase.table("phase2_district_scores").update({"is_active": False}) \
                .eq("is_active", True).execute()
            _batch_insert(supabase, "phase2_district_scores", districts)

        # ── Step 7: Zone scores ───────────────────────────────────────────
        _update_job(supabase, job_id, progress=85,
                    message="Aggregating by zone…")

        zones = []
        for zone, group in df.groupby("zone"):
            g_consented = group[group["consent"] == "yes"]
            g_usable    = group[group["water_received_daily"].isin(["yes", "no"])]
            zones.append({
                "upload_id":    job_id,
                "zone":         str(zone).title(),
                "total_calls":  len(group),
                "consented":    len(g_consented),
                "usable_calls": len(g_usable),
                "bsi":          compute_bsi(group),
                "is_active":    True,
            })

        if zones:
            supabase.table("phase2_zone_scores").update({"is_active": False}) \
                .eq("is_active", True).execute()
            _batch_insert(supabase, "phase2_zone_scores", zones)

        # ── Step 8: Scheme scores (by IMIS ID) ───────────────────────────
        _update_job(supabase, job_id, progress=93,
                    message="Aggregating by scheme (IMIS ID)…")

        schemes = []
        if "Imis_id" in df.columns:
            for imis_id, group in df.groupby("Imis_id"):
                g_consented  = group[group["consent"] == "yes"]
                g_usable     = group[group["water_received_daily"].isin(["yes", "no"])]
                g_q1_yes     = g_usable[g_usable["water_received_daily"] == "yes"]
                district_val = group["district"].mode()[0] if "district" in group.columns else None
                zone_val     = group["zone"].mode()[0]     if "zone"     in group.columns else None
                schemes.append({
                    "upload_id":    job_id,
                    "imis_id":      str(imis_id),
                    "district":     str(district_val).title() if district_val else None,
                    "zone":         str(zone_val).title()     if zone_val     else None,
                    "total_calls":  len(group),
                    "consented":    len(g_consented),
                    "usable_calls": len(g_usable),
                    "bsi":          compute_bsi(group),
                    "q1_yes_pct":   _safe_pct(g_usable,   "water_received_daily"),
                    "q1a_yes_pct":  _safe_pct(g_q1_yes,   "consistent_timing"),
                    "q2_yes_pct":   _safe_pct(g_consented, "quality_satisfied"),
                    "q3_yes_pct":   _safe_pct(g_consented, "quantity_satisfied"),
                    "q5_sat_pct":   _safe_pct(g_consented, "overall_satisfaction", ("satisfied",)),
                    "is_active":    True,
                })
            if schemes:
                supabase.table("phase2_scheme_scores").update({"is_active": False}) \
                    .eq("is_active", True).execute()
                _batch_insert(supabase, "phase2_scheme_scores", schemes)

        # ── Done ──────────────────────────────────────────────────────────
        _update_job(supabase, job_id,
                    status="complete",
                    progress=100,
                    message=f"Successfully processed {row_count:,} rows — "
                            f"{len(schemes)} schemes, {len(districts)} districts, {len(zones)} zones.",
                    completed_at=datetime.now(timezone.utc).isoformat())

        print(f"[{job_id}] Complete — {row_count:,} rows, "
              f"{len(schemes)} schemes, {len(districts)} districts, "
              f"{len(zones)} zones, BSI={state_bsi}")

    except Exception:
        err = traceback.format_exc()
        print(f"[{job_id}] ERROR:\n{err}")
        _update_job(supabase, job_id,
                    status="error",
                    progress=0,
                    message="An internal error occurred during processing.",
                    error_detail=err[:2000])

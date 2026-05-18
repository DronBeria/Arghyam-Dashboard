"""
Industrial-grade CSV/XLSX Processing Pipeline — Phase 2 CSAT Data

Features:
  - Fuzzy column auto-detection (works with any sensible column naming)
  - XLSX + CSV support with encoding fallback
  - Raw record storage for full edit/re-process capability
  - Per-column data quality reports
  - Configurable BSI weights
  - Append mode (add data without replacing existing)
  - Re-process from stored records without re-uploading
"""

import io
import traceback
from difflib import get_close_matches
import pandas as pd
from supabase import Client


# ── BSI weights (all 5 weights sum to 5.0) ───────────────────────────────────

DEFAULT_BSI_WEIGHTS: dict[str, float] = {
    "q1":  0.75,   # water_received_daily  — base = all usable calls
    "q1a": 0.75,   # consistent_timing     — base = Q1=yes callers
    "q2":  1.50,   # quality_satisfied     — base = consented
    "q3":  1.50,   # quantity_satisfied    — base = consented
    "q5":  0.50,   # overall_satisfaction  — base = consented; satisfied=yes
}


# ── Column alias dictionary ───────────────────────────────────────────────────
# Maps canonical column name → all acceptable input column names

COLUMN_ALIASES: dict[str, list[str]] = {
    "consent": [
        "consent", "consented", "agreed", "survey_consent",
        "consent_given", "respondent_consent", "call_consent",
        "has_consented", "consent_status",
    ],
    "water_received_daily": [
        "water_received_daily", "water_daily", "q1", "q1_answer", "q1_response",
        "daily_water", "water_supply_daily", "water_received", "daily_supply",
        "receives_water_daily", "water_q1", "q1_daily_water", "daily_water_supply",
    ],
    "quality_satisfied": [
        "quality_satisfied", "water_quality", "q2", "q2_answer", "q2_response",
        "quality", "water_quality_satisfied", "satisfied_quality", "quality_ok",
        "q2_quality", "water_q2", "q2_water_quality", "quality_of_water",
    ],
    "quantity_satisfied": [
        "quantity_satisfied", "water_quantity", "q3", "q3_answer", "q3_response",
        "quantity", "water_quantity_satisfied", "enough_water", "sufficient_water",
        "q3_quantity", "quantity_ok", "water_q3", "q3_water_quantity",
    ],
    "consistent_timing": [
        "consistent_timing", "timing", "q4", "q1a", "q4_answer", "q1a_answer",
        "q4_response", "q1a_response", "consistent", "water_timing",
        "regular_timing", "supply_timing", "water_q4", "q4_consistent_timing",
        "timing_consistent",
    ],
    "overall_satisfaction": [
        "overall_satisfaction", "satisfaction", "q5", "q5_answer", "q5_response",
        "overall", "overall_sat", "q5_satisfaction", "total_satisfaction",
        "rating", "water_q5", "q5_overall", "overall_rating", "csat_score",
    ],
    "district": [
        "district", "district_name", "dist", "district_id",
        "district_code", "taluka", "block", "mandal",
    ],
    "zone": [
        "zone", "zone_name", "region", "zone_id", "zone_code",
        "circle", "division", "cluster", "area",
    ],
    "imis_id": [
        "imis_id", "Imis_id", "IMIS_ID", "imis", "scheme_id",
        "scheme_code", "pwsid", "wss_id", "scheme_imis", "water_scheme_id",
        "imis_scheme_id", "scheme_reference",
    ],
    "contact_attempts": [
        "contact_attempts", "attempts", "call_attempts",
        "retries", "num_attempts", "total_attempts", "dial_attempts",
    ],
    "call_duration": [
        "call_duration", "duration", "call_length",
        "duration_seconds", "call_time", "talk_time", "call_duration_sec",
    ],
    "hhid": [
        "hhid", "HHID", "household_id", "hh_id",
        "beneficiary_id", "respondent_id", "beneficiary_hh_id", "hh_code",
    ],
}

REQUIRED_CANONICAL = [
    "consent", "water_received_daily", "quality_satisfied",
    "quantity_satisfied", "consistent_timing", "overall_satisfaction",
    "district", "zone",
]
OPTIONAL_CANONICAL = ["imis_id", "contact_attempts", "call_duration", "hhid"]

BATCH_SIZE = 1000


# ── Column detection ─────────────────────────────────────────────────────────

def _norm(s: str) -> str:
    return s.lower().strip().replace(" ", "_").replace("-", "_").replace(".", "_")


def detect_column_map(columns: list[str]) -> dict[str, str | None]:
    """
    Auto-map arbitrary column names to canonical names.
    Returns {canonical: original_col | None}.
    Priority: exact alias → normalized alias → fuzzy (cutoff 0.78).
    """
    norm_to_orig = {_norm(c): c for c in columns}
    result: dict[str, str | None] = {}

    for canonical, aliases in COLUMN_ALIASES.items():
        found: str | None = None

        # 1. Exact alias match (case-insensitive, normalized)
        for alias in aliases:
            n = _norm(alias)
            if n in norm_to_orig:
                found = norm_to_orig[n]
                break

        # 2. Fuzzy match against all input columns
        if not found:
            matches = get_close_matches(canonical, list(norm_to_orig.keys()), n=1, cutoff=0.78)
            if matches:
                found = norm_to_orig[matches[0]]

        result[canonical] = found

    return result


def apply_column_map(df: pd.DataFrame, col_map: dict[str, str | None]) -> pd.DataFrame:
    """Rename detected columns to canonical names; add missing columns as None."""
    rename = {v: k for k, v in col_map.items() if v and v in df.columns}
    df = df.rename(columns=rename)
    for canonical in COLUMN_ALIASES:
        if canonical not in df.columns:
            df[canonical] = None
    return df


# ── Cleaning & validation ─────────────────────────────────────────────────────

def _lc(val) -> str:
    s = str(val).strip().lower() if val is not None else ""
    return "" if s in ("nan", "none", "nat", "") else s


def clean_and_validate(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict], dict]:
    """
    Normalise string values. Flag rows with unexpected values.
    Returns (clean_df, error_rows, quality_report).
    """
    for col in df.select_dtypes(include="object").columns:
        df[col] = (
            df[col].astype(str)
            .str.strip()
            .str.lower()
            .replace({"nan": None, "none": None, "nat": None, "": None})
        )

    VALID_CONSENT = {"yes", "no", "unknown", "invalid_response"}
    VALID_YN      = {"yes", "no"}
    VALID_SAT     = {"satisfied", "neutral", "dissatisfied"}

    errors: list[dict] = []
    for i, row in df.iterrows():
        row_errs = []
        c = _lc(row.get("consent"))
        if c and c not in VALID_CONSENT:
            row_errs.append(f"consent='{c}'")
        for col in ["water_received_daily", "quality_satisfied",
                    "quantity_satisfied", "consistent_timing"]:
            v = _lc(row.get(col))
            if v and v not in VALID_YN:
                row_errs.append(f"{col}='{v}'")
        q5 = _lc(row.get("overall_satisfaction"))
        if q5 and q5 not in VALID_SAT:
            row_errs.append(f"overall_satisfaction='{q5}'")
        if row_errs:
            errors.append({"row": int(i) + 2, "issues": row_errs})

    quality = _build_quality_report(df, errors)
    return df, errors, quality


def _build_quality_report(df: pd.DataFrame, error_rows: list[dict]) -> dict:
    total = len(df)
    if total == 0:
        return {"total_rows": 0}

    def completeness(col: str) -> float:
        if col not in df.columns:
            return 0.0
        return round(float(df[col].notna().sum()) / total * 100, 1)

    def valid_rate(col: str, valid: set) -> float:
        if col not in df.columns:
            return 0.0
        filled = df[col].dropna()
        if len(filled) == 0:
            return 0.0
        return round(float(filled.isin(valid).sum()) / len(filled) * 100, 1)

    cs = df["consent"].value_counts() if "consent" in df.columns else {}
    return {
        "total_rows":   total,
        "error_rows":   len(error_rows),
        "error_sample": error_rows[:20],
        "consent_breakdown": {
            "yes":              int(cs.get("yes", 0)),
            "no":               int(cs.get("no", 0)),
            "unknown":          int(cs.get("unknown", 0)),
            "invalid_response": int(cs.get("invalid_response", 0)),
        },
        "completeness": {c: completeness(c) for c in list(COLUMN_ALIASES.keys())},
        "valid_rates": {
            "consent":                valid_rate("consent", {"yes","no","unknown","invalid_response"}),
            "water_received_daily":   valid_rate("water_received_daily", {"yes","no"}),
            "quality_satisfied":      valid_rate("quality_satisfied",    {"yes","no"}),
            "quantity_satisfied":     valid_rate("quantity_satisfied",   {"yes","no"}),
            "consistent_timing":      valid_rate("consistent_timing",    {"yes","no"}),
            "overall_satisfaction":   valid_rate("overall_satisfaction", {"satisfied","neutral","dissatisfied"}),
        },
        "geographic_coverage": {
            "districts": int(df["district"].nunique()) if "district" in df.columns else 0,
            "zones":     int(df["zone"].nunique())     if "zone"     in df.columns else 0,
            "schemes":   int(df["imis_id"].nunique())  if "imis_id"  in df.columns else 0,
        },
    }


# ── BSI computation ───────────────────────────────────────────────────────────

def _pct(subset: pd.DataFrame, col: str, yes_vals: tuple = ("yes",)) -> float:
    if col not in subset.columns:
        return 0.0
    valid = subset[subset[col].isin(list(yes_vals) + ["no"])]
    if len(valid) == 0:
        return 0.0
    return float(valid[col].isin(yes_vals).sum()) / len(valid)


def compute_bsi(df: pd.DataFrame, weights: dict | None = None) -> float:
    w = {**DEFAULT_BSI_WEIGHTS, **(weights or {})}
    usable    = df[df["water_received_daily"].isin(["yes", "no"])] if "water_received_daily" in df.columns else df.iloc[0:0]
    consented = df[df["consent"] == "yes"]                         if "consent"              in df.columns else df.iloc[0:0]
    q1_yes    = usable[usable["water_received_daily"] == "yes"]    if len(usable) else usable

    bsi = (
        _pct(usable,    "water_received_daily")        * w["q1"]  +
        _pct(q1_yes,   "consistent_timing")            * w["q1a"] +
        _pct(consented, "quality_satisfied")            * w["q2"]  +
        _pct(consented, "quantity_satisfied")           * w["q3"]  +
        _pct(consented, "overall_satisfaction", ("satisfied",)) * w["q5"]
    ) / sum(w.values())
    return round(bsi, 4)


def compute_bsi_components(df: pd.DataFrame, weights: dict | None = None) -> dict:
    """Full BSI breakdown: BSI + all component %s + call counts."""
    w = {**DEFAULT_BSI_WEIGHTS, **(weights or {})}

    usable    = df[df["water_received_daily"].isin(["yes", "no"])] if "water_received_daily" in df.columns else df.iloc[0:0]
    consented = df[df["consent"] == "yes"]                         if "consent"              in df.columns else df.iloc[0:0]
    q1_yes    = usable[usable["water_received_daily"] == "yes"]    if len(usable) else usable

    def pct_n(sub: pd.DataFrame, col: str, yes_vals: tuple = ("yes",)) -> dict:
        if col not in sub.columns:
            return {"pct": 0.0, "yes": 0, "no": 0, "base": 0}
        valid  = sub[sub[col].isin(list(yes_vals) + ["no"])]
        yes_n  = int(valid[col].isin(yes_vals).sum())
        return {"pct": round(yes_n / len(valid) * 100, 2) if valid.shape[0] else 0.0,
                "yes": yes_n, "no": len(valid) - yes_n, "base": len(valid)}

    q5_base = df[df["overall_satisfaction"].isin(["satisfied","neutral","dissatisfied"])] if "overall_satisfaction" in df.columns else df.iloc[0:0]
    q5_n    = pct_n(consented, "overall_satisfaction", ("satisfied",))

    bsi_raw = (
        q5_n["pct"]/100 * 0 +   # placeholder — recomputed below
        _pct(usable,    "water_received_daily")               * w["q1"]  +
        _pct(q1_yes,   "consistent_timing")                   * w["q1a"] +
        _pct(consented, "quality_satisfied")                   * w["q2"]  +
        _pct(consented, "quantity_satisfied")                  * w["q3"]  +
        _pct(consented, "overall_satisfaction", ("satisfied",)) * w["q5"]
    ) / sum(w.values())

    return {
        "bsi":            round(bsi_raw, 4),
        "bsi_5":          round(bsi_raw * 5, 2),
        "weights_used":   w,
        "total_rows":     len(df),
        "usable_rows":    len(usable),
        "consented_rows": len(consented),
        "q1":             pct_n(usable,    "water_received_daily"),
        "q1a":            pct_n(q1_yes,   "consistent_timing"),
        "q2":             pct_n(consented, "quality_satisfied"),
        "q3":             pct_n(consented, "quantity_satisfied"),
        "q5":             {
            **q5_n,
            "three_way": {
                "satisfied":    int((q5_base["overall_satisfaction"] == "satisfied").sum())    if len(q5_base) else 0,
                "neutral":      int((q5_base["overall_satisfaction"] == "neutral").sum())      if len(q5_base) else 0,
                "dissatisfied": int((q5_base["overall_satisfaction"] == "dissatisfied").sum()) if len(q5_base) else 0,
                "total":        len(q5_base),
            },
        },
    }


# ── Supabase helpers ──────────────────────────────────────────────────────────

def _update_job(supabase: Client, job_id: str, **fields) -> None:
    supabase.table("phase2_uploads").update(fields).eq("id", job_id).execute()


def _batch_insert(supabase: Client, table: str, records: list[dict]) -> None:
    for i in range(0, len(records), BATCH_SIZE):
        supabase.table(table).insert(records[i: i + BATCH_SIZE]).execute()


# ── Raw record storage ────────────────────────────────────────────────────────

def insert_raw_records(supabase: Client, upload_id: str, df: pd.DataFrame) -> int:
    """
    Store every row into phase2_raw_records as JSONB (preserves ALL columns).
    Also stores into phase2_call_records for typed access.
    After this, call recompute_phase2_aggregates() SQL RPC to compute BSI.
    """
    known_cols = set(COLUMN_ALIASES.keys())

    # ── JSONB records (flexible, any structure) ────────────────────────────────
    raw_records = []
    typed_records = []

    for idx, row in df.iterrows():
        # Build JSONB payload — include EVERY column from the original file
        row_data = {}
        for col in row.index:
            v = row[col]
            if v is not None and not (isinstance(v, float) and pd.isna(v)):
                row_data[col] = str(v)

        raw_records.append({
            "upload_id": upload_id,
            "row_num":   int(idx) + 2,
            "data":      row_data,
        })

        # Also populate typed table for direct SQL queries
        def sv(col):
            v = row_data.get(col) or row_data.get(col.lower()) or row_data.get(col.upper())
            return v if v and v not in ("nan","none","") else None

        def int_v(col):
            try:
                return int(float(sv(col))) if sv(col) else None
            except (ValueError, TypeError):
                return None

        extra = {c: str(row[c]) for c in row.index if c not in known_cols
                 and row[c] is not None and not (isinstance(row[c], float) and pd.isna(row[c]))}

        typed_records.append({
            "upload_id":             upload_id,
            "row_number":            int(idx) + 2,
            "consent":               sv("consent"),
            "water_received_daily":  sv("water_received_daily"),
            "quality_satisfied":     sv("quality_satisfied"),
            "quantity_satisfied":    sv("quantity_satisfied"),
            "consistent_timing":     sv("consistent_timing"),
            "overall_satisfaction":  sv("overall_satisfaction"),
            "district":              sv("district"),
            "zone":                  sv("zone"),
            "imis_id":               sv("imis_id"),
            "contact_attempts":      int_v("contact_attempts"),
            "call_duration":         int_v("call_duration"),
            "hhid":                  sv("hhid"),
            "is_consented":          sv("consent") == "yes",
            "is_usable":             sv("water_received_daily") in ("yes", "no"),
            "extra_data":            extra or None,
        })

    _batch_insert(supabase, "phase2_raw_records",  raw_records)
    _batch_insert(supabase, "phase2_call_records", typed_records)
    return len(raw_records)


# ── Aggregate insertion ───────────────────────────────────────────────────────

def _insert_aggregates(
    supabase: Client,
    upload_id: str,
    df: pd.DataFrame,
    weights: dict | None,
) -> tuple[int, int, int]:
    """Compute & insert district, zone, scheme aggregates."""

    def make_row(grp: pd.DataFrame, extra: dict) -> dict:
        c = compute_bsi_components(grp, weights)
        return {
            "upload_id":    upload_id,
            "total_calls":  len(grp),
            "consented":    c["consented_rows"],
            "usable_calls": c["usable_rows"],
            "bsi":          c["bsi"],
            "q1_yes_pct":   c["q1"]["pct"],
            "q2_yes_pct":   c["q2"]["pct"],
            "q3_yes_pct":   c["q3"]["pct"],
            "q1a_yes_pct":  c["q1a"]["pct"],
            "q5_sat_pct":   c["q5"]["pct"],
            "is_active":    True,
            **extra,
        }

    # Districts
    districts = []
    if "district" in df.columns and "zone" in df.columns:
        for (dist, zone), grp in df.groupby(["district", "zone"], dropna=True):
            districts.append(make_row(grp, {
                "district": str(dist).title(),
                "zone":     str(zone).title(),
            }))
    if districts:
        supabase.table("phase2_district_scores").update({"is_active": False}).eq("is_active", True).execute()
        _batch_insert(supabase, "phase2_district_scores", districts)

    # Zones
    zones = []
    if "zone" in df.columns:
        for zone, grp in df.groupby("zone", dropna=True):
            zones.append(make_row(grp, {"zone": str(zone).title()}))
    if zones:
        supabase.table("phase2_zone_scores").update({"is_active": False}).eq("is_active", True).execute()
        _batch_insert(supabase, "phase2_zone_scores", zones)

    # Schemes
    schemes = []
    if "imis_id" in df.columns:
        for imis_id, grp in df.groupby("imis_id", dropna=True):
            if str(imis_id).lower() in ("nan","none",""):
                continue
            dist_mode = grp["district"].mode()[0] if "district" in grp.columns and len(grp) else None
            zone_mode = grp["zone"].mode()[0]     if "zone"     in grp.columns and len(grp) else None
            schemes.append(make_row(grp, {
                "imis_id":  str(imis_id),
                "district": str(dist_mode).title() if dist_mode and not pd.isna(dist_mode) else None,
                "zone":     str(zone_mode).title() if zone_mode and not pd.isna(zone_mode) else None,
            }))
    if schemes:
        supabase.table("phase2_scheme_scores").update({"is_active": False}).eq("is_active", True).execute()
        _batch_insert(supabase, "phase2_scheme_scores", schemes)

    return len(districts), len(zones), len(schemes)


# ── File parsing ──────────────────────────────────────────────────────────────

def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV or XLSX. CSV tries UTF-8, falls back to latin-1."""
    fname = (filename or "").lower()
    if fname.endswith(".xlsx") or fname.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(content), dtype=str, engine="openpyxl")
    else:
        try:
            df = pd.read_csv(io.BytesIO(content), dtype=str, encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), dtype=str, encoding="latin-1")
    df.columns = df.columns.str.strip()
    return df


# ── DataFrame from stored records ────────────────────────────────────────────

def df_from_stored_records(supabase: Client, upload_id: str) -> pd.DataFrame:
    """Fetch all raw records for an upload and return as DataFrame."""
    all_rows = []
    chunk = 1000
    offset = 0
    while True:
        res = (
            supabase.table("phase2_call_records")
            .select("*")
            .eq("upload_id", upload_id)
            .range(offset, offset + chunk - 1)
            .execute()
        )
        if not res.data:
            break
        all_rows.extend(res.data)
        if len(res.data) < chunk:
            break
        offset += chunk
    return pd.DataFrame(all_rows) if all_rows else pd.DataFrame()


# ── Main background task ──────────────────────────────────────────────────────

def process_file_background(
    job_id:     str,
    content:    bytes,
    filename:   str,
    column_map: dict | None,
    mode:       str,        # "replace" | "append"
    supabase:   Client,
) -> None:
    try:
        # 1. Parse
        _update_job(supabase, job_id, status="validating", progress=10,
                    message="Parsing file…")
        df = parse_file(content, filename)
        original_columns = list(df.columns)

        # 2. Detect & apply column mapping
        _update_job(supabase, job_id, progress=18, message="Detecting column mapping…")
        auto_map = detect_column_map(original_columns)

        # User-supplied overrides auto-detection
        if column_map:
            for canonical, user_col in column_map.items():
                if user_col and user_col in df.columns:
                    auto_map[canonical] = user_col

        df = apply_column_map(df, auto_map)
        _update_job(supabase, job_id, column_map=auto_map)

        # Required column check
        missing = [c for c in REQUIRED_CANONICAL if auto_map.get(c) is None]
        if missing:
            _update_job(supabase, job_id, status="error", progress=0,
                        message=f"Could not detect required columns: {', '.join(missing)}",
                        error_detail=f"Auto-detection failed for: {missing}. "
                                     f"File had: {original_columns}")
            return

        # 3. Clean & validate
        _update_job(supabase, job_id, progress=28, message="Validating data quality…")
        df, error_rows, quality = clean_and_validate(df)
        row_count = len(df)

        _update_job(supabase, job_id,
                    row_count=row_count, status="processing", progress=35,
                    quality_report=quality,
                    message=f"Validated {row_count:,} rows — {len(error_rows)} with warnings")

        # 4. Deactivate old data (replace mode only)
        if mode != "append":
            for tbl in ["phase2_kpi_summary", "phase2_district_scores",
                        "phase2_zone_scores", "phase2_scheme_scores"]:
                supabase.table(tbl).update({"is_active": False}).eq("is_active", True).execute()

        # 5. Store raw records (both JSONB + typed)
        _update_job(supabase, job_id, progress=42,
                    message=f"Storing {row_count:,} records…")
        insert_raw_records(supabase, job_id, df)

        # 6. Hand off all BSI computation to Postgres SQL engine
        _update_job(supabase, job_id, progress=72,
                    message="Running SQL aggregation engine…")
        result = supabase.rpc(
            "recompute_phase2_aggregates",
            {"p_upload_id": job_id}
        ).execute()

        summary = result.data or {}
        print(f"[{job_id}] SQL engine done — {summary}")

    except Exception:
        err = traceback.format_exc()
        print(f"[{job_id}] ERROR:\n{err}")
        _update_job(supabase, job_id, status="error", progress=0,
                    message="Processing failed — contact support.",
                    error_detail=err[:4000])


# ── Re-process from stored records ───────────────────────────────────────────

def reprocess_from_records(job_id: str, supabase: Client) -> None:
    """Re-run BSI via the SQL engine — no re-upload, no Python computation."""
    try:
        _update_job(supabase, job_id, status="processing", progress=20,
                    message="Running SQL aggregation engine…")
        result = supabase.rpc(
            "recompute_phase2_aggregates",
            {"p_upload_id": job_id}
        ).execute()
        summary = result.data or {}
        print(f"[{job_id}] Reprocess done — {summary}")
    except Exception:
        err = traceback.format_exc()
        print(f"[{job_id}] Reprocess ERROR:\n{err}")
        _update_job(supabase, job_id, status="error", progress=0,
                    message="Reprocessing failed.", error_detail=err[:4000])

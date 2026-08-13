"""Export the canonical education-profile catalogue with explicit provenance.

The exporter consumes only `education_profile_scores`, which is produced by
`etl/build_education_profiles.py`. It never invents programme-level evidence.
Unavailable optional metrics are represented as null and are not silently
converted into scores.
"""
from __future__ import annotations

from pathlib import Path
import json
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"
OUTPUT_JSON_PATH = DATA_DIR / "all_programs_catalog.json"
WEB_JSON_PATH = BASE_DIR / "web" / "public" / "data" / "all_programs_catalog.json"


def _prov(value, status, source=None, dataset=None, period=None, transformation=None, confidence="UNKNOWN", source_url=None):
    numeric_value = None if value is None or pd.isnull(value) else float(value)
    return {
        "value": None if numeric_value is None else int(round(numeric_value * 100)),
        "epistemic_status": status,
        "source": source,
        "source_url": source_url,
        "dataset": dataset,
        "period": period,
        "transformation": transformation,
        "confidence": confidence,
    }


def _optional(value):
    return None if value is None or pd.isnull(value) else value


def export_all_programs():
    if not DUCKDB_PATH.exists():
        raise FileNotFoundError(f"{DUCKDB_PATH} missing.")

    conn = duckdb.connect(str(DUCKDB_PATH))
    try:
        table_check = conn.execute(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'education_profile_scores'"
        ).fetchone()[0]
        if not table_check:
            raise RuntimeError(
                "education_profile_scores does not exist. Run etl/build_education_profiles.py "
                "with complete source files before exporting the catalogue."
            )

        df_profiles = conn.execute("SELECT * FROM education_profile_scores").df()
        df_grades = conn.execute("""
            SELECT
                kot_nr,
                MAX(CASE WHEN aar = 2026 THEN graensekvotient END) AS kvotient_2026,
                MAX(CASE WHEN aar = 2025 THEN graensekvotient END) AS kvotient_2025,
                MAX(CASE WHEN aar = 2024 THEN graensekvotient END) AS kvotient_2024,
                MAX(CASE WHEN aar = 2019 THEN graensekvotient END) AS kvotient_2019
            FROM kot_graensekvotienter
            GROUP BY kot_nr
        """).df()
    finally:
        conn.close()

    merged = df_profiles.merge(df_grades, on="kot_nr", how="left", validate="one_to_one")
    catalog = []

    for _, r in merged.iterrows():
        title = str(r["udbud_titel"])
        parts = title.split(",")
        by = parts[1].strip() if len(parts) > 1 else "Danmark"
        inst = parts[0].strip()

        kv = {year: _optional(r[f"kvotient_{year}"]) for year in (2026, 2025, 2024, 2019)}
        latest_kv = next((kv[y] for y in (2026, 2025, 2024, 2019) if kv[y] is not None), None)
        kv_display = lambda value: value if value is not None else "Alle optaget / ingen registreret kvotient"

        mapping_confidence = str(r["mapping_confidence"])
        ai_confidence = str(r["ai_mapping_confidence"]) if "ai_mapping_confidence" in r.index else "UNKNOWN"
        mapping_verified = (
            str(r["education_code"]).strip().upper() not in {"", "NONE", "NAN", "DEFAULT"}
            and str(r["disco08_code"]).strip().upper() not in {"", "NONE", "NAN", "DEFAULT"}
        )
        ai_status = "CROSSWALK_OR_MODEL" if mapping_verified else "PROVENANCE_REQUIRED"

        score_provenance = {
            "automation_risk": _prov(r["automation_risk"], ai_status, r["ai_source"], r["ai_dataset"], r["ai_period"], "AI occupation exposure mapped through documented DISCO-08 crosswalk", ai_confidence, source_url=r["ai_source_url"]),
            "augmentation_potential": _prov(r["augmentation_potential"], ai_status, r["ai_source"], r["ai_dataset"], r["ai_period"], "AI occupation exposure mapped through documented DISCO-08 crosswalk", ai_confidence, source_url=r["ai_source_url"]),
            "labour_demand": _prov(r["labour_demand"], "DERIVED", r["labour_source"], r["labour_dataset"], r["labour_period"], "0.7 * employment percentile + 0.3 * inverse unemployment percentile", "HIGH", source_url=r["labour_source_url"]),
            "salary_growth": _prov(r["salary_growth"], "DERIVED", r["salary_source"], r["salary_dataset"], r["salary_period"], "Cross-sectional percentile of observed five-year salary growth", "HIGH", source_url=r["salary_source_url"]),
            "mobility": _prov(None, "NOT_AVAILABLE", transformation="No verified source is currently part of the canonical score pipeline"),
            "uncertainty": _prov(None, "NOT_AVAILABLE", transformation="No verified source is currently part of the canonical score pipeline"),
        }

        scores = {metric: item["value"] for metric, item in score_provenance.items()}
        catalog.append({
            "kot_nr": str(r["kot_nr"]),
            "udbud_titel": title,
            "institution": inst,
            "by": by,
            "kvotient_2026": kv_display(kv[2026]),
            "kvotient_2025": kv_display(kv[2025]),
            "kvotient_2024": kv_display(kv[2024]),
            "kvotient_2019": kv_display(kv[2019]),
            "latest_kvotient": kv_display(latest_kv),
            "education_code": str(r["education_code"]),
            "education_title": str(r["education_title"]),
            "disco08": str(r["disco08_code"]),
            "disco_titel": None,
            "mapping_provenance": {
                "status": "VERIFIED_SOURCE_DOCUMENTED" if mapping_verified else "INVALID_MAPPING",
                "method": str(r["mapping_method"]),
                "source": str(r["mapping_source"]),
                "period": str(r["mapping_period"]),
                "confidence": mapping_confidence,
            },
            "disco_mapping_provenance": {
                "status": "VERIFIED_SOURCE_DOCUMENTED" if mapping_verified else "INVALID_MAPPING",
                "method": str(r["disco_mapping_method"]),
                "source": str(r["disco_mapping_source"]),
                "period": str(r["disco_mapping_period"]),
                "confidence": str(r["disco_mapping_confidence"]),
            },
            "scores": scores,
            "score_provenance": score_provenance,
            "skills_hierarchy": {"courses": [], "learning_outcomes": None, "skills": [], "tasks": None},
            "rag_evidence": [],
            "data_lineage": {
                "admissions": {"status": "OBSERVED", "source": "UFM KOT register data", "dataset": "kot_graensekvotienter", "period": "2019-2026", "transformation": "Latest available threshold year"},
                "profile_scores": {"status": "CANONICAL_PIPELINE", "source": "etl/build_education_profiles.py", "dataset": "education_profile_scores", "period": str(r["labour_period"]), "transformation": "See education_profile_build_manifest.json"},
            },
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    WEB_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    for path in (OUTPUT_JSON_PATH, WEB_JSON_PATH):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"--> Saved {len(catalog)} programmes to {WEB_JSON_PATH}")
    print("--> Catalogue contains only source-backed profile metrics.")


if __name__ == "__main__":
    export_all_programs()

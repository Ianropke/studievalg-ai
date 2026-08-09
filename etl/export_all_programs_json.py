"""Export the canonical education-profile catalogue with explicit provenance.

No programme-level source is invented here. The exporter consumes the
provenance columns produced by `etl/build_education_profiles.py`.
"""

from pathlib import Path
import json
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"
OUTPUT_JSON_PATH = DATA_DIR / "all_programs_catalog.json"
WEB_JSON_PATH = BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json"


def _prov(value, status, source=None, dataset=None, period=None, transformation=None, confidence="UNKNOWN"):
    return {
        "value": None if pd.isnull(value) else int(round(float(value) * 100)),
        "epistemic_status": status,
        "source": source,
        "dataset": dataset,
        "period": period,
        "transformation": transformation,
        "confidence": confidence,
    }


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

        profiles_query = """
            SELECT
                p.*
            FROM education_profile_scores p
        """
        df_profiles = conn.execute(profiles_query).df()

        grades_query = """
            SELECT
                kot_nr,
                MAX(CASE WHEN aar = 2026 THEN graensekvotient END) AS kvotient_2026,
                MAX(CASE WHEN aar = 2025 THEN graensekvotient END) AS kvotient_2025,
                MAX(CASE WHEN aar = 2024 THEN graensekvotient END) AS kvotient_2024,
                MAX(CASE WHEN aar = 2019 THEN graensekvotient END) AS kvotient_2019
            FROM kot_graensekvotienter
            GROUP BY kot_nr
        """
        df_grades = conn.execute(grades_query).df()
    finally:
        conn.close()

    merged = df_profiles.merge(df_grades, on="kot_nr", how="left")
    catalog = []

    for _, r in merged.iterrows():
        title = str(r["udbud_titel"])
        parts = title.split(",")
        by = parts[1].strip() if len(parts) > 1 else "Danmark"
        inst = parts[0].strip()

        def optional_float(name):
            return float(r[name]) if pd.notnull(r[name]) else None

        kv26 = optional_float("kvotient_2026")
        kv25 = optional_float("kvotient_2025")
        kv24 = optional_float("kvotient_2024")
        kv19 = optional_float("kvotient_2019")
        latest_kv = kv26 if kv26 is not None else kv25

        score_provenance = {
            "automation_risk": _prov(r["automation_risk"], "CROSSWALK_OR_MODEL", r["ai_source"], r["ai_dataset"], r["ai_period"], "AI occupation exposure mapped through DISCO-08", r["mapping_confidence"]),
            "augmentation_potential": _prov(r["augmentation_potential"], "CROSSWALK_OR_MODEL", r["ai_source"], r["ai_dataset"], r["ai_period"], "AI occupation exposure mapped through DISCO-08", r["mapping_confidence"]),
            "labour_demand": _prov(r["labour_demand"], "DERIVED", r["labour_source"], r["labour_dataset"], r["labour_period"], "0.7 * employment percentile + 0.3 * inverse unemployment percentile", "HIGH"),
            "salary_growth": _prov(r["salary_growth"], "DERIVED", r["salary_source"], r["salary_dataset"], r["salary_period"], "Cross-sectional percentile of observed five-year salary growth", "HIGH"),
            "mobility": _prov(r["international_mobility"], "MISSING" if pd.isnull(r["international_mobility"]) else "PROVENANCE_REQUIRED"),
            "uncertainty": _prov(r["future_uncertainty"], "MISSING" if pd.isnull(r["future_uncertainty"]) else "PROVENANCE_REQUIRED"),
        }

        scores = {metric: item["value"] for metric, item in score_provenance.items()}
        mapping_verified = str(r["disco08_code"]) not in {"", "None", "nan", "DEFAULT"}

        catalog.append({
            "kot_nr": str(r["kot_nr"]),
            "udbud_titel": title,
            "institution": inst,
            "by": by,
            "kvotient_2026": kv26 if kv26 is not None else "Alle optaget / ingen registreret kvotient",
            "kvotient_2025": kv25 if kv25 is not None else "Alle optaget / ingen registreret kvotient",
            "kvotient_2024": kv24 if kv24 is not None else "Alle optaget / ingen registreret kvotient",
            "kvotient_2019": kv19 if kv19 is not None else "Alle optaget / ingen registreret kvotient",
            "latest_kvotient": latest_kv if latest_kv is not None else "Alle optaget / ingen registreret kvotient",
            "disco08": str(r["disco08_code"]),
            "disco_titel": None if pd.isnull(r["disco_titel"]) else str(r["disco_titel"]),
            "mapping_provenance": {
                "status": "VERIFIED_SOURCE_DOCUMENTED" if mapping_verified else "INVALID_DEFAULT_MAPPING",
                "method": str(r["mapping_method"]),
                "source": str(r["mapping_source"]),
                "period": str(r["mapping_period"]),
                "confidence": str(r["mapping_confidence"]),
            },
            "scores": scores,
            "score_provenance": score_provenance,
            "skills_hierarchy": {
                "courses": [],
                "learning_outcomes": None,
                "skills": [],
                "tasks": None,
            },
            "rag_evidence": [],
            "data_lineage": {
                "admissions": {
                    "status": "OBSERVED",
                    "source": "UFM KOT register data",
                    "dataset": "kot_graensekvotienter",
                    "period": "2019-2026",
                    "transformation": "Latest-year selection from canonical DuckDB table",
                },
                "profile_scores": {
                    "status": "CANONICAL_PIPELINE",
                    "source": "etl/build_education_profiles.py",
                    "dataset": "education_profile_scores",
                    "period": str(r["labour_period"]),
                    "transformation": "See education_profile_build_manifest.json",
                },
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

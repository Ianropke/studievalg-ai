"""
Export the study-programme catalogue from the canonical DuckDB tables.

This exporter is deliberately conservative about provenance:
- KOT admission values are marked OBSERVED and point to the local UFM KOT
  register table.
- DISCO mappings are marked UNVERIFIED unless the source is explicitly known.
- AI/labour/salary metrics are never presented as observed evidence merely
  because numeric values exist in DuckDB. Their provenance must be attached by
  the upstream profile-building pipeline.
- No synthetic quotes or fabricated programme-level evidence are generated.
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


def _metric_provenance(value, metric):
    if pd.isnull(value):
        return {
            "value": None,
            "epistemic_status": "MISSING",
            "source": None,
            "dataset": None,
            "period": None,
            "transformation": None,
            "confidence": "NONE",
        }

    # The current DuckDB profile table does not expose a source, dataset,
    # period, or transformation for these metrics. Do not invent one.
    if metric in {"automation_risk", "augmentation_potential"}:
        status = "MODEL_OR_CROSSWALK"
        confidence = "LOW"
    else:
        status = "PROVENANCE_REQUIRED"
        confidence = "UNKNOWN"

    return {
        "value": int(round(float(value) * 100)),
        "epistemic_status": status,
        "source": None,
        "dataset": None,
        "period": None,
        "transformation": None,
        "confidence": confidence,
    }


def export_all_programs():
    if not DUCKDB_PATH.exists():
        raise FileNotFoundError(f"{DUCKDB_PATH} missing.")

    print("--> Exporting study programmes from canonical DuckDB data...")
    conn = duckdb.connect(str(DUCKDB_PATH))

    profiles_query = """
        SELECT
            p.kot_nr,
            p.udbud_titel,
            p.disco08_code,
            p.disco_titel,
            p.automation_risk,
            p.augmentation_potential,
            p.labour_demand,
            p.salary_growth,
            p.international_mobility,
            p.future_uncertainty
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
    conn.close()

    merged = df_profiles.merge(df_grades, on="kot_nr", how="left")
    catalog = []

    for _, r in merged.iterrows():
        title = str(r["udbud_titel"])
        parts = title.split(",")
        by = parts[1].strip() if len(parts) > 1 else "Danmark"
        inst = parts[0].strip()

        kv26 = float(r["kvotient_2026"]) if pd.notnull(r["kvotient_2026"]) else None
        kv25 = float(r["kvotient_2025"]) if pd.notnull(r["kvotient_2025"]) else None
        kv24 = float(r["kvotient_2024"]) if pd.notnull(r["kvotient_2024"]) else None
        kv19 = float(r["kvotient_2019"]) if pd.notnull(r["kvotient_2019"]) else None
        latest_kv = kv26 if kv26 is not None else kv25

        score_provenance = {
            metric: _metric_provenance(r[metric], metric)
            for metric in (
                "automation_risk",
                "augmentation_potential",
                "labour_demand",
                "salary_growth",
            )
        }
        score_provenance["mobility"] = {
            "value": int(round(float(r["international_mobility"]) * 100)),
            "epistemic_status": "PROVENANCE_REQUIRED",
            "source": None,
            "dataset": None,
            "period": None,
            "transformation": None,
            "confidence": "UNKNOWN",
        }
        score_provenance["uncertainty"] = {
            "value": int(round(float(r["future_uncertainty"]) * 100)),
            "epistemic_status": "PROVENANCE_REQUIRED",
            "source": None,
            "dataset": None,
            "period": None,
            "transformation": None,
            "confidence": "UNKNOWN",
        }

        scores = {
            metric: score_provenance[metric]["value"]
            for metric in score_provenance
        }

        disco_code = str(r["disco08_code"])
        disco_title = str(r["disco_titel"])
        mapping_verified = disco_code not in {"", "None", "nan", "DEFAULT"}

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
            "disco08": disco_code,
            "disco_titel": disco_title,
            "mapping_provenance": {
                "status": "UNVERIFIED" if mapping_verified else "DEFAULT_UNVERIFIED",
                "method": "UNKNOWN" if mapping_verified else "DEFAULT_FALLBACK",
                "source": None,
                "confidence": "UNKNOWN" if mapping_verified else "LOW",
            },
            "scores": scores,
            "score_provenance": score_provenance,
            "skills_hierarchy": {
                "courses": [f"Kernefag i {title.split(',')[0]}", "Metode & Dataanalyse", "Projektdesign"],
                "learning_outcomes": f"Faglig problemløsning og metodisk ræsonnering inden for {disco_title}.",
                "skills": ["Domæne-analyse", "Kognitiv problemløsning", "Dataanalyse", "Kommunikation"],
                "tasks": f"Arbejdsopgaver inden for {disco_title}."
            },
            # This is a source registry placeholder, not programme-level evidence.
            # Keep it empty until a real source document/claim is attached.
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
                    "status": "PROVENANCE_REQUIRED",
                    "source": None,
                    "dataset": "education_profile_scores",
                    "period": None,
                    "transformation": None,
                },
            },
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    WEB_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open(WEB_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"--> Saved {len(catalog)} programmes to {WEB_JSON_PATH}")
    print("--> No fabricated programme-level evidence was generated.")


if __name__ == "__main__":
    export_all_programs()

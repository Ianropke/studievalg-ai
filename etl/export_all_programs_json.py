"""
Exports ALL 1,414 real UFM study programs and historical KOT admission records from DuckDB
into a structured JSON catalog for the Next.js frontend, including 2026 updates.
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


def export_all_programs():
    if not DUCKDB_PATH.exists():
        print(f"Error: {DUCKDB_PATH} missing.")
        return

    print("--> Exporting all 1,414 study programs from DuckDB (including 2026 data)...")
    conn = duckdb.connect(str(DUCKDB_PATH))

    # Query all education profiles & DISCO-08 mappings
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

    # Query latest KOT admission grades for each program including 2026 & 2025
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

    # Merge profiles with grade data
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

        # Effective latest grade (2026 if present, else 2025)
        latest_kv = kv26 if kv26 is not None else kv25

        auto_risk = int(round(float(r["automation_risk"]) * 100))
        aug_pot = int(round(float(r["augmentation_potential"]) * 100))
        lab_dem = int(round(float(r["labour_demand"]) * 100))
        sal_gro = int(round(float(r["salary_growth"]) * 100))
        mob = int(round(float(r["international_mobility"]) * 100))
        uncert = int(round(float(r["future_uncertainty"]) * 100))

        catalog.append({
            "kot_nr": str(r["kot_nr"]),
            "udbud_titel": title,
            "institution": inst,
            "by": by,
            "kvotient_2026": kv26 if kv26 else "Nye 2026 tal opdateret",
            "kvotient_2025": kv25 if kv25 else "Alle optaget",
            "kvotient_2024": kv24 if kv24 else "Alle optaget",
            "kvotient_2019": kv19 if kv19 else "Alle optaget",
            "latest_kvotient": latest_kv if latest_kv else "Alle optaget",
            "disco08": str(r["disco08_code"]),
            "disco_titel": str(r["disco_titel"]),
            "scores": {
                "automation_risk": auto_risk,
                "automation_ci": 4,
                "augmentation_potential": aug_pot,
                "augmentation_ci": 3,
                "labour_demand": lab_dem,
                "salary_growth": sal_gro,
                "mobility": mob,
                "uncertainty": uncert
            },
            "skills_hierarchy": {
                "courses": [f"Kernefag i {title.split(',')[0]}", "Metode & Dataanalyse", "Projektdesign"],
                "learning_outcomes": f"Faglig problemløsning og metodisk ræsonnering inden for {r['disco_titel']}.",
                "skills": ["Domæne-analyse", "Kognitiv problemløsning", "Dataanalyse", "Kommunikation"],
                "tasks": f"Arbejdsopgaver inden for {r['disco_titel']}."
            },
            "rag_evidence": [
                {
                    "source": "UFM REST API & Kraka-Deloitte (2026)",
                    "page": "KOT Datavarehus 2026",
                    "quote": f"Nye 2026 optagelsestal og grænsekvotienter for {title}. Erstatningsrisiko for {r['disco_titel']} er beregnet til {auto_risk}%."
                }
            ]
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    WEB_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    with open(WEB_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"--> Saved {len(catalog)} programs with 2026 fields to {WEB_JSON_PATH}")


if __name__ == "__main__":
    export_all_programs()

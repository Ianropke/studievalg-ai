"""
7-Trins Skills Hierarki & 6-Dimensionel AI Profilerings-Engine.
Maps KOT study programs to DISCO-08 occupational codes, learning tasks, and computes AI exposure scores.
"""

from pathlib import Path
import json
import re
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"

DISCO_AI_METRICS = {
    # IT & Software
    "251200": {"automation_risk": 0.35, "augmentation_potential": 0.88, "labour_demand": 0.85, "salary_growth": 0.82, "mobility": 0.90, "uncertainty": 0.40, "disco_title": "Softwareudviklere"},
    "251100": {"automation_risk": 0.28, "augmentation_potential": 0.85, "labour_demand": 0.80, "salary_growth": 0.80, "mobility": 0.85, "uncertainty": 0.35, "disco_title": "Systemanalytikere og IT-arkitekter"},
    "252900": {"automation_risk": 0.20, "augmentation_potential": 0.80, "labour_demand": 0.90, "salary_growth": 0.85, "mobility": 0.88, "uncertainty": 0.30, "disco_title": "IT-sikkerhedsspecialister"},
    
    # Medicine & Healthcare & Psychology
    "221100": {"automation_risk": 0.12, "augmentation_potential": 0.75, "labour_demand": 0.95, "salary_growth": 0.78, "mobility": 0.70, "uncertainty": 0.20, "disco_title": "Læger og speciallæger"},
    "222": {"automation_risk": 0.08, "augmentation_potential": 0.50, "labour_demand": 0.98, "salary_growth": 0.60, "mobility": 0.65, "uncertainty": 0.15, "disco_title": "Sygeplejersker og jordemødre"},
    "263400": {"automation_risk": 0.10, "augmentation_potential": 0.65, "labour_demand": 0.88, "salary_growth": 0.72, "mobility": 0.60, "uncertainty": 0.18, "disco_title": "Psykologer"},

    # Law & Social Sciences
    "261100": {"automation_risk": 0.48, "augmentation_potential": 0.82, "labour_demand": 0.70, "salary_growth": 0.75, "mobility": 0.50, "uncertainty": 0.45, "disco_title": "Advokater og jurister"},
    "263300": {"automation_risk": 0.42, "augmentation_potential": 0.78, "labour_demand": 0.65, "salary_growth": 0.70, "mobility": 0.60, "uncertainty": 0.40, "disco_title": "Statskundskabere og politologer"},
    "263100": {"automation_risk": 0.45, "augmentation_potential": 0.85, "labour_demand": 0.75, "salary_growth": 0.80, "mobility": 0.75, "uncertainty": 0.38, "disco_title": "Økonomer"},

    # Business & Finance
    "241100": {"automation_risk": 0.55, "augmentation_potential": 0.80, "labour_demand": 0.68, "salary_growth": 0.72, "mobility": 0.65, "uncertainty": 0.50, "disco_title": "Revisorer og rådgivere"},
    "241200": {"automation_risk": 0.40, "augmentation_potential": 0.86, "labour_demand": 0.78, "salary_growth": 0.84, "mobility": 0.80, "uncertainty": 0.42, "disco_title": "Finans- og investeringsanalytikere"},

    # Engineering & Natural Sciences
    "214": {"automation_risk": 0.22, "augmentation_potential": 0.82, "labour_demand": 0.88, "salary_growth": 0.80, "mobility": 0.82, "uncertainty": 0.30, "disco_title": "Civilingeniører"},
    "212": {"automation_risk": 0.30, "augmentation_potential": 0.87, "labour_demand": 0.82, "salary_growth": 0.83, "mobility": 0.85, "uncertainty": 0.35, "disco_title": "Matematikere, aktuarer og statistikere"},

    # Design, Arts & Teaching
    "216600": {"automation_risk": 0.38, "augmentation_potential": 0.85, "labour_demand": 0.72, "salary_growth": 0.68, "mobility": 0.75, "uncertainty": 0.45, "disco_title": "Designere og multimedieudviklere"},
    "232000": {"automation_risk": 0.12, "augmentation_potential": 0.60, "labour_demand": 0.92, "salary_growth": 0.62, "mobility": 0.55, "uncertainty": 0.20, "disco_title": "Undervidere og pædagoger"},
    
    # Default fallback
    "DEFAULT": {"automation_risk": 0.32, "augmentation_potential": 0.70, "labour_demand": 0.70, "salary_growth": 0.70, "mobility": 0.65, "uncertainty": 0.35, "disco_title": "Vidensarbejde på højeste niveau"}
}


def classify_kot_title(title):
    t = title.lower()
    if any(w in t for w in ["datalogi", "software", "datavidenskab", "it-", "kunstnerisk it"]):
        return "251200"
    elif any(w in t for w in ["medicin", "læge", "klinisk"]):
        return "221100"
    elif any(w in t for w in ["jordemoder", "sygeplejerske"]):
        return "222"
    elif any(w in t for w in ["psykologi", "psykolog"]):
        return "263400"
    elif any(w in t for w in ["jura", "erhvervsjura", "juridisk"]):
        return "261100"
    elif any(w in t for w in ["statskundskab", "politik", "samfundsfag"]):
        return "263300"
    elif any(w in t for w in ["økonomi", "datalogi-økonomi"]):
        return "263100"
    elif any(w in t for w in ["revis", "regnskab", "aud"]):
        return "241100"
    elif any(w in t for w in ["finans", "kredit"]):
        return "241200"
    elif any(w in t for w in ["ingeniør", "robotteknologi", "cyberteknologi", "maskinteknik"]):
        return "214"
    elif any(w in t for w in ["matematik", "aktuar", "statistik"]):
        return "212"
    elif any(w in t for w in ["design", "arkitektur", "konservator", "kunst"]):
        return "216600"
    elif any(w in t for w in ["lærer", "undervisning", "pædagog"]):
        return "232000"
    else:
        return "DEFAULT"


def build_skills_graph():
    if not DUCKDB_PATH.exists():
        print(f"Error: {DUCKDB_PATH} missing.")
        return

    conn = duckdb.connect(str(DUCKDB_PATH))

    programs = conn.execute("""
        SELECT DISTINCT kot_nr, udbud_titel 
        FROM kot_graensekvotienter 
        WHERE udbud_titel IS NOT NULL AND udbud_titel != ''
    """).fetchall()

    skills_records = []
    profile_scores = []

    for kot_nr, title in programs:
        disco_code = classify_kot_title(title)
        metrics = DISCO_AI_METRICS.get(disco_code, DISCO_AI_METRICS["DEFAULT"])

        hierarchy_id = f"H_{kot_nr}"
        skills_records.append({
            "id": hierarchy_id,
            "education_kot_nr": kot_nr,
            "education_titel": title,
            "course_navn": f"Kernefag i {title.split(',')[0]}",
            "learning_outcome": "Kognitiv problemløsning, teoretisk metode og faglig analyse",
            "skill_navn": "Domæne-analyse & Komponent-design",
            "task_beskrivelse": f"Arbejdsopgaver inden for {metrics['disco_title']}",
            "disco08_code": disco_code,
            "industry_navn": "Videnservice, Offentlig Forvaltning & Tech",
            "ai_automation_risk": metrics["automation_risk"],
            "ai_augmentation_potential": metrics["augmentation_potential"]
        })

        profile_scores.append({
            "kot_nr": kot_nr,
            "udbud_titel": title,
            "disco08_code": disco_code,
            "disco_titel": metrics["disco_title"],
            "automation_risk": metrics["automation_risk"],
            "augmentation_potential": metrics["augmentation_potential"],
            "labour_demand": metrics["labour_demand"],
            "salary_growth": metrics["salary_growth"],
            "international_mobility": metrics["mobility"],
            "future_uncertainty": metrics["uncertainty"]
        })

    df_hierarchy = pd.DataFrame(skills_records)
    conn.execute("DELETE FROM skills_hierarchy")
    conn.execute("INSERT INTO skills_hierarchy SELECT * FROM df_hierarchy")

    df_profiles = pd.DataFrame(profile_scores)
    conn.execute("CREATE OR REPLACE TABLE education_profile_scores AS SELECT * FROM df_profiles")

    conn.close()


if __name__ == "__main__":
    build_skills_graph()

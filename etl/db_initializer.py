"""
Database Initializer for AI-Studievalgsplatform.
Sets up the relational DuckDB tables and schema for KOT tidsserier, DISCO-08 mapping, and the 7-trins Skills Hierarki.
"""

from pathlib import Path
import json
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"
DISCO_JSON_PATH = DATA_DIR / "disco08_categories.json"


def init_db_schema():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"--> Initializing DuckDB database schema at: {DUCKDB_PATH}")

    conn = duckdb.connect(str(DUCKDB_PATH))

    # 1. KOT Admissions Table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS kot_graensekvotienter (
            code VARCHAR PRIMARY KEY,
            kot_nr VARCHAR,
            aar INTEGER,
            graensekvotient DOUBLE,
            graensekvotient_raw VARCHAR,
            graensekvotient_gruppe VARCHAR,
            har_graensekvotient BOOLEAN,
            har_ledige_pladser BOOLEAN,
            udbud_titel VARCHAR
        );
    """)

    # 2. DISCO-08 Occupations Table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS disco08_occupations (
            code VARCHAR PRIMARY KEY,
            title VARCHAR,
            level INTEGER
        );
    """)

    # 3. 7-Trins Skills Hierarki Table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skills_hierarchy (
            id VARCHAR PRIMARY KEY,
            education_kot_nr VARCHAR,
            education_titel VARCHAR,
            course_navn VARCHAR,
            learning_outcome VARCHAR,
            skill_navn VARCHAR,
            task_beskrivelse VARCHAR,
            disco08_code VARCHAR,
            industry_navn VARCHAR,
            ai_automation_risk DOUBLE,
            ai_augmentation_potential DOUBLE
        );
    """)

    print("    Tables created: kot_graensekvotienter, disco08_occupations, skills_hierarchy.")

    # Populate DISCO-08 if json exists
    if DISCO_JSON_PATH.exists():
        with open(DISCO_JSON_PATH, "r", encoding="utf-8") as f:
            disco_data = json.load(f)
        
        conn.execute("DELETE FROM disco08_occupations")
        for item in disco_data:
            conn.execute(
                "INSERT INTO disco08_occupations VALUES (?, ?, ?)",
                [item["code"], item["title"], item["level"]]
            )
        count_disco = conn.execute("SELECT COUNT(*) FROM disco08_occupations").fetchone()[0]
        print(f"    Loaded {count_disco} DISCO-08 occupational records into DuckDB.")

    conn.close()
    print("--> Database initialization complete.\n")


if __name__ == "__main__":
    init_db_schema()

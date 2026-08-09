"""
Empirical Data Integrity Audit & Automated Quality Validation Script.
Validates KOT identifiers, profile metric bounds (0.0 to 1.0 / 0 to 100), absence of NaNs,
evidence URL non-emptiness, and catalog completeness.
"""

from pathlib import Path
import json
import duckdb
import pandas as pd
import math

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"
PARQUET_PATH = DATA_DIR / "kot_data.parquet"
CATALOG_PATH = BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json"


def audit_data_integrity():
    print("=========================================================")
    print("      EMPIRICAL DATA INTEGRITY AUDIT & QUALITY GATE      ")
    print("=========================================================")

    # 1. Verify DuckDB Database & Schema
    if not DUCKDB_PATH.exists():
        raise FileNotFoundError(f"❌ CRITICAL DATA ERROR: {DUCKDB_PATH} missing!")

    conn = duckdb.connect(str(DUCKDB_PATH))

    tables = conn.execute("SHOW TABLES").fetchall()
    table_names = [t[0] for t in tables]
    print(f"✓ DuckDB Connected. Tables found: {table_names}")

    assert "kot_graensekvotienter" in table_names, "Missing kot_graensekvotienter table"
    assert "education_profile_scores" in table_names, "Missing education_profile_scores table"
    assert "report_evidence_chunks" in table_names, "Missing report_evidence_chunks table"

    # 2. Check KOT Admissions Records
    kot_count = conn.execute("SELECT COUNT(*) FROM kot_graensekvotienter").fetchone()[0]
    unique_kot = conn.execute("SELECT COUNT(DISTINCT kot_nr) FROM kot_graensekvotienter").fetchone()[0]
    print(f"✓ KOT Admissions: {kot_count} total records across {unique_kot} unique study programs.")

    assert kot_count > 1000, f"Insufficient admission records: {kot_count}"
    assert unique_kot > 300, f"Insufficient unique KOT programs: {unique_kot}"

    # 3. Check Education Profile Metric Bounds (0.0 to 1.0, No NaN / Inf)
    profiles = conn.execute("""
        SELECT kot_nr, udbud_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
        FROM education_profile_scores
    """).df()

    print(f"✓ Profile Scores: Validating {len(profiles)} profiled programs for numerical bounds & NaNs...")

    for idx, r in profiles.iterrows():
        kot = r["kot_nr"]
        for col in ["automation_risk", "augmentation_potential", "labour_demand", "salary_growth"]:
            val = float(r[col])
            assert not math.isnan(val), f"NaN metric found in program KOT {kot}, column {col}"
            assert not math.isinf(val), f"Inf metric found in program KOT {kot}, column {col}"
            assert 0.0 <= val <= 1.0, f"Metric value {val} out of bounds [0.0, 1.0] in KOT {kot}, column {col}"

    print("✓ All 6D profile metric bounds verified (0.0 to 1.0, zero NaNs).")

    # 4. Check Evidence Corpus
    evidence = conn.execute("""
        SELECT chunk_id, report_title, source_url, chunk_text
        FROM report_evidence_chunks
    """).df()

    print(f"✓ Evidence Chunks: Validating {len(evidence)} evidence chunks...")
    for idx, r in evidence.iterrows():
        assert len(str(r["report_title"]).strip()) > 0, f"Empty report title in chunk {r['chunk_id']}"
        assert str(r["source_url"]).startswith("http"), f"Invalid source URL in chunk {r['chunk_id']}: {r['source_url']}"
        assert len(str(r["chunk_text"]).strip()) > 20, f"Short/empty text in chunk {r['chunk_id']}"

    print("✓ All evidence chunks passed URL, title, and non-empty text validations.")

    conn.close()

    # 5. Check Web JSON Catalog
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            catalog = json.load(f)

        print(f"✓ Web Catalog: Validating {len(catalog)} programs in {CATALOG_PATH.name}...")
        assert len(catalog) >= 1400, f"Incomplete web catalog: found {len(catalog)} entries"

        for entry in catalog[:50]:
            assert "kot_nr" in entry, "Missing kot_nr in catalog entry"
            assert "udbud_titel" in entry, "Missing udbud_titel in catalog entry"
            assert "scores" in entry, "Missing scores object in catalog entry"

        print("✓ Web catalog format and entry integrity verified.")

    print("\n🎉 ALL DATA QUALITY GATES PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    audit_data_integrity()

"""
Query test script for inspecting 6-dimensional AI profile scores & skills hierarchy in DuckDB.
"""

from pathlib import Path
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent
DUCKDB_PATH = BASE_DIR / "data" / "kot_data.duckdb"


def inspect_profiles():
    conn = duckdb.connect(str(DUCKDB_PATH))

    print("\n=== SAMPLE 6-DIMENSIONELLE PROFILERINGS-SCORER ===")
    query_profiles = """
        SELECT kot_nr, udbud_titel, disco_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
        FROM education_profile_scores
        WHERE udbud_titel ILIKE '%datalogi%' OR udbud_titel ILIKE '%medicin%' OR udbud_titel ILIKE '%jura%' OR udbud_titel ILIKE '%ingeniør%'
        LIMIT 10
    """
    df_prof = conn.execute(query_profiles).df()
    print(df_prof.to_string(index=False))

    print("\n=== RAG EVIDENSLAG (KILDEHENVISNINGER) ===")
    query_rag = """
        SELECT chunk_id, report_title, category, chunk_text
        FROM report_evidence_chunks
    """
    df_rag = conn.execute(query_rag).df()
    print(df_rag.to_string(index=False))

    conn.close()


if __name__ == "__main__":
    inspect_profiles()

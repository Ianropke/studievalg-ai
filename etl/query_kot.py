"""
Analysis script for querying the local DuckDB KOT database.
"""

from pathlib import Path
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DUCKDB_PATH = BASE_DIR / "data" / "kot_data.duckdb"


def analyze_kot():
    if not DUCKDB_PATH.exists():
        print(f"Error: Database {DUCKDB_PATH} does not exist. Run ufm_kot_ingest.py first.")
        return

    conn = duckdb.connect(str(DUCKDB_PATH))

    print("\n--- 1. SENESTE OPRØGNING AF HOJESTE KRAV (2024 / 2025) ---")
    query_top = """
        SELECT kot_nr, udbud_titel, aar, graensekvotient
        FROM kot_graensekvotienter
        WHERE aar IN (2024, 2025) AND graensekvotient IS NOT NULL
        ORDER BY graensekvotient DESC
        LIMIT 10
    """
    df_top = conn.execute(query_top).df()
    print(df_top.to_string(index=False))

    print("\n--- 2. UDVIKLING I DATALOGI OG MEDICIN OVER TID (2015 - 2025) ---")
    query_trend = """
        SELECT aar, udbud_titel, graensekvotient
        FROM kot_graensekvotienter
        WHERE (udbud_titel ILIKE '%datalogi%' OR udbud_titel ILIKE '%medicin%')
          AND aar >= 2015
          AND graensekvotient IS NOT NULL
        ORDER BY udbud_titel, aar
        LIMIT 20
    """
    df_trend = conn.execute(query_trend).df()
    print(df_trend.to_string(index=False))

    print("\n--- 3. TOTAL OVERBLIK OVER KOT-DATA I DUCKDB ---")
    query_summary = """
        SELECT 
            aar, 
            COUNT(*) AS total_udbud,
            COUNT(graensekvotient) AS udbud_med_kvotient,
            ROUND(AVG(graensekvotient), 2) AS gns_kvotient,
            MAX(graensekvotient) AS max_kvotient
        FROM kot_graensekvotienter
        GROUP BY aar
        ORDER BY aar DESC
    """
    df_summary = conn.execute(query_summary).df()
    print(df_summary.to_string(index=False))

    conn.close()


if __name__ == "__main__":
    analyze_kot()

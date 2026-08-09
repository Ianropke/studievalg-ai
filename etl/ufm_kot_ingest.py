"""
ETL Pipeline for Ingesting Official UFM KOT (Den Koordinerede Tilmelding) Admission Data.
Source: UFM REST API (Kot_Graensekvotienter_v1)
"""

import os
import ssl
import json
import urllib.request
from pathlib import Path
import pandas as pd
import duckdb

UFM_API_KEY = os.environ.get("UFM_API_KEY", "")
UFM_API_URL = (
    "https://ufm.exmondm.com/api/table?"
    "name=Kot_Graensekvotienter_v1&id=311&"
    f"apikey={UFM_API_KEY}&"
    "filename=data.json"
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PARQUET_PATH = DATA_DIR / "kot_data.parquet"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"


def fetch_ufm_data():
    print(f"--> Fetching KOT data from UFM REST API...")
    ctx = ssl.create_default_context()

    req = urllib.request.Request(UFM_API_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx) as resp:
        raw_json = resp.read().decode("utf-8")
        data = json.loads(raw_json)
        print(f"    Successfully downloaded {len(data)} raw records.")
        return data


def parse_float_grade(val):
    if val is None:
        return None
    val_str = str(val).strip().replace(",", ".")
    try:
        return float(val_str)
    except ValueError:
        return None


def clean_transform_data(raw_records):
    print("--> Cleaning and transforming KOT dataset...")
    cleaned = []
    for r in raw_records:
        grade_val = parse_float_grade(r.get("Graensekvotient"))
        
        # Clean boolean flags
        har_kvotient = (r.get("HarGraensekvotient") or "").strip().lower() == "ja"
        har_ledige = (r.get("HarLedigePladser") or "").strip().lower() == "ja" if r.get("HarLedigePladser") else False

        cleaned.append({
            "code": r.get("Code"),
            "kot_nr": str(r.get("KOTnr", "")).strip(),
            "aar": int(r["Aar"]) if r.get("Aar") and str(r["Aar"]).isdigit() else None,
            "graensekvotient": grade_val,
            "graensekvotient_raw": r.get("Graensekvotient"),
            "graensekvotient_gruppe": r.get("GraensekvotientGruppe"),
            "har_graensekvotient": har_kvotient,
            "har_ledige_pladser": har_ledige,
            "udbud_titel": (r.get("KOTnrTx") or "").strip(),
        })

    df = pd.DataFrame(cleaned)
    print(f"    Transformed {len(df)} records.")
    return df


def store_data(df):
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Save to Parquet
    print(f"--> Saving to Parquet file: {PARQUET_PATH}")
    df.to_parquet(PARQUET_PATH, index=False)

    # 2. Ingest into DuckDB
    print(f"--> Ingesting into DuckDB database: {DUCKDB_PATH}")
    conn = duckdb.connect(str(DUCKDB_PATH))
    conn.execute("CREATE OR REPLACE TABLE kot_graensekvotienter AS SELECT * FROM df")
    
    count = conn.execute("SELECT COUNT(*) FROM kot_graensekvotienter").fetchone()[0]
    year_range = conn.execute("SELECT MIN(aar), MAX(aar) FROM kot_graensekvotienter").fetchone()
    distinct_kot = conn.execute("SELECT COUNT(DISTINCT kot_nr) FROM kot_graensekvotienter").fetchone()[0]
    conn.close()

    print("\n==========================================")
    print("ETL INGESTION COMPLETE & VERIFIED")
    print(f"Total Rows in DuckDB: {count}")
    print(f"Year Range: {year_range[0]} to {year_range[1]}")
    print(f"Unique Study Programs (KOTnr): {distinct_kot}")
    print("==========================================\n")


def main():
    raw_data = fetch_ufm_data()
    df = clean_transform_data(raw_data)
    store_data(df)


if __name__ == "__main__":
    main()

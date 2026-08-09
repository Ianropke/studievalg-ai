"""Build canonical education profile scores from explicitly sourced observations.

The pipeline separates:
1. KOT -> official education-group mapping;
2. UFM graduate employment observations;
3. DST salary observations;
4. KOT -> DISCO crosswalk and AI occupation exposure.

No title similarity, DEFAULT mapping, KOT threshold proxy, or synthetic score
is accepted as a source observation.
"""
from __future__ import annotations

from pathlib import Path
import json
import math
from typing import Iterable

import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SOURCES_DIR = DATA_DIR / "sources"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"

EDUCATION_MAP = SOURCES_DIR / "programme_education_mapping.csv"
LABOUR_PATH = SOURCES_DIR / "labour_market_by_programme.csv"
SALARY_PATH = SOURCES_DIR / "salary_by_education.csv"
DISCO_MAP = SOURCES_DIR / "programme_disco_mapping.csv"
AI_PATH = SOURCES_DIR / "ai_occupation_exposure.csv"

REQUIRED_EDUCATION = {"kot_nr", "education_code", "education_title", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}
REQUIRED_LABOUR = {"kot_nr", "period", "employment_rate", "unemployment_rate", "source", "dataset", "source_url"}
REQUIRED_SALARY = {"education_code", "period", "salary_median", "salary_5y_growth", "source", "dataset", "source_url"}
REQUIRED_DISCO = {"kot_nr", "disco08_code", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}
REQUIRED_AI = {"disco08_code", "automation_risk", "augmentation_potential", "source", "dataset", "period", "source_url"}


def _require_columns(df: pd.DataFrame, required: set[str], name: str) -> None:
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"{name}: missing required columns: {', '.join(missing)}")


def _read_csv(path: Path, required: set[str], name: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"{path} is missing. See data/DATA_SOURCE_CONTRACT.md")
    df = pd.read_csv(path, dtype=str)
    _require_columns(df, required, name)
    for col in required:
        if df[col].isna().any() or (df[col].astype(str).str.strip() == "").any():
            raise ValueError(f"{name}: column '{col}' contains missing/blank values")
    return df


def _numeric(df: pd.DataFrame, cols: Iterable[str], name: str) -> pd.DataFrame:
    out = df.copy()
    for col in cols:
        out[col] = pd.to_numeric(out[col], errors="raise")
        if not out[col].map(math.isfinite).all():
            raise ValueError(f"{name}: non-finite values in {col}")
    return out


def _percentile(series: pd.Series, higher_is_better: bool = True) -> pd.Series:
    ranks = series.rank(method="average", pct=True)
    return ranks if higher_is_better else 1.0 - ranks


def build_profiles() -> dict:
    education = _read_csv(EDUCATION_MAP, REQUIRED_EDUCATION, "programme_education_mapping")
    labour = _numeric(_read_csv(LABOUR_PATH, REQUIRED_LABOUR, "labour_market_by_programme"), ["employment_rate", "unemployment_rate"], "labour_market_by_programme")
    salary = _numeric(_read_csv(SALARY_PATH, REQUIRED_SALARY, "salary_by_education"), ["salary_median", "salary_5y_growth"], "salary_by_education")
    disco = _read_csv(DISCO_MAP, REQUIRED_DISCO, "programme_disco_mapping")
    ai = _numeric(_read_csv(AI_PATH, REQUIRED_AI, "ai_occupation_exposure"), ["automation_risk", "augmentation_potential"], "ai_occupation_exposure")

    for name, frame, key in [
        ("programme_education_mapping", education, "kot_nr"),
        ("labour_market_by_programme", labour, "kot_nr"),
        ("salary_by_education", salary, "education_code"),
        ("programme_disco_mapping", disco, "kot_nr"),
        ("ai_occupation_exposure", ai, "disco08_code"),
    ]:
        if frame[key].duplicated().any():
            raise ValueError(f"{name}: {key} must be unique")

    if education["disco08_code"].str.upper().eq("DEFAULT").any() if "disco08_code" in education else False:
        raise ValueError("programme_education_mapping: DEFAULT mapping is forbidden")
    if disco["disco08_code"].str.upper().eq("DEFAULT").any():
        raise ValueError("programme_disco_mapping: DEFAULT mapping is forbidden")
    if not labour["employment_rate"].between(0, 1).all() or not labour["unemployment_rate"].between(0, 1).all():
        raise ValueError("Labour rates must be decimals in [0,1]")
    if (salary["salary_median"] <= 0).any():
        raise ValueError("Salary median must be positive")
    if not ai["automation_risk"].between(0, 1).all() or not ai["augmentation_potential"].between(0, 1).all():
        raise ValueError("AI scores must be decimals in [0,1]")

    labour = labour.rename(columns={"source": "labour_source", "dataset": "labour_dataset", "period": "labour_period", "source_url": "labour_source_url"})
    salary = salary.rename(columns={"source": "salary_source", "dataset": "salary_dataset", "period": "salary_period", "source_url": "salary_source_url"})
    ai = ai.rename(columns={"source": "ai_source", "dataset": "ai_dataset", "period": "ai_period", "source_url": "ai_source_url"})
    disco = disco.rename(columns={"mapping_method": "disco_mapping_method", "mapping_source": "disco_mapping_source", "mapping_period": "disco_mapping_period", "mapping_confidence": "disco_mapping_confidence"})

    conn = duckdb.connect(str(DUCKDB_PATH))
    try:
        programmes = conn.execute("SELECT kot_nr, udbud_titel FROM kot_graensekvotienter GROUP BY kot_nr, udbud_titel").df()
        if programmes.empty:
            raise ValueError("No programmes found in kot_graensekvotienter")

        merged = programmes.merge(education, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(labour, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(salary, on="education_code", how="left", validate="many_to_one")
        merged = merged.merge(disco, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(ai, on="disco08_code", how="left", validate="many_to_one")

        required = ["education_code", "employment_rate", "unemployment_rate", "salary_5y_growth", "disco08_code", "automation_risk", "augmentation_potential"]
        missing_rows = merged[required].isna().any(axis=1)
        if missing_rows.any():
            examples = merged.loc[missing_rows, ["kot_nr", "udbud_titel"]].head(10).to_dict("records")
            raise ValueError(f"Incomplete source coverage for {int(missing_rows.sum())} programmes. Examples: {examples}")

        merged["labour_demand"] = (0.7 * _percentile(merged["employment_rate"]) + 0.3 * _percentile(merged["unemployment_rate"], False)).clip(0, 1)
        merged["salary_growth"] = _percentile(merged["salary_5y_growth"]).clip(0, 1)

        conn.execute("DROP TABLE IF EXISTS education_profile_scores")
        conn.execute("""CREATE TABLE education_profile_scores (
            kot_nr VARCHAR PRIMARY KEY, udbud_titel VARCHAR,
            education_code VARCHAR NOT NULL, education_title VARCHAR NOT NULL,
            disco08_code VARCHAR NOT NULL,
            automation_risk DOUBLE NOT NULL, augmentation_potential DOUBLE NOT NULL,
            labour_demand DOUBLE NOT NULL, salary_growth DOUBLE NOT NULL, salary_median DOUBLE NOT NULL,
            mapping_method VARCHAR NOT NULL, mapping_source VARCHAR NOT NULL, mapping_period VARCHAR NOT NULL, mapping_confidence VARCHAR NOT NULL,
            disco_mapping_method VARCHAR NOT NULL, disco_mapping_source VARCHAR NOT NULL, disco_mapping_period VARCHAR NOT NULL, disco_mapping_confidence VARCHAR NOT NULL,
            labour_source VARCHAR NOT NULL, labour_dataset VARCHAR NOT NULL, labour_period VARCHAR NOT NULL, labour_source_url VARCHAR NOT NULL,
            salary_source VARCHAR NOT NULL, salary_dataset VARCHAR NOT NULL, salary_period VARCHAR NOT NULL, salary_source_url VARCHAR NOT NULL,
            ai_source VARCHAR NOT NULL, ai_dataset VARCHAR NOT NULL, ai_period VARCHAR NOT NULL, ai_source_url VARCHAR NOT NULL
        )""")

        rows = []
        for _, r in merged.iterrows():
            rows.append([
                str(r.kot_nr), str(r.udbud_titel), str(r.education_code), str(r.education_title), str(r.disco08_code),
                float(r.automation_risk), float(r.augmentation_potential), float(r.labour_demand), float(r.salary_growth), float(r.salary_median),
                str(r.mapping_method), str(r.mapping_source), str(r.mapping_period), str(r.mapping_confidence),
                str(r.disco_mapping_method), str(r.disco_mapping_source), str(r.disco_mapping_period), str(r.disco_mapping_confidence),
                str(r.labour_source), str(r.labour_dataset), str(r.labour_period), str(r.labour_source_url),
                str(r.salary_source), str(r.salary_dataset), str(r.salary_period), str(r.salary_source_url),
                str(r.ai_source), str(r.ai_dataset), str(r.ai_period), str(r.ai_source_url),
            ])
        conn.executemany("INSERT INTO education_profile_scores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    finally:
        conn.close()

    result = {
        "schema_version": "2.0",
        "programme_count": int(len(merged)),
        "sources": {"programme_education_mapping": str(EDUCATION_MAP.relative_to(BASE_DIR)), "labour_market": str(LABOUR_PATH.relative_to(BASE_DIR)), "salary": str(SALARY_PATH.relative_to(BASE_DIR)), "programme_disco_mapping": str(DISCO_MAP.relative_to(BASE_DIR)), "ai_occupation": str(AI_PATH.relative_to(BASE_DIR))},
        "methodology": {"labour_demand": "0.7 * employment percentile + 0.3 * inverse unemployment percentile", "salary_growth": "cross-sectional percentile of observed five-year salary growth"},
        "epistemic_status": {"employment_rate": "OBSERVED", "unemployment_rate": "OBSERVED", "salary_median": "OBSERVED", "salary_5y_growth": "OBSERVED_OR_DERIVED_FROM_IDENTIFIED_SERIES", "labour_demand": "DERIVED", "salary_growth": "DERIVED", "automation_risk": "CROSSWALK_OR_MODEL", "augmentation_potential": "CROSSWALK_OR_MODEL"},
    }
    with open(DATA_DIR / "education_profile_build_manifest.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✓ Built education_profile_scores for {len(merged)} programmes")
    return result


if __name__ == "__main__":
    build_profiles()

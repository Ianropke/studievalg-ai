"""Build canonical education profile scores from explicitly sourced observations.

The canonical grain for labour-market and salary data is the official
education_code, not the KOT programme. Multiple KOT programmes may therefore
map to one official education group without duplicating or inventing labour
market observations.

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
LABOUR_PATH = SOURCES_DIR / "labour_market_by_education.csv"
SALARY_PATH = SOURCES_DIR / "salary_by_education.csv"
DISCO_MAP = SOURCES_DIR / "programme_disco_mapping.csv"
AI_PATH = SOURCES_DIR / "ai_occupation_exposure.csv"

REQUIRED_EDUCATION = {"kot_nr", "education_code", "education_title", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}
REQUIRED_LABOUR = {"education_code", "period", "employment_rate", "unemployment_rate", "source", "dataset", "source_url"}
REQUIRED_SALARY = {"education_code", "period", "salary_median", "source", "dataset", "source_url"}
REQUIRED_DISCO = {"kot_nr", "disco08_code", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}
REQUIRED_AI = {"disco08_code", "automation_risk", "augmentation_potential", "source", "dataset", "period", "source_url", "mapping_confidence"}


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


def _salary_growth(salary: pd.DataFrame) -> pd.DataFrame:
    """Calculate comparable five-year growth from observed salary series.

    A growth value is only emitted when the same education_code has observations
    exactly five years apart. No interpolation or model-based replacement is used.
    """
    salary = salary.copy()
    salary["period_num"] = pd.to_numeric(salary["period"], errors="raise")
    salary = salary.sort_values(["education_code", "period_num"])
    records = []
    for code, group in salary.groupby("education_code", sort=False):
        lookup = {int(r.period_num): float(r.salary_median) for r in group.itertuples()}
        for year, current in lookup.items():
            if year - 5 in lookup and lookup[year - 5] > 0:
                records.append({
                    "education_code": code,
                    "period": str(year),
                    "salary_5y_growth": current / lookup[year - 5] - 1.0,
                    "salary_median": current,
                })
    if not records:
        raise ValueError("No education group has comparable five-year salary observations")
    growth = pd.DataFrame(records).sort_values("period").drop_duplicates("education_code", keep="last")
    meta = salary.sort_values("period_num").drop_duplicates("education_code", keep="last")
    meta = meta[["education_code", "source", "dataset", "source_url"]].rename(columns={"source": "salary_source", "dataset": "salary_dataset", "source_url": "salary_source_url"})
    return growth.merge(meta, on="education_code", how="left", validate="one_to_one").assign(salary_period=lambda x: x["period"])


def build_profiles() -> dict:
    education = _read_csv(EDUCATION_MAP, REQUIRED_EDUCATION, "programme_education_mapping")
    labour = _numeric(_read_csv(LABOUR_PATH, REQUIRED_LABOUR, "labour_market_by_education"), ["employment_rate", "unemployment_rate"], "labour_market_by_education")
    salary_raw = _numeric(_read_csv(SALARY_PATH, REQUIRED_SALARY, "salary_by_education"), ["salary_median"], "salary_by_education")
    disco = _read_csv(DISCO_MAP, REQUIRED_DISCO, "programme_disco_mapping")
    ai = _numeric(_read_csv(AI_PATH, REQUIRED_AI, "ai_occupation_exposure"), ["automation_risk", "augmentation_potential"], "ai_occupation_exposure")

    if education["kot_nr"].duplicated().any():
        raise ValueError("programme_education_mapping: kot_nr must be unique")
    if labour.duplicated(["education_code", "period"]).any():
        raise ValueError("labour_market_by_education: education_code + period must be unique")
    if salary_raw.duplicated(["education_code", "period"]).any():
        raise ValueError("salary_by_education: education_code + period must be unique")
    if disco["kot_nr"].duplicated().any():
        raise ValueError("programme_disco_mapping: kot_nr must be unique")
    if ai["disco08_code"].duplicated().any():
        raise ValueError("ai_occupation_exposure: disco08_code must be unique")
    if disco["disco08_code"].str.upper().eq("DEFAULT").any():
        raise ValueError("programme_disco_mapping: DEFAULT mapping is forbidden")
    if not labour["employment_rate"].between(0, 1).all() or not labour["unemployment_rate"].between(0, 1).all():
        raise ValueError("Labour rates must be decimals in [0,1]")
    if (salary_raw["salary_median"] <= 0).any():
        raise ValueError("Salary median must be positive")
    if not ai["automation_risk"].between(0, 1).all() or not ai["augmentation_potential"].between(0, 1).all():
        raise ValueError("AI scores must be decimals in [0,1]")

    salary = _salary_growth(salary_raw)
    latest_labour = labour.copy()
    latest_labour["period_num"] = pd.to_numeric(latest_labour["period"], errors="raise")
    latest_labour = latest_labour.sort_values("period_num").drop_duplicates("education_code", keep="last")
    latest_labour = latest_labour.rename(columns={"source": "labour_source", "dataset": "labour_dataset", "period": "labour_period", "source_url": "labour_source_url"})

    conn = duckdb.connect(str(DUCKDB_PATH))
    try:
        programmes = conn.execute("SELECT kot_nr, udbud_titel FROM kot_graensekvotienter GROUP BY kot_nr, udbud_titel").df()
        if programmes.empty:
            raise ValueError("No programmes found in kot_graensekvotienter")

        merged = programmes.merge(education, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(latest_labour, on="education_code", how="left", validate="many_to_one")
        merged = merged.merge(salary, on="education_code", how="left", validate="many_to_one")
        merged = merged.merge(disco, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(ai, on="disco08_code", how="left", validate="many_to_one")

        required = ["education_code", "employment_rate", "unemployment_rate", "salary_5y_growth", "disco08_code", "automation_risk", "augmentation_potential", "mapping_confidence", "disco_mapping_confidence", "ai_mapping_confidence"]
        missing_rows = merged[required].isna().any(axis=1)
        if missing_rows.any():
            examples = merged.loc[missing_rows, ["kot_nr", "udbud_titel", "education_code"]].head(10).to_dict("records")
            raise ValueError(f"Incomplete source coverage for {int(missing_rows.sum())} programmes. Examples: {examples}")

        # Compute labour and salary percentiles once per official education group.
        group_scores = merged[["education_code", "employment_rate", "unemployment_rate", "salary_5y_growth"]].drop_duplicates("education_code").copy()
        group_scores["labour_demand"] = (0.7 * _percentile(group_scores["employment_rate"]) + 0.3 * _percentile(group_scores["unemployment_rate"], False)).clip(0, 1)
        group_scores["salary_growth"] = _percentile(group_scores["salary_5y_growth"]).clip(0, 1)
        merged = merged.drop(columns=[c for c in ["labour_demand", "salary_growth"] if c in merged.columns], errors="ignore")
        merged = merged.merge(group_scores[["education_code", "labour_demand", "salary_growth"]], on="education_code", how="left", validate="many_to_one")

        conn.execute("DROP TABLE IF EXISTS education_profile_scores")
        conn.execute("""CREATE TABLE education_profile_scores (
            kot_nr VARCHAR PRIMARY KEY, udbud_titel VARCHAR,
            education_code VARCHAR NOT NULL, education_title VARCHAR NOT NULL,
            disco08_code VARCHAR NOT NULL,
            automation_risk DOUBLE NOT NULL, augmentation_potential DOUBLE NOT NULL,
            labour_demand DOUBLE NOT NULL, salary_growth DOUBLE NOT NULL,
            employment_rate DOUBLE NOT NULL, unemployment_rate DOUBLE NOT NULL,
            salary_median DOUBLE NOT NULL, salary_5y_growth DOUBLE NOT NULL,
            mapping_method VARCHAR NOT NULL, mapping_source VARCHAR NOT NULL, mapping_period VARCHAR NOT NULL, mapping_confidence VARCHAR NOT NULL,
            disco_mapping_method VARCHAR NOT NULL, disco_mapping_source VARCHAR NOT NULL, disco_mapping_period VARCHAR NOT NULL, disco_mapping_confidence VARCHAR NOT NULL,
            labour_source VARCHAR NOT NULL, labour_dataset VARCHAR NOT NULL, labour_period VARCHAR NOT NULL, labour_source_url VARCHAR NOT NULL,
            salary_source VARCHAR NOT NULL, salary_dataset VARCHAR NOT NULL, salary_period VARCHAR NOT NULL, salary_source_url VARCHAR NOT NULL,
            ai_source VARCHAR NOT NULL, ai_dataset VARCHAR NOT NULL, ai_period VARCHAR NOT NULL, ai_source_url VARCHAR NOT NULL, ai_mapping_confidence VARCHAR NOT NULL
        )""")

        rows = []
        for _, r in merged.iterrows():
            rows.append([
                str(r.kot_nr), str(r.udbud_titel), str(r.education_code), str(r.education_title), str(r.disco08_code),
                float(r.automation_risk), float(r.augmentation_potential), float(r.labour_demand), float(r.salary_growth),
                float(r.employment_rate), float(r.unemployment_rate), float(r.salary_median), float(r.salary_5y_growth),
                str(r.mapping_method), str(r.mapping_source), str(r.mapping_period), str(r.mapping_confidence),
                str(r.disco_mapping_method), str(r.disco_mapping_source), str(r.disco_mapping_period), str(r.disco_mapping_confidence),
                str(r.labour_source), str(r.labour_dataset), str(r.labour_period), str(r.labour_source_url),
                str(r.salary_source), str(r.salary_dataset), str(r.salary_period), str(r.salary_source_url),
                str(r.ai_source), str(r.ai_dataset), str(r.ai_period), str(r.ai_source_url), str(r.ai_mapping_confidence),
            ])
        conn.executemany("INSERT INTO education_profile_scores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    finally:
        conn.close()

    result = {
        "schema_version": "3.1",
        "programme_count": int(len(merged)),
        "education_group_count": int(merged["education_code"].nunique()),
        "sources": {"programme_education_mapping": str(EDUCATION_MAP.relative_to(BASE_DIR)), "labour_market": str(LABOUR_PATH.relative_to(BASE_DIR)), "salary": str(SALARY_PATH.relative_to(BASE_DIR)), "programme_disco_mapping": str(DISCO_MAP.relative_to(BASE_DIR)), "ai_occupation": str(AI_PATH.relative_to(BASE_DIR))},
        "methodology": {"labour_demand": "0.7 * employment percentile + 0.3 * inverse unemployment percentile across unique official education groups", "salary_growth": "cross-sectional percentile of observed five-year salary growth across unique official education groups"},
        "epistemic_status": {"employment_rate": "OBSERVED", "unemployment_rate": "OBSERVED", "salary_median": "OBSERVED", "salary_5y_growth": "DERIVED_FROM_OBSERVED_SERIES", "labour_demand": "DERIVED", "salary_growth": "DERIVED", "automation_risk": "CROSSWALK_OR_MODEL", "augmentation_potential": "CROSSWALK_OR_MODEL"},
    }
    with open(DATA_DIR / "education_profile_build_manifest.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✓ Built education_profile_scores for {len(merged)} programmes")
    return result


if __name__ == "__main__":
    build_profiles()

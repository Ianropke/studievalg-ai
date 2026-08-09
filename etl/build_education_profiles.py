"""Build education profile scores from explicitly sourced input datasets.

This is the canonical producer of education_profile_scores.

The pipeline deliberately refuses to invent labour-market, salary, occupation,
or AI values. Inputs are plain CSV files with mandatory provenance columns:

  data/sources/programme_disco_mapping.csv
  data/sources/labour_market_by_programme.csv
  data/sources/ai_occupation_exposure.csv

Required provenance fields are validated before any score is written.
The labour-demand score is derived from observed employment/unemployment data;
salary-growth is derived from observed salary observations; AI metrics are
crosswalk/model values and are never labelled observed.

Input schemas are documented in DATA_SOURCE_CONTRACT.md.
"""

from __future__ import annotations

from pathlib import Path
import json
import math
import re
from typing import Iterable

import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SOURCES_DIR = DATA_DIR / "sources"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"

MAPPING_PATH = SOURCES_DIR / "programme_disco_mapping.csv"
LABOUR_PATH = SOURCES_DIR / "labour_market_by_programme.csv"
AI_PATH = SOURCES_DIR / "ai_occupation_exposure.csv"

REQUIRED_MAPPING = {
    "kot_nr", "disco08_code", "mapping_method", "mapping_source",
    "mapping_period", "mapping_confidence"
}
REQUIRED_LABOUR = {
    "kot_nr", "period", "employment_rate", "unemployment_rate",
    "salary_median", "salary_5y_growth", "source", "dataset", "source_url"
}
REQUIRED_AI = {
    "disco08_code", "automation_risk", "augmentation_potential",
    "source", "dataset", "period", "source_url"
}


def _require_columns(df: pd.DataFrame, required: set[str], name: str) -> None:
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"{name}: missing required columns: {', '.join(missing)}")


def _read_csv(path: Path, required: set[str], name: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} is missing. Add the official source export described in "
            "data/DATA_SOURCE_CONTRACT.md; the pipeline will not fabricate values."
        )
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


def _normalise_percentile(series: pd.Series, higher_is_better: bool = True) -> pd.Series:
    """Cross-sectional percentile rank in [0,1]."""
    ranks = series.rank(method="average", pct=True)
    return ranks if higher_is_better else 1.0 - ranks


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def build_profiles() -> dict:
    mapping = _read_csv(MAPPING_PATH, REQUIRED_MAPPING, "programme_disco_mapping")
    labour = _read_csv(LABOUR_PATH, REQUIRED_LABOUR, "labour_market_by_programme")
    ai = _read_csv(AI_PATH, REQUIRED_AI, "ai_occupation_exposure")

    mapping = _numeric(mapping, [], "programme_disco_mapping")
    labour = _numeric(
        labour,
        ["employment_rate", "unemployment_rate", "salary_median", "salary_5y_growth"],
        "labour_market_by_programme",
    )
    ai = _numeric(ai, ["automation_risk", "augmentation_potential"], "ai_occupation_exposure")

    if mapping["kot_nr"].duplicated().any():
        raise ValueError("programme_disco_mapping: kot_nr must be unique")
    if labour["kot_nr"].duplicated().any():
        raise ValueError("labour_market_by_programme: kot_nr must be unique")
    if ai["disco08_code"].duplicated().any():
        raise ValueError("ai_occupation_exposure: disco08_code must be unique")

    for col in ("employment_rate", "unemployment_rate"):
        if not labour[col].between(0, 1).all():
            raise ValueError(f"labour data: {col} must be expressed as 0..1")
    if not ai["automation_risk"].between(0, 1).all():
        raise ValueError("AI automation_risk must be expressed as 0..1")
    if not ai["augmentation_potential"].between(0, 1).all():
        raise ValueError("AI augmentation_potential must be expressed as 0..1")

    conn = duckdb.connect(str(DUCKDB_PATH))
    try:
        programmes = conn.execute(
            """
            SELECT kot_nr, udbud_titel
            FROM kot_graensekvotienter
            GROUP BY kot_nr, udbud_titel
            """
        ).df()

        if programmes.empty:
            raise ValueError("No programmes found in kot_graensekvotienter")

        merged = programmes.merge(mapping, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(labour, on="kot_nr", how="left", validate="one_to_one")
        merged = merged.merge(ai, on="disco08_code", how="left", validate="many_to_one")

        required_join = ["disco08_code", "employment_rate", "unemployment_rate", "salary_median", "salary_5y_growth", "automation_risk", "augmentation_potential"]
        missing_rows = merged[required_join].isna().any(axis=1)
        if missing_rows.any():
            examples = merged.loc[missing_rows, ["kot_nr", "udbud_titel"]].head(10).to_dict("records")
            raise ValueError(
                f"Incomplete source coverage for {int(missing_rows.sum())} programmes. "
                f"Examples: {examples}"
            )

        # Labour demand is a transparent derived indicator: high employment and
        # low unemployment. It is NOT a direct observation and must be labelled DERIVED.
        employment_component = _normalise_percentile(merged["employment_rate"], True)
        unemployment_component = _normalise_percentile(merged["unemployment_rate"], False)
        merged["labour_demand"] = 0.7 * employment_component + 0.3 * unemployment_component

        # Salary growth is based directly on observed 5-year salary growth and
        # transformed to a cross-sectional percentile for comparability.
        merged["salary_growth"] = _normalise_percentile(merged["salary_5y_growth"], True)

        # AI resilience is model-derived; it is never represented as observed.
        merged["ai_resilience"] = (
            1.0 - merged["automation_risk"] + 0.2 * merged["augmentation_potential"]
        ).clip(0, 1)

        conn.execute("DROP TABLE IF EXISTS education_profile_scores")
        conn.execute(
            """
            CREATE TABLE education_profile_scores (
                kot_nr VARCHAR PRIMARY KEY,
                udbud_titel VARCHAR,
                disco08_code VARCHAR NOT NULL,
                disco_titel VARCHAR,
                automation_risk DOUBLE NOT NULL,
                augmentation_potential DOUBLE NOT NULL,
                labour_demand DOUBLE NOT NULL,
                salary_growth DOUBLE NOT NULL,
                international_mobility DOUBLE,
                future_uncertainty DOUBLE,
                mapping_method VARCHAR NOT NULL,
                mapping_source VARCHAR NOT NULL,
                mapping_period VARCHAR NOT NULL,
                mapping_confidence VARCHAR NOT NULL,
                labour_source VARCHAR NOT NULL,
                labour_dataset VARCHAR NOT NULL,
                labour_period VARCHAR NOT NULL,
                labour_source_url VARCHAR NOT NULL,
                salary_source VARCHAR NOT NULL,
                salary_dataset VARCHAR NOT NULL,
                salary_period VARCHAR NOT NULL,
                salary_source_url VARCHAR NOT NULL,
                ai_source VARCHAR NOT NULL,
                ai_dataset VARCHAR NOT NULL,
                ai_period VARCHAR NOT NULL,
                ai_source_url VARCHAR NOT NULL
            )
            """
        )

        disco_titles = conn.execute(
            "SELECT code, title FROM disco08_occupations"
        ).fetchall()
        disco_title_map = {str(code): title for code, title in disco_titles}

        rows = []
        for _, r in merged.iterrows():
            rows.append([
                str(r.kot_nr), str(r.udbud_titel), str(r.disco08_code),
                disco_title_map.get(str(r.disco08_code)),
                float(r.automation_risk), float(r.augmentation_potential),
                float(r.labour_demand), float(r.salary_growth), None, None,
                str(r.mapping_method), str(r.mapping_source), str(r.mapping_period), str(r.mapping_confidence),
                str(r.source), str(r.dataset), str(r.period), str(r.source_url),
                str(r.source), str(r.dataset), str(r.period), str(r.source_url),
                str(r.source_y), str(r.dataset_y), str(r.period_y), str(r.source_url_y),
            ])

        conn.executemany(
            """INSERT INTO education_profile_scores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            rows,
        )
    finally:
        conn.close()

    result = {
        "schema_version": "1.0",
        "programme_count": int(len(merged)),
        "sources": {
            "mapping": str(MAPPING_PATH.relative_to(BASE_DIR)),
            "labour_market": str(LABOUR_PATH.relative_to(BASE_DIR)),
            "ai_occupation": str(AI_PATH.relative_to(BASE_DIR)),
        },
        "methodology": {
            "labour_demand": "0.7 * employment percentile + 0.3 * inverse unemployment percentile",
            "salary_growth": "cross-sectional percentile of observed 5-year salary growth",
            "ai_resilience": "1 - automation_risk + 0.2 * augmentation_potential, clipped to [0,1]",
        },
        "epistemic_status": {
            "labour_demand": "DERIVED",
            "salary_growth": "DERIVED",
            "automation_risk": "CROSSWALK_OR_MODEL",
            "augmentation_potential": "CROSSWALK_OR_MODEL",
            "ai_resilience": "MODEL_DERIVED",
        },
    }

    with open(DATA_DIR / "education_profile_build_manifest.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✓ Built education_profile_scores for {len(merged)} programmes")
    return result


if __name__ == "__main__":
    build_profiles()

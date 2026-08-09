"""Validate canonical source files before any education score is built.

This is intentionally strict: incomplete or ambiguous source data must stop
the build instead of being replaced with plausible defaults.
"""
from __future__ import annotations

from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
S = BASE / "data" / "sources"

FILES = {
    "programme_education_mapping.csv": ["kot_nr", "education_code", "education_title", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"],
    "labour_market_by_education.csv": ["education_code", "period", "employment_rate", "unemployment_rate", "source", "dataset", "source_url"],
    "salary_by_education.csv": ["education_code", "period", "salary_median", "source", "dataset", "source_url"],
    "programme_disco_mapping.csv": ["kot_nr", "disco08_code", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"],
    "ai_occupation_exposure.csv": ["disco08_code", "automation_risk", "augmentation_potential", "source", "dataset", "period", "source_url"],
}


def _numeric(df: pd.DataFrame, columns: list[str], filename: str, errors: list[str]) -> None:
    for col in columns:
        values = pd.to_numeric(df[col], errors="coerce")
        if values.isna().any():
            errors.append(f"{filename}: non-numeric values in {col}")


def _validate_url_column(df: pd.DataFrame, filename: str, errors: list[str]) -> None:
    invalid = ~df["source_url"].astype(str).str.match(r"^https?://", na=False)
    if invalid.any():
        errors.append(f"{filename}: source_url must contain http(s) URLs")


def main() -> None:
    errors: list[str] = []
    frames: dict[str, pd.DataFrame] = {}

    for filename, required in FILES.items():
        path = S / filename
        if not path.exists():
            errors.append(f"MISSING: {path}")
            continue
        try:
            df = pd.read_csv(path, dtype=str)
        except Exception as exc:
            errors.append(f"{filename}: cannot read CSV: {exc}")
            continue
        frames[filename] = df
        missing = [c for c in required if c not in df.columns]
        if missing:
            errors.append(f"{filename}: missing columns {missing}")
            continue
        if df.empty:
            errors.append(f"{filename}: empty")
            continue
        for col in required:
            if df[col].isna().any() or df[col].astype(str).str.strip().eq("").any():
                errors.append(f"{filename}: blank values in {col}")
        if "source_url" in df.columns:
            _validate_url_column(df, filename, errors)

    edu = frames.get("programme_education_mapping.csv")
    if edu is not None and {"kot_nr", "mapping_method"}.issubset(edu.columns):
        if edu["kot_nr"].duplicated().any():
            errors.append("programme_education_mapping.csv: kot_nr must be unique")
        allowed = {"OFFICIAL", "DOCUMENTED_CROSSWALK", "EXPERT_REVIEW"}
        bad = ~edu["mapping_method"].str.upper().isin(allowed)
        if bad.any():
            errors.append("programme_education_mapping.csv: mapping_method must be OFFICIAL, DOCUMENTED_CROSSWALK or EXPERT_REVIEW")

    labour = frames.get("labour_market_by_education.csv")
    if labour is not None and {"education_code", "period", "employment_rate", "unemployment_rate"}.issubset(labour.columns):
        if labour.duplicated(["education_code", "period"]).any():
            errors.append("labour_market_by_education.csv: education_code + period must be unique")
        _numeric(labour, ["employment_rate", "unemployment_rate"], "labour_market_by_education.csv", errors)
        for col in ["employment_rate", "unemployment_rate"]:
            values = pd.to_numeric(labour[col], errors="coerce")
            if values.notna().any() and ((values.dropna() < 0).any() or (values.dropna() > 1).any()):
                errors.append(f"labour_market_by_education.csv: {col} must be in [0,1]")

    salary = frames.get("salary_by_education.csv")
    if salary is not None and {"education_code", "period", "salary_median"}.issubset(salary.columns):
        if salary.duplicated(["education_code", "period"]).any():
            errors.append("salary_by_education.csv: education_code + period must be unique")
        _numeric(salary, ["salary_median"], "salary_by_education.csv", errors)
        values = pd.to_numeric(salary["salary_median"], errors="coerce")
        if values.notna().any() and (values.dropna() <= 0).any():
            errors.append("salary_by_education.csv: salary_median must be positive")

    disco = frames.get("programme_disco_mapping.csv")
    if disco is not None and {"kot_nr", "disco08_code", "mapping_method"}.issubset(disco.columns):
        if disco["kot_nr"].duplicated().any():
            errors.append("programme_disco_mapping.csv: kot_nr must be unique")
        if disco["disco08_code"].str.upper().eq("DEFAULT").any():
            errors.append("programme_disco_mapping.csv: DEFAULT mapping is forbidden")
        allowed = {"OFFICIAL", "DOCUMENTED_CROSSWALK", "EXPERT_REVIEW"}
        if (~disco["mapping_method"].str.upper().isin(allowed)).any():
            errors.append("programme_disco_mapping.csv: invalid mapping_method")

    ai = frames.get("ai_occupation_exposure.csv")
    if ai is not None and {"disco08_code", "automation_risk", "augmentation_potential"}.issubset(ai.columns):
        if ai["disco08_code"].duplicated().any():
            errors.append("ai_occupation_exposure.csv: disco08_code must be unique")
        _numeric(ai, ["automation_risk", "augmentation_potential"], "ai_occupation_exposure.csv", errors)
        for col in ["automation_risk", "augmentation_potential"]:
            values = pd.to_numeric(ai[col], errors="coerce")
            if values.notna().any() and ((values.dropna() < 0).any() or (values.dropna() > 1).any()):
                errors.append(f"ai_occupation_exposure.csv: {col} must be in [0,1]")

    legacy = S / "labour_market_by_programme.csv"
    if legacy.exists():
        errors.append("LEGACY FILE PRESENT: labour_market_by_programme.csv; remove it to avoid programme-grain confusion")

    if errors:
        raise SystemExit("SOURCE CONTRACT FAILED:\n- " + "\n- ".join(errors))
    print("✓ Source contract passed")


if __name__ == "__main__":
    main()

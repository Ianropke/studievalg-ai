"""Validate source files before any education score is built."""
from __future__ import annotations
from pathlib import Path
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
S = BASE / "data" / "sources"

FILES = {
    "programme_education_mapping.csv": ["kot_nr","education_code","education_title","mapping_method","mapping_source","mapping_period","mapping_confidence"],
    "labour_market_by_education.csv": ["education_code","period","employment_rate","unemployment_rate","source","dataset","source_url"],
    "salary_by_education.csv": ["education_code","period","salary_median","source","dataset","source_url"],
    "programme_disco_mapping.csv": ["kot_nr","disco08_code","mapping_method","mapping_source","mapping_period","mapping_confidence"],
    "ai_occupation_exposure.csv": ["disco08_code","automation_risk","augmentation_potential","source","dataset","period","source_url"],
}


def main() -> None:
    errors: list[str] = []
    for filename, required in FILES.items():
        path = S / filename
        if not path.exists():
            errors.append(f"MISSING: {path}")
            continue
        df = pd.read_csv(path, dtype=str)
        missing = [c for c in required if c not in df.columns]
        if missing:
            errors.append(f"{filename}: missing columns {missing}")
            continue
        if df.empty:
            errors.append(f"{filename}: empty")
        for col in required:
            if df[col].isna().any() or df[col].astype(str).str.strip().eq("").any():
                errors.append(f"{filename}: blank values in {col}")

    if (S / "labour_market_by_programme.csv").exists():
        errors.append("LEGACY FILE PRESENT: labour_market_by_programme.csv; remove it to avoid programme-grain confusion")

    if errors:
        raise SystemExit("SOURCE CONTRACT FAILED:\n- " + "\n- ".join(errors))
    print("✓ Source contract passed")


if __name__ == "__main__":
    main()

"""Audit representative programmes end-to-end once authoritative data exists.

The audit is intentionally data-driven: it never invents expected scores. It
checks that representative programmes have a traceable mapping and, where a
score is present, a corresponding observation and provenance record.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROSSWALK = ROOT / "data/sources/kot_udd_crosswalk.csv"
SCORES = ROOT / "data/education_profile_scores.csv"
OUT = ROOT / "data/sources/golden_programme_audit.json"

TARGET_NAMES = {"datalogi", "medicin", "jura", "statskundskab", "psykologi", "sygepleje", "historie", "økonomi"}

def norm(value: str) -> str:
    return " ".join((value or "").strip().lower().split())

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--allow-blocked",
        action="store_true",
        help="Return success when authoritative crosswalk/score inputs are explicitly unavailable.",
    )
    args = parser.parse_args()
    if not CROSSWALK.exists() or not SCORES.exists():
        report = {"status": "BLOCKED", "reason": "Crosswalk or canonical score table is not available yet."}
        OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return 0 if args.allow_blocked else 2
    with CROSSWALK.open(encoding="utf-8-sig", newline="") as f:
        crosswalk = list(csv.DictReader(f))
    with SCORES.open(encoding="utf-8-sig", newline="") as f:
        scores = list(csv.DictReader(f))
    by_udd = {norm(r.get("udd_code")): r for r in scores if r.get("udd_code")}
    rows = []
    for r in crosswalk:
        name = norm(r.get("programme_name") or r.get("education_name") or "")
        if name in TARGET_NAMES:
            score = by_udd.get(norm(r.get("udd_code")))
            rows.append({
                "programme": r.get("programme_name") or r.get("education_name"),
                "kot_code": r.get("kot_code"),
                "udd_code": r.get("udd_code"),
                "mapping_method": r.get("mapping_method"),
                "mapping_source": r.get("mapping_source"),
                "score_row_present": bool(score),
                "score_provenance_present": bool(score and (score.get("source") or score.get("labour_source") or score.get("salary_source"))),
            })
    missing = [r for r in rows if not r["score_row_present"]]
    missing_provenance = [r for r in rows if r["score_row_present"] and not r["score_provenance_present"]]
    report = {
        "status": "PASS" if rows and not missing and not missing_provenance else ("FAIL" if rows else "BLOCKED"),
        "targets": len(rows),
        "missing_score_rows": len(missing),
        "missing_score_provenance_rows": len(missing_provenance),
        "rows": rows,
        "policy": "A score without traceable source provenance is not production-valid.",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if report["status"] == "PASS":
        return 0
    if report["status"] == "BLOCKED" and args.allow_blocked:
        return 0
    return 1

if __name__ == "__main__":
    raise SystemExit(main())

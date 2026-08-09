"""Build the production KOT -> UDD crosswalk from authoritative source data.

This intentionally refuses fuzzy/name-based inference. A mapping is only
accepted when an explicit authoritative relationship is present in the input
source. Ambiguous and missing mappings are reported and remain unmapped.
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "sources" / "raw"
OUT = ROOT / "data" / "sources" / "kot_udd_crosswalk.csv"
REPORT = ROOT / "data" / "sources" / "kot_udd_crosswalk_report.json"

REQUIRED = {"kot_code", "udd_code", "mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}
ALLOWED = {"OFFICIAL_SOURCE", "VERIFIED_CROSSWALK"}


def find_mapping_files() -> list[Path]:
    candidates = []
    for p in RAW.rglob("*.csv"):
        try:
            with p.open("r", encoding="utf-8-sig", newline="") as f:
                header = {x.strip().lower() for x in next(csv.reader(f), [])}
            if {"kot_code", "udd_code"}.issubset(header):
                candidates.append(p)
        except (OSError, UnicodeDecodeError, StopIteration):
            continue
    return candidates


def main() -> int:
    files = find_mapping_files()
    if not files:
        report = {
            "status": "BLOCKED",
            "reason": "No authoritative KOT-to-UDD mapping source was found in raw sources.",
            "mapped": 0,
            "unmapped": 0,
            "ambiguous": 0,
            "source_files": [],
        }
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(report["reason"], file=sys.stderr)
        return 2

    rows: list[dict[str, str]] = []
    errors: list[str] = []
    for path in files:
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fields = {x.strip().lower() for x in (reader.fieldnames or [])}
            missing = REQUIRED - fields
            if missing:
                errors.append(f"{path}: missing {sorted(missing)}")
                continue
            for raw in reader:
                row = {k.strip().lower(): (v or "").strip() for k, v in raw.items()}
                if not row.get("kot_code"):
                    errors.append(f"{path}: row missing kot_code")
                    continue
                if not row.get("udd_code"):
                    errors.append(f"{path}: {row['kot_code']}: missing udd_code")
                    continue
                if row.get("mapping_method") not in ALLOWED:
                    errors.append(f"{path}: {row['kot_code']}: invalid mapping_method")
                    continue
                if not row.get("mapping_source") or not row.get("mapping_period") or not row.get("mapping_confidence"):
                    errors.append(f"{path}: {row['kot_code']}: incomplete provenance")
                    continue
                rows.append(row)

    by_kot: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        by_kot.setdefault(row["kot_code"], []).append(row)

    ambiguous = {k: v for k, v in by_kot.items() if len({r["udd_code"] for r in v}) > 1}
    duplicate = {k: v for k, v in by_kot.items() if len(v) > 1 and k not in ambiguous}
    if ambiguous:
        for kot in ambiguous:
            errors.append(f"ambiguous mapping for KOT {kot}")

    final = [v[0] for k, v in sorted(by_kot.items()) if k not in ambiguous]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=sorted(REQUIRED))
        writer.writeheader()
        writer.writerows(final)

    report = {
        "status": "PASS" if not errors else "FAIL",
        "source_files": [str(p.relative_to(ROOT)) for p in files],
        "mapped": len(final),
        "ambiguous": len(ambiguous),
        "duplicate_same_mapping": len(duplicate),
        "validation_errors": errors,
        "policy": "No fuzzy mapping; ambiguous/unmapped KOT programmes receive no labour or salary score.",
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if errors:
        print(json.dumps(report, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

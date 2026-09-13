"""Transform the reviewed LONS11 extract into strict salary source rows.

The output remains at Statistics Denmark education-category grain. It is not
programme-level evidence until a documented KOT -> education mapping connects
individual programmes to these categories.
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "sources" / "raw" / "LONS11.csv"
RAW_MANIFEST = ROOT / "data" / "sources" / "raw" / "SOURCE_MANIFEST.json"
OUTPUT = ROOT / "data" / "sources" / "salary_by_education.csv"
MANIFEST = ROOT / "data" / "sources" / "salary_by_education_manifest.json"

REQUIRED_HEADERS = {"UDDANNELSE", "SEKTOR", "AFLOEN", "LONGRP", "LØNMÅL", "KØN", "TID", "INDHOLD"}


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_number(value: str) -> float:
    normalized = value.strip().replace(".", "").replace(",", ".")
    number = float(normalized)
    if number <= 0:
        raise ValueError("Salary observations must be positive")
    return number


def education_category(value: str) -> str | None:
    match = re.match(r"^(H[0-9A-Z]+)\s+", value.strip())
    return match.group(1) if match else None


def transform(raw_path: Path = RAW) -> list[dict[str, str]]:
    with raw_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        headers = {header.upper() for header in (reader.fieldnames or [])}
        missing = sorted(REQUIRED_HEADERS - headers)
        if missing:
            raise ValueError(f"LONS11 extract lacks required columns: {', '.join(missing)}")
        rows = []
        for raw in reader:
            code = education_category(raw["UDDANNELSE"])
            if code is None:  # Exclude the aggregate 'I alt' row.
                continue
            if not raw["INDHOLD"].strip() or raw["INDHOLD"].strip() in {"..", "...", "-"}:
                # StatBank suppresses or omits some cells. Missing observations
                # remain absent and are never converted into zero or a fallback.
                continue
            rows.append({
                "education_code": code,
                "period": raw["TID"].strip(),
                "salary_value": f"{parse_number(raw['INDHOLD']):.2f}",
                "salary_measure": raw["LØNMÅL"].strip(),
                "salary_unit": "DKK per præsteret time",
                "source": "Danmarks Statistik",
                "dataset": "LONS11",
                "source_url": "https://www.statistikbanken.dk/LONS11",
            })
    if not rows:
        raise ValueError("LONS11 transformation produced no education-category observations")
    keys = {(row["education_code"], row["period"]) for row in rows}
    if len(keys) != len(rows):
        raise ValueError("LONS11 transformation produced duplicate education_code + period rows")
    return rows


def main() -> None:
    rows = transform()
    source_manifest = json.loads(RAW_MANIFEST.read_text(encoding="utf-8"))
    lons_source = next((source for source in source_manifest.get("sources", []) if source.get("table") == "LONS11"), None)
    if not lons_source or not lons_source.get("query"):
        raise ValueError("SOURCE_MANIFEST lacks the reviewed LONS11 query")
    expected_hash = lons_source.get("sha256")
    actual_hash = file_sha256(RAW)
    if not expected_hash or expected_hash != actual_hash:
        raise ValueError("LONS11 raw extract does not match its source-manifest SHA-256")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    fields = ["education_code", "period", "salary_value", "salary_measure", "salary_unit", "source", "dataset", "source_url"]
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    periods = sorted({row["period"] for row in rows})
    categories = sorted({row["education_code"] for row in rows})
    manifest = {
        "schema_version": "1.0",
        "status": "SOURCE_READY_NOT_PROGRAMME_MAPPED",
        "row_count": len(rows),
        "excluded_aggregate_or_missing_rows": int(lons_source.get("shape", {}).get("rows", len(rows))) - len(rows),
        "education_category_count": len(categories),
        "periods": periods,
        "source": "Danmarks Statistik",
        "dataset": "LONS11",
        "source_retrieved_at": source_manifest.get("retrieved_at"),
        "raw_source_sha256": actual_hash,
        "output_sha256": file_sha256(OUTPUT),
        "query": lons_source["query"],
        "transformation": "Parsed official education-category code from the LONS11 label; excluded aggregate totals and blank/suppressed cells; no interpolation or programme mapping.",
        "limitation": "These observations cannot enter programme rankings until a documented KOT-to-compatible-education mapping exists.",
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(rows)} salary observations across {len(categories)} education categories.")


if __name__ == "__main__":
    main()

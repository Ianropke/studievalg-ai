#!/usr/bin/env python3
"""Build the reproducible 2026 KOT admissions snapshot from its official XLSX.

This producer is intentionally offline-only.  The caller must provide the
authorized workbook through ``--input``; the script never downloads sources.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


SOURCE_URL = "https://ufsn.dk/media/omyojnzg/kot-hovedtal-2026.xlsx"
SOURCE_SHA256 = "98efdeeffdee67b470c3ee24ccdb6c68d735a365f0c39c32d9b7eda75b221ce4"
DATASET_YEAR = 2026
SHEET_NAME = "hovedtal med filter"
EXPECTED_HEADERS = (
    None,
    "OptOmrNr",
    "Uddannelsessted",
    "Optagelsesområder",
    "optagne",
    "standby",
    "total",
    "1. prioritet",
    "kvote 1 kvotient",
    "standby",
)
EXPECTED_RECORD_COUNT = 957
NON_NUMERIC_KVOTE1_STATUSES = frozenset(
    {
        "Alle optaget",
        "Alle optaget, ledige pladser",
        "Ikke oprettet",
        "Ingen optaget, ledige pladser",
        "Kun kvote 2",
        "Kun kvote 2, ledige pladser",
        "Uden for kvotesystem",
        "Uden for kvotesystem, ledige pladser",
    }
)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = PROJECT_ROOT / "web" / "src" / "data" / "kot2026.json"


class KotImportError(ValueError):
    """Raised when the authorized KOT snapshot does not meet its contract."""


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_decimal(value: Any, *, row_number: int) -> Decimal:
    if isinstance(value, bool) or value is None:
        raise KotImportError(f"row {row_number}: expected numeric Kvote 1 value, got {value!r}")
    try:
        decimal_value = Decimal(str(value).strip().replace(",", "."))
    except (InvalidOperation, ValueError) as error:
        raise KotImportError(f"row {row_number}: invalid Kvote 1 value {value!r}") from error
    if not decimal_value.is_finite():
        raise KotImportError(f"row {row_number}: non-finite Kvote 1 value {value!r}")
    if not Decimal("2") <= decimal_value <= Decimal("12"):
        raise KotImportError(f"row {row_number}: Kvote 1 threshold out of range: {value!r}")
    return decimal_value


def decimal_string(value: Decimal) -> str:
    normalized = value.normalize()
    return format(normalized, "f")


def parse_kvote1(value: Any, *, row_number: int) -> tuple[str, float | None]:
    if isinstance(value, str) and value in NON_NUMERIC_KVOTE1_STATUSES:
        return value, None
    if isinstance(value, str) and not value.strip():
        raise KotImportError(f"row {row_number}: blank Kvote 1 value")
    threshold = normalized_decimal(value, row_number=row_number)
    return decimal_string(threshold), float(threshold)


def raw_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, float) and not math.isfinite(value):
        raise KotImportError(f"standby value must be finite, got {value!r}")
    return str(value)


def kot_number(value: Any, *, row_number: int) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise KotImportError(f"row {row_number}: OptOmrNr must be a numeric five-digit value, got {value!r}")
    if isinstance(value, float) and (not value.is_integer() or not math.isfinite(value)):
        raise KotImportError(f"row {row_number}: OptOmrNr must be an integer, got {value!r}")
    value = int(value)
    if not 10000 <= value <= 99999:
        raise KotImportError(f"row {row_number}: OptOmrNr out of five-digit range: {value!r}")
    return str(value)


def required_text(value: Any, *, column: str, row_number: int) -> str:
    if not isinstance(value, str) or not value.strip():
        raise KotImportError(f"row {row_number}: {column} must be nonblank text")
    return value


def build_snapshot(input_path: Path) -> dict[str, Any]:
    actual_hash = file_sha256(input_path)
    if actual_hash != SOURCE_SHA256:
        raise KotImportError(
            f"source hash mismatch: expected {SOURCE_SHA256}, got {actual_hash}"
        )

    workbook = load_workbook(input_path, read_only=True, data_only=True)
    if SHEET_NAME not in workbook.sheetnames:
        raise KotImportError(f"missing required sheet: {SHEET_NAME!r}")
    worksheet = workbook[SHEET_NAME]
    headers = tuple(next(worksheet.iter_rows(min_row=2, max_row=2, values_only=True)))
    if headers != EXPECTED_HEADERS:
        raise KotImportError(f"unexpected row 2 schema: {headers!r}")

    records: list[dict[str, Any]] = []
    seen_kot_numbers: set[str] = set()
    for row_number, row in enumerate(worksheet.iter_rows(min_row=3, values_only=True), start=3):
        kot_cell = row[1]
        # The official sheet has structural rows and a trailing formatted row
        # with no OptOmrNr. Only populated identifier cells are data rows.
        if kot_cell is None or (isinstance(kot_cell, str) and not kot_cell.strip()):
            continue
        kot_nr = kot_number(kot_cell, row_number=row_number)
        if kot_nr in seen_kot_numbers:
            raise KotImportError(f"row {row_number}: duplicate OptOmrNr {kot_nr}")
        kvote1_raw, threshold = parse_kvote1(row[8], row_number=row_number)
        records.append(
            {
                "kot_nr": kot_nr,
                "title": required_text(row[3], column="Optagelsesområder", row_number=row_number),
                "institution": required_text(row[2], column="Uddannelsessted", row_number=row_number),
                "kvote1_raw": kvote1_raw,
                "threshold": threshold,
                "standby_raw": raw_string(row[9]),
                "source_row": row_number,
            }
        )
        seen_kot_numbers.add(kot_nr)

    if len(records) != EXPECTED_RECORD_COUNT:
        raise KotImportError(
            f"expected {EXPECTED_RECORD_COUNT} KOT records, found {len(records)}"
        )
    records.sort(key=lambda record: record["kot_nr"])
    return {
        "source_url": SOURCE_URL,
        "source_sha256": SOURCE_SHA256,
        "dataset_year": DATASET_YEAR,
        "sheet": SHEET_NAME,
        "records": records,
    }


def write_snapshot(snapshot: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
    temporary_path.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    os.replace(temporary_path, output_path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Authorized official KOT 2026 XLSX; no download is performed.",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args(argv)
    snapshot = build_snapshot(arguments.input)
    write_snapshot(snapshot, arguments.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

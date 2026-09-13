"""Fetch official Danish education/labour-market source data.

This module deliberately separates two source classes:

1. UFM Datavarehus graduate outcomes: the preferred source for programme /
   education-group employment and unemployment indicators after graduation.
2. Statistics Denmark Statbank: supporting education/salary observations.

No title matching, KOT-to-education guessing, or KOT-to-DISCO inference is
performed here. Raw source extracts are stored with provenance manifests.

The UFM CSV URL is configurable through UFM_EMPLOYMENT_CSV_URL because the
Datavarehus distribution endpoint can change independently of the repository.
The script refuses to continue when it cannot retrieve the official source.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
from datetime import date
from pathlib import Path
from typing import Any

import requests

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "sources" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

STATBANK_API = "https://api.statbank.dk/v1"
UFM_EMPLOYMENT_PAGE = "https://datavarehus.ufm.dk/rapporter/beskaeftigelse"
UFM_EMPLOYMENT_CSV_URL = os.getenv("UFM_EMPLOYMENT_CSV_URL", "").strip()
UFM_EMPLOYMENT_REQUIRED_COLUMNS = tuple(
    column.strip() for column in os.getenv("UFM_EMPLOYMENT_REQUIRED_COLUMNS", "").split(",") if column.strip()
)
CSV_CONTENT_TYPES = {"text/csv", "application/csv", "application/vnd.ms-excel"}

SOURCES = {
    "LONS11": {
        "name": "Løn efter uddannelse",
        "url": "https://www.statistikbanken.dk/LONS11",
        "purpose": "Observed salary statistics by education group.",
    },
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _get(url: str, *, timeout: int = 120) -> requests.Response:
    response = requests.get(url, timeout=timeout, headers={"User-Agent": "studievalg-ai/1.0"})
    response.raise_for_status()
    return response


def get_tableinfo(table: str) -> dict[str, Any]:
    response = _get(f"{STATBANK_API}/tableinfo/{table}?lang=da", timeout=60)
    return response.json()


def build_lons11_query(tableinfo: dict[str, Any]) -> dict[str, Any]:
    """Return the reviewed, bounded salary query used for source readiness.

    The extract uses total sector, all pay forms combined, employees excluding
    young people and apprentices, earnings per hour worked, all sexes, and the
    latest six years. Six years are required to calculate a comparable
    five-year change without interpolation.
    """
    selections = {
        "UDDANNELSE": "*",
        "SEKTOR": "1000",
        "AFLOEN": "TIFA",
        "LONGRP": "VOK",
        "LØNMÅL": "FORINKL",
        "KØN": "MOK",
    }
    variables_by_id = {str(variable["id"]): variable for variable in tableinfo.get("variables", [])}
    missing = sorted(set(selections) - set(variables_by_id))
    if missing or "Tid" not in variables_by_id:
        raise RuntimeError(f"LONS11 schema lacks reviewed dimensions: {', '.join(missing or ['Tid'])}")

    variables = []
    for code, selected in selections.items():
        values = [str(value.get("id")) for value in variables_by_id[code].get("values", [])]
        if selected != "*" and selected not in values:
            raise RuntimeError(f"LONS11 dimension {code} lacks reviewed value {selected}")
        variables.append({"code": code, "values": [selected]})

    years = [str(value.get("id")) for value in variables_by_id["Tid"].get("values", [])]
    if len(years) < 6:
        raise RuntimeError("LONS11 requires at least six annual observations for five-year growth")
    variables.append({"code": "Tid", "values": years[-6:]})
    return {"table": "LONS11", "format": "CSV", "lang": "da", "variables": variables}


def download_targeted_statbank_csv(table: str, tableinfo: dict[str, Any]) -> tuple[Path, dict[str, Any]]:
    """Download the reviewed bounded extract rather than a Cartesian table."""
    if table != "LONS11":
        raise RuntimeError(f"No reviewed query is configured for {table}")
    payload = build_lons11_query(tableinfo)
    response = requests.post(f"{STATBANK_API}/data", json=payload, timeout=180)
    response.raise_for_status()
    output = RAW_DIR / f"{table}.csv"
    output.write_bytes(response.content)
    return output, payload


def download_ufm_employment() -> Path:
    """Download the official UFM CSV distribution.

    UFM exposes the dataset as HTML/XLSX/CSV. The exact CSV distribution URL is
    intentionally configured rather than guessed, because the distribution
    endpoint is not guaranteed to be stable. The source page itself is always
    recorded in the manifest.
    """
    if not UFM_EMPLOYMENT_CSV_URL:
        raise RuntimeError(
            "UFM_EMPLOYMENT_CSV_URL is not configured. Set it to the current "
            "official CSV distribution URL shown on "
            f"{UFM_EMPLOYMENT_PAGE}. No substitute or scraped value is accepted."
        )

    if not UFM_EMPLOYMENT_REQUIRED_COLUMNS:
        raise RuntimeError(
            "UFM_EMPLOYMENT_REQUIRED_COLUMNS is not configured. Record the reviewed, comma-separated "
            "official column names before enabling the UFM distribution."
        )

    response = _get(UFM_EMPLOYMENT_CSV_URL, timeout=180)
    validate_ufm_csv_payload(
        response.content,
        response.headers.get("content-type", ""),
        UFM_EMPLOYMENT_REQUIRED_COLUMNS,
    )

    output = RAW_DIR / "UFM_BESKAEFTIGELSE.csv"
    output.write_bytes(response.content)
    return output


def validate_ufm_csv_payload(content: bytes, content_type: str, required_columns: tuple[str, ...]) -> None:
    """Reject report/login HTML and schema drift before publishing a UFM file."""
    mime = content_type.lower().split(";", 1)[0].strip()
    if mime not in CSV_CONTENT_TYPES:
        raise RuntimeError(f"UFM distribution has incompatible content-type {content_type!r}")
    if not required_columns:
        raise RuntimeError("UFM CSV schema cannot be validated without reviewed required columns")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")
    if text.lstrip().lower().startswith(("<!doctype html", "<html")):
        raise RuntimeError("UFM distribution returned HTML instead of CSV")
    try:
        dialect = csv.Sniffer().sniff(text[:8192], delimiters=",;\t")
        reader = csv.reader(io.StringIO(text), dialect)
        header = next(reader, [])
        first_row = next(reader, [])
    except (csv.Error, StopIteration) as error:
        raise RuntimeError(f"UFM distribution is not a parseable CSV: {error}") from error
    normalized_header = {column.strip().casefold() for column in header}
    missing = [column for column in required_columns if column.strip().casefold() not in normalized_header]
    if missing:
        raise RuntimeError(f"UFM CSV schema lacks reviewed columns: {', '.join(missing)}")
    if not first_row or len(first_row) != len(header):
        raise RuntimeError("UFM CSV has no complete data row")


def _csv_shape(path: Path) -> dict[str, int]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        reader = csv.reader(handle, dialect)
        header = next(reader, [])
        rows = sum(1 for _ in reader)
    return {"columns": len(header), "rows": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--allow-missing-ufm-distribution",
        action="store_true",
        help="Refresh reviewed StatBank inputs while recording UFM as blocked when no verified CSV URL is configured.",
    )
    args = parser.parse_args()
    manifest = {
        "retrieved_at": date.today().isoformat(),
        "sources": [],
        "methodological_note": (
            "UFM graduate outcomes are the preferred source for post-graduation "
            "employment. Statbank salary data are supporting observations. "
            "Neither source is automatically mapped to KOT programmes here."
        ),
    }

    if UFM_EMPLOYMENT_CSV_URL:
        ufm_path = download_ufm_employment()
        manifest["sources"].append({
            "provider": "Uddannelses- og Forskningsstyrelsen",
            "dataset": "Beskæftigelse",
            "source_url": UFM_EMPLOYMENT_PAGE,
            "distribution_url": UFM_EMPLOYMENT_CSV_URL,
            "retrieved_file": str(ufm_path.relative_to(BASE_DIR)),
            "sha256": file_sha256(ufm_path),
            "bytes": ufm_path.stat().st_size,
            "shape": _csv_shape(ufm_path),
            "status": "AVAILABLE",
            "definition": "Beskæftigelsesgrad målt 12.-23. måned efter fuldførelse.",
        })
    elif args.allow_missing_ufm_distribution:
        manifest["sources"].append({
            "provider": "Uddannelses- og Forskningsstyrelsen",
            "dataset": "Beskæftigelse",
            "source_url": UFM_EMPLOYMENT_PAGE,
            "distribution_url": None,
            "retrieved_file": None,
            "status": "BLOCKED_NO_VERIFIED_MACHINE_DISTRIBUTION",
            "definition": "Beskæftigelsesgrad målt 12.-23. måned efter fuldførelse.",
        })
    else:
        raise RuntimeError(
            "UFM_EMPLOYMENT_CSV_URL is not configured. Use the reviewed official CSV URL or "
            "--allow-missing-ufm-distribution for a source-readiness refresh that cannot rebuild scores."
        )

    for table, metadata in SOURCES.items():
        info = get_tableinfo(table)
        output, query = download_targeted_statbank_csv(table, info)
        manifest["sources"].append({
            "provider": "Danmarks Statistik",
            "table": table,
            "name": metadata["name"],
            "source_url": metadata["url"],
            "purpose": metadata["purpose"],
            "status": "AVAILABLE_FOR_EDUCATION_GROUP_ANALYSIS_NOT_PROGRAMME_MAPPED",
            "retrieved_file": str(output.relative_to(BASE_DIR)),
            "sha256": file_sha256(output),
            "bytes": output.stat().st_size,
            "shape": _csv_shape(output),
            "query": query,
            "tableinfo": {
                "text": info.get("text"),
                "updated": info.get("updated"),
                "unit": info.get("unit"),
                "variables": [
                    {"id": v["id"], "text": v.get("text"), "values": len(v.get("values", []))}
                    for v in info.get("variables", [])
                ],
            },
        })

    with open(RAW_DIR / "SOURCE_MANIFEST.json", "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)

    print(f"Downloaded {len(manifest['sources'])} official source extracts.")


if __name__ == "__main__":
    main()

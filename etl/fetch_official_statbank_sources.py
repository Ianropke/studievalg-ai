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

import csv
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

SOURCES = {
    "LONS11": {
        "name": "Løn efter uddannelse",
        "url": "https://www.statistikbanken.dk/LONS11",
        "purpose": "Observed salary statistics by education group.",
    },
}


def _get(url: str, *, timeout: int = 120) -> requests.Response:
    response = requests.get(url, timeout=timeout, headers={"User-Agent": "studievalg-ai/1.0"})
    response.raise_for_status()
    return response


def get_tableinfo(table: str) -> dict[str, Any]:
    response = _get(f"{STATBANK_API}/tableinfo/{table}?lang=da", timeout=60)
    return response.json()


def download_targeted_statbank_csv(table: str, tableinfo: dict[str, Any]) -> Path:
    """Download a bounded, reproducible extract rather than the full Cartesian table."""
    variables = []
    for variable in tableinfo["variables"]:
        values = variable.get("values", [])
        if not values:
            raise RuntimeError(f"{table}: dimension {variable['id']} has no values")

        # Keep all categories for non-time dimensions. For time, use the most
        # recent five available years. This is deterministic and avoids an
        # accidental multi-million-cell request.
        if variable.get("time") is True:
            values = values[-5:]
        variables.append({"code": variable["id"], "values": values})

    payload = {"table": table, "format": "CSV", "lang": "da", "variables": variables}
    response = requests.post(f"{STATBANK_API}/data", json=payload, timeout=180)
    response.raise_for_status()
    output = RAW_DIR / f"{table}.csv"
    output.write_bytes(response.content)
    return output


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

    response = _get(UFM_EMPLOYMENT_CSV_URL, timeout=180)
    content_type = response.headers.get("content-type", "").lower()
    if "csv" not in content_type and not UFM_EMPLOYMENT_CSV_URL.lower().endswith(".csv"):
        raise RuntimeError(
            "UFM_EMPLOYMENT_CSV_URL did not return a CSV distribution. "
            f"content-type={content_type!r}"
        )

    output = RAW_DIR / "UFM_BESKAEFTIGELSE.csv"
    output.write_bytes(response.content)
    return output


def _csv_shape(path: Path) -> dict[str, int]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, [])
        rows = sum(1 for _ in reader)
    return {"columns": len(header), "rows": rows}


def main() -> None:
    manifest = {
        "retrieved_at": date.today().isoformat(),
        "sources": [],
        "methodological_note": (
            "UFM graduate outcomes are the preferred source for post-graduation "
            "employment. Statbank salary data are supporting observations. "
            "Neither source is automatically mapped to KOT programmes here."
        ),
    }

    ufm_path = download_ufm_employment()
    manifest["sources"].append({
        "provider": "Uddannelses- og Forskningsstyrelsen",
        "dataset": "Beskæftigelse",
        "source_url": UFM_EMPLOYMENT_PAGE,
        "distribution_url": UFM_EMPLOYMENT_CSV_URL,
        "retrieved_file": str(ufm_path.relative_to(BASE_DIR)),
        "shape": _csv_shape(ufm_path),
        "definition": "Beskæftigelsesgrad målt 12.-23. måned efter fuldførelse.",
    })

    for table, metadata in SOURCES.items():
        info = get_tableinfo(table)
        output = download_targeted_statbank_csv(table, info)
        manifest["sources"].append({
            "provider": "Danmarks Statistik",
            "table": table,
            "name": metadata["name"],
            "source_url": metadata["url"],
            "purpose": metadata["purpose"],
            "retrieved_file": str(output.relative_to(BASE_DIR)),
            "shape": _csv_shape(output),
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

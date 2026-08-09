"""Fetch official Danish labour-market and salary source data.

This script downloads raw data from Statistics Denmark's public Statbank API.
It deliberately stores RAW source extracts and provenance manifests; it does not
silently map education groups to individual KOT programmes.

Official sources:
- OVGARB10: transition from education to labour market.
- LONS11: salary by education.

The resulting files are inputs to a later, explicitly documented programme
mapping step. No title-based or heuristic KOT mapping is performed here.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

import requests

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "sources" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

STATBANK_API = "https://api.statbank.dk/v1"
SOURCES = {
    "OVGARB10": {
        "name": "Fra uddannelsesgrupper til fortsat uddannelse eller arbejdsmarked",
        "url": "https://www.dst.dk/da/Statistik/emner/uddannelse-og-forskning/veje-gennem-uddannelsessystemet/fra-uddannelse-til-arbejdsmarked",
        "purpose": "Observed post-education employment/labour-market status by education group.",
    },
    "LONS11": {
        "name": "Løn efter uddannelse",
        "url": "https://www.dst.dk/da/statistik/udgivelser/nyt/relateret?pid=981",
        "purpose": "Observed salary statistics by education.",
    },
}


def get_tableinfo(table: str) -> dict[str, Any]:
    response = requests.get(
        f"{STATBANK_API}/tableinfo/{table}",
        params={"lang": "da"},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def download_csv(table: str, tableinfo: dict[str, Any]) -> Path:
    # Select every category for every dimension except time, where we select
    # all available years. This creates a transparent raw extract. If the
    # table is too large, the script fails rather than silently sampling.
    variables = []
    for variable in tableinfo["variables"]:
        values = variable.get("values", [])
        if not values:
            raise RuntimeError(f"{table}: dimension {variable['id']} has no values")
        variables.append({"code": variable["id"], "values": values})

    payload = {
        "table": table,
        "format": "CSV",
        "lang": "da",
        "variables": variables,
    }
    response = requests.post(
        f"{STATBANK_API}/data",
        json=payload,
        timeout=180,
    )
    response.raise_for_status()
    output = RAW_DIR / f"{table}.csv"
    output.write_bytes(response.content)
    return output


def main() -> None:
    manifest = {
        "retrieved_at": date.today().isoformat(),
        "provider": "Danmarks Statistik",
        "api": STATBANK_API,
        "sources": [],
        "important_methodological_note": (
            "Raw Statbank data are not programme-level observations unless the "
            "source table itself identifies the programme. No KOT-to-education "
            "or KOT-to-DISCO mapping is inferred by this script."
        ),
    }

    for table, metadata in SOURCES.items():
        info = get_tableinfo(table)
        output = download_csv(table, info)
        manifest["sources"].append({
            "table": table,
            "name": metadata["name"],
            "source_url": metadata["url"],
            "purpose": metadata["purpose"],
            "retrieved_file": str(output.relative_to(BASE_DIR)),
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

    print(f"Downloaded {len(manifest['sources'])} official Statbank sources.")


if __name__ == "__main__":
    main()

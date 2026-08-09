"""Fetch official Statistics Denmark (StatBank) metadata and configured extracts.

The script deliberately requires an explicit query configuration. It never
silently downloads an arbitrary slice of a table and never invents an
education-code mapping. Each successful extract gets a sidecar provenance
manifest containing table, query, retrieval timestamp and source URL.

StatBank API documentation: https://www.dst.dk/en/Statistik/hjaelp-til-statistikbanken/api
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import os
import urllib.parse
import urllib.request

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw" / "statbank"
CONFIG_PATH = BASE_DIR / "data" / "sources" / "statbank_queries.json"
API = "https://api.statbank.dk/v1"


def _request(url: str, body: dict | None = None) -> bytes:
    if body is None:
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
    else:
        payload = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "Accept": "text/csv"}, method="POST")
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def fetch_tableinfo(table: str) -> Path:
    raw = _request(f"{API}/tableinfo/{urllib.parse.quote(table)}?lang=en")
    out = RAW_DIR / f"{table.upper()}_tableinfo.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(raw)
    return out


def fetch_extract(spec: dict) -> Path:
    table = spec["table"]
    output = spec["output"]
    query = {
        "table": table,
        "format": "CSV",
        "lang": "en",
        "variables": spec["variables"],
    }
    raw = _request(f"{API}/data", query)
    out = RAW_DIR / output
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(raw)

    manifest = {
        "schema_version": "1.0",
        "source": "Statistics Denmark / StatBank",
        "table": table,
        "query": query,
        "api_url": f"{API}/data",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "licence": "CC BY 4.0",
        "source_url": f"https://www.statistikbanken.dk/{table}",
    }
    manifest_path = out.with_suffix(out.suffix + ".manifest.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    for table in config.get("metadata_tables", []):
        print(f"Fetching metadata: {table}")
        fetch_tableinfo(table)
    for spec in config.get("extracts", []):
        print(f"Fetching data: {spec['table']}")
        fetch_extract(spec)
    print("✓ StatBank ingestion completed")


if __name__ == "__main__":
    main()

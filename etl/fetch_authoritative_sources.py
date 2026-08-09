"""Fetch authoritative Danish education/labour sources into data/sources/raw.

Sources:
- UFM Beskæftigelse via the public Datavejviser CKAN API.
- Statistics Denmark education register (current CSV distributions).
- Statistics Denmark LONS11 via Statbank API.

No values are embedded in the repository. Every downloaded file gets a SHA-256
manifest entry with source URL, retrieval time and dataset metadata.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "sources" / "raw"
MANIFEST = ROOT / "data" / "sources" / "raw_source_manifest.json"

UFM_CKAN = "https://datavejviser-indtastning.digst.govcloud.dk/api/3/action/package_show?id=beskaeftigelse"
DST_REGISTER_PAGE = "https://www.dst.dk/da/Statistik/dokumentation/metode/uddannelsesregistret"
STATBANK_API = "https://api.statbank.dk/v1/data"


def get(url: str) -> requests.Response:
    r = requests.get(url, timeout=60, headers={"User-Agent": "studievalg-ai-source-ingestion/1.0"})
    r.raise_for_status()
    return r


def save_bytes(name: str, data: bytes, metadata: dict) -> None:
    path = RAW / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    metadata.update({"path": str(path.relative_to(ROOT)), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})


def fetch_ufm(manifest: list[dict]) -> None:
    payload = get(UFM_CKAN).json()
    if not payload.get("success"):
        raise RuntimeError("UFM CKAN package_show returned success=false")
    resources = payload["result"]["resources"]
    csv_resources = [r for r in resources if str(r.get("format", "")).upper() == "CSV" and r.get("url")]
    if not csv_resources:
        raise RuntimeError("UFM Beskæftigelse: no CSV distribution found in public CKAN metadata")
    resource = csv_resources[0]
    r = get(resource["url"])
    meta = {
        "source": "Uddannelses- og Forskningsstyrelsen",
        "dataset": "Beskæftigelse",
        "distribution": "CSV",
        "catalog_url": "https://datavejviser.dk/katalog/uddannelses-og-forskningsstyrelsen/c7f294fe-bf49-4f1d-98c2-61f0573bcb67",
        "source_url": resource["url"],
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "license": "CC BY 4.0",
        "definition": "Graduate employment rate during months 12-23 after completion",
    }
    save_bytes("ufm_beskaeftigelse.csv", r.content, meta)
    manifest.append(meta)


def fetch_dst_register(manifest: list[dict]) -> None:
    html = get(DST_REGISTER_PAGE).text
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.I)
    wanted = [h for h in hrefs if any(x in h.lower() for x in ("udd_klassifikation", "audd_klassifikation", "kt_udd", "kt_audd", "uddvej")) and h.lower().endswith(".csv")]
    if not wanted:
        raise RuntimeError("DST education register page did not expose expected CSV links")
    seen = set()
    for href in wanted:
        url = urljoin(DST_REGISTER_PAGE, href)
        if url in seen:
            continue
        seen.add(url)
        r = get(url)
        name = Path(url.split("?")[0]).name or "dst_education_register.csv"
        meta = {
            "source": "Danmarks Statistik",
            "dataset": "Uddannelsesregistret",
            "distribution": "CSV",
            "source_url": url,
            "catalog_url": DST_REGISTER_PAGE,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "classification_note": "UDD/AUDD are the authoritative programme/qualification identifiers used to link education data.",
        }
        save_bytes(f"dst_education_register/{name}", r.content, meta)
        manifest.append(meta)


def fetch_lons11(manifest: list[dict]) -> None:
    tableinfo_url = "https://api.statbank.dk/v1/tableinfo/LONS11?lang=da"
    info = get(tableinfo_url).json()
    variables = {v["id"]: v for v in info["variables"]}
    required = {"UDD": "uddannelse"}
    missing = [k for k in required if k not in variables]
    if missing:
        raise RuntimeError(f"LONS11 schema changed; missing variables: {missing}")

    # Do not guess salary dimensions. Export TABLEINFO only; the exact LONS11
    # query must be configured once the project's desired population is reviewed.
    data = json.dumps(info, ensure_ascii=False, indent=2).encode("utf-8")
    meta = {
        "source": "Danmarks Statistik",
        "dataset": "LONS11",
        "distribution": "Statbank API",
        "source_url": tableinfo_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "status": "SCHEMA_FETCHED_QUERY_NOT_YET_EXecuted",
        "note": "The pipeline deliberately does not guess sector/pay-form/employee-group/sex dimensions.",
    }
    save_bytes("dst_lons11_tableinfo.json", data, meta)
    manifest.append(meta)


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []
    fetch_ufm(manifest)
    fetch_dst_register(manifest)
    fetch_lons11(manifest)
    MANIFEST.write_text(json.dumps({"retrieved_at": datetime.now(timezone.utc).isoformat(), "sources": manifest}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Fetched {len(manifest)} authoritative source artefacts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

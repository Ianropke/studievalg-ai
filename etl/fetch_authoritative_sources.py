"""Fetch authoritative Danish education/labour sources into data/sources/raw.

The ingestion uses public official distributions and stores immutable snapshots
with SHA-256 provenance. It never fabricates missing observations.

Important: the UFM KOT file is an admissions source, not itself a labour-market
identifier. The DST education register is used to discover UDD/AUDD mappings;
we do not infer a mapping from programme names.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "sources" / "raw"
MANIFEST = ROOT / "data" / "sources" / "raw_source_manifest.json"
CROSSWALK_SPEC = ROOT / "data" / "sources" / "education_crosswalk_spec.json"

UFM_CKAN_BASE = "https://datavejviser-indtastning.digst.govcloud.dk/api/3/action/package_show?id="
UFM_EMPLOYMENT_ID = "c7f294fe-bf49-4f1d-98c2-61f0573bcb67"
UFM_KOT_ID = "f13d335a-d4e5-456d-b176-2af0ba1d82c2"
UFM_KOT_CATALOG = "https://datavejviser.dk/katalog/uddannelses-og-forskningsstyrelsen/f13d335a-d4e5-456d-b176-2af0ba1d82c2"
UFM_EMPLOYMENT_CATALOG = "https://datavejviser.dk/katalog/uddannelses-og-forskningsstyrelsen/c7f294fe-bf49-4f1d-98c2-61f0573bcb67"
DST_REGISTER_PAGE = "https://www.dst.dk/da/Statistik/dokumentation/metode/uddannelsesregistret"


def get(url: str) -> requests.Response:
    r = requests.get(url, timeout=60, headers={"User-Agent": "studievalg-ai-source-ingestion/1.3"})
    r.raise_for_status()
    return r


def save_bytes(name: str, data: bytes, metadata: dict) -> None:
    path = RAW / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    metadata.update({
        "path": str(path.relative_to(ROOT)),
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    })


def fetch_ufm_dataset(dataset_id: str, dataset_name: str, catalog_url: str, filename: str, manifest: list[dict]) -> None:
    payload = get(UFM_CKAN_BASE + dataset_id).json()
    if not payload.get("success"):
        raise RuntimeError(f"UFM CKAN package_show returned success=false for {dataset_name}")
    resources = payload["result"]["resources"]
    csv_resources = [r for r in resources if str(r.get("format", "")).upper() == "CSV" and r.get("url")]
    if not csv_resources:
        raise RuntimeError(f"{dataset_name}: no CSV distribution found in public CKAN metadata")
    resource = csv_resources[0]
    r = get(resource["url"])
    meta = {
        "source": "Uddannelses- og Forskningsstyrelsen",
        "dataset": dataset_name,
        "distribution": "CSV",
        "catalog_url": catalog_url,
        "source_url": resource["url"],
        "resource_name": resource.get("name"),
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "license": "CC BY 4.0",
    }
    save_bytes(filename, r.content, meta)
    manifest.append(meta)


def fetch_dst_register(manifest: list[dict]) -> None:
    html = get(DST_REGISTER_PAGE).text
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.I)
    wanted = [
        h for h in hrefs
        if any(x in h.lower() for x in ("udd_klassifikation", "audd_klassifikation", "kt_udd", "kt_audd", "uddvej"))
        and h.lower().endswith(".csv")
    ]
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
            "classification_note": "UDD/AUDD are authoritative Danish education identifiers; programme-to-observation mapping must be explicit.",
        }
        save_bytes(f"dst_education_register/{name}", r.content, meta)
        manifest.append(meta)


def fetch_lons11_schema(manifest: list[dict]) -> None:
    tableinfo_url = "https://api.statbank.dk/v1/tableinfo/LONS11?lang=da"
    info = get(tableinfo_url).json()
    variables = {v["id"]: v for v in info["variables"]}
    # Do not assume that a variable named UDD exists forever. Fail clearly if
    # the table's education dimension changes and require a reviewed query.
    if not any(v.get("id", "").upper() == "UDD" for v in info["variables"]):
        raise RuntimeError("LONS11 schema changed; no UDD education variable found")
    data = json.dumps(info, ensure_ascii=False, indent=2).encode("utf-8")
    meta = {
        "source": "Danmarks Statistik",
        "dataset": "LONS11",
        "distribution": "Statbank API",
        "source_url": tableinfo_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "status": "SCHEMA_ONLY",
        "note": "Salary dimensions are deliberately not guessed. A reviewed query is required before downloading salary observations.",
    }
    save_bytes("dst_lons11_tableinfo.json", data, meta)
    manifest.append(meta)


def write_crosswalk_spec() -> None:
    spec = {
        "version": "1.0",
        "status": "REQUIRES_SOURCE_MAPPING",
        "grain": "KOT programme -> official Danish education identifier",
        "canonical_identifier": "UDD",
        "secondary_identifier": "AUDD",
        "rules": [
            "Do not map by fuzzy programme-title similarity.",
            "Do not infer an education code from DISCO-08.",
            "Do not use KOT number as a labour-market code unless the source explicitly defines that relationship.",
            "Each production mapping must contain kot_code, udd_code, mapping_method, mapping_source, mapping_period, and mapping_confidence.",
            "Unmapped programmes remain UNMAPPED and cannot receive labour/salary scores."
        ],
        "allowed_mapping_methods": ["OFFICIAL_SOURCE", "VERIFIED_CROSSWALK"],
        "required_provenance": ["source_url", "dataset", "period"],
        "note": "The ingestion pipeline creates the contract and raw source snapshots; it does not manufacture the KOT-to-UDD relationship."
    }
    CROSSWALK_SPEC.parent.mkdir(parents=True, exist_ok=True)
    CROSSWALK_SPEC.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []
    fetch_ufm_dataset(UFM_EMPLOYMENT_ID, "Beskæftigelse", UFM_EMPLOYMENT_CATALOG, "ufm_beskaeftigelse.csv", manifest)
    fetch_ufm_dataset(UFM_KOT_ID, "Søgning og optagelse via KOT", UFM_KOT_CATALOG, "ufm_kot.csv", manifest)
    fetch_dst_register(manifest)
    fetch_lons11_schema(manifest)
    write_crosswalk_spec()
    MANIFEST.write_text(
        json.dumps({"retrieved_at": datetime.now(timezone.utc).isoformat(), "sources": manifest}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Fetched {len(manifest)} authoritative source artefacts.")
    print(f"Crosswalk contract written to {CROSSWALK_SPEC.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

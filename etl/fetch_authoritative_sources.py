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
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "sources" / "raw"
MANIFEST = ROOT / "data" / "sources" / "raw_source_manifest.json"
CROSSWALK_SPEC = ROOT / "data" / "sources" / "education_crosswalk_spec.json"

UFM_EMPLOYMENT_ID = "c7f294fe-bf49-4f1d-98c2-61f0573bcb67"
UFM_KOT_ID = "f13d335a-d4e5-456d-b176-2af0ba1d82c2"
UFM_KOT_CATALOG = "https://datavejviser.dk/katalog/uddannelses-og-forskningsstyrelsen/f13d335a-d4e5-456d-b176-2af0ba1d82c2"
UFM_EMPLOYMENT_CATALOG = "https://datavejviser.dk/katalog/uddannelses-og-forskningsstyrelsen/c7f294fe-bf49-4f1d-98c2-61f0573bcb67"
DST_REGISTER_PAGE = "https://www.dst.dk/da/Statistik/dokumentation/metode/uddannelsesregistret"


def get(url: str) -> requests.Response:
    r = requests.get(url, timeout=60, headers={"User-Agent": "studievalg-ai-source-ingestion/1.3"})
    r.raise_for_status()
    return r


def save_bytes(raw_root: Path, name: str, data: bytes, metadata: dict) -> None:
    path = raw_root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    metadata.update({
        "path": str((RAW / name).relative_to(ROOT)),
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    })


def extract_distributions(payload: dict) -> list[dict[str, str | None]]:
    distributions = []
    for item in payload.get("@graph", []):
        item_type = item.get("@type")
        types = item_type if isinstance(item_type, list) else [item_type]
        if "dcat:Distribution" not in types:
            continue
        access = item.get("dcat:accessURL") or {}
        distributions.append({
            "format": item.get("dct:format"),
            "access_url": access.get("@id") if isinstance(access, dict) else None,
            "title": item.get("dct:title"),
        })
    return distributions


def fetch_ufm_catalog_metadata(
    raw_root: Path,
    dataset_id: str,
    dataset_name: str,
    catalog_url: str,
    filename: str,
    manifest: list[dict],
) -> None:
    """Snapshot current official metadata without pretending the report page is CSV.

    Datavejviser's former CKAN ``package_show`` endpoint now returns 404. Its
    public DCAT JSON-LD endpoint is current, but the advertised CSV distribution
    currently points to the rendered UFM report rather than a machine CSV URL.
    We therefore preserve metadata and fail closed for programme scoring.
    """
    metadata_url = f"{catalog_url}.jsonld"
    response = get(metadata_url)
    payload = response.json()
    distributions = extract_distributions(payload)
    if not distributions:
        raise RuntimeError(f"{dataset_name}: official DCAT metadata has no distributions")
    csv_distributions = [item for item in distributions if str(item.get("format", "")).upper() == "CSV"]
    if not csv_distributions:
        raise RuntimeError(f"{dataset_name}: official DCAT metadata no longer declares a CSV distribution")
    csv_url = csv_distributions[0].get("access_url")
    meta = {
        "source": "Uddannelses- og Forskningsstyrelsen",
        "dataset": dataset_name,
        "dataset_id": dataset_id,
        "distribution": "DCAT JSON-LD metadata",
        "catalog_url": catalog_url,
        "source_url": metadata_url,
        "declared_csv_access_url": csv_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "license": "CC BY 4.0",
        "status": "METADATA_ONLY",
        "note": (
            "The declared CSV access URL currently resolves to the rendered UFM report page, "
            "not a verified CSV distribution. It is not ingested as programme-level evidence."
        ),
        "distributions": distributions,
    }
    save_bytes(raw_root, filename, response.content, meta)
    manifest.append(meta)


def fetch_dst_register(raw_root: Path, manifest: list[dict]) -> None:
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
        save_bytes(raw_root, f"dst_education_register/{name}", r.content, meta)
        manifest.append(meta)


def validate_lons11_schema(info: dict) -> str:
    education_variables = [
        str(variable.get("id", ""))
        for variable in info.get("variables", [])
        if str(variable.get("id", "")).upper() in {"UDD", "UDDANNELSE"}
    ]
    if not education_variables:
        raise RuntimeError("LONS11 schema changed; no UDD/UDDANNELSE education variable found")
    return education_variables[0]


def fetch_lons11_schema(raw_root: Path, manifest: list[dict]) -> None:
    tableinfo_url = "https://api.statbank.dk/v1/tableinfo/LONS11?lang=da"
    info = get(tableinfo_url).json()
    education_variable = validate_lons11_schema(info)
    data = json.dumps(info, ensure_ascii=False, indent=2).encode("utf-8")
    meta = {
        "source": "Danmarks Statistik",
        "dataset": "LONS11",
        "distribution": "Statbank API",
        "source_url": tableinfo_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "status": "SCHEMA_ONLY",
        "education_variable": education_variable,
        "note": "Salary dimensions are deliberately not guessed. A reviewed query is required before downloading salary observations.",
    }
    save_bytes(raw_root, "dst_lons11_tableinfo.json", data, meta)
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
        "allowed_mapping_methods": ["OFFICIAL", "DOCUMENTED_CROSSWALK", "EXPERT_REVIEW"],
        "required_provenance": ["source_url", "dataset", "period"],
        "note": "The ingestion pipeline creates the contract and raw source snapshots; it does not manufacture the KOT-to-UDD relationship."
    }
    CROSSWALK_SPEC.parent.mkdir(parents=True, exist_ok=True)
    CROSSWALK_SPEC.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    manifest: list[dict] = []
    with tempfile.TemporaryDirectory(prefix="uddannelsesindsigt-source-refresh-") as temp_dir:
        staged_raw = Path(temp_dir) / "raw"
        staged_raw.mkdir(parents=True, exist_ok=True)
        fetch_ufm_catalog_metadata(staged_raw, UFM_EMPLOYMENT_ID, "Beskæftigelse", UFM_EMPLOYMENT_CATALOG, "ufm_beskaeftigelse_catalog.jsonld", manifest)
        fetch_ufm_catalog_metadata(staged_raw, UFM_KOT_ID, "Søgning og optagelse via KOT", UFM_KOT_CATALOG, "ufm_kot_catalog.jsonld", manifest)
        fetch_dst_register(staged_raw, manifest)
        fetch_lons11_schema(staged_raw, manifest)

        # Publish only after every official endpoint and schema check succeeded.
        # Existing O*NET snapshots are left untouched.
        RAW.mkdir(parents=True, exist_ok=True)
        for staged in staged_raw.rglob("*"):
            if staged.is_file():
                destination = RAW / staged.relative_to(staged_raw)
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(staged, destination)
    write_crosswalk_spec()
    manifest_payload = {
        "schema_version": "2.0",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "sources": manifest,
        "status_counts": {
            status: sum(1 for item in manifest if item.get("status", "AVAILABLE") == status)
            for status in sorted({item.get("status", "AVAILABLE") for item in manifest})
        },
        "scoring_readiness": "BLOCKED_PENDING_VERIFIED_UFM_DISTRIBUTION_AND_PROGRAMME_MAPPINGS",
    }
    temporary_manifest = MANIFEST.with_suffix(".json.tmp")
    temporary_manifest.write_text(json.dumps(manifest_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_manifest.replace(MANIFEST)
    print(f"Fetched {len(manifest)} authoritative source artefacts.")
    print(f"Crosswalk contract written to {CROSSWALK_SPEC.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

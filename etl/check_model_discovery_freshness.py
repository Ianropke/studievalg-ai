"""Check model-version consistency and search/agent discoverability.

The default mode is deterministic and suitable for pull requests. ``--live``
also verifies the current public deployment and checks whether O*NET has
published a newer production release. A newer upstream release fails the check
so it is reviewed rather than silently changing public scores.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_MODEL = "2026.6"
EXPECTED_ONET = "31.0"
EXPECTED_MAPPED = 569
EXPECTED_TOTAL = 1413
SITE = "https://uddannelsesindsigt.com"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FRESHNESS CHECK FAILED: {message}")


def local_checks() -> None:
    status = (ROOT / "web" / "src" / "lib" / "dataStatus.ts").read_text(encoding="utf-8")
    llms = (ROOT / "web" / "public" / "llms.txt").read_text(encoding="utf-8")
    llms_full = (ROOT / "web" / "public" / "llms-full.txt").read_text(encoding="utf-8")
    robots = (ROOT / "web" / "src" / "app" / "robots.ts").read_text(encoding="utf-8")
    sitemap = (ROOT / "web" / "src" / "app" / "sitemap.ts").read_text(encoding="utf-8")
    manifest = json.loads((ROOT / "data" / "sources" / "onet31_source_manifest.json").read_text(encoding="utf-8"))
    report = json.loads((ROOT / "data" / "ONET31_MIGRATION_REPORT.json").read_text(encoding="utf-8"))

    require(f'methodologyVersion: "{EXPECTED_MODEL}"' in status, "central model version is stale")
    require('source: "O*NET 31.0' in status, "central source label does not identify O*NET 31.0")
    require(manifest.get("dataset") == f"O*NET {EXPECTED_ONET}", "source manifest has wrong O*NET version")
    require(report.get("model_version") == EXPECTED_MODEL, "migration report has wrong model version")
    require(report.get("migrated_programme_count") == EXPECTED_MAPPED, "mapped programme count drifted")
    require(report.get("programme_count") == EXPECTED_TOTAL, "catalogue count drifted")
    for text, name in ((llms, "llms.txt"), (llms_full, "llms-full.txt")):
        require("O*NET 31.0" in text, f"{name} lacks the active source version")
        require("569" in text and ("1.413" in text or "1,413" in text), f"{name} lacks coverage disclosure")
    require('allow: "/"' in robots, "robots route no longer allows public crawling")
    require("sitemap.xml" in robots, "robots route lacks sitemap discovery")
    require("MODEL_LAST_MODIFIED" in sitemap, "sitemap is not tied to model freshness")
    print("✓ Local model, SEO and agent-discovery metadata are consistent")


def get(url: str):
    import requests

    response = requests.get(url, timeout=30, headers={"User-Agent": "Uddannelsesindsigt-Freshness-Audit/1.0"})
    response.raise_for_status()
    return response


def live_checks() -> None:
    release_page = get("https://www.onetcenter.org/db_releases.html").text
    match = re.search(r"current production release of the O\*NET database is\s+(\d+(?:\.\d+)?)", release_page, re.I)
    if not match:
        match = re.search(r"O\*NET\s+(\d+(?:\.\d+)?)\s+(?:August|May|February|December)\s+\d{4}", release_page, re.I)
    require(bool(match), "could not identify the current O*NET production release")
    require(match.group(1) == EXPECTED_ONET, f"O*NET {match.group(1)} is current; review migration from {EXPECTED_ONET}")

    live_expectations = {
        "/robots.txt": ("sitemap.xml",),
        "/sitemap.xml": ("/evidens", "/guides/ai-og-uddannelsesvalg"),
        "/llms.txt": ("O*NET 31.0", "569", "1.413"),
        "/llms-full.txt": ("model version: 2026.6", "O*NET 31.0", "PROVENANCE_REQUIRED"),
        "/evidens": ("O*NET 31.0", "569", "legacy-baseline"),
    }
    for path, needles in live_expectations.items():
        body = get(SITE + path).text
        for needle in needles:
            require(needle.lower() in body.lower(), f"{path} lacks expected marker: {needle}")
    print("✓ Live crawl surfaces and O*NET release freshness passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Also check the deployed site and current upstream release")
    args = parser.parse_args()
    local_checks()
    if args.live:
        live_checks()


if __name__ == "__main__":
    main()

"""Audit production discovery, representative routes, links and response budgets.

Internal failures are blocking. External source availability is reported but is
not a release gate because official publishers may rate-limit automated checks.
Latency and byte counts are observations, not stable performance guarantees.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SITE = "https://uddannelsesindsigt.com"
DEFAULT_OUTPUT = ROOT / "data" / "SITE_QUALITY_REPORT.json"
KEY_PATHS = ("/", "/analyse", "/evidens", "/guides", "/sammenlign", "/om-os")


def sample_evenly(values: list[str], count: int) -> list[str]:
    if count <= 0 or not values:
        return []
    if len(values) <= count:
        return values
    if count == 1:
        return [values[0]]
    return [values[round(index * (len(values) - 1) / (count - 1))] for index in range(count)]


def canonical_from_html(html: str) -> str | None:
    match = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', html, re.I)
    if not match:
        match = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html, re.I)
    return match.group(1) if match else None


def canonical_matches_page(canonical: str | None, expected_url: str) -> bool:
    if not canonical:
        return False
    actual = urlparse(canonical)
    expected = urlparse(expected_url)
    actual_path = actual.path.rstrip("/") or "/"
    expected_path = expected.path.rstrip("/") or "/"
    return (
        actual.scheme == "https"
        and actual.netloc.lower() == expected.netloc.lower()
        and actual_path == expected_path
        and not actual.query
        and not actual.fragment
    )


def get(session: requests.Session, url: str) -> dict:
    started = time.perf_counter()
    try:
        response = session.get(url, timeout=30, allow_redirects=True)
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        return {
            "url": url,
            "final_url": response.url,
            "status": response.status_code,
            "elapsed_ms": elapsed_ms,
            "bytes": len(response.content),
            "content_type": response.headers.get("content-type", ""),
            "body": response.text,
            "error": None,
        }
    except requests.RequestException as error:
        return {
            "url": url,
            "final_url": None,
            "status": None,
            "elapsed_ms": round((time.perf_counter() - started) * 1000),
            "bytes": 0,
            "content_type": "",
            "body": "",
            "error": str(error),
        }


def audit(site: str, sample_size: int) -> dict:
    site = site.rstrip("/")
    session = requests.Session()
    session.headers["User-Agent"] = "Uddannelsesindsigt-Site-Quality/1.0"
    failures: list[str] = []

    discovery = {}
    for path in ("/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt"):
        result = get(session, site + path)
        discovery[path] = {key: value for key, value in result.items() if key != "body"}
        if result["status"] != 200:
            failures.append(f"{path} returned {result['status'] or result['error']}")

    robots_body = get(session, site + "/robots.txt")["body"]
    if f"Sitemap: {site}/sitemap.xml" not in robots_body:
        failures.append("robots.txt does not advertise the canonical sitemap")

    sitemap_result = get(session, site + "/sitemap.xml")
    sitemap_urls: list[str] = []
    if sitemap_result["status"] == 200:
        try:
            root = ET.fromstring(sitemap_result["body"])
            sitemap_urls = [element.text or "" for element in root.findall(".//{*}loc")]
        except ET.ParseError as error:
            failures.append(f"sitemap.xml is invalid XML: {error}")
    if len(sitemap_urls) < 1400:
        failures.append(f"sitemap has only {len(sitemap_urls)} URLs")

    programme_urls = [url for url in sitemap_urls if "/uddannelse/" in url]
    checked_urls = [urljoin(site + "/", path.lstrip("/")) for path in KEY_PATHS]
    checked_urls.extend(sample_evenly(programme_urls, sample_size))
    pages = []
    for url in checked_urls:
        result = get(session, url)
        body = result.pop("body")
        canonical = canonical_from_html(body)
        title_present = bool(re.search(r"<title>[^<]+</title>", body, re.I))
        description_present = bool(re.search(r'<meta[^>]+name=["\']description["\']', body, re.I))
        language_is_danish = bool(re.search(r'<html[^>]+lang=["\']da["\']', body, re.I))
        page = {
            **result,
            "canonical": canonical,
            "title_present": title_present,
            "description_present": description_present,
            "language_is_danish": language_is_danish,
        }
        pages.append(page)
        if result["status"] != 200:
            failures.append(f"{url} returned {result['status'] or result['error']}")
        if not canonical_matches_page(canonical, url):
            failures.append(f"{url} has missing or mismatched canonical URL {canonical!r}")
        if not title_present or not description_present or not language_is_danish:
            failures.append(f"{url} lacks title, description or Danish language metadata")

    external_sources = json.loads((ROOT / "data" / "sources" / "official_sources.json").read_text(encoding="utf-8"))
    external_urls = sorted({source.get("url") for source in external_sources.get("sources", []) if source.get("url")})
    external = []
    for url in external_urls:
        result = get(session, url)
        result.pop("body")
        external.append(result)

    return {
        "schema_version": "1.0",
        "site": site,
        "status": "PASS" if not failures else "FAIL",
        "sitemap_url_count": len(sitemap_urls),
        "programme_url_count": len(programme_urls),
        "discovery": discovery,
        "representative_pages": pages,
        "external_sources_informational": external,
        "failures": failures,
        "performance_note": "Response durations and sizes are single-run operational observations, not Core Web Vitals.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", default=DEFAULT_SITE)
    parser.add_argument("--sample-size", type=int, default=25)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    report = audit(args.site, args.sample_size)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"{report['status']}: {report['sitemap_url_count']} sitemap URLs; "
        f"{len(report['representative_pages'])} representative pages checked"
    )
    for failure in report["failures"]:
        print(f"- {failure}")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

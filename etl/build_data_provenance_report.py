"""Build a machine-readable provenance audit for programme-level metrics.

The report trusts only explicit programme-level provenance emitted by the
canonical profile pipeline. A global source registry is never sufficient.
"""

from pathlib import Path
import json
from collections import Counter, defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent
CATALOG_CANDIDATES = [
    BASE_DIR / "data" / "all_programs_catalog.json",
    BASE_DIR / "web" / "public" / "data" / "all_programs_catalog.json",
    BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json",
]
OUTPUT_PATH = BASE_DIR / "data" / "DATA_PROVENANCE_REPORT.json"
METRICS = ("automation_risk", "augmentation_potential", "labour_demand", "salary_growth")
EXPLICIT_STATUSES = {
    "OBSERVED",
    "DERIVED",
    "CROSSWALK",
    "CROSSWALK_OR_MODEL",
    "MODEL",
    "MODEL_OR_CROSSWALK",
    "PROVENANCE_REQUIRED",
    "UNKNOWN",
}
REQUIRED_METRIC_PROVENANCE = ("source", "source_url", "dataset", "period", "transformation")


def _catalog_path():
    for path in CATALOG_CANDIDATES:
        if path.exists():
            return path
    raise FileNotFoundError("No all_programs_catalog.json found")


def _score_signature(scores):
    return tuple(scores.get(metric) for metric in METRICS)


def _status_from_export(programme, metric, value):
    provenance = (programme.get("score_provenance") or {}).get(metric) or {}
    explicit = provenance.get("epistemic_status")
    if value is None:
        return "MISSING"
    if explicit in EXPLICIT_STATUSES:
        return explicit
    if metric in {"automation_risk", "augmentation_potential"}:
        mapping = programme.get("mapping_provenance") or {}
        disco = str(programme.get("disco08") or "").strip().upper()
        mapping_is_explicit = (
            disco not in {"", "NONE", "NAN", "DEFAULT"}
            and str(mapping.get("source") or "").strip()
            and str(mapping.get("period") or "").strip()
            and str(mapping.get("confidence") or "").upper() not in {"", "UNKNOWN", "NAN"}
        )
        return "MODEL_OR_CROSSWALK" if mapping_is_explicit else "PROVENANCE_REQUIRED"
    return "PROVENANCE_REQUIRED"


def _has_complete_metric_provenance(exported, status):
    if status in {"MISSING", "PROVENANCE_REQUIRED", "UNKNOWN"}:
        return False
    return (
        all(str(exported.get(field) or "").strip() for field in REQUIRED_METRIC_PROVENANCE)
        and str(exported.get("confidence") or "").upper() not in {"", "UNKNOWN", "NAN"}
    )


def build_report():
    catalog_path = _catalog_path()
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    programme_rows = []
    status_counter = Counter()
    status_by_metric = {metric: Counter() for metric in METRICS}
    coverage_by_metric = {metric: {"value_count": 0, "complete_provenance_count": 0} for metric in METRICS}
    signature_groups = defaultdict(list)
    default_mapping_count = 0

    for programme in catalog:
        scores = programme.get("scores", {}) or {}
        signature = _score_signature(scores)
        signature_groups[signature].append(str(programme.get("kot_nr", "")))

        disco = programme.get("disco08")
        mapping = programme.get("mapping_provenance") or {}
        is_default_mapping = disco in (None, "", "DEFAULT") or mapping.get("status") in {"DEFAULT_UNVERIFIED", "INVALID_DEFAULT_MAPPING"}
        if is_default_mapping:
            default_mapping_count += 1

        row = {
            "kot_nr": str(programme.get("kot_nr", "")),
            "title": programme.get("udbud_titel", ""),
            "institution": programme.get("institution"),
            "city": programme.get("by"),
            "disco08": disco,
            "mapping": mapping,
            "metrics": {},
        }

        for metric in METRICS:
            value = scores.get(metric)
            exported = (programme.get("score_provenance") or {}).get(metric) or {}
            status = _status_from_export(programme, metric, value)
            complete_provenance = _has_complete_metric_provenance(exported, status)
            row["metrics"][metric] = {
                "value": value,
                "epistemic_status": status,
                "source": exported.get("source"),
                "source_url": exported.get("source_url"),
                "dataset": exported.get("dataset"),
                "period": exported.get("period"),
                "transformation": exported.get("transformation"),
                "coverage": exported.get("coverage"),
                "confidence": exported.get("confidence", "UNKNOWN"),
                "provenance_complete": complete_provenance,
            }
            status_counter[status] += 1
            status_by_metric[metric][status] += 1
            if value is not None:
                coverage_by_metric[metric]["value_count"] += 1
            if complete_provenance:
                coverage_by_metric[metric]["complete_provenance_count"] += 1

        programme_rows.append(row)

    repeated_groups = [
        {"signature": list(signature), "programme_count": len(kots), "kot_numbers": kots[:100]}
        for signature, kots in signature_groups.items()
        if len(kots) >= 5
    ]
    repeated_groups.sort(key=lambda x: x["programme_count"], reverse=True)
    largest_group = repeated_groups[0] if repeated_groups else None
    repeated_warning = bool(largest_group and largest_group["programme_count"] >= max(5, len(catalog) * 0.05))

    report = {
        "schema_version": "2.1",
        "generated_by": "etl/build_data_provenance_report.py",
        "catalog_path": str(catalog_path.relative_to(BASE_DIR)),
        "purpose": "Audit explicit programme-level provenance and detect fallback/default scoring.",
        "epistemic_statuses": {
            "OBSERVED": "Directly observed from a named source dataset.",
            "DERIVED": "Calculated deterministically from observed source data.",
            "CROSSWALK": "Transferred through an occupation/skills classification mapping.",
            "MODEL": "Produced by a documented modelling assumption or formula.",
            "CROSSWALK_OR_MODEL": "Crosswalk/model estimate with explicit source metadata.",
            "MODEL_OR_CROSSWALK": "Model/crosswalk estimate pending programme-specific provenance.",
            "PROVENANCE_REQUIRED": "A numeric value exists but its raw source/transformation is not documented.",
            "MISSING": "No numeric value is available.",
        },
        "summary": {
            "programme_count": len(catalog),
            "metric_counts": dict(status_counter),
            "default_mapping_count": default_mapping_count,
            "default_mapping_share": round(default_mapping_count / len(catalog), 4) if catalog else 0,
            "unique_score_vectors": len(signature_groups),
            "repeated_score_vector_groups": len(repeated_groups),
            "largest_repeated_score_vector": largest_group,
            "status_counts_by_metric": {metric: dict(counts) for metric, counts in status_by_metric.items()},
            "metric_provenance_coverage": {
                metric: {
                    **counts,
                    "coverage_share": round(counts["complete_provenance_count"] / len(catalog), 4) if catalog else 0,
                }
                for metric, counts in coverage_by_metric.items()
            },
            "critical_warnings": [
                warning for warning in [
                    "DEFAULT occupation mapping is present for a substantial number of programmes." if default_mapping_count else None,
                    "A large number of programmes share an identical score vector; programme-specific scoring may not be populated." if repeated_warning else None,
                    "labour_demand or salary_growth remain blocked from being called observed unless their exported provenance is DERIVED/OBSERVED.",
                ] if warning
            ],
        },
        "programmes": programme_rows,
        "repeated_score_vectors": repeated_groups[:20],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✓ Provenance report written to {OUTPUT_PATH}")
    print(f"✓ Programmes audited: {len(catalog)}")
    print(f"✓ Default mappings: {default_mapping_count}")
    print(f"✓ Unique score vectors: {len(signature_groups)}")
    return report


if __name__ == "__main__":
    build_report()

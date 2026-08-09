"""Build a machine-readable provenance audit for programme-level metrics.

This audit is intentionally conservative. A numeric value is not treated as
credible merely because it exists or because a source exists in the global
registry. It detects missing provenance, default occupation mappings and
suspiciously repeated score vectors.
"""

from pathlib import Path
import json
from collections import Counter, defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent
CATALOG_CANDIDATES = [
    BASE_DIR / "data" / "all_programs_catalog.json",
    BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json",
]
OUTPUT_PATH = BASE_DIR / "data" / "DATA_PROVENANCE_REPORT.json"

METRICS = (
    "automation_risk",
    "augmentation_potential",
    "labour_demand",
    "salary_growth",
)


def _catalog_path():
    for path in CATALOG_CANDIDATES:
        if path.exists():
            return path
    raise FileNotFoundError("No all_programs_catalog.json found")


def _score_signature(scores):
    return tuple(scores.get(metric) for metric in METRICS)


def _metric_status(programme, metric, value):
    if value is None:
        return "MISSING"
    if metric in {"automation_risk", "augmentation_potential"}:
        # Until a programme-specific occupation/task crosswalk is documented,
        # these remain model/crosswalk estimates.
        return "MODEL_OR_CROSSWALK"
    return "PROVENANCE_REQUIRED"


def build_report():
    catalog_path = _catalog_path()
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    programme_rows = []
    status_counter = Counter()
    signature_groups = defaultdict(list)
    default_mapping_count = 0

    for programme in catalog:
        scores = programme.get("scores", {}) or {}
        signature = _score_signature(scores)
        signature_groups[signature].append(str(programme.get("kot_nr", "")))

        disco = programme.get("disco08")
        is_default_mapping = disco in (None, "", "DEFAULT")
        if is_default_mapping:
            default_mapping_count += 1

        row = {
            "kot_nr": str(programme.get("kot_nr", "")),
            "title": programme.get("udbud_titel", ""),
            "institution": programme.get("institution"),
            "city": programme.get("by"),
            "disco08": disco,
            "disco_title": programme.get("disco_titel"),
            "mapping": {
                "status": "DEFAULT_UNVERIFIED" if is_default_mapping else "UNVERIFIED",
                "method": "DEFAULT_FALLBACK" if is_default_mapping else None,
                "source": None,
                "confidence": "LOW" if is_default_mapping else "UNKNOWN",
            },
            "metrics": {},
        }

        for metric in METRICS:
            value = scores.get(metric)
            status = _metric_status(programme, metric, value)
            row["metrics"][metric] = {
                "value": value,
                "epistemic_status": status,
                "source": None,
                "dataset": None,
                "period": None,
                "transformation": None,
                "coverage": None,
                "confidence": "LOW" if is_default_mapping else "UNKNOWN",
            }
            status_counter[status] += 1

        # ai_resilience is derived from the model metrics if present, but it is
        # never treated as independently observed evidence.
        if "ai_resilience" in scores:
            row["metrics"]["ai_resilience"] = {
                "value": scores["ai_resilience"],
                "epistemic_status": "MODEL_DERIVED",
                "source": None,
                "dataset": None,
                "period": None,
                "transformation": "Documented model formula; not an observed labour-market outcome.",
                "coverage": None,
                "confidence": "LOW",
            }
            status_counter["MODEL_DERIVED"] += 1

        programme_rows.append(row)

    # Repeated vectors are not automatically wrong, but a very large cluster is
    # a strong signal that programme-specific metrics are not being populated.
    repeated_groups = [
        {"signature": list(signature), "programme_count": len(kots), "kot_numbers": kots[:100]}
        for signature, kots in signature_groups.items()
        if len(kots) >= 5
    ]
    repeated_groups.sort(key=lambda x: x["programme_count"], reverse=True)

    largest_group = repeated_groups[0] if repeated_groups else None
    repeated_score_warning = bool(largest_group and largest_group["programme_count"] >= max(5, len(catalog) * 0.05))

    report = {
        "schema_version": "2.0",
        "generated_by": "etl/build_data_provenance_report.py",
        "catalog_path": str(catalog_path.relative_to(BASE_DIR)),
        "purpose": "Audit programme-level provenance and detect fallback/default scoring.",
        "epistemic_statuses": {
            "OBSERVED": "Directly observed from a named source dataset.",
            "DERIVED": "Calculated deterministically from observed source data.",
            "CROSSWALK": "Transferred through an occupation/skills classification mapping.",
            "MODEL": "Produced by a documented modelling assumption or formula.",
            "MODEL_OR_CROSSWALK": "Model/crosswalk estimate pending programme-specific provenance.",
            "PROVENANCE_REQUIRED": "A numeric value exists but its raw source/transformation is not documented.",
            "MODEL_DERIVED": "Derived from model metrics; not an observed outcome.",
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
            "critical_warnings": [
                warning for warning in [
                    "DEFAULT occupation mapping is present for a substantial number of programmes." if default_mapping_count else None,
                    "A large number of programmes share an identical score vector; programme-specific scoring may not be populated." if repeated_score_warning else None,
                    "labour_demand and salary_growth remain blocked from being called observed until raw provenance is attached.",
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

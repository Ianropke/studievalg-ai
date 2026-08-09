"""Build a machine-readable provenance audit for programme-level metrics.

The audit deliberately distinguishes observed, derived, crosswalk and model
metrics. It never upgrades a metric's evidence quality merely because a source
exists in the global source registry.
"""

from pathlib import Path
import json
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent.parent
CATALOG_PATH = BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json"
OUTPUT_PATH = BASE_DIR / "data" / "DATA_PROVENANCE_REPORT.json"

METRICS = (
    "automation_risk",
    "augmentation_potential",
    "labour_demand",
    "salary_growth",
    "ai_resilience",
)


def build_report():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    programme_rows = []
    status_counter = Counter()

    for programme in catalog:
        scores = programme.get("scores", {})
        row = {
            "kot_nr": str(programme.get("kot_nr", "")),
            "title": programme.get("udbud_titel", ""),
            "institution": programme.get("institution"),
            "city": programme.get("by"),
            "disco08": programme.get("disco08"),
            "disco_title": programme.get("disco_titel"),
            "metrics": {},
        }

        for metric in METRICS:
            value = scores.get(metric)
            if value is None:
                status = "MISSING"
            elif metric in {"automation_risk", "augmentation_potential"}:
                status = "MODEL_OR_CROSSWALK"
            elif metric == "ai_resilience":
                status = "MODEL_DERIVED"
            else:
                status = "PROVENANCE_REQUIRED"

            row["metrics"][metric] = {
                "value": value,
                "epistemic_status": status,
                "source": None,
                "dataset": None,
                "period": None,
                "transformation": None,
                "coverage": None,
                "confidence": "UNKNOWN",
            }
            status_counter[status] += 1

        row["mapping"] = {
            "status": "UNVERIFIED",
            "method": None,
            "source": None,
            "confidence": "UNKNOWN",
        }
        programme_rows.append(row)

    report = {
        "schema_version": "1.0",
        "generated_by": "etl/build_data_provenance_report.py",
        "purpose": "Audit programme-level data provenance; absence of provenance is not treated as evidence.",
        "epistemic_statuses": {
            "OBSERVED": "Directly observed from a named source dataset.",
            "DERIVED": "Calculated deterministically from observed source data.",
            "CROSSWALK": "Transferred through an occupation/skills classification mapping.",
            "MODEL": "Produced by a documented modelling assumption or formula.",
            "PROVENANCE_REQUIRED": "A numeric value exists but its raw source/transformation is not yet documented in the catalogue.",
            "UNKNOWN": "The system cannot currently establish provenance or confidence."
        },
        "summary": {
            "programme_count": len(catalog),
            "metric_counts": dict(status_counter),
            "warning": "The source registry is not programme-specific evidence. Every metric used for recommendations must have its own provenance record."
        },
        "programmes": programme_rows,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✓ Provenance report written to {OUTPUT_PATH}")
    print(f"✓ Programmes audited: {len(catalog)}")
    return report


if __name__ == "__main__":
    build_report()

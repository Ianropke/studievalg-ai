"""
Descriptive KOT diagnostics.

IMPORTANT:
This module intentionally does NOT run an "empirical" TWFE/DiD model.
The previous implementation constructed the outcome variable from KOT
threshold scores and the platform's own labour_demand metric. That created
circular validation and must not be presented as empirical evidence.

This replacement produces descriptive diagnostics from observed UFM KOT data
only. It does not infer causal effects and does not validate the AI model.
"""

from pathlib import Path
import json
import math
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent
DUCKDB_PATH = BASE_DIR / "data" / "kot_data.duckdb"
RESULTS_OUTPUT_PATH = BASE_DIR / "data" / "empirical_econometric_results.json"


def _safe_float(value):
    if value is None:
        return None
    value = float(value)
    return value if math.isfinite(value) else None


def run_empirical_reproducibility():
    """Generate descriptive diagnostics from observed KOT register data.

    The legacy output filename is retained for compatibility, but the output
    explicitly declares that no causal/econometric estimate is available.
    """
    conn = duckdb.connect(str(DUCKDB_PATH), read_only=True)
    try:
        total_records = conn.execute(
            "SELECT COUNT(*) FROM kot_graensekvotienter"
        ).fetchone()[0]

        rows = conn.execute(
            """
            SELECT aar, graensekvotient
            FROM kot_graensekvotienter
            WHERE aar BETWEEN 2015 AND 2026
              AND graensekvotient IS NOT NULL
            ORDER BY aar
            """
        ).fetchall()

        by_year = {}
        for year, threshold in rows:
            by_year.setdefault(int(year), []).append(float(threshold))

        yearly = {}
        for year, values in sorted(by_year.items()):
            yearly[year] = {
                "n": len(values),
                "mean_threshold": round(sum(values) / len(values), 3),
                "median_threshold": round(sorted(values)[len(values) // 2], 3),
                "min_threshold": round(min(values), 3),
                "max_threshold": round(max(values), 3),
            }

        output = {
            "metadata": {
                "analysis_type": "DESCRIPTIVE_KOT_DIAGNOSTICS",
                "validation_status": "NOT_AN_EMPIRICAL_MODEL_VALIDATION",
                "total_duckdb_records": int(total_records),
                "panel_period": "2015-2026",
                "observations_n": len(rows),
                "source": "UFM KOT register data in kot_data.duckdb",
            },
            "methodological_warning": (
                "No TWFE, DiD, placebo test, causal estimate, p-value or confidence "
                "interval is produced. The previous implementation constructed a "
                "synthetic outcome from KOT threshold values and the platform's own "
                "labour_demand score, which cannot provide independent empirical validation."
            ),
            "descriptive_kot_statistics": yearly,
            "twfe_estimation": None,
            "placebo_tests": None,
            "domain_heterogeneity": None,
        }

        with open(RESULTS_OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print("✓ Descriptive KOT diagnostics exported.")
        print("✓ No pseudo-econometric validation was performed.")
        return output
    finally:
        conn.close()


if __name__ == "__main__":
    run_empirical_reproducibility()

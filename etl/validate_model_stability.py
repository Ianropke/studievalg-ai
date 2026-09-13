"""Measure sensitivity of the published O*NET AI ranking to model weights.

This is a deterministic robustness check, not empirical validation. It only
includes programmes with explicit O*NET 31.0 inputs and deliberately excludes
legacy/default rows whose client ranking value is neutralised.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from statistics import median
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "web" / "public" / "data" / "all_programs_catalog.json"
OUTPUT = ROOT / "data" / "MODEL_STABILITY_REPORT.json"
CANONICAL_RISK_WEIGHT = 0.75
SCENARIO_RISK_WEIGHTS = (0.60, 0.70, 0.75, 0.80, 0.90)


def _average_ranks(values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(values.items(), key=lambda item: (-item[1], item[0]))
    ranks: dict[str, float] = {}
    index = 0
    while index < len(ordered):
        end = index + 1
        while end < len(ordered) and math.isclose(ordered[end][1], ordered[index][1], abs_tol=1e-12):
            end += 1
        average_rank = ((index + 1) + end) / 2
        for key, _ in ordered[index:end]:
            ranks[key] = average_rank
        index = end
    return ranks


def _spearman(left: dict[str, float], right: dict[str, float]) -> float:
    keys = sorted(left)
    left_values = [left[key] for key in keys]
    right_values = [right[key] for key in keys]
    left_mean = sum(left_values) / len(left_values)
    right_mean = sum(right_values) / len(right_values)
    numerator = sum((a - left_mean) * (b - right_mean) for a, b in zip(left_values, right_values))
    left_ss = sum((a - left_mean) ** 2 for a in left_values)
    right_ss = sum((b - right_mean) ** 2 for b in right_values)
    return numerator / math.sqrt(left_ss * right_ss) if left_ss and right_ss else 1.0


def _percentile(values: Iterable[float], fraction: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = min(len(ordered) - 1, max(0, math.ceil(len(ordered) * fraction) - 1))
    return ordered[index]


def _mapped_inputs(catalogue: list[dict]) -> list[dict]:
    mapped = []
    for programme in catalogue:
        scores = programme.get("scores") or {}
        if scores.get("ai_dataset_version") != "O*NET 31.0" or scores.get("ai_is_baseline_estimate") is True:
            continue
        risk = scores.get("automation_risk")
        augmentation = scores.get("augmentation_potential")
        if not isinstance(risk, (int, float)) or not isinstance(augmentation, (int, float)):
            raise ValueError(f"Mapped programme {programme.get('kot_nr')} lacks finite AI inputs")
        mapped.append({
            "kot_nr": str(programme["kot_nr"]),
            "title": str(programme.get("udbud_titel") or ""),
            "risk": float(risk) / 100,
            "augmentation": float(augmentation) / 100,
        })
    return mapped


def _scores(programmes: list[dict], risk_weight: float) -> dict[str, float]:
    augmentation_weight = 1 - risk_weight
    return {
        programme["kot_nr"]: risk_weight * (1 - programme["risk"]) + augmentation_weight * programme["augmentation"]
        for programme in programmes
    }


def build_report(catalogue: list[dict]) -> dict:
    programmes = _mapped_inputs(catalogue)
    if not programmes:
        raise ValueError("No O*NET 31.0-mapped programmes found")

    title_by_kot = {programme["kot_nr"]: programme["title"] for programme in programmes}
    canonical_scores = _scores(programmes, CANONICAL_RISK_WEIGHT)
    canonical_ranks = _average_ranks(canonical_scores)
    canonical_top = set(sorted(canonical_scores, key=lambda key: (-canonical_scores[key], key))[:20])
    scenarios = []

    for risk_weight in SCENARIO_RISK_WEIGHTS:
        scenario_scores = _scores(programmes, risk_weight)
        scenario_ranks = _average_ranks(scenario_scores)
        shifts = {key: abs(scenario_ranks[key] - canonical_ranks[key]) for key in canonical_ranks}
        scenario_top = set(sorted(scenario_scores, key=lambda key: (-scenario_scores[key], key))[:20])
        largest = sorted(shifts, key=lambda key: (-shifts[key], key))[:10]
        scenarios.append({
            "automation_resilience_weight": risk_weight,
            "augmentation_weight": round(1 - risk_weight, 2),
            "spearman_rank_correlation_with_canonical": round(_spearman(canonical_ranks, scenario_ranks), 6),
            "top_20_overlap_with_canonical": len(canonical_top & scenario_top),
            "median_absolute_rank_shift": round(median(shifts.values()), 2),
            "p95_absolute_rank_shift": round(_percentile(shifts.values(), 0.95), 2),
            "max_absolute_rank_shift": round(max(shifts.values()), 2),
            "largest_rank_shifts": [
                {
                    "kot_nr": key,
                    "title": title_by_kot[key],
                    "canonical_rank": round(canonical_ranks[key], 2),
                    "scenario_rank": round(scenario_ranks[key], 2),
                    "absolute_shift": round(shifts[key], 2),
                }
                for key in largest
            ],
        })

    return {
        "schema_version": "1.0",
        "model_version": "2026.6",
        "canonical_formula": "0.75 * (1 - automation_risk) + 0.25 * augmentation_potential",
        "cohort": {
            "programme_count": len(catalogue),
            "onet31_mapped_programmes": len(programmes),
            "legacy_or_unmapped_excluded": len(catalogue) - len(programmes),
            "reason_for_exclusion": "Legacy/default AI values are not programme-specific O*NET 31.0 evidence.",
        },
        "scenarios": scenarios,
        "interpretation": {
            "status": "DETERMINISTIC_SENSITIVITY_ANALYSIS",
            "supports": "Whether mapped-programme ordering is stable under plausible alternative formula weights.",
            "does_not_support": "Predictive validity for Danish employment, individual outcomes, or causal AI effects.",
            "human_validation_required": True,
        },
    }


def main() -> None:
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    report = build_report(catalogue)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Built model stability report for {report['cohort']['onet31_mapped_programmes']} "
        f"mapped programmes across {len(report['scenarios'])} scenarios."
    )


if __name__ == "__main__":
    main()

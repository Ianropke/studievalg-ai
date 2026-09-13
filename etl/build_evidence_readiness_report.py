"""Build a deterministic readiness report for programme-level score evidence."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "web" / "public" / "data" / "all_programs_catalog.json"
SOURCES = ROOT / "data" / "sources"
OUTPUT = ROOT / "data" / "EVIDENCE_READINESS_REPORT.json"


ALLOWED_MAPPING_METHODS = {"OFFICIAL", "DOCUMENTED_CROSSWALK", "EXPERT_REVIEW"}
MAPPING_PROVENANCE = {"mapping_method", "mapping_source", "mapping_period", "mapping_confidence"}


def _csv_data(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [{key: (value or "").strip() for key, value in row.items()} for row in csv.DictReader(handle)]


def _education_mapping_data(sources_dir: Path) -> tuple[list[dict[str, str]], str]:
    canonical = sources_dir / "programme_education_mapping.csv"
    if canonical.exists():
        return _csv_data(canonical), canonical.name
    crosswalk = sources_dir / "kot_udd_crosswalk.csv"
    rows = _csv_data(crosswalk)
    return [
        {**row, "kot_nr": row.get("kot_code", ""), "education_code": row.get("udd_code", "")}
        for row in rows
    ], crosswalk.name


def _valid_mapping(rows: list[dict[str, str]], code_field: str) -> dict[str, str]:
    grouped: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        kot = row.get("kot_nr", "")
        code = row.get(code_field, "")
        if (
            not kot
            or not code
            or code.upper() == "DEFAULT"
            or row.get("mapping_method", "").upper() not in ALLOWED_MAPPING_METHODS
            or any(not row.get(field) for field in MAPPING_PROVENANCE - {"mapping_method"})
        ):
            continue
        grouped.setdefault(kot, []).append(row)
    return {
        kot: candidates[0][code_field]
        for kot, candidates in grouped.items()
        if len(candidates) == 1
    }


def _observation_codes(rows: list[dict[str, str]], required: set[str], code_field: str) -> set[str]:
    return {
        row[code_field]
        for row in rows
        if all(row.get(field) for field in required | {code_field, "period", "source", "dataset", "source_url"})
        and row.get("source_url", "").startswith(("http://", "https://"))
    }


def _complete_metric(programme: dict, metric: str, chained_programmes: set[str]) -> bool:
    provenance = (programme.get("score_provenance") or {}).get(metric) or {}
    return (
        str(programme.get("kot_nr") or "") in chained_programmes
        and provenance.get("epistemic_status") in {"OBSERVED", "DERIVED"}
        and bool(provenance.get("source"))
        and bool(provenance.get("source_url"))
        and bool(provenance.get("period"))
        and bool(provenance.get("transformation"))
    )


def build_report(catalogue: list[dict], sources_dir: Path = SOURCES) -> dict:
    total = len(catalogue)
    onet_mapped = sum(
        1
        for programme in catalogue
        if (programme.get("scores") or {}).get("ai_dataset_version") == "O*NET 31.0"
        and (programme.get("scores") or {}).get("ai_is_baseline_estimate") is not True
    )
    legacy = total - onet_mapped
    education_rows, education_mapping_artifact = _education_mapping_data(sources_dir)
    disco_rows = _csv_data(sources_dir / "programme_disco_mapping.csv")
    labour_rows = _csv_data(sources_dir / "labour_market_by_education.csv")
    salary_rows = _csv_data(sources_dir / "salary_by_education.csv")
    ai_rows = _csv_data(sources_dir / "ai_occupation_exposure.csv")
    education_mapping = _valid_mapping(education_rows, "education_code")
    disco_mapping = _valid_mapping(disco_rows, "disco08_code")
    labour_codes = _observation_codes(labour_rows, {"employment_rate", "unemployment_rate"}, "education_code")
    salary_codes = _observation_codes(salary_rows, {"salary_value", "salary_measure", "salary_unit"}, "education_code")
    ai_codes = _observation_codes(ai_rows, {"automation_risk", "augmentation_potential", "mapping_confidence"}, "disco08_code")
    catalogue_kots = {str(programme.get("kot_nr") or "") for programme in catalogue}
    labour_chains = {kot for kot, code in education_mapping.items() if kot in catalogue_kots and code in labour_codes}
    salary_chains = {kot for kot, code in education_mapping.items() if kot in catalogue_kots and code in salary_codes}
    ai_chains = {kot for kot, code in disco_mapping.items() if kot in catalogue_kots and code in ai_codes}
    labour_complete = sum(_complete_metric(programme, "labour_demand", labour_chains) for programme in catalogue)
    salary_complete = sum(_complete_metric(programme, "salary_growth", salary_chains) for programme in catalogue)

    blockers = []
    if len(education_mapping) < total:
        blockers.append(f"Documented KOT-to-education mappings cover {len(education_mapping)}/{total} programmes.")
    if len(ai_chains) < total:
        blockers.append(f"Verified programme-to-DISCO-to-AI chains cover {len(ai_chains)}/{total} programmes; current catalogue links remain model crosswalks.")
    if len(labour_chains) < total:
        blockers.append(f"Verified programme-to-labour-observation chains cover {len(labour_chains)}/{total} programmes.")
    if len(salary_chains) < total:
        blockers.append(f"Verified programme-to-salary-observation chains cover {len(salary_chains)}/{total} programmes.")
    if labour_complete < total or salary_complete < total:
        blockers.append("Client job/salary metrics remain neutral until programme-level source chains are complete.")

    return {
        "schema_version": "1.0",
        "status": "READY" if not blockers else "PARTIAL_BLOCKED",
        "programme_count": total,
        "client_metric_coverage": {
            "onet31_model_crosswalk": {"complete_count": onet_mapped, "share": round(onet_mapped / total, 4)},
            "legacy_or_unmapped_ai": {"count": legacy, "share": round(legacy / total, 4)},
            "labour_demand_complete_provenance": {"complete_count": labour_complete, "share": round(labour_complete / total, 4)},
            "salary_growth_complete_provenance": {"complete_count": salary_complete, "share": round(salary_complete / total, 4)},
        },
        "strict_source_readiness": {
            "education_mapping_artifact": education_mapping_artifact,
            "programme_education_mapping_rows": len(education_rows),
            "valid_unique_programme_education_mappings": len(education_mapping),
            "programme_disco_mapping_rows": len(disco_rows),
            "valid_unique_programme_disco_mappings": len(disco_mapping),
            "labour_observation_rows": len(labour_rows),
            "salary_observation_rows": len(salary_rows),
            "ai_observation_rows": len(ai_rows),
            "programme_labour_chains": len(labour_chains),
            "programme_salary_chains": len(salary_chains),
            "programme_ai_chains": len(ai_chains),
        },
        "blockers": blockers,
        "policy": {
            "no_fuzzy_authoritative_mapping": True,
            "no_source_label_without_programme_relationship": True,
            "unsupported_client_dimensions_remain_neutral": True,
            "coverage_may_only_increase_from_reviewed_mapping_inputs": True,
        },
    }


def main() -> None:
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    report = build_report(catalogue)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"{report['status']}: O*NET {report['client_metric_coverage']['onet31_model_crosswalk']['complete_count']}/"
        f"{report['programme_count']}; salary source rows {report['strict_source_readiness']['salary_observation_rows']}"
    )


if __name__ == "__main__":
    main()

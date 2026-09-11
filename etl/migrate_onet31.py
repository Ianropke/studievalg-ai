"""Migrate published AI model inputs to the O*NET 31.0 database.

The migration deliberately separates three mappings:

1. O*NET 31.0 work-activity observations -> occupation-level model features.
2. O*NET-SOC -> ESCO/ISCO using the published O*NET-ESCO crosswalk.
3. Existing programme -> DISCO mapping in the legacy catalogue.

Only programmes with a non-default DISCO code receive a new O*NET 31.0-derived
score. The existing DEFAULT group remains a clearly labelled legacy baseline;
it is never relabelled as O*NET-derived evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "sources" / "raw" / "onet-31.0"
WORK_ACTIVITIES = RAW_DIR / "Work Activities.xlsx"
OCCUPATION_DATA = RAW_DIR / "Occupation Data.xlsx"
ESCO_CROSSWALK = RAW_DIR / "ESCO_to_ONET-SOC.xlsx"
AI_OUTPUT = ROOT / "data" / "sources" / "ai_occupation_exposure.csv"
SOURCE_MANIFEST = ROOT / "data" / "sources" / "onet31_source_manifest.json"
MIGRATION_REPORT = ROOT / "data" / "ONET31_MIGRATION_REPORT.json"
CATALOGUES = (
    ROOT / "data" / "all_programs_catalog.json",
    ROOT / "web" / "public" / "data" / "all_programs_catalog.json",
)

ONET_VERSION = "31.0"
ONET_RELEASE = "August 2026"
MODEL_VERSION = "2026.6"
ONET_DATABASE_URL = "https://www.onetcenter.org/database.html"
ONET_DOWNLOAD_URL = "https://www.onetcenter.org/dl_files/database/db_31_0_excel.zip"
ESCO_CROSSWALK_URL = "https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx"

EXPECTED_SHA256 = {
    "Work Activities.xlsx": "98b46861507de7217a63b2744cc3e99ce99806a3087bf9e7f70c8e7872033ac9",
    "Occupation Data.xlsx": "13b2aa4c08e6c9a3708d5e5ac83e13da5cc184e3798313c8942a266d00593ace",
    "ESCO_to_ONET-SOC.xlsx": "bf6c854f7ffc935eba67a296d6d7fa4d40b70fb26bcdb5ecb5621374bca6f35b",
}

INFORMATION_ACTIVITIES = (
    "Processing Information",
    "Evaluating Information to Determine Compliance with Standards",
    "Analyzing Data or Information",
    "Scheduling Work and Activities",
    "Working with Computers",
    "Documenting/Recording Information",
    "Performing Administrative Activities",
    "Estimating the Quantifiable Characteristics of Products, Events, or Information",
)

HUMAN_ACTIVITIES = (
    "Establishing and Maintaining Interpersonal Relationships",
    "Assisting and Caring for Others",
    "Selling or Influencing Others",
    "Resolving Conflicts and Negotiating with Others",
    "Performing for or Working Directly with the Public",
    "Coordinating the Work and Activities of Others",
    "Developing and Building Teams",
    "Training and Teaching Others",
    "Guiding, Directing, and Motivating Subordinates",
    "Coaching and Developing Others",
    "Providing Consultation and Advice to Others",
)

PHYSICAL_ACTIVITIES = (
    "Performing General Physical Activities",
    "Handling and Moving Objects",
    "Controlling Machines and Processes",
    "Operating Vehicles, Mechanized Devices, or Equipment",
    "Inspecting Equipment, Structures, or Materials",
    "Repairing and Maintaining Mechanical Equipment",
    "Repairing and Maintaining Electronic Equipment",
)

COGNITIVE_ACTIVITIES = (
    "Making Decisions and Solving Problems",
    "Thinking Creatively",
    "Updating and Using Relevant Knowledge",
    "Developing Objectives and Strategies",
    "Organizing, Planning, and Prioritizing Work",
    "Interpreting the Meaning of Information for Others",
    "Providing Consultation and Advice to Others",
)

TRANSFORMATION = (
    "O*NET 31.0 importance ratings normalized from 1-5 to 0-1. "
    "Automation pressure = clamp(0.10 + 0.75 * top-four information activity mean "
    "- 0.60 * top-four human/physical safeguard mean, 0.05, 0.85). "
    "Augmentation potential = clamp(0.15 + 0.65 * top-four cognitive activity mean "
    "+ 0.25 * information activity mean - 0.20 * top-three physical activity mean, 0.10, 0.95). "
    "Occupation scores are aggregated to the DISCO/ISCO group median through the O*NET-ESCO crosswalk."
)

# Frozen score vectors from the checked-in pre-migration catalogue. They are
# retained only as the drift baseline and for unmapped programmes; they are not
# presented as source-backed O*NET 28.1 observations.
LEGACY_BASELINE_BY_DISCO = {
    "DEFAULT": (32.0, 70.0),
    "212": (30.0, 87.0),
    "214": (22.0, 82.0),
    "216600": (38.0, 85.0),
    "221100": (12.0, 75.0),
    "222": (8.0, 50.0),
    "232000": (12.0, 60.0),
    "241100": (55.0, 80.0),
    "241200": (40.0, 86.0),
    "251200": (35.0, 88.0),
    "261100": (48.0, 82.0),
    "263100": (45.0, 85.0),
    "263300": (42.0, 78.0),
    "263400": (10.0, 65.0),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_raw_sources() -> dict[str, str]:
    observed: dict[str, str] = {}
    for filename, expected in EXPECTED_SHA256.items():
        path = RAW_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing O*NET migration source: {path}")
        actual = sha256(path)
        if actual != expected:
            raise ValueError(f"{filename}: SHA-256 changed; expected {expected}, got {actual}")
        observed[filename] = actual
    return observed


def _top_mean(frame: pd.DataFrame, columns: Iterable[str], count: int) -> np.ndarray:
    names = list(columns)
    missing = sorted(set(names) - set(frame.columns))
    if missing:
        raise ValueError(f"O*NET Work Activities is missing required elements: {missing}")
    values = frame[names].fillna(0.0).to_numpy(dtype=float)
    return np.sort(values, axis=1)[:, -count:].mean(axis=1)


def build_onet_occupation_scores() -> pd.DataFrame:
    activities = pd.read_excel(WORK_ACTIVITIES)
    required = {
        "O*NET-SOC Code",
        "Title",
        "Element Name",
        "Scale ID",
        "Data Value",
        "Recommend Suppress",
    }
    missing = sorted(required - set(activities.columns))
    if missing:
        raise ValueError(f"O*NET Work Activities columns missing: {missing}")

    importance = activities[
        (activities["Scale ID"] == "IM")
        & (activities["Recommend Suppress"].fillna("N") != "Y")
    ].copy()
    importance["normalized_importance"] = (
        (pd.to_numeric(importance["Data Value"], errors="raise") - 1.0) / 4.0
    ).clip(0.0, 1.0)
    pivot = importance.pivot_table(
        index=["O*NET-SOC Code", "Title"],
        columns="Element Name",
        values="normalized_importance",
        aggfunc="mean",
    )

    information = _top_mean(pivot, INFORMATION_ACTIVITIES, 4)
    safeguards = _top_mean(pivot, HUMAN_ACTIVITIES + PHYSICAL_ACTIVITIES, 4)
    cognitive = _top_mean(pivot, COGNITIVE_ACTIVITIES, 4)
    physical = _top_mean(pivot, PHYSICAL_ACTIVITIES, 3)

    result = pivot.reset_index()[["O*NET-SOC Code", "Title"]].copy()
    result["automation_risk"] = np.clip(
        0.10 + 0.75 * information - 0.60 * safeguards,
        0.05,
        0.85,
    )
    result["augmentation_potential"] = np.clip(
        0.15 + 0.65 * cognitive + 0.25 * information - 0.20 * physical,
        0.10,
        0.95,
    )
    if len(result) != 911:
        raise ValueError(f"Expected 911 O*NET occupations with activity ratings, got {len(result)}")
    return result


def load_onet_esco_crosswalk() -> pd.DataFrame:
    crosswalk = pd.read_excel(ESCO_CROSSWALK, header=3)
    required = {"ESCO/ISCO Code", "O*NET-SOC 2019 Code", "O*NET-SOC 2019 Title"}
    missing = sorted(required - set(crosswalk.columns))
    if missing:
        raise ValueError(f"O*NET-ESCO crosswalk columns missing: {missing}")
    crosswalk = crosswalk.dropna(subset=["ESCO/ISCO Code", "O*NET-SOC 2019 Code"]).copy()
    crosswalk["isco08_code"] = (
        crosswalk["ESCO/ISCO Code"].astype(str).str.extract(r"^(\d{4})", expand=False)
    )
    crosswalk = crosswalk.dropna(subset=["isco08_code"])
    return crosswalk[["isco08_code", "O*NET-SOC 2019 Code", "O*NET-SOC 2019 Title"]].drop_duplicates()


def aggregate_disco_scores(disco_codes: Iterable[str]) -> pd.DataFrame:
    occupation_scores = build_onet_occupation_scores()
    crosswalk = load_onet_esco_crosswalk()
    joined = crosswalk.merge(
        occupation_scores,
        left_on="O*NET-SOC 2019 Code",
        right_on="O*NET-SOC Code",
        how="inner",
        validate="many_to_one",
    )

    rows = []
    for raw_code in sorted(set(str(code) for code in disco_codes)):
        digits = "".join(char for char in raw_code if char.isdigit())
        if not digits:
            continue
        isco_prefix = digits[:4]
        matches = joined[joined["isco08_code"].str.startswith(isco_prefix)]
        occupation_count = int(matches["O*NET-SOC 2019 Code"].nunique())
        if occupation_count == 0:
            raise ValueError(f"No O*NET-ESCO occupations matched DISCO code {raw_code}")
        rows.append(
            {
                "disco08_code": raw_code,
                "automation_risk": round(float(matches["automation_risk"].median()), 6),
                "augmentation_potential": round(float(matches["augmentation_potential"].median()), 6),
                "source": "U.S. Department of Labor, Employment and Training Administration",
                "dataset": "O*NET 31.0 Work Activities + O*NET-ESCO crosswalk",
                "period": ONET_RELEASE,
                "source_url": ONET_DATABASE_URL,
                "crosswalk_url": ESCO_CROSSWALK_URL,
                "mapping_confidence": "MEDIUM",
                "onet_occupation_count": occupation_count,
                "transformation": TRANSFORMATION,
            }
        )
    return pd.DataFrame(rows)


def ai_resilience(automation_risk: float, augmentation_potential: float) -> float:
    return max(10.0, min(100.0, 0.75 * (100.0 - automation_risk) + 0.25 * augmentation_potential))


def _mapped_provenance(score_row: dict, programme_count: int, total_count: int) -> dict:
    coverage = (
        f"{programme_count}/{total_count} programmes have a non-default legacy DISCO mapping. "
        "The O*NET-to-ISCO step is documented; the programme-to-DISCO step remains a low-confidence model mapping."
    )
    common = {
        "epistemic_status": "CROSSWALK_OR_MODEL",
        "source": score_row["source"],
        "source_url": score_row["source_url"],
        "dataset": score_row["dataset"],
        "period": score_row["period"],
        "transformation": score_row["transformation"],
        "coverage": coverage,
        "confidence": "LOW",
        "crosswalk_url": score_row["crosswalk_url"],
        "onet_occupation_count": int(score_row["onet_occupation_count"]),
    }
    return {
        "automation_risk": {**common, "value": int(round(score_row["automation_risk"] * 100))},
        "augmentation_potential": {
            **common,
            "value": int(round(score_row["augmentation_potential"] * 100)),
        },
    }


def _legacy_provenance() -> dict:
    common = {
        "epistemic_status": "PROVENANCE_REQUIRED",
        "source": "Legacy sector baseline; not derived from O*NET 31.0",
        "source_url": None,
        "dataset": "Legacy baseline",
        "period": "Before September 2026",
        "transformation": "Preserved during migration because no non-default programme-to-DISCO mapping is available.",
        "coverage": "Unmapped programme; O*NET 31.0 was not applied.",
        "confidence": "LOW",
    }
    return {
        "automation_risk": dict(common),
        "augmentation_potential": dict(common),
    }


def _remove_legacy_ai_claims(programme: dict) -> None:
    """Keep KOT evidence while removing stale risk claims from the old model.

    The legacy catalogue combined an official admissions sentence with a
    hard-coded replacement-risk sentence in the same evidence item. Once the
    numerical AI model changes, retaining that sentence would show users two
    contradictory AI-risk values and falsely attribute the old estimate to the
    admissions source.
    """
    evidence = programme.get("rag_evidence")
    if not isinstance(evidence, list):
        return
    for item in evidence:
        if not isinstance(item, dict):
            continue
        quote = item.get("quote")
        if isinstance(quote, str) and " Erstatningsrisiko for " in quote:
            admissions_quote = quote.split(" Erstatningsrisiko for ", 1)[0].strip()
            item["quote"] = admissions_quote if admissions_quote.endswith(".") else admissions_quote + "."
        if item.get("source") == "UFM REST API & Kraka-Deloitte (2026)":
            item["source"] = "UFM KOT Datavarehus (2026)"


def migrate_catalogue(catalogue: list[dict], score_lookup: dict[str, dict]) -> tuple[list[dict], list[dict]]:
    mapped_count = sum(str(programme.get("disco08", "")).upper() != "DEFAULT" for programme in catalogue)
    total_count = len(catalogue)
    changes: list[dict] = []

    for programme in catalogue:
        _remove_legacy_ai_claims(programme)
        code = str(programme.get("disco08", "")).strip()
        scores = programme.setdefault("scores", {})
        if code not in LEGACY_BASELINE_BY_DISCO:
            raise ValueError(f"DISCO code {code!r} has no frozen pre-migration baseline")
        old_risk, old_aug = LEGACY_BASELINE_BY_DISCO[code]
        old_resilience = ai_resilience(old_risk, old_aug)
        provenance = programme.setdefault("score_provenance", {})

        if code and code.upper() != "DEFAULT":
            if code not in score_lookup:
                raise ValueError(f"Published DISCO code {code} has no O*NET 31.0 aggregate")
            row = score_lookup[code]
            new_risk = int(round(float(row["automation_risk"]) * 100))
            new_aug = int(round(float(row["augmentation_potential"]) * 100))
            scores["automation_risk"] = new_risk
            scores["augmentation_potential"] = new_aug
            scores["ai_dataset_version"] = "O*NET 31.0"
            scores["ai_model_status"] = "CROSSWALK_OR_MODEL"
            scores["ai_mapping_confidence"] = "LOW"
            scores["ai_is_baseline_estimate"] = False
            provenance.update(_mapped_provenance(row, mapped_count, total_count))
            programme["mapping_provenance"] = {
                "status": "HEURISTIC_MODEL",
                "method": "Legacy deterministic programme-title category rules",
                "source": "etl/skills_graph_builder.py",
                "period": "Before September 2026",
                "confidence": "LOW",
                "note": "Not an official programme-to-occupation crosswalk; retained transparently pending verified Danish mapping.",
            }
        else:
            new_risk = old_risk
            new_aug = old_aug
            scores["ai_dataset_version"] = "Legacy baseline (not O*NET 31.0-derived)"
            scores["ai_model_status"] = "PROVENANCE_REQUIRED"
            scores["ai_mapping_confidence"] = "LOW"
            scores["ai_is_baseline_estimate"] = True
            provenance.update(_legacy_provenance())
            programme["mapping_provenance"] = {
                "status": "UNMAPPED_BASELINE",
                "method": "No programme-to-DISCO mapping established",
                "source": None,
                "period": None,
                "confidence": "UNKNOWN",
            }

        programme.setdefault("data_lineage", {})["ai_model"] = {
            "model_version": MODEL_VERSION,
            "dataset_version": scores["ai_dataset_version"],
            "status": scores["ai_model_status"],
            "source_manifest": "data/sources/onet31_source_manifest.json",
            "migration_report": "data/ONET31_MIGRATION_REPORT.json",
        }
        new_resilience = ai_resilience(float(new_risk), float(new_aug))
        changes.append(
            {
                "kot_nr": str(programme.get("kot_nr", "")),
                "title": programme.get("udbud_titel", ""),
                "disco08_code": code,
                "migrated_to_onet31": code.upper() != "DEFAULT",
                "old_automation_risk": round(old_risk, 2),
                "new_automation_risk": round(float(new_risk), 2),
                "old_augmentation_potential": round(old_aug, 2),
                "new_augmentation_potential": round(float(new_aug), 2),
                "old_ai_resilience": round(old_resilience, 2),
                "new_ai_resilience": round(new_resilience, 2),
                "ai_resilience_delta": round(new_resilience - old_resilience, 2),
            }
        )
    return catalogue, changes


def write_manifest(hashes: dict[str, str]) -> None:
    payload = {
        "schema_version": "1.0",
        "dataset": "O*NET 31.0",
        "release": ONET_RELEASE,
        "retrieved_at": "2026-09-10",
        "publisher": "U.S. Department of Labor, Employment and Training Administration",
        "licence": "CC BY 4.0",
        "database_url": ONET_DATABASE_URL,
        "download_url": ONET_DOWNLOAD_URL,
        "crosswalk_url": ESCO_CROSSWALK_URL,
        "files": [
            {
                "path": str((RAW_DIR / filename).relative_to(ROOT)),
                "sha256": digest,
                "bytes": (RAW_DIR / filename).stat().st_size,
            }
            for filename, digest in sorted(hashes.items())
        ],
        "model_version": MODEL_VERSION,
        "transformation": TRANSFORMATION,
        "limitations": [
            "O*NET describes occupations in the United States.",
            "The O*NET-ESCO crosswalk is model-assisted and human-validated, not an official Danish programme mapping.",
            "Programmes with DEFAULT DISCO mapping retain a legacy baseline and are not labelled O*NET 31.0-derived.",
            "The scores are model estimates, not observed job-loss probabilities or individual forecasts.",
        ],
    }
    SOURCE_MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_report(changes: list[dict], score_frame: pd.DataFrame, hashes: dict[str, str]) -> dict:
    deltas = pd.Series([change["ai_resilience_delta"] for change in changes], dtype=float)
    migrated = [change for change in changes if change["migrated_to_onet31"]]
    unmapped = len(changes) - len(migrated)
    largest = sorted(migrated, key=lambda item: abs(item["ai_resilience_delta"]), reverse=True)[:50]
    return {
        "schema_version": "1.0",
        "generated_at": "2026-09-10",
        "model_version": MODEL_VERSION,
        "source_dataset": "O*NET 31.0",
        "source_release": ONET_RELEASE,
        "source_hashes": hashes,
        "transformation": TRANSFORMATION,
        "disco_group_count": int(len(score_frame)),
        "programme_count": len(changes),
        "migrated_programme_count": len(migrated),
        "migrated_programme_share": round(len(migrated) / len(changes), 4),
        "unmapped_legacy_baseline_count": unmapped,
        "unmapped_legacy_baseline_share": round(unmapped / len(changes), 4),
        "legacy_ai_evidence_claims_removed": len(changes),
        "score_drift": {
            "mean_ai_resilience_delta": round(float(deltas.mean()), 3),
            "median_ai_resilience_delta": round(float(deltas.median()), 3),
            "p05_ai_resilience_delta": round(float(deltas.quantile(0.05)), 3),
            "p95_ai_resilience_delta": round(float(deltas.quantile(0.95)), 3),
            "max_absolute_ai_resilience_delta": round(float(deltas.abs().max()), 3),
        },
        "largest_mapped_programme_changes": largest,
        "activation_decision": {
            "status": "PARTIAL_ACTIVATION_WITH_DISCLOSED_COVERAGE",
            "reason": (
                "O*NET 31.0 is activated only for programmes with a non-default legacy DISCO mapping. "
                "Unmapped programmes retain a labelled legacy baseline until a verified Danish crosswalk exists."
            ),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Validate inputs and generated outputs without rewriting catalogues")
    args = parser.parse_args()

    hashes = validate_raw_sources()
    catalog_data = json.loads(CATALOGUES[1].read_text(encoding="utf-8"))
    disco_codes = {
        str(programme.get("disco08", ""))
        for programme in catalog_data
        if str(programme.get("disco08", "")).upper() != "DEFAULT"
    }
    score_frame = aggregate_disco_scores(disco_codes)
    score_lookup = {str(row["disco08_code"]): row for row in score_frame.to_dict("records")}

    if args.check:
        if not AI_OUTPUT.exists() or not SOURCE_MANIFEST.exists() or not MIGRATION_REPORT.exists():
            raise FileNotFoundError("Generated O*NET 31.0 migration outputs are missing")
        generated = pd.read_csv(AI_OUTPUT, dtype={"disco08_code": str})
        expected = score_frame.copy()
        pd.testing.assert_frame_equal(
            generated[expected.columns].reset_index(drop=True),
            expected.reset_index(drop=True),
            check_dtype=False,
            atol=1e-9,
        )
        report = json.loads(MIGRATION_REPORT.read_text(encoding="utf-8"))
        if report.get("source_dataset") != "O*NET 31.0":
            raise ValueError("Migration report does not identify O*NET 31.0")
        for path in CATALOGUES:
            catalogue = json.loads(path.read_text(encoding="utf-8"))
            for programme in catalogue:
                is_default = str(programme.get("disco08", "")).upper() == "DEFAULT"
                version = str((programme.get("scores") or {}).get("ai_dataset_version", ""))
                if is_default and version == "O*NET 31.0":
                    raise ValueError(f"Unmapped programme {programme.get('kot_nr')} is incorrectly labelled O*NET 31.0")
                if not is_default and version != "O*NET 31.0":
                    raise ValueError(f"Mapped programme {programme.get('kot_nr')} lacks O*NET 31.0 version")
                for item in programme.get("rag_evidence") or []:
                    if "Erstatningsrisiko" in str(item.get("quote", "")):
                        raise ValueError(f"Programme {programme.get('kot_nr')} retains a stale legacy AI-risk claim")
        print("✓ O*NET 31.0 inputs and generated migration outputs are consistent")
        return

    AI_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    score_frame.to_csv(AI_OUTPUT, index=False)
    write_manifest(hashes)

    all_changes: list[dict] | None = None
    for path in CATALOGUES:
        catalogue = json.loads(path.read_text(encoding="utf-8"))
        migrated_catalogue, changes = migrate_catalogue(catalogue, score_lookup)
        path.write_text(json.dumps(migrated_catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if all_changes is None:
            all_changes = changes
    report = build_report(all_changes or [], score_frame, hashes)
    MIGRATION_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✓ Built O*NET 31.0 model inputs for {len(score_frame)} DISCO groups")
    print(f"✓ Migrated {report['migrated_programme_count']}/{report['programme_count']} programmes")
    print(f"✓ Retained {report['unmapped_legacy_baseline_count']} disclosed legacy baselines")


if __name__ == "__main__":
    main()

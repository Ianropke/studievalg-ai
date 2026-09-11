import json
import sys
import unittest
from collections import Counter
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "etl"))

import migrate_onet31 as migration  # noqa: E402


class Onet31MigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogue = json.loads(
            (ROOT / "web" / "public" / "data" / "all_programs_catalog.json").read_text(encoding="utf-8")
        )
        cls.report = json.loads(
            (ROOT / "data" / "ONET31_MIGRATION_REPORT.json").read_text(encoding="utf-8")
        )

    def test_raw_source_hashes_are_pinned(self):
        self.assertEqual(migration.validate_raw_sources(), migration.EXPECTED_SHA256)

    def test_occupation_model_is_deterministic_and_bounded(self):
        scores = migration.build_onet_occupation_scores()
        self.assertEqual(len(scores), 911)
        self.assertTrue(scores["automation_risk"].between(0.05, 0.85).all())
        self.assertTrue(scores["augmentation_potential"].between(0.10, 0.95).all())

    def test_generated_disco_scores_match_known_regression_values(self):
        scores = migration.aggregate_disco_scores(["221100", "251200"]).set_index("disco08_code")
        self.assertAlmostEqual(float(scores.loc["221100", "automation_risk"]), 0.253094, places=6)
        self.assertAlmostEqual(float(scores.loc["251200", "augmentation_potential"]), 0.813740, places=6)

    def test_partial_activation_never_labels_unmapped_rows_as_onet31(self):
        versions = Counter(programme["scores"]["ai_dataset_version"] for programme in self.catalogue)
        self.assertEqual(versions["O*NET 31.0"], 569)
        self.assertEqual(versions["Legacy baseline (not O*NET 31.0-derived)"], 844)
        for programme in self.catalogue:
            is_default = str(programme.get("disco08", "")).upper() == "DEFAULT"
            is_onet31 = programme["scores"]["ai_dataset_version"] == "O*NET 31.0"
            self.assertEqual(is_onet31, not is_default)

    def test_mapped_scores_have_complete_model_provenance(self):
        for programme in self.catalogue:
            if programme["scores"]["ai_dataset_version"] != "O*NET 31.0":
                continue
            for metric in ("automation_risk", "augmentation_potential"):
                provenance = programme["score_provenance"][metric]
                self.assertEqual(provenance["dataset"], "O*NET 31.0 Work Activities + O*NET-ESCO crosswalk")
                self.assertEqual(provenance["epistemic_status"], "CROSSWALK_OR_MODEL")
                self.assertEqual(provenance["confidence"], "LOW")
                self.assertTrue(provenance["source_url"].startswith("https://"))

    def test_legacy_ai_risk_claims_are_not_displayed_as_current_evidence(self):
        for programme in self.catalogue:
            for evidence in programme.get("rag_evidence") or []:
                self.assertNotIn("Erstatningsrisiko", str(evidence.get("quote", "")))
                self.assertNotEqual(evidence.get("source"), "UFM REST API & Kraka-Deloitte (2026)")

    def test_report_discloses_coverage_and_drift(self):
        self.assertEqual(self.report["model_version"], "2026.6")
        self.assertEqual(self.report["migrated_programme_count"], 569)
        self.assertEqual(self.report["unmapped_legacy_baseline_count"], 844)
        self.assertLessEqual(self.report["score_drift"]["max_absolute_ai_resilience_delta"], 20)
        self.assertEqual(
            self.report["activation_decision"]["status"],
            "PARTIAL_ACTIVATION_WITH_DISCLOSED_COVERAGE",
        )

    def test_generated_ai_csv_matches_recalculation(self):
        generated = pd.read_csv(
            ROOT / "data" / "sources" / "ai_occupation_exposure.csv",
            dtype={"disco08_code": str},
        )
        expected = migration.aggregate_disco_scores(generated["disco08_code"])
        pd.testing.assert_frame_equal(
            generated[expected.columns].reset_index(drop=True),
            expected.reset_index(drop=True),
            check_dtype=False,
            atol=1e-9,
        )


if __name__ == "__main__":
    unittest.main()

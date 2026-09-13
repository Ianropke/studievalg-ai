import unittest

from etl.validate_model_stability import _average_ranks, build_report


class ModelStabilityTests(unittest.TestCase):
    def test_average_ranks_handle_ties(self):
        self.assertEqual(_average_ranks({"a": 0.9, "b": 0.8, "c": 0.8}), {"a": 1.0, "b": 2.5, "c": 2.5})

    def test_report_excludes_legacy_rows_and_is_explicitly_non_empirical(self):
        catalogue = [
            {
                "kot_nr": "1",
                "udbud_titel": "Mapped A",
                "scores": {
                    "automation_risk": 20,
                    "augmentation_potential": 80,
                    "ai_dataset_version": "O*NET 31.0",
                    "ai_is_baseline_estimate": False,
                },
            },
            {
                "kot_nr": "2",
                "udbud_titel": "Mapped B",
                "scores": {
                    "automation_risk": 60,
                    "augmentation_potential": 90,
                    "ai_dataset_version": "O*NET 31.0",
                    "ai_is_baseline_estimate": False,
                },
            },
            {
                "kot_nr": "3",
                "udbud_titel": "Legacy",
                "scores": {
                    "automation_risk": 1,
                    "augmentation_potential": 99,
                    "ai_dataset_version": "Legacy baseline (not O*NET 31.0-derived)",
                    "ai_is_baseline_estimate": True,
                },
            },
        ]

        report = build_report(catalogue)

        self.assertEqual(report["cohort"]["onet31_mapped_programmes"], 2)
        self.assertEqual(report["cohort"]["legacy_or_unmapped_excluded"], 1)
        self.assertEqual(report["interpretation"]["status"], "DETERMINISTIC_SENSITIVITY_ANALYSIS")
        self.assertTrue(report["interpretation"]["human_validation_required"])
        self.assertEqual(len(report["scenarios"]), 5)


if __name__ == "__main__":
    unittest.main()

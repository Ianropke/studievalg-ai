"""Regression tests for the strict provenance audit policy."""

import unittest

from etl.validate_data_provenance import validate_report


class DataProvenancePolicyTests(unittest.TestCase):
    def test_complete_report_passes(self):
        report = {
            "summary": {
                "programme_count": 10,
                "default_mapping_share": 0,
                "largest_repeated_score_vector": None,
                "metric_counts": {"DERIVED": 40},
                "metric_provenance_coverage": {
                    "labour_demand": {"value_count": 10, "complete_provenance_count": 10},
                    "salary_growth": {"value_count": 10, "complete_provenance_count": 10},
                },
            }
        }

        self.assertEqual(validate_report(report), [])

    def test_missing_provenance_is_a_blocking_error(self):
        report = {
            "summary": {
                "programme_count": 10,
                "default_mapping_share": 0.2,
                "largest_repeated_score_vector": {"programme_count": 5},
                "metric_counts": {"PROVENANCE_REQUIRED": 2},
                "metric_provenance_coverage": {
                    "labour_demand": {"value_count": 10, "complete_provenance_count": 8},
                },
            }
        }

        errors = validate_report(report)
        self.assertTrue(any("DEFAULT occupation mapping" in error for error in errors))
        self.assertTrue(any("lack documented raw provenance" in error for error in errors))
        self.assertTrue(any("without complete source metadata" in error for error in errors))


if __name__ == "__main__":
    unittest.main()

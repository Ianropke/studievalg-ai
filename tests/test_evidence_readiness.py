import csv
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from etl import build_education_crosswalk
from etl.build_evidence_readiness_report import build_report


class EvidenceReadinessTests(unittest.TestCase):
    @staticmethod
    def _write_csv(path: Path, rows: list[dict[str, str]]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)

    def test_global_source_name_does_not_count_as_programme_provenance(self):
        catalogue = [
            {
                "scores": {"ai_dataset_version": "O*NET 31.0", "ai_is_baseline_estimate": False},
                "score_provenance": {
                    "labour_demand": {"epistemic_status": "DERIVED", "source": "UFM"},
                },
            },
            {
                "scores": {"ai_dataset_version": "Legacy baseline", "ai_is_baseline_estimate": True},
                "score_provenance": {},
            },
        ]
        with tempfile.TemporaryDirectory() as directory:
            report = build_report(catalogue, Path(directory))
        self.assertEqual(report["client_metric_coverage"]["onet31_model_crosswalk"]["complete_count"], 1)
        self.assertEqual(report["client_metric_coverage"]["labour_demand_complete_provenance"]["complete_count"], 0)
        self.assertEqual(report["status"], "PARTIAL_BLOCKED")

    def test_unrelated_mapping_and_observation_rows_do_not_create_readiness(self):
        complete_provenance = {
            "epistemic_status": "DERIVED",
            "source": "Official source",
            "source_url": "https://example.test/source",
            "period": "2024",
            "transformation": "Documented transform",
        }
        catalogue = [{
            "kot_nr": "P1",
            "scores": {"ai_dataset_version": "O*NET 31.0", "ai_is_baseline_estimate": False},
            "score_provenance": {
                "labour_demand": complete_provenance,
                "salary_growth": complete_provenance,
            },
        }]
        mapping_provenance = {
            "mapping_method": "OFFICIAL",
            "mapping_source": "Register",
            "mapping_period": "2026",
            "mapping_confidence": "HIGH",
        }
        with tempfile.TemporaryDirectory() as directory:
            sources = Path(directory)
            self._write_csv(sources / "programme_education_mapping.csv", [{"kot_nr": "OTHER", "education_code": "E1", **mapping_provenance}])
            self._write_csv(sources / "programme_disco_mapping.csv", [{"kot_nr": "OTHER", "disco08_code": "D1", **mapping_provenance}])
            self._write_csv(sources / "labour_market_by_education.csv", [{
                "education_code": "E1", "period": "2024", "employment_rate": "0.9", "unemployment_rate": "0.1",
                "source": "UFM", "dataset": "Employment", "source_url": "https://example.test/labour",
            }])
            self._write_csv(sources / "salary_by_education.csv", [{
                "education_code": "E1", "period": "2024", "salary_value": "300", "salary_measure": "Hourly",
                "salary_unit": "DKK", "source": "DST", "dataset": "LONS11", "source_url": "https://example.test/salary",
            }])
            self._write_csv(sources / "ai_occupation_exposure.csv", [{
                "disco08_code": "D1", "period": "2026", "automation_risk": "0.4", "augmentation_potential": "0.6",
                "mapping_confidence": "HIGH", "source": "O*NET", "dataset": "O*NET 31.0", "source_url": "https://example.test/ai",
            }])
            report = build_report(catalogue, sources)

        self.assertEqual(report["status"], "PARTIAL_BLOCKED")
        self.assertEqual(report["strict_source_readiness"]["programme_labour_chains"], 0)
        self.assertEqual(report["strict_source_readiness"]["programme_salary_chains"], 0)
        self.assertEqual(report["client_metric_coverage"]["labour_demand_complete_provenance"]["complete_count"], 0)

    def test_crosswalk_producer_output_connects_to_readiness_gate(self):
        complete_provenance = {
            "epistemic_status": "DERIVED",
            "source": "Official source",
            "source_url": "https://example.test/source",
            "period": "2024",
            "transformation": "Documented transform",
        }
        catalogue = [{
            "kot_nr": "P1",
            "scores": {"ai_dataset_version": "Legacy baseline", "ai_is_baseline_estimate": True},
            "score_provenance": {
                "labour_demand": complete_provenance,
                "salary_growth": complete_provenance,
            },
        }]
        with tempfile.TemporaryDirectory() as directory:
            sources = Path(directory)
            raw = sources / "raw"
            raw.mkdir()
            self._write_csv(raw / "official_mapping.csv", [{
                "kot_code": "P1",
                "udd_code": "E1",
                "mapping_method": "OFFICIAL",
                "mapping_source": "Register",
                "mapping_period": "2026",
                "mapping_confidence": "HIGH",
            }])
            with patch.object(build_education_crosswalk, "ROOT", sources), \
                 patch.object(build_education_crosswalk, "RAW", raw), \
                 patch.object(build_education_crosswalk, "OUT", sources / "kot_udd_crosswalk.csv"), \
                 patch.object(build_education_crosswalk, "REPORT", sources / "kot_udd_crosswalk_report.json"):
                self.assertEqual(build_education_crosswalk.main(), 0)

            self._write_csv(sources / "labour_market_by_education.csv", [{
                "education_code": "E1", "period": "2024", "employment_rate": "0.9", "unemployment_rate": "0.1",
                "source": "UFM", "dataset": "Employment", "source_url": "https://example.test/labour",
            }])
            self._write_csv(sources / "salary_by_education.csv", [{
                "education_code": "E1", "period": "2024", "salary_value": "300", "salary_measure": "Hourly",
                "salary_unit": "DKK", "source": "DST", "dataset": "LONS11", "source_url": "https://example.test/salary",
            }])
            report = build_report(catalogue, sources)

        self.assertEqual(report["strict_source_readiness"]["education_mapping_artifact"], "kot_udd_crosswalk.csv")
        self.assertEqual(report["strict_source_readiness"]["programme_labour_chains"], 1)
        self.assertEqual(report["strict_source_readiness"]["programme_salary_chains"], 1)
        self.assertEqual(report["client_metric_coverage"]["labour_demand_complete_provenance"]["complete_count"], 1)


if __name__ == "__main__":
    unittest.main()

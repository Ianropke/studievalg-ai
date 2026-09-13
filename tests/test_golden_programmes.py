import csv
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from etl import audit_golden_programmes


class GoldenProgrammeAuditTests(unittest.TestCase):
    @staticmethod
    def _write_csv(path: Path, rows: list[dict[str, str]]) -> None:
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)

    def test_existing_score_without_provenance_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            crosswalk = root / "crosswalk.csv"
            scores = root / "scores.csv"
            report = root / "report.json"
            self._write_csv(crosswalk, [{
                "programme_name": "medicin",
                "kot_code": "P1",
                "udd_code": "U1",
                "mapping_method": "OFFICIAL",
                "mapping_source": "Register",
            }])
            self._write_csv(scores, [{"udd_code": "U1", "labour_demand": "0.8"}])
            with patch.object(audit_golden_programmes, "CROSSWALK", crosswalk), \
                 patch.object(audit_golden_programmes, "SCORES", scores), \
                 patch.object(audit_golden_programmes, "OUT", report), \
                 patch("sys.argv", ["audit_golden_programmes.py"]):
                self.assertEqual(audit_golden_programmes.main(), 1)

            payload = json.loads(report.read_text(encoding="utf-8"))
            self.assertEqual(payload["status"], "FAIL")
            self.assertEqual(payload["missing_score_provenance_rows"], 1)


if __name__ == "__main__":
    unittest.main()

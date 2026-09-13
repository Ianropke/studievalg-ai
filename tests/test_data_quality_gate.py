import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from etl import run_data_quality_gate


class DataQualityGateTests(unittest.TestCase):
    def test_exit_two_is_reported_as_blocked_not_passed(self):
        with TemporaryDirectory() as temp_dir, \
             patch.object(run_data_quality_gate, "REPORT", Path(temp_dir) / "report.json"):
            with patch.object(run_data_quality_gate, "run", return_value={"script": "x", "returncode": 2, "stdout": "", "stderr": ""}), \
                 patch("sys.argv", ["run_data_quality_gate.py"]):
                self.assertEqual(run_data_quality_gate.main(), 1)

            with patch.object(run_data_quality_gate, "run", return_value={"script": "x", "returncode": 2, "stdout": "", "stderr": ""}), \
                 patch("sys.argv", ["run_data_quality_gate.py", "--allow-blocked"]):
                self.assertEqual(run_data_quality_gate.main(), 0)

    def test_real_validation_error_still_fails_with_allow_blocked(self):
        with TemporaryDirectory() as temp_dir, \
             patch.object(run_data_quality_gate, "REPORT", Path(temp_dir) / "report.json"), \
             patch.object(run_data_quality_gate, "run", return_value={"script": "x", "returncode": 1, "stdout": "", "stderr": ""}), \
             patch("sys.argv", ["run_data_quality_gate.py", "--allow-blocked"]):
            self.assertEqual(run_data_quality_gate.main(), 1)


if __name__ == "__main__":
    unittest.main()

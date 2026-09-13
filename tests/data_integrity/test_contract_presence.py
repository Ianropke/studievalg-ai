import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class DataIntegrityContractSmokeTest(unittest.TestCase):
    def test_claim_schema_keeps_epistemic_and_evidence_enums(self):
        schema = json.loads((ROOT / "schemas/claim.schema.json").read_text())
        self.assertEqual(
            schema["properties"]["status"]["enum"],
            ["OBSERVED", "VERIFIED", "DERIVED", "INFERRED", "UNKNOWN", "CONFLICT"],
        )
        self.assertEqual(
            schema["properties"]["evidence_type"]["enum"],
            ["REAL_WORLD", "SYNTHETIC", "MOCK", "TEST"],
        )

    def test_contract_and_domain_router_exist(self):
        self.assertTrue((ROOT / "docs/data/DATA_CONTRACT.md").is_file())
        self.assertTrue((ROOT / "docs/data/INTEGRATION.md").is_file())
        self.assertTrue((ROOT / "validators/core.py").is_file())


if __name__ == "__main__":
    unittest.main()

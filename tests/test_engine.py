"""Unit tests for the deterministic analytics engine and evidence semantics."""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from agents.multi_agent_engine import MultiAgentEngine, classify_source_authority, compute_canonical_ai_resilience


class TestMultiAgentEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MultiAgentEngine()

    def test_01_planner_query_expansion(self):
        plan = self.engine._planner_agent("Jeg vil læse til journalist i København", {})
        self.assertIn("journalistik", plan["search_terms"])
        self.assertEqual(plan["detected_location"], "København")
        self.assertEqual(plan["user_preferences"].get("location"), "København")

    def test_02_staged_retrieval_unbiased_no_high_salary_fallback(self):
        plan = self.engine._planner_agent("kvantefysikastronomi999", {})
        retrieved = self.engine._retriever_agent(plan)
        self.assertEqual(len(retrieved["profiles"]), 0, "Unmatched query must not return a high-salary fallback")

    def test_03_canonical_ai_resilience_formula(self):
        self.assertAlmostEqual(compute_canonical_ai_resilience(0.35, 0.85), 0.70, places=2)
        self.assertEqual(compute_canonical_ai_resilience(0.99, 0.0), 0.1)

    def test_04_user_interest_alignment_ranking_advantage(self):
        res = self.engine.run_pipeline("historie og politik i København")
        self.assertEqual(res["status"], "success")
        progs = res["recommended_programs"]
        self.assertGreater(len(progs), 0)
        top_title = progs[0]["udbud_titel"].lower()
        self.assertTrue(any(w in top_title for w in ["historie", "politik", "samfund", "kultur"]))
        self.assertIn("interest_fit", progs[0]["score_components"])
        self.assertIn("metric_status", progs[0])

    def test_05_program_specific_evidence_quality_independence(self):
        res = self.engine.run_pipeline("Datalogi og Jura i København")
        self.assertEqual(res["status"], "success")
        for p in res["recommended_programs"]:
            self.assertIn("evidence_quality", p)
            self.assertIn("citations", p)
            self.assertIsInstance(p["citations"], list)

    def test_06_location_source_transparency_structured_title_unknown(self):
        plan_cph = self.engine._planner_agent("datalogi", {"location": "København"})
        retrieved = self.engine._retriever_agent(plan_cph)
        evidence = self.engine._evidence_agent(retrieved, plan_cph)
        reasoning = self.engine._reasoning_agent(plan_cph, retrieved, evidence)
        for p in reasoning:
            self.assertIn(p["location_source"], ["STRUCTURED", "TITLE_FALLBACK", "UNKNOWN"])

    def test_07_validator_payload_status(self):
        dummy_programs = [
            {
                "kot_nr": "17020",
                "match_score": 0.85,
                "automation_risk": 0.28,
                "augmentation_potential": 0.80,
                "labour_demand": 0.94,
                "salary_growth": 0.90,
                "ai_resilience": 0.88,
                "interest_fit": 0.90,
            },
            {
                "kot_nr": "17020",
                "match_score": 1.5,
                "automation_risk": 0.28,
                "augmentation_potential": 0.80,
                "labour_demand": 0.94,
                "salary_growth": 0.90,
                "ai_resilience": 0.88,
                "interest_fit": 0.90,
            },
        ]
        val_payload = self.engine._data_validator_agent(dummy_programs)
        self.assertEqual(val_payload["validation_status"], "PARTIALLY_VALID")
        self.assertEqual(len(val_payload["valid_programs"]), 1)

    def test_08_source_authority_classification(self):
        self.assertEqual(classify_source_authority("Danmarks Statistik IND Register", "https://dst.dk"), "HIGH")
        self.assertEqual(classify_source_authority("Kraka-Deloitte Rapport", "https://kraka.dk"), "HIGH")
        self.assertEqual(classify_source_authority("CBS Program Board Note", "https://cbs.dk"), "MEDIUM")
        self.assertEqual(classify_source_authority("Ukendt blog", "https://random.com"), "LOW")

    def test_09_counterargument_modelbaseret_forbehold_terminology(self):
        dummy_top = {"udbud_titel": "Datalogi", "automation_risk_pct": "28%"}
        counter = self.engine._counterargument_agent(dummy_top)
        self.assertTrue(counter.startswith("Modelbaseret forbehold"))
        self.assertIn("ikke en automatiseringssandsynlighed", counter)

    def test_10_regression_major_study_fields(self):
        for query in ["Datalogi", "Jura", "Medicin", "Ingeniør", "Humaniora", "Sygepleje"]:
            res = self.engine.run_pipeline(query)
            self.assertEqual(res["status"], "success")
            self.assertGreater(len(res["recommended_programs"]), 0, f"Query '{query}' should yield candidates")

    def test_11_reasoning_drops_incomplete_profile_instead_of_using_numeric_defaults(self):
        plan = self.engine._planner_agent("datalogi", {"location": ""})
        retrieved = {
            "profiles": [{
                "kot_nr": "missing-metric",
                "udbud_titel": "Datalogi",
                "disco_titel": "Softwareudvikling",
                "automation_risk": 0.3,
                "augmentation_potential": 0.8,
                "labour_demand": 0.7,
                # salary_growth deliberately missing
            }],
            "admissions": [],
        }
        result = self.engine._reasoning_agent(plan, retrieved, {"evidence_chunks": [], "admissions_summary": []})
        self.assertEqual(result, [], "Incomplete strict profile must be excluded, not filled with a fallback")

    def test_12_counterargument_never_invents_default_exposure(self):
        counter = self.engine._counterargument_agent({"udbud_titel": "Ukendt"})
        self.assertIn("kunne ikke fastsættes", counter)
        self.assertNotIn("25%", counter)

    def test_13_validator_rejects_missing_core_metric(self):
        payload = self.engine._data_validator_agent([{ 
            "kot_nr": "17020",
            "match_score": 0.7,
            "automation_risk": 0.2,
            "augmentation_potential": 0.8,
            "labour_demand": 0.7,
            # salary_growth missing
            "ai_resilience": 0.8,
            "interest_fit": 0.9,
        }])
        self.assertEqual(payload["validation_status"], "NO_VALID_CANDIDATES")
        self.assertIn("salary_growth", payload["rejection_reasons"]["17020"])


if __name__ == "__main__":
    unittest.main()

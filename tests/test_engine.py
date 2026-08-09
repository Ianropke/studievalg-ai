"""
Python Unit Test Suite for Analytics Engine & Scenario Simulator (v2026.4 Targeted Correctness Pass).
Tests query intent expansion, unbiased staged retrieval, canonical AI resilience,
user interest alignment (interest_fit), program-specific evidence quality,
location source transparency (STRUCTURED, TITLE_FALLBACK, UNKNOWN),
validator status payload, Modelbaseret forbehold terminology, and regression queries.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from agents.multi_agent_engine import MultiAgentEngine, classify_source_authority, compute_canonical_ai_resilience
from engine.scenario_simulator import run_scenario_simulation


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
        self.assertEqual(len(retrieved["profiles"]), 0, "Unmatched query must NOT return biased high-salary fallback programs")

    def test_03_canonical_ai_resilience_formula(self):
        res1 = compute_canonical_ai_resilience(0.35, 0.85)
        self.assertAlmostEqual(res1, 0.82, places=2)
        res_high_risk = compute_canonical_ai_resilience(0.99, 0.0)
        self.assertEqual(res_high_risk, 0.1)

    def test_04_user_interest_alignment_ranking_advantage(self):
        # Query expressing strong interest in history and politics
        res = self.engine.run_pipeline("historie og politik i København")
        self.assertEqual(res["status"], "success")
        progs = res["recommended_programs"]
        self.assertGreater(len(progs), 0)
        
        top_title = progs[0]["udbud_titel"].lower()
        # Top recommended program should match history or political science interest
        has_interest_match = any(w in top_title for w in ["historie", "politik", "samfund", "kultur"])
        self.assertTrue(has_interest_match, f"Top candidate should align with user interest, got: {top_title}")
        self.assertIn("interest_fit", progs[0]["score_components"])

    def test_05_program_specific_evidence_quality_independence(self):
        res = self.engine.run_pipeline("Datalogi og Jura i København")
        self.assertEqual(res["status"], "success")
        progs = res["recommended_programs"]
        
        # Verify that each program carries its own independent evidence_quality field and citations array
        for p in progs:
            self.assertIn("evidence_quality", p)
            self.assertIn("citations", p)
            self.assertIsInstance(p["citations"], list)

    def test_06_location_source_transparency_structured_title_unknown(self):
        plan_cph = self.engine._planner_agent("datalogi", {"location": "København"})
        retrieved = self.engine._retriever_agent(plan_cph)
        evidence = self.engine._evidence_agent(retrieved, plan_cph)
        reasoning = self.engine._reasoning_agent(plan_cph, retrieved, evidence)
        
        for p in reasoning:
            self.assertIn("location_source", p)
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
                "interest_fit": 0.90
            },
            {
                "kot_nr": "17020",
                "match_score": 1.5,  # Out of bounds (> 1.0)
                "automation_risk": 0.28,
                "augmentation_potential": 0.80,
                "labour_demand": 0.94,
                "salary_growth": 0.90,
                "ai_resilience": 0.88,
                "interest_fit": 0.90
            }
        ]
        val_payload = self.engine._data_validator_agent(dummy_programs)
        self.assertIn("validation_status", val_payload)
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
        self.assertTrue(counter.startswith("Modelbaseret forbehold"), f"Expected 'Modelbaseret forbehold', got: {counter}")

    def test_10_regression_major_study_fields(self):
        queries = ["Datalogi", "Jura", "Medicin", "Ingeniør", "Humaniora", "Sygepleje"]
        for q in queries:
            res = self.engine.run_pipeline(q)
            self.assertEqual(res["status"], "success")
            self.assertGreater(len(res["recommended_programs"]), 0, f"Query '{q}' should yield candidate recommendations")


if __name__ == "__main__":
    unittest.main()

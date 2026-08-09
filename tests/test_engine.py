"""
Python Unit Test Suite for Analytics Engine & Scenario Simulator (v2026.2).
Tests query intent expansion, staged retrieval (without high-salary bias),
canonical AI resilience formula, structured location fit, validator status payload,
source authority classification, claim matching, monotonic user weights, and regression queries.
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
        # Query for obscure/unmatched subject should return empty list, NOT high-salary engineering programs!
        plan = self.engine._planner_agent("kvantefysikastronomi999", {})
        retrieved = self.engine._retriever_agent(plan)
        self.assertEqual(len(retrieved["profiles"]), 0, "Unmatched query must NOT return biased high-salary fallback programs")

    def test_03_canonical_ai_resilience_formula(self):
        # Test exact authoritative formula: 1.0 - auto_risk + 0.2 * aug_pot
        res1 = compute_canonical_ai_resilience(0.35, 0.85)
        self.assertAlmostEqual(res1, 0.82, places=2)
        
        # Test boundary clamping [0.1, 1.0]
        res_high_risk = compute_canonical_ai_resilience(0.99, 0.0)
        self.assertEqual(res_high_risk, 0.1)

    def test_04_structured_location_fit(self):
        plan = self.engine._planner_agent("datalogi", {"location": "København"})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved, plan)
        reasoning = self.engine._reasoning_agent(plan, retrieved, evidence)
        
        cph_progs = [p for p in reasoning if "københavn" in p["udbud_titel"].lower()]
        odense_progs = [p for p in reasoning if "odense" in p["udbud_titel"].lower()]
        
        if cph_progs and odense_progs:
            self.assertEqual(cph_progs[0]["score_components"]["location_fit"], 100)
            self.assertEqual(odense_progs[0]["score_components"]["location_fit"], 30)

    def test_05_validator_payload_status(self):
        dummy_programs = [
            {
                "kot_nr": "17020",
                "match_score": 0.85,
                "automation_risk": 0.28,
                "augmentation_potential": 0.80,
                "labour_demand": 0.94,
                "salary_growth": 0.90,
                "ai_resilience": 0.88
            },
            {
                "kot_nr": "17020",
                "match_score": 1.5,  # Out of bounds (> 1.0)
                "automation_risk": 0.28,
                "augmentation_potential": 0.80,
                "labour_demand": 0.94,
                "salary_growth": 0.90,
                "ai_resilience": 0.88
            }
        ]
        val_payload = self.engine._data_validator_agent(dummy_programs)
        self.assertIn("validation_status", val_payload)
        self.assertEqual(val_payload["validation_status"], "PARTIALLY_VALID")
        self.assertEqual(len(val_payload["valid_programs"]), 1)
        self.assertEqual(len(val_payload["rejected_programs"]), 1)

    def test_06_source_authority_and_claim_relevance(self):
        self.assertEqual(classify_source_authority("Danmarks Statistik IND Register", "https://dst.dk"), "HIGH")
        self.assertEqual(classify_source_authority("Kraka-Deloitte Rapport", "https://kraka.dk"), "HIGH")
        self.assertEqual(classify_source_authority("CBS Program Board Note", "https://cbs.dk"), "MEDIUM")
        self.assertEqual(classify_source_authority("Ukendt blog indlæg", "https://random.com"), "LOW")

    def test_07_unsupported_claim_produces_no_fake_citations(self):
        plan = self.engine._planner_agent("folkeskolelærer", {})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved, plan)
        citations = self.engine._citation_agent(evidence, retrieved["profiles"][0])
        
        self.assertEqual(len(citations), 1)
        self.assertFalse(citations[0]["supports_claim"])
        self.assertEqual(citations[0]["source_authority"], "UNKNOWN")

    def test_08_monotonic_user_preference_weights(self):
        plan_low = self.engine._planner_agent("datalogi", {"salary_priority": 0.1})
        plan_high = self.engine._planner_agent("datalogi", {"salary_priority": 0.9})
        
        retrieved = self.engine._retriever_agent(plan_low)
        evidence = self.engine._evidence_agent(retrieved, plan_low)
        
        reason_low = self.engine._reasoning_agent(plan_low, retrieved, evidence)
        reason_high = self.engine._reasoning_agent(plan_high, retrieved, evidence)
        
        # High salary program should rank higher or equal in high salary priority run
        high_sal_prog_low = [p for p in reason_low if p["salary_growth"] >= 0.8][0]
        high_sal_prog_high = [p for p in reason_high if p["salary_growth"] >= 0.8][0]
        
        self.assertGreaterEqual(high_sal_prog_high["match_score"], high_sal_prog_low["match_score"])

    def test_09_regression_major_study_fields(self):
        queries = ["Datalogi", "Jura", "Medicin", "Ingeniør", "Humaniora", "Sygepleje"]
        for q in queries:
            res = self.engine.run_pipeline(q)
            self.assertEqual(res["status"], "success")
            self.assertGreater(len(res["recommended_programs"]), 0, f"Query '{q}' should yield candidate recommendations")


if __name__ == "__main__":
    unittest.main()

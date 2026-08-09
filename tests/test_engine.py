"""
Python Unit Test Suite for Analytics Engine & Scenario Simulator.
Tests query intent expansion, candidate retrieval, candidate-aware evidence filtering,
weighted preference matching, deterministic source quality classification, claim matching,
data bounds validation, scenario simulations, and regression study queries.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from agents.multi_agent_engine import MultiAgentEngine, classify_source_quality
from engine.scenario_simulator import run_scenario_simulation


class TestMultiAgentEngine(unittest.TestCase):

    def setUp(self):
        self.engine = MultiAgentEngine()

    def test_01_planner_query_expansion(self):
        plan = self.engine._planner_agent("Jeg vil læse til journalist i København", {})
        self.assertIn("journalistik", plan["search_terms"])
        self.assertEqual(plan["detected_location"], "København")
        self.assertEqual(plan["user_preferences"].get("location"), "København")

    def test_02_query_aware_candidate_retrieval(self):
        plan = self.engine._planner_agent("journalist", {})
        retrieved = self.engine._retriever_agent(plan)
        self.assertGreater(len(retrieved["profiles"]), 0)
        
        titles = [p["udbud_titel"].lower() for p in retrieved["profiles"]]
        has_media_match = any("medie" in t or "kommunikation" in t or "journalist" in t for t in titles)
        self.assertTrue(has_media_match, "retriever should find media/journalism programs")

    def test_03_weighted_preference_scoring(self):
        plan = self.engine._planner_agent("datalogi", {"salary_priority": 0.9, "risk_tolerance": 0.1})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved, plan)
        reasoning = self.engine._reasoning_agent(plan, retrieved, evidence)
        
        self.assertGreater(len(reasoning), 0)
        top = reasoning[0]
        self.assertIn("match_score", top)
        self.assertIn("score_components", top)
        self.assertIn("ai_resilience", top["score_components"])
        self.assertGreaterEqual(top["match_score"], 0.0)
        self.assertLessEqual(top["match_score"], 1.0)

    def test_04_source_quality_classification(self):
        self.assertEqual(classify_source_quality("Danmarks Statistik IND Register", "https://dst.dk"), "HIGH")
        self.assertEqual(classify_source_quality("Kraka-Deloitte Rapport", "https://kraka.dk"), "HIGH")
        self.assertEqual(classify_source_quality("CBS Program Board Note", "https://cbs.dk"), "MEDIUM")
        self.assertEqual(classify_source_quality("Ukendt blog indlæg", "https://random.com"), "LOW")

    def test_05_data_validator_comprehensive_bounds(self):
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
            },
            {
                "kot_nr": "999999",  # Invalid non-existent KOT
                "match_score": 0.80,
                "automation_risk": 0.20,
                "augmentation_potential": 0.80,
                "labour_demand": 0.80,
                "salary_growth": 0.80,
                "ai_resilience": 0.80
            }
        ]
        validated = self.engine._data_validator_agent(dummy_programs)
        self.assertEqual(len(validated), 1)
        self.assertEqual(validated[0]["kot_nr"], "17020")
        self.assertEqual(validated[0]["match_score"], 0.85)

    def test_06_unsupported_claim_produces_no_fake_citations(self):
        plan = self.engine._planner_agent("folkeskolelærer", {})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved, plan)
        citations = self.engine._citation_agent(evidence, retrieved["profiles"][0])
        
        self.assertEqual(len(citations), 1)
        self.assertFalse(citations[0]["supports_claim"])
        self.assertEqual(citations[0]["evidence_quality"], "UNKNOWN")

    def test_07_scenario_simulation_range(self):
        sim = run_scenario_simulation("17020", target_year=2030, iterations=500)
        self.assertIn("projections", sim)
        self.assertIn("basis", sim["projections"])
        basis = sim["projections"]["basis"]
        self.assertIn("model_uncertainty_interval", basis)
        self.assertIn("empirical_percentile_5th", basis)
        self.assertIn("empirical_percentile_95th", basis)
        self.assertLess(basis["empirical_percentile_5th"], basis["empirical_percentile_95th"])

    def test_08_regression_major_study_fields(self):
        queries = ["Datalogi", "Jura", "Medicin", "Ingeniør", "Humaniora", "Sygepleje"]
        for q in queries:
            res = self.engine.run_pipeline(q)
            self.assertEqual(res["status"], "success")
            self.assertGreater(len(res["recommended_programs"]), 0, f"Query '{q}' should yield candidate recommendations")


if __name__ == "__main__":
    unittest.main()

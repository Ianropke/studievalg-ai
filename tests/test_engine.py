"""
Python Unit Test Suite for Analytics Engine & Scenario Simulator.
Tests query parsing, synonym expansion, query-aware candidate retrieval,
weighted preference scoring, evidence citation matching, data validation, and Monte Carlo scenario simulation.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from agents.multi_agent_engine import MultiAgentEngine
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
        
        # Verify retrieved titles relate to media/journalism or communication
        titles = [p["udbud_titel"].lower() for p in retrieved["profiles"]]
        has_media_match = any("medie" in t or "kommunikation" in t or "journalist" in t for t in titles)
        self.assertTrue(has_media_match, "retriever should find media/journalism programs")

    def test_03_weighted_preference_scoring(self):
        plan = self.engine._planner_agent("datalogi", {"salary_priority": 0.9, "risk_tolerance": 0.1})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved)
        reasoning = self.engine._reasoning_agent(plan, retrieved, evidence)
        
        self.assertGreater(len(reasoning), 0)
        top = reasoning[0]
        self.assertIn("match_score", top)
        self.assertIn("score_components", top)
        self.assertIn("ai_resilience", top["score_components"])
        self.assertGreaterEqual(top["match_score"], 0.0)
        self.assertLessEqual(top["match_score"], 1.0)

    def test_04_data_validator_bounds_check(self):
        dummy_programs = [
            {"kot_nr": "17020", "match_score": 0.85},
            {"kot_nr": "999999", "match_score": 1.5}, # Invalid bounds & invalid KOT
        ]
        validated = self.engine._data_validator_agent(dummy_programs)
        self.assertEqual(len(validated), 1)
        self.assertEqual(validated[0]["kot_nr"], "17020")

    def test_05_claim_evidence_matching(self):
        plan = self.engine._planner_agent("jura", {})
        retrieved = self.engine._retriever_agent(plan)
        evidence = self.engine._evidence_agent(retrieved)
        citations = self.engine._citation_agent(evidence, retrieved["profiles"][0])
        
        self.assertGreater(len(citations), 0)
        first_cite = citations[0]
        self.assertIn("claim_id", first_cite)
        self.assertIn("relevance_score", first_cite)
        self.assertTrue(first_cite["supports_claim"])

    def test_06_scenario_simulation_range(self):
        sim = run_scenario_simulation("17020", target_year=2030, iterations=500)
        self.assertIn("projections", sim)
        self.assertIn("basis", sim["projections"])
        basis = sim["projections"]["basis"]
        self.assertIn("model_uncertainty_interval", basis)
        self.assertIn("empirical_percentile_5th", basis)
        self.assertIn("empirical_percentile_95th", basis)
        self.assertLess(basis["empirical_percentile_5th"], basis["empirical_percentile_95th"])


if __name__ == "__main__":
    unittest.main()

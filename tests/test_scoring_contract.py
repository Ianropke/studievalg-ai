"""Regression tests for the shared AI-resilience scoring contract."""

import unittest

from agents.multi_agent_engine import compute_canonical_ai_resilience


class CanonicalAiResilienceContractTests(unittest.TestCase):
    def test_matches_frontend_75_25_contract(self):
        self.assertEqual(compute_canonical_ai_resilience(0.15, 0.8), 0.838)
        self.assertEqual(compute_canonical_ai_resilience(0.35, 0.2), 0.538)

    def test_is_bounded_after_input_clamping(self):
        self.assertEqual(compute_canonical_ai_resilience(-2, 2), 1.0)
        self.assertEqual(compute_canonical_ai_resilience(2, -2), 0.1)


if __name__ == "__main__":
    unittest.main()

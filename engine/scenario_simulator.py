"""
Monte Carlo Scenario Simulator Engine for AI Studievalgsplatform.
Calculates time-projected forecasts (2026, 2028, 2030, 2035, 2040) for 3 macro scenarios:
- Konservativt: Slow deployment due to regulation & implementation costs
- Basis: Gradual integration in line with OECD and Kraka-Deloitte baselines
- Accelereret: Rapid breakthrough in autonomous agents in cognitive professions
"""

from pathlib import Path
import random
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"


def run_scenario_simulation(kot_nr, target_year=2030, iterations=1000):
    conn = duckdb.connect(str(DUCKDB_PATH))

    profile = conn.execute("""
        SELECT kot_nr, udbud_titel, disco_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
        FROM education_profile_scores
        WHERE kot_nr = ?
    """, [kot_nr]).fetchone()

    conn.close()

    if not profile:
        return {"error": f"Study program KOT {kot_nr} not found."}

    base_automation = profile[3]
    base_augmentation = profile[4]
    base_demand = profile[5]

    year_delta = max(0, target_year - 2025)

    # Scenario multipliers per year
    scenarios = {
        "konservativt": {"automation_rate": 0.015, "demand_shift": -0.005},
        "basis": {"automation_rate": 0.035, "demand_shift": 0.010},
        "accelereret": {"automation_rate": 0.070, "demand_shift": 0.025}
    }

    results = {}
    for scenario_name, params in scenarios.items():
        sim_automation = []
        sim_demand = []

        for _ in range(iterations):
            noise_auto = random.gauss(0, 0.02)
            noise_demand = random.gauss(0, 0.02)

            proj_auto = min(0.95, max(0.05, base_automation + (params["automation_rate"] * year_delta) + noise_auto))
            proj_demand = min(0.98, max(0.10, base_demand + (params["demand_shift"] * year_delta) + noise_demand))

            sim_automation.append(proj_auto)
            sim_demand.append(proj_demand)

        avg_auto = sum(sim_automation) / iterations
        avg_demand = sum(sim_demand) / iterations
        
        # Calculate 95% confidence interval
        margin_auto = 1.96 * (pd.Series(sim_automation).std() / (iterations ** 0.5))

        results[scenario_name] = {
            "target_year": target_year,
            "projected_automation_risk": round(avg_auto, 3),
            "automation_confidence_interval": f"{round(avg_auto*100, 1)}% ± {round(margin_auto*100, 1)}%",
            "projected_labour_demand": round(avg_demand, 3),
        }

    return {
        "kot_nr": kot_nr,
        "udbud_titel": profile[1],
        "disco_titel": profile[2],
        "baseline_2025": {
            "automation_risk": base_automation,
            "augmentation_potential": base_augmentation,
            "labour_demand": base_demand
        },
        "projections": results
    }


if __name__ == "__main__":
    # Test simulation for Datalogi (KOT 17020) and Jura (KOT 20410)
    print("\n--- MONTE CARLO SIMULERING: DATALOGI (2030) ---")
    sim_cs = run_scenario_simulation("17020", target_year=2030)
    print(json.dumps(sim_cs, indent=2, ensure_ascii=False))

    print("\n--- MONTE CARLO SIMULERING: JURA (2030) ---")
    sim_law = run_scenario_simulation("20410", target_year=2030)
    print(json.dumps(sim_law, indent=2, ensure_ascii=False))

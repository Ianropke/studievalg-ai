"""
Macro-Scenario Simulator Engine for AI Studievalgsplatform.
Calculates time-projected scenario ranges (2026, 2028, 2030, 2035) for 3 macro scenarios:
- Konservativt: Slow deployment due to regulation & implementation costs
- Basis: Gradual integration in line with OECD and Kraka-Deloitte baselines
- Accelereret: Rapid breakthrough in autonomous agents in cognitive professions

Methodology Note:
Parameter distributions are sampled iteratively (Monte Carlo simulation over scenario assumptions)
to estimate the empirical 5th to 95th percentile uncertainty range across model projections.
"""

from pathlib import Path
import random
import duckdb
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"


def run_scenario_simulation(kot_nr, target_year=2030, iterations=1000):
    conn = duckdb.connect(str(DUCKDB_PATH))

    profile = conn.execute("""
        SELECT kot_nr, udbud_titel, disco_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
        FROM education_profile_scores
        WHERE kot_nr = ?
    """, [str(kot_nr)]).fetchone()

    conn.close()

    if not profile:
        return {"error": f"Study program KOT {kot_nr} not found."}

    base_automation = float(profile[3])
    base_augmentation = float(profile[4])
    base_demand = float(profile[5])

    year_delta = max(0, target_year - 2025)

    # Defined parameter distributions per scenario: (rate_mean, rate_std, shift_mean, shift_std)
    scenario_configs = {
        "konservativt": {
            "title": "Konservativt scenarie (Gradvis adoption)",
            "rate_mean": 0.015,
            "rate_std": 0.008,
            "shift_mean": -0.005,
            "shift_std": 0.006,
        },
        "basis": {
            "title": "Basisscenarie (OECD/Kraka-Deloitte baseline)",
            "rate_mean": 0.035,
            "rate_std": 0.012,
            "shift_mean": 0.010,
            "shift_std": 0.008,
        },
        "accelereret": {
            "title": "Accelereret scenarie (Hurtigt gennembrud)",
            "rate_mean": 0.070,
            "rate_std": 0.020,
            "shift_mean": 0.025,
            "shift_std": 0.012,
        }
    }

    results = {}
    for scenario_name, cfg in scenario_configs.items():
        sim_automation = []
        sim_demand = []

        for _ in range(iterations):
            # Sample both scenario parameters and stochastic variation
            sampled_rate = random.gauss(cfg["rate_mean"], cfg["rate_std"])
            sampled_shift = random.gauss(cfg["shift_mean"], cfg["shift_std"])

            stochastic_noise_auto = random.gauss(0, 0.015)
            stochastic_noise_demand = random.gauss(0, 0.015)

            proj_auto = min(0.95, max(0.05, base_automation + (sampled_rate * year_delta) + stochastic_noise_auto))
            proj_demand = min(0.98, max(0.10, base_demand + (sampled_shift * year_delta) + stochastic_noise_demand))

            sim_automation.append(proj_auto)
            sim_demand.append(proj_demand)

        sim_auto_arr = np.array(sim_automation)
        sim_demand_arr = np.array(sim_demand)

        median_auto = float(np.median(sim_auto_arr))
        p05_auto = float(np.percentile(sim_auto_arr, 5))
        p95_auto = float(np.percentile(sim_auto_arr, 95))

        median_demand = float(np.median(sim_demand_arr))

        results[scenario_name] = {
            "scenario_title": cfg["title"],
            "target_year": target_year,
            "projected_automation_risk": round(median_auto, 3),
            "model_uncertainty_interval": f"{round(p05_auto*100, 1)}% – {round(p95_auto*100, 1)}%",
            "empirical_percentile_5th": round(p05_auto, 3),
            "empirical_percentile_95th": round(p95_auto, 3),
            "projected_labour_demand": round(median_demand, 3),
        }

    return {
        "kot_nr": str(kot_nr),
        "udbud_titel": profile[1],
        "disco_titel": profile[2],
        "baseline_year": 2025,
        "target_year": target_year,
        "baseline_2025": {
            "automation_risk": base_automation,
            "augmentation_potential": base_augmentation,
            "labour_demand": base_demand
        },
        "methodology_disclaimer": "Illustrativ scenariomodelsimulering baseret på antagne parameterfordelinger (5.–95. percentilinterval). Udgør et modelbaseret skøn, ikke en deterministisk profeti.",
        "projections": results
    }


if __name__ == "__main__":
    import json
    print("\n--- MONTE CARLO SCENARIOMODEL SIMULERING: DATALOGI (2030) ---")
    sim_cs = run_scenario_simulation("17020", target_year=2030)
    print(json.dumps(sim_cs, indent=2, ensure_ascii=False))

"""
Spot-check data quality and DISCO-08 mappings across representative study programs.
Checks: Datalogi (KU), Psykologi (AU), Maskiningeniør (SDU), Statskundskab (RUC), Kunstnerisk/Humanistisk.
"""

from pathlib import Path
import duckdb
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DUCKDB_PATH = BASE_DIR / "data" / "kot_data.duckdb"


def run_spot_check():
    conn = duckdb.connect(str(DUCKDB_PATH))

    target_queries = [
        ("Datalogi (KU)", "Datalogi, København Ø"),
        ("Psykologi (AU)", "Psykologi, Aarhus C"),
        ("Maskiningeniør (SDU)", "Maskinteknik"),
        ("Statskundskab (RUC)", "Statskundskab"),
        ("Design / Kunstnerisk", "Designer, Kolding")
    ]

    print("\n=======================================================")
    print("DATAKVALITET & SPOT-CHECK AF 5 STRATEGISKE UDDANNELSER")
    print("=======================================================\n")

    for label, search_term in target_queries:
        query = f"""
            SELECT kot_nr, udbud_titel, disco08_code, disco_titel, 
                   automation_risk, augmentation_potential, labour_demand, salary_growth
            FROM education_profile_scores
            WHERE udbud_titel ILIKE '%{search_term}%'
            LIMIT 1
        """
        row = conn.execute(query).df()
        if not row.empty:
            r = row.iloc[0]
            print(f"📌 [{label}]")
            print(f"   Udbud: {r['udbud_titel']} (KOT #{r['kot_nr']})")
            print(f"   DISCO-08: {r['disco08_code']} -> {r['disco_titel']}")
            print(f"   Scores: Automation Risk: {int(r['automation_risk']*100)}% | Augmentation: {int(r['augmentation_potential']*100)}% | Demand: {int(r['labour_demand']*100)}% | Salary Growth: {int(r['salary_growth']*100)}%")
            print("-" * 55)
        else:
            print(f"⚠️ [{label}]: Ingen direkte match fundet på '{search_term}'\n")

    conn.close()


if __name__ == "__main__":
    run_spot_check()

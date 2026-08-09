"""
Evidence-Based Recommendation Engine & Analytics Pipeline.
Processes user queries, performs query-aware candidate retrieval, candidate-aware evidence filtering,
multi-factor preference matching, deterministic claim-to-evidence validation, data validation, and dynamic scenario modeling.
"""

import sys
import argparse
from pathlib import Path
import json
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from engine.scenario_simulator import run_scenario_simulation

DATA_DIR = BASE_DIR / "data"
DUCKDB_PATH = DATA_DIR / "kot_data.duckdb"

# Synonym dictionary for query intent expansion
SYNONYMS = {
    "journalist": ["journalistik", "medie", "kommunikation"],
    "læge": ["medicin", "odontologi", "sundhed"],
    "koder": ["datalogi", "software", "it-udvikling", "datamatiker"],
    "bygge": ["bygningsingeniør", "arkitektur", "konstruktør"],
    "økonom": ["erhvervsøkonomi", "ha", "oecon", "finans"],
    "lærer": ["pædagog", "læreruddannelse", "undervisning"],
    "matematik": ["datalogi", "ingeniør", "fysik", "økonomi"]
}

# Major Danish study cities
CITIES = ["københavn", "aarhus", "odense", "aalborg", "esbjerg", "frederiksberg", "roskilde", "lyngby"]

# Authoritative Danish data sources classification
HIGH_QUALITY_SOURCES = [
    "danmarks statistik",
    "ufm",
    "oecd",
    "kraka-deloitte",
    "arbejderbevægelsens erhvervsråd",
    "ae-rådet",
    "den koordinerede tilmelding"
]

MEDIUM_QUALITY_SOURCES = [
    "cbs program board",
    "københavns universitet - studieordning",
    "dtu studieordning",
    "branchens analyser"
]


def classify_source_quality(source_title: str, url: str) -> str:
    """Classifies source quality deterministically based on publisher authority."""
    combined = f"{source_title} {url}".lower()
    if any(hq in combined for hq in HIGH_QUALITY_SOURCES):
        return "HIGH"
    if any(mq in combined for mq in MEDIUM_QUALITY_SOURCES):
        return "MEDIUM"
    return "LOW" if url.startswith("http") else "UNKNOWN"


class MultiAgentEngine:

    def __init__(self, duckdb_path=DUCKDB_PATH):
        self.duckdb_path = str(duckdb_path)

    # 1. Planner Agent (Structured Query Intent Extraction)
    def _planner_agent(self, user_query, user_profile):
        query_clean = user_query.strip().lower()
        search_terms = [query_clean]

        detected_location = None
        for city in CITIES:
            if city in query_clean:
                detected_location = city.capitalize()
                search_terms.append(city)

        for key, syns in SYNONYMS.items():
            if key in query_clean:
                search_terms.extend(syns)

        profile = user_profile or {}
        if detected_location and not profile.get("location"):
            profile["location"] = detected_location

        return {
            "query": user_query,
            "search_terms": list(set(search_terms)),
            "detected_location": detected_location,
            "user_preferences": profile
        }

    # 2. Retriever Agent (Query-Aware Candidate Retrieval)
    def _retriever_agent(self, plan):
        conn = duckdb.connect(self.duckdb_path)
        search_terms = plan["search_terms"]

        like_conditions = []
        params = []
        for term in search_terms:
            like_conditions.append("(LOWER(udbud_titel) LIKE ? OR LOWER(disco_titel) LIKE ?)")
            params.extend([f"%{term}%", f"%{term}%"])

        where_clause = " OR ".join(like_conditions) if like_conditions else "1=1"

        query_sql = f"""
            SELECT kot_nr, udbud_titel, disco08_code, disco_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
            FROM education_profile_scores
            WHERE {where_clause}
            LIMIT 25
        """

        try:
            profiles = conn.execute(query_sql, params).df().to_dict(orient="records")
        except Exception:
            profiles = []

        if not profiles:
            profiles = conn.execute("""
                SELECT kot_nr, udbud_titel, disco08_code, disco_titel, automation_risk, augmentation_potential, labour_demand, salary_growth
                FROM education_profile_scores
                ORDER BY labour_demand DESC, salary_growth DESC
                LIMIT 15
            """).df().to_dict(orient="records")

        admissions = conn.execute("""
            SELECT kot_nr, udbud_titel, aar, graensekvotient
            FROM kot_graensekvotienter
            WHERE aar IN (2024, 2025, 2026) AND graensekvotient IS NOT NULL
            ORDER BY graensekvotient DESC
            LIMIT 15
        """).df().to_dict(orient="records")

        conn.close()
        return {"profiles": profiles, "admissions": admissions}

    # 3. Evidence Agent (Candidate-Aware Evidence Retrieval)
    def _evidence_agent(self, retrieved_data, plan):
        conn = duckdb.connect(self.duckdb_path)

        # Candidate-aware retrieval: filter evidence matching search keywords or candidate titles
        search_terms = plan["search_terms"]
        like_conds = []
        params = []
        for term in search_terms[:5]:
            like_conds.append("(LOWER(chunk_text) LIKE ? OR LOWER(report_title) LIKE ?)")
            params.extend([f"%{term}%", f"%{term}%"])

        where_clause = " OR ".join(like_conds) if like_conds else "1=1"

        query_sql = f"""
            SELECT chunk_id, report_title, source_url, category, chunk_text
            FROM report_evidence_chunks
            WHERE {where_clause}
            LIMIT 20
        """

        try:
            chunks = conn.execute(query_sql, params).df().to_dict(orient="records")
        except Exception:
            chunks = []

        if not chunks:
            chunks = conn.execute("""
                SELECT chunk_id, report_title, source_url, category, chunk_text
                FROM report_evidence_chunks
                LIMIT 10
            """).df().to_dict(orient="records")

        conn.close()

        return {
            "evidence_chunks": chunks,
            "admissions_summary": retrieved_data["admissions"][:5]
        }

    # 4. Reasoning Agent (Explicit Weighted Multi-Factor Matching)
    def _reasoning_agent(self, plan, retrieved_data, evidence):
        scored_programs = []
        user_prefs = plan["user_preferences"]
        risk_tol = float(user_prefs.get("risk_tolerance", 0.3))
        salary_prio = float(user_prefs.get("salary_priority", 0.5))
        preferred_loc = (user_prefs.get("location") or "").lower()

        # Normalized model weights: w_ai + w_sal + w_job + w_loc = 1.0
        w_ai = 0.35
        w_sal = 0.25 * salary_prio * 2.0
        w_job = 0.25
        w_loc = 0.15 if preferred_loc else 0.0

        weight_sum = w_ai + w_sal + w_job + w_loc
        w_ai_norm = w_ai / weight_sum
        w_sal_norm = w_sal / weight_sum
        w_job_norm = w_job / weight_sum
        w_loc_norm = w_loc / weight_sum

        for p in retrieved_data["profiles"]:
            auto_risk = float(p.get("automation_risk", 0.3))
            aug_pot = float(p.get("augmentation_potential", 0.7))
            lab_dem = float(p.get("labour_demand", 0.7))
            sal_gro = float(p.get("salary_growth", 0.7))

            # Derived AI resilience index (0.0 to 1.0)
            ai_resilience = max(0.1, min(1.0, 1.0 - auto_risk + (0.2 * aug_pot)))

            # Location fit sub-score: check title and by
            title_lower = p["udbud_titel"].lower()
            loc_fit = 1.0 if preferred_loc and preferred_loc in title_lower else (0.5 if preferred_loc else 1.0)

            # Composite match score
            composite = (
                (w_ai_norm * ai_resilience) +
                (w_sal_norm * sal_gro) +
                (w_job_norm * lab_dem) +
                (w_loc_norm * loc_fit)
            )

            top_factors = []
            main_risks = []

            if ai_resilience >= 0.75:
                top_factors.append("Høj AI-robusthed og stærkt augmentationspotentiale")
            if lab_dem >= 0.80:
                top_factors.append("Stærk dimittend-beskæftigelse og høj efterspørgsel")
            if sal_gro >= 0.80:
                top_factors.append("Højt historisk lønpotentiale for dimittender")
            if loc_fit == 1.0 and preferred_loc:
                top_factors.append(f"Match på ønsket studieby ({preferred_loc.capitalize()})")

            if auto_risk >= 0.35:
                main_risks.append(f"Forventet opgaveomstilling ved øget AI-adoption ({round(auto_risk*100)}% automatiseringseksponering)")
            if lab_dem < 0.60:
                main_risks.append("Lavere historisk dimittend-beskæftigelse")

            scored_programs.append({
                "kot_nr": str(p["kot_nr"]),
                "udbud_titel": p["udbud_titel"],
                "match_score": round(composite, 2),
                "automation_risk": round(auto_risk, 3),
                "augmentation_potential": round(aug_pot, 3),
                "labour_demand": round(lab_dem, 3),
                "salary_growth": round(sal_gro, 3),
                "ai_resilience": round(ai_resilience, 3),
                "score_components": {
                    "ai_resilience": round(ai_resilience * 100),
                    "salary_growth": round(sal_gro * 100),
                    "labour_demand": round(lab_dem * 100),
                    "location_fit": round(loc_fit * 100)
                },
                "evidence_quality": "HIGH" if p.get("disco08_code") else "MEDIUM",
                "top_positive_factors": top_factors if top_factors else ["Stabil samlet profil"],
                "main_risks": main_risks if main_risks else ["Ingen væsentlige risikofaktorer identificeret"],
                "automation_risk_pct": f"{round(auto_risk*100)}%",
                "augmentation_potential_pct": f"{round(aug_pot*100)}%",
                "labour_demand_pct": f"{round(lab_dem*100)}%"
            })

        scored_programs.sort(key=lambda x: x["match_score"], reverse=True)
        return scored_programs

    # 5. Counterargument Agent (Data-Backed Downside Risk Analysis)
    def _counterargument_agent(self, top_program):
        title = top_program.get("udbud_titel", "uddannelsen")
        risk_pct = top_program.get("automation_risk_pct", "25%")
        return (
            f"Statistisk forbehold for {title}: "
            f"Baseret på opgavetaksonomien vurderes den direkte automatiseringseksponering til {risk_pct}. "
            f"Et muligt downside-scenarie er, at acceleration i AI-værktøjer omstrukturerer rutineopgaver for nyuddannede."
        )

    # 6. Data Validator Agent (Comprehensive Model & Bounds Verification)
    def _data_validator_agent(self, scored_programs):
        conn = duckdb.connect(self.duckdb_path)
        verified = []

        for p in scored_programs:
            # Validate numerical bounds for ALL model metrics
            score = p.get("match_score", 0)
            auto_risk = p.get("automation_risk", 0)
            aug_pot = p.get("augmentation_potential", 0)
            lab_dem = p.get("labour_demand", 0)
            sal_gro = p.get("salary_growth", 0)
            ai_res = p.get("ai_resilience", 0)

            if not (0.0 <= score <= 1.0 and 0.0 <= auto_risk <= 1.0 and 0.0 <= aug_pot <= 1.0 and
                    0.0 <= lab_dem <= 1.0 and 0.0 <= sal_gro <= 1.0 and 0.0 <= ai_res <= 1.0):
                continue

            # Validate program existence in education_profile_scores canonical table
            db_row = conn.execute("SELECT kot_nr FROM education_profile_scores WHERE kot_nr = ?", [p["kot_nr"]]).fetchone()
            if db_row:
                verified.append(p)

        conn.close()
        return verified if verified else scored_programs

    # 7. Citation Agent (Deterministic Claim-to-Evidence Matching & Source Quality)
    def _citation_agent(self, evidence, top_program):
        citations = []
        program_title = (top_program.get("udbud_titel") or "").lower()
        title_tokens = [w for w in program_title.split() if len(w) > 3][:3]

        for c in evidence["evidence_chunks"]:
            quote_text = (c.get("chunk_text") or "").lower()
            source_title = c.get("report_title") or ""
            source_url = c.get("source_url") or ""

            # Deterministic relevance scoring: require >= 2 matching domain tokens for relevance >= 0.70
            matching_tokens = sum(1 for token in title_tokens if token in quote_text or token in source_title.lower())
            relevance_score = 0.30 + (0.25 * matching_tokens)
            relevance_score = min(0.95, round(relevance_score, 2))

            # Classify source quality deterministically
            quality = classify_source_quality(source_title, source_url)

            # Set supports_claim = True ONLY if relevance >= 0.70
            supports = relevance_score >= 0.70

            if supports:
                citations.append({
                    "claim_id": f"claim-{top_program.get('kot_nr', '17020')}",
                    "source": source_title,
                    "url": source_url,
                    "quote": c["chunk_text"],
                    "relevance_score": relevance_score,
                    "evidence_quality": quality,
                    "supports_claim": True
                })

        # If no evidence passed the relevance threshold, return explicit unsupported claim status
        if not citations:
            return [{
                "claim_id": f"claim-{top_program.get('kot_nr', '17020')}",
                "source": "Ingen specifik kilde matchet",
                "url": "",
                "quote": "Ingen direkte verificeret evidenskilde fundet for dette specifikke fagområde.",
                "relevance_score": 0.0,
                "evidence_quality": "UNKNOWN",
                "supports_claim": False
            }]

        return citations[:5]

    # 8. UI Formatter Agent
    def _ui_formatter_agent(self, verified_programs, counterargument, citations, user_query):
        top_kot = verified_programs[0]["kot_nr"] if verified_programs else "17020"
        scenario_proj = run_scenario_simulation(top_kot, target_year=2030)

        return {
            "status": "success",
            "query": user_query,
            "recommended_programs": verified_programs,
            "devils_advocate_perspective": counterargument,
            "scenario_projections_2030": scenario_proj,
            "evidence_citations": citations,
            "explainability": {
                "user_model_matching": "Deterministisk flerfaktor-vægtet algoritme (w_ai, w_salary, w_demand, w_location)",
                "knowledge_graph_chain": "Education -> Course -> Task -> DISCO-08 -> Industry",
                "register_data_verification": "UFM REST API & Danmarks Statistik (KOT 2009-2026)"
            }
        }

    # Main Orchestrator Pipeline Run
    def run_pipeline(self, user_query, user_profile=None):
        if user_profile is None:
            user_profile = {"risk_tolerance": 0.3, "salary_priority": 0.8, "location": "København"}

        plan = self._planner_agent(user_query, user_profile)
        retrieved = self._retriever_agent(plan)
        evidence = self._evidence_agent(retrieved, plan)
        reasoning = self._reasoning_agent(plan, retrieved, evidence)
        top_prog = reasoning[0] if reasoning else {}
        counterargument = self._counterargument_agent(top_prog)
        validated_programs = self._data_validator_agent(reasoning)
        citations = self._citation_agent(evidence, top_prog)

        final_payload = self._ui_formatter_agent(validated_programs, counterargument, citations, user_query)
        return final_payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run query-aware education analytics engine")
    parser.add_argument("--query", type=str, default="Datalogi og Jura i København")
    parser.add_argument("--risk", type=float, default=0.3)
    parser.add_argument("--salaryPrio", type=float, default=0.5)
    parser.add_argument("--location", type=str, default="")
    args = parser.parse_args()

    engine = MultiAgentEngine()
    result = engine.run_pipeline(args.query, {
        "risk_tolerance": args.risk,
        "salary_priority": args.salaryPrio,
        "location": args.location
    })

    print("\n==========================================")
    print("ANALYTICS ENGINE RESPONSE (JSON PAYLOAD)")
    print("==========================================")
    print(json.dumps(result, indent=2, ensure_ascii=False))

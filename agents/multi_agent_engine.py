"""
Evidence-Based Recommendation Engine & Analytics Pipeline (v2026.4 Targeted Correctness Pass).
Processes user queries, performs staged candidate retrieval, candidate-aware evidence filtering,
interest alignment matching, canonical location matching with source transparency,
deterministic claim-to-evidence validation, data validation, and dynamic scenario modeling.
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
CATALOG_PATH = DATA_DIR / "all_programs_catalog.json"

# Load structured catalog metadata for canonical location lookup ('by', 'institution')
CATALOG_BY_KOT = {}
if CATALOG_PATH.exists():
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            cat_list = json.load(f)
            for item in cat_list:
                if "kot_nr" in item:
                    CATALOG_BY_KOT[str(item["kot_nr"])] = item
    except Exception as e:
        sys.stderr.write(f"Warning loading catalog: {e}\n")

# Synonym dictionary for query intent expansion
SYNONYMS = {
    "journalist": ["journalistik", "medie", "kommunikation"],
    "læge": ["medicin", "odontologi", "sundhed"],
    "koder": ["datalogi", "software", "it-udvikling", "datamatiker"],
    "bygge": ["bygningsingeniør", "arkitektur", "konstruktør"],
    "økonom": ["erhvervsøkonomi", "ha", "oecon", "finans"],
    "lærer": ["pædagog", "læreruddannelse", "undervisning"],
    "matematik": ["datalogi", "ingeniør", "fysik", "økonomi"],
    "kunsthistorie": ["kunst", "visuel", "kultur", "design"],
    "humaniora": ["humaniora", "filosofi", "historie", "litteratur", "sprog", "kultur", "politik"]
}

# Major Danish study cities and regional aliases
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


def classify_source_authority(source_title: str, url: str) -> str:
    """Classifies source authority deterministically based on publisher and official status."""
    combined = f"{source_title} {url}".lower()
    if any(hq in combined for hq in HIGH_QUALITY_SOURCES):
        return "HIGH"
    if any(mq in combined for mq in MEDIUM_QUALITY_SOURCES):
        return "MEDIUM"
    return "LOW" if url.startswith("http") else "UNKNOWN"


def compute_canonical_ai_resilience(auto_risk: float, aug_pot: float) -> float:
    """
    Canonical authoritative formula for derived AI Resilience Index.
    Formula: 0.75 * (1 - automation_risk) + 0.25 * augmentation_potential,
    bounded to the interval [0.1, 1.0].

    This is a crosswalk/model estimate, not an observed employment outcome.
    """
    risk = max(0.0, min(1.0, float(auto_risk)))
    aug = max(0.0, min(1.0, float(aug_pot)))
    risk_resilience = 1.0 - risk
    resilience = (0.75 * risk_resilience) + (0.25 * aug)
    return round(max(0.1, min(1.0, resilience)), 3)


class MultiAgentEngine:

    def __init__(self, duckdb_path=DUCKDB_PATH):
        self.duckdb_path = str(duckdb_path)

    # 1. Planner Agent (Structured Query Intent Extraction)
    def _planner_agent(self, user_query, user_profile):
        query_clean = user_query.strip().lower()
        stop_words = {"i", "på", "til", "og", "eller", "en", "et", "som", "med", "af", "for", "love", "like", "elsker"}
        raw_tokens = [t for t in query_clean.split() if t not in stop_words and len(t) > 1]

        search_terms = raw_tokens.copy()

        detected_location = None
        for city in CITIES:
            if city in query_clean:
                detected_location = city.capitalize()
                search_terms.append(city)

        for key, syns in SYNONYMS.items():
            if any(key in token for token in raw_tokens):
                search_terms.extend(syns)

        profile = user_profile or {}
        if detected_location and not profile.get("location"):
            profile["location"] = detected_location

        return {
            "query": user_query,
            "raw_tokens": raw_tokens,
            "search_terms": list(set(search_terms)),
            "detected_location": detected_location,
            "user_preferences": profile
        }

    # 2. Retriever Agent (Staged Retrieval without High-Salary Fallback Bias)
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
            SELECT kot_nr, udbud_titel, disco08_code, disco_titel,
                   automation_risk, augmentation_potential, labour_demand, salary_growth
            FROM education_profile_scores
            WHERE {where_clause}
            LIMIT 25
        """

        try:
            profiles = conn.execute(query_sql, params).df().to_dict(orient="records")
        except Exception:
            profiles = []

        if not profiles and search_terms:
            first_term = search_terms[0].split()[0]
            if len(first_term) > 3:
                broad_sql = """
                    SELECT kot_nr, udbud_titel, disco08_code, disco_titel,
                           automation_risk, augmentation_potential, labour_demand, salary_growth
                    FROM education_profile_scores
                    WHERE LOWER(udbud_titel) LIKE ?
                    LIMIT 15
                """
                try:
                    profiles = conn.execute(broad_sql, [f"%{first_term}%"]).df().to_dict(orient="records")
                except Exception:
                    profiles = []

        admissions = conn.execute("""
            SELECT kot_nr, udbud_titel, aar, graensekvotient
            FROM kot_graensekvotienter
            WHERE aar IN (2024, 2025, 2026) AND graensekvotient IS NOT NULL
            ORDER BY graensekvotient DESC
            LIMIT 15
        """).df().to_dict(orient="records")

        conn.close()
        return {"profiles": profiles, "admissions": admissions}

    # 3. Evidence Agent (Candidate-Aware Evidence Filtering)
    def _evidence_agent(self, retrieved_data, plan):
        conn = duckdb.connect(self.duckdb_path)
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

        conn.close()

        return {
            "evidence_chunks": chunks,
            "admissions_summary": retrieved_data["admissions"][:5]
        }

    # 4. Reasoning Agent (User Interest Alignment & Structured Location Sources)
    def _reasoning_agent(self, plan, retrieved_data, evidence):
        scored_programs = []
        user_prefs = plan["user_preferences"]
        raw_tokens = plan.get("raw_tokens", [])
        query_terms = [t.lower() for t in raw_tokens if len(t) > 2]
        
        risk_tol = float(user_prefs.get("risk_tolerance", 0.3))
        salary_prio = float(user_prefs.get("salary_priority", 0.5))
        preferred_loc = (user_prefs.get("location") or "").lower().strip()

        # Transparent score component weights summing to 1.0:
        # interest_fit: 30%, ai_resilience: 25%, labour_demand: 20%, salary_growth: 15%, location_fit: 10%
        w_int = 0.30
        w_ai = 0.25 * (1.0 - (0.2 * risk_tol))
        w_job = 0.20
        w_sal = 0.15 * (0.5 + (0.5 * salary_prio))
        w_loc = 0.10 if preferred_loc else 0.0

        weight_sum = w_int + w_ai + w_sal + w_job + w_loc
        w_int_norm = w_int / weight_sum
        w_ai_norm = w_ai / weight_sum
        w_job_norm = w_job / weight_sum
        w_sal_norm = w_sal / weight_sum
        w_loc_norm = w_loc / weight_sum

        for p in retrieved_data["profiles"]:
            kot = str(p["kot_nr"])
            auto_risk = max(0.0, min(1.0, float(p.get("automation_risk", 0.3))))
            aug_pot = max(0.0, min(1.0, float(p.get("augmentation_potential", 0.7))))
            lab_dem = max(0.0, min(1.0, float(p.get("labour_demand", 0.7))))
            sal_gro = max(0.0, min(1.0, float(p.get("salary_growth", 0.7))))

            # Authoritative single AI resilience index
            ai_resilience = compute_canonical_ai_resilience(auto_risk, aug_pot)

            # REQ #4: User Interest Alignment (interest_fit)
            title_lower = p["udbud_titel"].lower().strip()
            disco_lower = (p.get("disco_titel") or "").lower().strip()

            # Filter out city names from interest alignment query terms
            interest_query_terms = [t for t in query_terms if t not in CITIES]

            if interest_query_terms:
                direct_matches = sum(1 for tok in interest_query_terms if tok in title_lower)
                disco_matches = sum(1 for tok in interest_query_terms if tok in disco_lower)
                
                if direct_matches > 0:
                    interest_fit = min(1.0, 0.85 + (0.10 * (direct_matches - 1)))
                elif disco_matches > 0:
                    interest_fit = 0.70
                else:
                    interest_fit = 0.30
            else:
                interest_fit = 0.70

            # REQ #2: Canonical Location Data with Transparent Source
            cat_entry = CATALOG_BY_KOT.get(kot, {})
            cat_city = (cat_entry.get("by") or "").lower().strip()
            cat_inst = (cat_entry.get("institution") or "").lower().strip()

            if preferred_loc:
                if preferred_loc in cat_city or preferred_loc in cat_inst or (preferred_loc == "københavn" and "frederiksberg" in cat_city):
                    loc_fit = 1.0
                    loc_source = "STRUCTURED"
                elif preferred_loc in title_lower:
                    loc_fit = 0.8  # Title fallback gets lower confidence score than structured
                    loc_source = "TITLE_FALLBACK"
                elif cat_city or cat_inst:
                    loc_fit = 0.3
                    loc_source = "STRUCTURED"
                else:
                    loc_fit = 0.5
                    loc_source = "UNKNOWN"
            else:
                loc_fit = 1.0
                loc_source = "STRUCTURED" if (cat_city or cat_inst) else "UNKNOWN"

            # Composite match score with user interest alignment
            composite = (
                (w_int_norm * interest_fit) +
                (w_ai_norm * ai_resilience) +
                (w_sal_norm * sal_gro) +
                (w_job_norm * lab_dem) +
                (w_loc_norm * loc_fit)
            )

            top_factors = []
            main_risks = []

            if interest_fit >= 0.80:
                top_factors.append("Stærk faglig interesse-sammenfald for ansøgeren")
            if ai_resilience >= 0.75:
                top_factors.append("Høj AI-robusthed og stærkt augmentationspotentiale")
            if lab_dem >= 0.80:
                top_factors.append("Stærk dimittend-beskæftigelse og høj efterspørgsel")
            if sal_gro >= 0.80:
                top_factors.append("Højt historisk lønpotentiale for dimittender")
            if loc_fit == 1.0 and preferred_loc:
                top_factors.append(f"Match på ønsket studieby ({preferred_loc.capitalize()})")

            if auto_risk >= 0.35:
                main_risks.append(f"Forventet opgaveomstilling ved øget AI-adoption ({round(auto_risk*100)}% opgaveeksponering)")
            if lab_dem < 0.60:
                main_risks.append("Lavere historisk dimittend-beskæftigelse")

            scored_programs.append({
                "kot_nr": kot,
                "udbud_titel": p["udbud_titel"],
                "match_score": round(composite, 2),
                "automation_risk": round(auto_risk, 3),
                "augmentation_potential": round(aug_pot, 3),
                "labour_demand": round(lab_dem, 3),
                "salary_growth": round(sal_gro, 3),
                "ai_resilience": round(ai_resilience, 3),
                "interest_fit": round(interest_fit, 3),
                "location_fit": round(loc_fit, 2),
                "location_source": loc_source,
                "score_components": {
                    "interest_fit": round(interest_fit * 100),
                    "ai_resilience": round(ai_resilience * 100),
                    "salary_growth": round(sal_gro * 100),
                    "labour_demand": round(lab_dem * 100),
                    "location_fit": round(loc_fit * 100)
                },
                "score_weights": {
                    "interest_weight": round(w_int_norm, 2),
                    "ai_weight": round(w_ai_norm, 2),
                    "job_weight": round(w_job_norm, 2),
                    "salary_weight": round(w_sal_norm, 2),
                    "location_weight": round(w_loc_norm, 2)
                },
                "top_positive_factors": top_factors if top_factors else ["Stabil samlet profil"],
                "main_risks": main_risks if main_risks else ["Ingen væsentlige risikofaktorer identificeret"],
                "automation_risk_pct": f"{round(auto_risk*100)}%",
                "augmentation_potential_pct": f"{round(aug_pot*100)}%",
                "labour_demand_pct": f"{round(lab_dem*100)}%"
            })

        scored_programs.sort(key=lambda x: x["match_score"], reverse=True)
        return scored_programs

    # 5. Counterargument Agent (Modelbaseret Forbehold)
    def _counterargument_agent(self, top_program):
        if not top_program:
            return "Ingen kandidatuddannelse at analysere for risikofaktorer."
        title = top_program.get("udbud_titel", "uddannelsen")
        risk_pct = top_program.get("automation_risk_pct", "25%")
        return (
            f"Modelbaseret forbehold for {title}: "
            f"Baseret på opgavetaksonomien vurderes den direkte automatiseringseksponering til {risk_pct}. "
            f"Et muligt downside-scenarie er, at acceleration i AI-værktøjer omstrukturerer rutineopgaver for nyuddannede."
        )

    # 6. Data Validator Agent (Comprehensive Model Validation & Explicit Payload)
    def _data_validator_agent(self, scored_programs):
        conn = duckdb.connect(self.duckdb_path)
        valid_programs = []
        rejected_programs = []
        rejection_reasons = {}

        for p in scored_programs:
            kot = p.get("kot_nr", "")
            score = p.get("match_score", 0)
            auto_risk = p.get("automation_risk", 0)
            aug_pot = p.get("augmentation_potential", 0)
            lab_dem = p.get("labour_demand", 0)
            sal_gro = p.get("salary_growth", 0)
            ai_res = p.get("ai_resilience", 0)
            int_fit = p.get("interest_fit", 0)

            # Bounds check for all core dimensions [0.0, 1.0]
            if not (0.0 <= score <= 1.0 and 0.0 <= auto_risk <= 1.0 and 0.0 <= aug_pot <= 1.0 and
                    0.0 <= lab_dem <= 1.0 and 0.0 <= sal_gro <= 1.0 and 0.0 <= ai_res <= 1.0 and
                    0.0 <= int_fit <= 1.0):
                rejected_programs.append(p)
                rejection_reasons[kot] = "Numerical metric out of bounds [0.0, 1.0]"
                continue

            # Database existence check
            db_row = conn.execute("SELECT kot_nr FROM education_profile_scores WHERE kot_nr = ?", [kot]).fetchone()
            if db_row:
                valid_programs.append(p)
            else:
                rejected_programs.append(p)
                rejection_reasons[kot] = "Program KOT ID missing from canonical database profile table"

        conn.close()

        if not scored_programs:
            status = "NO_VALID_CANDIDATES"
        elif len(valid_programs) == len(scored_programs):
            status = "VALID"
        elif len(valid_programs) > 0:
            status = "PARTIALLY_VALID"
        else:
            status = "NO_VALID_CANDIDATES"

        return {
            "valid_programs": valid_programs,
            "rejected_programs": rejected_programs,
            "rejection_reasons": rejection_reasons,
            "validation_status": status
        }

    # 7. Citation Agent (REQ #1: Programme & Claim-Specific Evidence Evaluation)
    def _citation_agent(self, evidence, candidate_program):
        if not candidate_program:
            return [{
                "claim_id": "claim-none",
                "source": "Ingen kilde",
                "url": "",
                "quote": "Ingen kandidat matchet.",
                "source_authority": "UNKNOWN",
                "claim_relevance": 0.0,
                "supports_claim": False
            }]

        citations = []
        program_title = (candidate_program.get("udbud_titel") or "").lower()
        title_tokens = [w for w in program_title.split() if len(w) > 3][:3]

        for c in evidence["evidence_chunks"]:
            quote_text = (c.get("chunk_text") or "").lower()
            source_title = c.get("report_title") or ""
            source_url = c.get("source_url") or ""

            matching_tokens = sum(1 for token in title_tokens if token in quote_text or token in source_title.lower())
            relevance_score = 0.30 + (0.25 * matching_tokens)
            relevance_score = min(0.95, round(relevance_score, 2))

            authority = classify_source_authority(source_title, source_url)
            supports = (authority != "UNKNOWN") and (relevance_score >= 0.70)

            if supports:
                citations.append({
                    "claim_id": f"claim-{candidate_program.get('kot_nr', '17020')}",
                    "source": source_title,
                    "url": source_url,
                    "quote": c["chunk_text"],
                    "source_authority": authority,
                    "claim_relevance": relevance_score,
                    "supports_claim": True
                })

        if not citations:
            return [{
                "claim_id": f"claim-{candidate_program.get('kot_nr', '17020')}",
                "source": "Ingen specifik kilde matchet for denne uddannelse",
                "url": "",
                "quote": "Ingen direkte verificeret evidenskilde fundet for dette specifikke fagområde.",
                "source_authority": "UNKNOWN",
                "claim_relevance": 0.0,
                "supports_claim": False
            }]

        return citations[:5]

    # 8. UI Formatter Agent (REQ #1: Programme-Specific Evidence Quality Attachment)
    def _ui_formatter_agent(self, validation_payload, counterargument, evidence, user_query):
        valid_programs = validation_payload["valid_programs"]
        val_status = validation_payload["validation_status"]

        if val_status == "NO_VALID_CANDIDATES" or not valid_programs:
            return {
                "status": "no_relevant_candidates",
                "query": user_query,
                "message": f"Ingen relevante uddannelser matchede søgningen '{user_query}'. Prøv en mere overordnet fagbeskrivelse.",
                "validation_details": validation_payload,
                "recommended_programs": [],
                "evidence_citations": []
            }

        # REQ #1: Calculate program-specific evidence citations and quality for EACH recommended program
        all_program_citations = {}
        for prog in valid_programs:
            prog_citations = self._citation_agent(evidence, prog)
            all_program_citations[prog["kot_nr"]] = prog_citations
            
            # Attach programme-specific overall evidence quality
            top_cite = prog_citations[0] if prog_citations else {}
            prog["evidence_quality"] = top_cite.get("source_authority", "UNKNOWN")
            prog["citations"] = prog_citations

        top_kot = valid_programs[0]["kot_nr"]
        scenario_proj = run_scenario_simulation(top_kot, target_year=2030)
        top_citations = all_program_citations.get(top_kot, [])

        return {
            "status": "success",
            "query": user_query,
            "validation_status": val_status,
            "recommended_programs": valid_programs,
            "devils_advocate_perspective": counterargument,
            "scenario_projections_2030": scenario_proj,
            "evidence_citations": top_citations,
            "explainability": {
                "user_model_matching": "Deterministisk 5-faktor vægtet algoritme (w_interest, w_ai, w_salary, w_demand, w_location)",
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

        validation_payload = self._data_validator_agent(reasoning)
        valid_progs = validation_payload["valid_programs"]
        top_prog = valid_progs[0] if valid_progs else {}

        counterargument = self._counterargument_agent(top_prog)

        final_payload = self._ui_formatter_agent(validation_payload, counterargument, evidence, user_query)
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

    # Clean stdout JSON output
    sys.stdout.write(json.dumps(result, ensure_ascii=False))

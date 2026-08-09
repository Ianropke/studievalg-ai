"""
Evidence source registry for Studievalg-AI.

This module indexes source metadata. It does NOT claim that every source was
retrieved, analysed, or used to support every programme. Programme-specific
evidence must be attached separately when an actual claim/source relationship
has been established.
"""

from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WEB_JSON_PATH = BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json"
EVIDENCE_KB_PATH = DATA_DIR / "evidence_knowledge_base.json"

# Registered source metadata. These are source candidates/registry entries,
# not proof that the source supports every programme-level claim.
EVIDENCE_SOURCES = {
    "Niveau 1: Kernestudier": [
        {"id": "oecd_2024", "name": "OECD Employment Outlook (2024)", "type": "Kernestudie", "weight": 0.95, "decay": 1.0, "relevance_dk": 0.95, "desc": "OECD analysis of employment, skills and automation."},
        {"id": "ilo_2024", "name": "ILO Generative AI and Jobs (2024)", "type": "Kernestudie", "weight": 0.95, "decay": 1.0, "relevance_dk": 0.90, "desc": "ILO analysis of generative AI exposure and augmentation."},
        {"id": "stanford_ai_2025", "name": "Stanford AI Index Report (2025)", "type": "Kernestudie", "weight": 0.94, "decay": 1.0, "relevance_dk": 0.92, "desc": "Annual AI research and economic indicators."},
        {"id": "kraka_deloitte_2024", "name": "Kraka & Deloitte (2024)", "type": "Kernestudie (DK)", "weight": 0.92, "decay": 1.0, "relevance_dk": 1.0, "desc": "Danish analysis of AI and employment."},
        {"id": "ae_raad_2024", "name": "AE-rådet / FH (2024)", "type": "Kernestudie (DK)", "weight": 0.92, "decay": 1.0, "relevance_dk": 1.0, "desc": "Danish analysis of AI exposure and inequality."},
        {"id": "pwc_barometer_2025", "name": "PwC AI Jobs Barometer (2025)", "type": "Kernestudie", "weight": 0.85, "decay": 1.0, "relevance_dk": 0.88, "desc": "Analysis of AI exposure, wages and job demand."},
        {"id": "wef_future_2025", "name": "WEF Future of Jobs Report (2025)", "type": "Kernestudie", "weight": 0.80, "decay": 1.0, "relevance_dk": 0.85, "desc": "Global labour-market projections."},
        {"id": "imf_ai_2024", "name": "IMF AI Preparedness Index (2024)", "type": "Kernestudie", "weight": 0.88, "decay": 0.95, "relevance_dk": 0.90, "desc": "Country and labour-market AI preparedness."},
        {"id": "openai_eloundou_2023", "name": "OpenAI / Eloundou et al. (2023)", "type": "Kernestudie (LLM)", "weight": 0.88, "decay": 0.90, "relevance_dk": 0.85, "desc": "LLM task exposure study."},
        {"id": "mckinsey_genai_2023", "name": "McKinsey Global Institute (2023)", "type": "Kernestudie", "weight": 0.83, "decay": 0.88, "relevance_dk": 0.82, "desc": "Generative AI analysis of knowledge work."}
    ],
    "Niveau 2: Akademiske AI-Papers": [
        {"id": "autor_mit_2024", "name": "Autor, Chin et al. (MIT / NBER 2024)", "type": "Peer-Reviewed", "weight": 0.96, "decay": 1.0, "relevance_dk": 0.90, "desc": "AI and augmentation of human expertise."},
        {"id": "acemoglu_2024", "name": "Acemoglu (MIT / NBER 2024)", "type": "Peer-Reviewed", "weight": 0.95, "decay": 1.0, "relevance_dk": 0.90, "desc": "Macroeconomic analysis of AI."},
        {"id": "brynjolfsson_2023", "name": "Brynjolfsson et al. (Stanford / NBER)", "type": "Peer-Reviewed", "weight": 0.95, "decay": 0.92, "relevance_dk": 0.88, "desc": "Generative AI at Work."},
        {"id": "felten_2023", "name": "Felten, Raj & Seamans (2023)", "type": "Peer-Reviewed", "weight": 0.91, "decay": 0.90, "relevance_dk": 0.85, "desc": "Occupational AI exposure."},
        {"id": "webb_2020", "name": "Webb (Stanford 2020)", "type": "Peer-Reviewed", "weight": 0.85, "decay": 0.80, "relevance_dk": 0.80, "desc": "AI and labour-market exposure."}
    ],
    "Niveau 3: Danske Analyser & Myndigheder": [
        {"id": "dst_2025", "name": "Danmarks Statistik (DST 2025)", "type": "Myndighed (DK)", "weight": 0.95, "decay": 1.0, "relevance_dk": 1.0, "desc": "Official Danish statistics."},
        {"id": "finansmin_2024", "name": "Finansministeriet (2024)", "type": "Myndighed (DK)", "weight": 0.92, "decay": 1.0, "relevance_dk": 1.0, "desc": "Danish economic analysis."},
        {"id": "digst_2025", "name": "Digitaliseringsstyrelsen (2025)", "type": "Myndighed (DK)", "weight": 0.90, "decay": 1.0, "relevance_dk": 1.0, "desc": "Danish AI adoption statistics."},
        {"id": "di_dansk_erhverv_2024", "name": "Dansk Industri & Dansk Erhverv (2024)", "type": "Erhverv (DK)", "weight": 0.88, "decay": 0.95, "relevance_dk": 1.0, "desc": "Danish employer AI analysis."},
        {"id": "dea_vive_2024", "name": "Tænketanken DEA & VIVE (2024)", "type": "Forskning (DK)", "weight": 0.89, "decay": 0.95, "relevance_dk": 1.0, "desc": "Danish education and labour-market analysis."}
    ],
    "Niveau 4: Levende Job- & Arbejdsmarkedsdata": [
        {"id": "jobindex_star_2026", "name": "Jobindex & STAR Jobbarometer (2026)", "type": "Arbejdsmarkedsdata", "weight": 0.94, "decay": 1.0, "relevance_dk": 1.0, "desc": "Danish job-market indicators."},
        {"id": "linkedin_jobs_2026", "name": "LinkedIn Jobs & Skills Insights (2026)", "type": "Arbejdsmarkedsdata", "weight": 0.90, "decay": 1.0, "relevance_dk": 0.90, "desc": "Job and skill demand indicators."},
        {"id": "ufm_kot_2026", "name": "UFM KOT Registerdata (2009–2026)", "type": "Offentlig Registerdata", "weight": 0.98, "decay": 1.0, "relevance_dk": 1.0, "desc": "Observed Danish admission and threshold data."}
    ],
    "Niveau 5: Skills-Hierarki & Kompetencedata": [
        {"id": "esco_eu_2025", "name": "EU ESCO Taxonomy v1.2 (2025)", "type": "Kompetence-Klassifikation", "weight": 0.96, "decay": 1.0, "relevance_dk": 0.95, "desc": "European skills and occupation taxonomy."},
        {"id": "onet_2025", "name": "US O*NET Database 29.1 (2025)", "type": "Kompetence-Klassifikation", "weight": 0.95, "decay": 1.0, "relevance_dk": 0.85, "desc": "US occupation task and skill data; requires crosswalk for Danish use."},
        {"id": "disco08_dst", "name": "Danmarks Statistik DISCO-08 Standard", "type": "Kompetence-Klassifikation", "weight": 0.98, "decay": 1.0, "relevance_dk": 1.0, "desc": "Official Danish occupation classification."}
    ],
    "Niveau 6: Real-Time LLM Benchmarks": [
        {"id": "swe_bench_2025", "name": "SWE-bench Verified (2025)", "type": "LLM Benchmark", "weight": 0.92, "decay": 1.0, "relevance_dk": 0.80, "desc": "Software engineering benchmark."},
        {"id": "humanities_last_exam_2025", "name": "Humanity's Last Exam (2025)", "type": "LLM Benchmark", "weight": 0.94, "decay": 1.0, "relevance_dk": 0.85, "desc": "Expert knowledge benchmark."},
        {"id": "stanford_helm_2025", "name": "Stanford HELM (2025)", "type": "LLM Benchmark", "weight": 0.93, "decay": 1.0, "relevance_dk": 0.82, "desc": "Holistic language-model evaluation."}
    ]
}


def build_evidence_engine():
    print("--> Building evidence source registry...")
    flattened_sources = []
    for level, sources in EVIDENCE_SOURCES.items():
        for source in sources:
            final_weight = round(
                source["weight"] * source["decay"] * source["relevance_dk"], 3
            )
            flattened_sources.append({
                "level": level,
                "id": source["id"],
                "name": source["name"],
                "type": source["type"],
                "base_weight": source["weight"],
                "decay": source["decay"],
                "relevance_dk": source["relevance_dk"],
                "final_evidence_weight": final_weight,
                "desc": source["desc"]
            })

    EVIDENCE_KB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EVIDENCE_KB_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "registry_type": "SOURCE_REGISTRY",
            "total_sources": len(flattened_sources),
            "levels_count": len(EVIDENCE_SOURCES),
            "sources": flattened_sources
        }, f, ensure_ascii=False, indent=2)

    if WEB_JSON_PATH.exists():
        with open(WEB_JSON_PATH, "r", encoding="utf-8") as f:
            catalog = json.load(f)

        for prog in catalog:
            # No fabricated programme-level consensus. These are registry
            # statistics only; actual evidence must be attached to claims.
            prog["evidence_engine"] = {
                "registry_sources": len(flattened_sources),
                "registry_levels": len(EVIDENCE_SOURCES),
                "programme_evidence_status": "NOT_ESTABLISHED",
                "programme_evidence_note": (
                    "Source registry only. No source is treated as supporting "
                    "this programme unless a programme-specific claim/evidence "
                    "relationship has been established."
                )
            }

        with open(WEB_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"--> Indexed {len(flattened_sources)} source registry entries.")


if __name__ == "__main__":
    build_evidence_engine()

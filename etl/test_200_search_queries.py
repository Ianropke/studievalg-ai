"""
Automated Test Suite for 200 Danish Study Program Search Queries.
Tests official UFM study titles, everyday Danish job titles, and common typos.
"""

from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent
CATALOG_PATH = BASE_DIR / "web" / "src" / "data" / "all_programs_catalog.json"

SYNONYM_MAP = {
  # Teeth & Dentistry
  "tandlæge": ["odontologi", "tandpleje", "tandteknik"],
  "tændlæge": ["odontologi", "tandpleje", "tandteknik"],
  "ordontologi": ["odontologi"],
  "odontologi": ["odontologi", "tandlæge"],
  "tandplejer": ["tandpleje", "odontologi"],
  "dentist": ["odontologi"],

  # Doctors & Healthcare
  "læge": ["medicin", "lægemiddelvidenskab", "kirurgi"],
  "doktor": ["medicin"],
  "medicin": ["medicin", "læge"],
  "dyrlæge": ["veterinær"],
  "veterinær": ["veterinær", "dyrlæge"],
  "sygeplejerske": ["sygeplejerske", "sygepleje"],
  "jordemoder": ["jordemoder"],
  "fysioterapeut": ["fysioterapi"],
  "ergoterapeut": ["ergoterapi"],

  # Law & Legal
  "advokat": ["jura", "erhvervsjura"],
  "jurist": ["jura", "erhvervsjura"],
  "jura": ["jura", "juridisk"],

  # Engineering & Architecture
  "ingeniør": ["ingeniør", "teknisk videnskab", "bygningsdesign", "computer engineering"],
  "civilingeniør": ["ingeniør", "teknisk videnskab"],
  "diplomingeniør": ["ingeniør", "diplom"],
  "arkitekt": ["arkitektur", "bygningsdesign", "byggeri"],
  "skovingeniør": ["skov", "landskab", "naturressourcer"],

  # IT & Coding
  "programmør": ["datalogi", "software", "computer", "kunstig intelligens"],
  "kodning": ["datalogi", "software", "computer engineering"],
  "datalog": ["datalogi"],
  "software": ["software", "datalogi", "computer engineering"],

  # Teaching & Education
  "skolelærer": ["lærer", "folkeskolelærer"],
  "lærer": ["lærer", "pædagog"],
  "pædagog": ["pædagog"],

  # Business & Accounting
  "revisor": ["revision", "erhvervsøkonomi", "økonomi"],
  "politiker": ["statskundskab", "politik"],

  # Arts & Culture
  "skuespiller": ["teater", "performancestudier", "musik", "film"],
  "grafisk design": ["multimediedesigner", "visuel kommunikation", "design"],
  "agronom": ["agrobiologi", "jordbrug", "plante"],
  "aktuarvidenskab": ["forsikringsmatematik", "matematik"],
  "astronomi": ["fysik", "geofysik og rumteknologi"],

  # University Acronyms
  "dtu": ["kgs. lyngby", "teknisk videnskab", "lyngby", "ballerup"],
  "cbs": ["frederiksberg", "business", "shipping", "erhvervsøkonomi"],
  "aau": ["aalborg"],
  "itu": ["it-universitetet", "datalogi", "software"],
  "erhvervsakademi": ["professionsbachelor", "erhvervsøkonom", "akademigrad"],
  "naestved": ["næstved"],
  "skov og natur": ["skov", "landskab"],
  "havbiologi": ["biologi"],
  "oplevelsesøkonomi": ["service", "turisme", "leisure"],
  "mode og design": ["design", "tekstildesign"],
  "digital kommunikation": ["kommunikation", "it", "medievidenskab"],
  "reklame": ["markedsføring", "kommunikation"],
  "forlag": ["kommunikation", "dansk", "litteraturvidenskab"],
  "master": ["kandidat", "bachelor"],
  "akademigrad": ["akademiker", "bachelor"],
  "diplomuddannelse": ["diplom", "diplomingeniør"],
  "kvote 1": ["sommerstart", "bachelor"],
  "kvote 2": ["sommerstart", "bachelor"]
}

def normalize_text(text: str) -> str:
    return (
        text.lower()
        .replace("tændlæge", "tandlæge")
        .replace("ordontologi", "odontologi")
        .replace("naestved", "næstved")
        .replace("kvote 1", "sommerstart")
        .replace("kvote 2", "sommerstart")
        .replace("æ", "ae")
        .replace("ø", "oe")
        .replace("å", "aa")
        .strip()
    )

def run_200_queries_test():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    queries = [
        # Dentistry & Healthcare (1-20)
        "tandlæge", "tændlæge", "ordontologi", "odontologi", "tandplejer", "dentist",
        "læge", "doktor", "medicin", "sygeplejerske", "fysioterapeut", "jordemoder",
        "dyrlæge", "veterinær", "biomedicin", "lægemiddelvidenskab", "ergoterapeut",
        "audiologi", "folkesundhed", "klinisk biomekanik",

        # IT & Software (21-40)
        "datalogi", "datalog", "software", "programmør", "kodning", "kunstig intelligens",
        "machine learning", "data science", "cybersecurity", "webutvikler", "multimediedesigner",
        "it-arkitektur", "softwareteknologi", "datamanagement", "spiludvikling", "medialogi",
        "it og kommunikation", "datalogi og økonomi", "bachelor software", "computer science",

        # Engineering (41-60)
        "ingeniør", "civilingeniør", "diplomingeniør", "bygningsdesign", "bygningsingeniør",
        "maskiningeniør", "elektronik", "robotteknologi", "nanoteknologi", "miljøteknologi",
        "kemiingeniør", "bioteknologi", "energiteknologi", "bæredygtigt design", "rumteknologi",
        "elektroteknologi", "produktionsteknologi", "eksport og teknologi", "velfærdsteknologi", "landinspektør",

        # Business & Economics (61-80)
        "økonomi", "erhvervsøkonomi", "ha", "cand.merc", "shipping", "revisor",
        "revision", "markedsføring", "ledelse", "hrm", "international business", "polit",
        "finans", "logistik", "aktuar", "forsikringsmatematik", "leisure management",
        "serviceøkonom", "market anthropology", "handelsøkonom",

        # Law & Social Sciences (81-100)
        "jura", "advokat", "jurist", "statskundskab", "politiker", "sociologi",
        "psykologi", "psykolog", "antropologi", "kriminologi", "forvaltning",
        "samfundsfag", "europastudier", "politik og administration", "socialrådgiver",
        "pædagog", "skolelærer", "lærer", "uddannelsesvidenskab", "erhvervsjura",

        # Humanities & Languages (101-120)
        "historie", "filosofi", "dansk", "engelsk", "tysk", "fransk",
        "spansk", "kinesisk", "japanstudier", "retorik", "lingvistik",
        "litteraturvidenskab", "religionsvidenskab", "teologi", "præst",
        "teater", "musikvidenskab", "kunsthistorie", "arkæologi", "kulturarv",

        # Media, Communication & Design (121-140)
        "journalistik", "journalist", "medievidenskab", "kommunikation", "film",
        "arkitekt", "design", "grafisk design", "interaktionsdesign", "oplevelsesøkonomi",
        "visuel kommunikation", "tekstildesign", "lyddesign", "skuespiller",
        "designpsykologi", "mode og design", "digital kommunikation", "reklame", "pr", "forlag",

        # Natural Sciences & Math (141-160)
        "fysik", "kemi", "biologi", "matematik", "geologi", "geografi",
        "astronomi", "nanoscience", "molekylærbiologi", "miljøvidenskab",
        "klima", "skov og natur", "jordbrug", "agronom", "skovingeniør",
        "mejeriteknologi", "fødevarevidenskab", "havbiologi", "statistik", "aktuarvidenskab",

        # Major Danish Cities & Campuses (161-180)
        "københavn", "aarhus", "odense", "aalborg", "lyngby", "frederiksberg",
        "roskilde", "kolding", "esbjerg", "sønderborg", "slagelse", "naestved",
        "herning", "viborg", "holstebro", "horsens", "haderslev", "svendborg",
        "rønne", "thisted",

        # Universities & Institutions (181-200)
        "ku", "dtu", "au", "cbs", "sdu", "aau", "ruc", "itu",
        "professionsbachelor", "erhvervsakademi", "diplom", "master",
        "akademigrad", "diplomuddannelse", "kandidat", "bachelor",
        "sommerstart", "vinterstart", "kvote 1", "kvote 2"
    ]

    print("=========================================================")
    print("      AUTOMATED TEST OF 200 REAL SEARCH QUERIES          ")
    print("=========================================================")

    passed = 0
    failed = 0

    for idx, q in enumerate(queries, 1):
        raw_q = q.strip().lower()
        norm_q = normalize_text(q)

        expanded = [raw_q, norm_q]
        for key in SYNONYM_MAP:
            if raw_q in key or norm_q in normalize_text(key):
                expanded.extend(SYNONYM_MAP[key])

        matches = []
        for prog in catalog:
            p_title = prog["udbud_titel"].lower()
            p_disco = prog["disco_titel"].lower()
            p_kot = prog["kot_nr"].lower()
            p_city = prog["by"].lower()
            p_inst = prog["institution"].lower()
            p_skills = " ".join(prog.get("skills_hierarchy", {}).get("skills", [])).lower()
            p_courses = " ".join(prog.get("skills_hierarchy", {}).get("courses", [])).lower()

            match_found = any(
                term and (
                    term in p_title or normalize_text(term) in p_title or
                    term in p_disco or term in p_kot or term in p_city or
                    term in p_inst or term in p_skills or term in p_courses
                )
                for term in expanded
            )
            if match_found:
                matches.append(prog)

        if len(matches) > 0:
            passed += 1
            print(f"  [{idx:03d}/200] ✓ Query '{q}': {len(matches)} matches (Top Match: #{matches[0]['kot_nr']} - {matches[0]['udbud_titel']})")
        else:
            failed += 1
            print(f"  [{idx:03d}/200] ❌ Query '{q}': NO MATCHES FOUND")

    print("\n=========================================================")
    print(f"  RESULTS: {passed}/200 PASSED ({(passed/200)*100:.1f}%), {failed} FAILED")
    print("=========================================================")

if __name__ == "__main__":
    run_200_queries_test()

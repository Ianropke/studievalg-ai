"""
DISCO-08 Occupational Classification Data Loader.
Stores standard DISCO-08 categories (1-digit to 6-digit) for mapping study programs to occupations.
"""

from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DISCO_JSON_PATH = DATA_DIR / "disco08_categories.json"

# Core high-level DISCO-08 major & sub-major groups relevant to Danish higher education
CORE_DISCO_08_MAPPING = [
    {"code": "1", "title": "Ledarbejde", "level": 1},
    {"code": "2", "title": "Arbejde der forudsætter viden på højeste niveau", "level": 1},
    {"code": "21", "title": "Arbejde inden for naturvidenskab og ingeniørvæsen", "level": 2},
    {"code": "211", "title": "Fysikere, kemikere, geologer og meteorologer", "level": 3},
    {"code": "212", "title": "Matematikere, aktuarer og statistikere", "level": 3},
    {"code": "213", "title": "Biologer, botanikere, zoologer mv.", "level": 3},
    {"code": "214", "title": "Civilingeniører og relateret arbejde", "level": 3},
    {"code": "215", "title": "El- og stærkstrømsingeniører", "level": 3},
    {"code": "216", "title": "Arkitekter, byplanlæggere og landinspektører", "level": 3},
    {"code": "22", "title": "Arbejde inden for sundhedsområdet", "level": 2},
    {"code": "221", "title": "Læger og speciallæger", "level": 3},
    {"code": "221100", "title": "Læger", "level": 6},
    {"code": "222", "title": "Sygeplejersker og jordemødre", "level": 3},
    {"code": "226", "title": "Tandlæger, farmaceuter, fysioterapeuter mv.", "level": 3},
    {"code": "23", "title": "Undervisningsarbejde", "level": 2},
    {"code": "231", "title": "Universitets- og højskolelærere", "level": 3},
    {"code": "232", "title": "Gymnasielærere og ervervsskolelærere", "level": 3},
    {"code": "24", "title": "Arbejde inden for forretningsforståelse og administration", "level": 2},
    {"code": "241", "title": "Finansanalytikere, revisorer og økonomer", "level": 3},
    {"code": "241100", "title": "Revisorer og rådgivere", "level": 6},
    {"code": "241200", "title": "Finans- og investeringsanalytikere", "level": 6},
    {"code": "242", "title": "Organisations- og administrationskonsulenter", "level": 3},
    {"code": "25", "title": "Arbejde inden for informationsteknologi (IKT)", "level": 2},
    {"code": "251", "title": "Software- og applikationsudviklere og -analytikere", "level": 3},
    {"code": "251100", "title": "Systemanalytikere og IT-arkitekter", "level": 6},
    {"code": "251200", "title": "Softwareudviklere og -programmører", "level": 6},
    {"code": "251300", "title": "Web- og multimedieudviklere", "level": 6},
    {"code": "251400", "title": "Applikationsprogrammører", "level": 6},
    {"code": "251900", "title": "Andre software- og applikationsudviklere", "level": 6},
    {"code": "252", "title": "Database- og netværks-specialister", "level": 3},
    {"code": "252100", "title": "Databasedesignere og -administratorer", "level": 6},
    {"code": "252200", "title": "Systemadministratorer", "level": 6},
    {"code": "252900", "title": "Datasikkerhedsspecialister og IT-sikkerhedskonsulenter", "level": 6},
    {"code": "26", "title": "Arbejde inden for jura, samfundsvidenskab og kultur", "level": 2},
    {"code": "261", "title": "Jurister, advokater og dommere", "level": 3},
    {"code": "261100", "title": "Advokater og jurister", "level": 6},
    {"code": "263", "title": "Samfundsforskere, sociologer og statskundskabere", "level": 3},
    {"code": "263100", "title": "Økonomer", "level": 6},
    {"code": "263200", "title": "Sociologer og antropolger", "level": 6},
    {"code": "263300", "title": "Statskundskabere og politologer", "level": 6},
]


def store_disco():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DISCO_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(CORE_DISCO_08_MAPPING, f, ensure_ascii=False, indent=2)
    print(f"--> Saved {len(CORE_DISCO_08_MAPPING)} DISCO-08 categories to {DISCO_JSON_PATH}")


if __name__ == "__main__":
    store_disco()

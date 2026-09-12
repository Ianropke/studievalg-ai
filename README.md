# AI-Studievalgsplatform — Uddannelsesindsigt.dk

En landsdækkende platform for AI-informeret studievejledning med deterministisk vægtningsmotor, KOT/UFM-data, dokumenteret provenance og en delvis O*NET 31.0-migration.

Platformen er beslutningsstøtte. Den må ikke præsentere modelestimerede AI-signaler, occupational crosswalks eller provenance-ufuldstændige job/løn-værdier som observerede danske uddannelsesudfald.

---

## System- og produktionsarkitektur

Platformen er et hybridt **Next.js + Python Analytics-system**:

1. **Klient-side katalog og ranking (`web/`)**
   - Forhåndsberegnet katalog med 1.413 danske videregående uddannelsesudbud.
   - Søgning, filtrering, karakterkontrol og præference-rangering direkte i browseren.
   - Forbliver brugbart, hvis den separate Python-analysetjeneste er utilgængelig.
   - Ranking må kun få relative forskelle fra signaler, der har tilstrækkelig programmevidence. Manglende/legacy signaler neutraliseres til 50, så de ikke belønner eller straffer et program relativt til et andet.

2. **Dybdegående analytics (`agents/multi_agent_engine.py`)**
   - Bruger DuckDB (`data/kot_data.duckdb`) og den strengere `education_profile_scores`-pipeline.
   - Den tabel bygges kun, når de krævede uddannelses-, arbejdsmarkeds-, løn-, DISCO- og AI-kilder/mappings er til stede.
   - Hvis analytics-servicen ikke er tilgængelig, returnerer API'et en eksplicit unavailable/503-status frem for fallback-anbefalinger.

Se `docs/PROJECT_STATE.md` for den aktuelle implementerings- og evidensstatus.

---

## Sådan skal scorerne læses

| Signal | Evidensstatus | Må ikke læses som |
| --- | --- | --- |
| KOT/adgangsdata | Observeret admissionsdata | Arbejdsmarkedsefterspørgsel eller fremtidig succes |
| AI-opgaveeksponering / augmentation | O*NET-baseret crosswalk/model | Dansk jobtabsrate eller automatiseringssandsynlighed |
| AI-resiliensindeks | Afledt modelindeks | Jobgaranti eller individuel prognose |
| Jobindikator i klientkatalog | `PROVENANCE_REQUIRED` indtil programkilde er dokumenteret | Observeret programmefterspørgsel |
| Lønindikator i klientkatalog | `PROVENANCE_REQUIRED` indtil programkilde er dokumenteret | Observeret programløn |
| Monte Carlo-percentiler | Simulations-/modelinterval | Empirisk konfidensinterval |

### O*NET 31.0

Modelversion 2026.6 bruger amerikanske O*NET 31.0 Work Activities for 569 af 1.413 uddannelser (40,3%) gennem O*NET–ESCO/ISCO/DISCO og program→occupation-mappings. O*NET publicerer ikke en automatiseringssandsynlighed for danske uddannelser og validerer ikke platformens AI-resiliensformel.

De resterende 844 programmer mangler en defensibel O*NET 31.0-programkobling. Deres legacy/default AI-værdier må derfor ikke skabe relative ranking-forskelle; klienten neutraliserer den dimension.

Job- og lønværdier i det statiske klientkatalog mangler fortsat komplet programniveau-provenance og neutraliseres tilsvarende, indtil kilde, population, periode, transformation og mapping er dokumenteret.

---

## Lokal udvikling

### Python

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m unittest discover -s tests -p "test_*.py"
python3 etl/verify_all_data_integrity.py
```

### Web

```bash
npm install --prefix web --no-audit --no-fund
npm run --prefix web typecheck
npm run --prefix web lint
npm run --prefix web algorithm:test
npm run --prefix web build
npm exec --prefix web -- playwright install chromium
npm run --prefix web e2e
```

---

## Centrale dokumenter

- `docs/PROJECT_STATE.md` — aktuel implementering og evidensstatus.
- `docs/MODEL_METHODOLOGY.md` — formler, epistemiske lag og simulationsregler.
- `data/DATA_SOURCE_CONTRACT.md` — krav til kilder, mappings og provenance.
- `docs/DATA_PROVENANCE_GAPS.md` — kendte programniveau-huller.
- `data/ONET31_MIGRATION_REPORT.json` — O*NET 31.0-dækning, input-hashes og scoredrift.
- `.github/workflows/quality.yml` — release quality gates.

Generated catalogues og audit-artefakter er output fra pipeline-koden; de skal ikke håndredigeres for at ændre modelresultater.

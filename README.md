# AI-Studievalgsplatform — Uddannelsesindsigt.dk

En landsdækkende, fremtidssikret platform for AI-informeret studievejledning med deterministisk vægtningsmotor, registerdata fra Danmarks Statistik (DST) og UFM, samt O*NET 28.1 / DISCO-08 opgavetaksonomi.

---

## 🏛️ System- og Produktion-Arkitektur

Platformen er opbygget som et **hybrid Next.js + Python Analytics-system**:

1. **Klient-side Søgemaskine (Next.js / TypeScript)**:
   - Forhåndsberegnet kanonisk uddannelseskatalog (`all_programs_catalog.json`) med 1.413 danske videregående uddannelser.
   - Realtids-filtrering, karakter-slider og vægtningssortering direkte i browseren med 0 ms responstid.
   - Forbliver 100% funktionel selv hvis serverless Python-miljøet er utilgængeligt.

2. **Dybdegående Analytics Pipeline (`agents/multi_agent_engine.py`)**:
   - Kræver lokalt/server-baseret Python-miljø med DuckDB database (`data/kot_data.duckdb`).
   - Udfører struktureret query-intent parsing, kandidat-specifik evidensfiltrering, deterministisk kildekvalitetsklassificering (`HIGH`, `MEDIUM`, `LOW`) og Monte Carlo scenariesimuleringer.
   - Hvis Python-miljøet ikke er tilgængeligt (fx under ren serverless Vercel-deployment), returnerer API'et en sikker `HTTP 503 ANALYTICS_ENGINE_UNAVAILABLE` statuskode uden at fabrikere falske anbefalinger.

---

## 🚀 Kom i gang (Lokal udvikling & Analytics Engine)

### 1. Opsæt Python-miljø (`venv`)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Kør Data Integrity Quality Gate
```bash
python3 etl/verify_all_data_integrity.py
```

### 3. Kør Enhedstests (Python & TypeScript)
```bash
# Python backend tests
python3 -m unittest discover -s tests -p "test_*.py"

# TypeScript frontend & algoritme tests
cd web && npx tsx src/__tests__/algorithm.test.ts
```

### 4. Start Next.js Frontend Server
```bash
cd web
npm run dev
```

---

## 📊 Datakilder & Metoder

- **`data/kot_data.duckdb`**: Lokal DuckDB database med historiske optagelsestal, grænsekvotienter og DISCO-08 erhvervskoder.
- **`web/src/data/all_programs_catalog.json`**: Eksporteret kanonisk katalog med empiriske registermålinger.
- **`docs/MODEL_METHODOLOGY.md`**: Komplet metodisk dokumentation for formler, Monte Carlo scenarier og datakilder.

# AI-Studievalgsplatform (Lokal-First & Self-Hosted)

En landsdækkende, fremtidssikret platform for AI-informeret studievejledning med 0 DKK i løbende drift-omkostninger.

## 🚀 Kom i gang

### 1. Virtuelt Python-miljø & Afhængigheder
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Ingest UFM Offentlige KOT-Data (14.934 Poster)
```bash
python3 etl/disco_ingest.py
python3 etl/db_initializer.py
python3 etl/ufm_kot_ingest.py
```

### 3. Analyser & Søg i DuckDB Databasen
```bash
python3 etl/query_kot.py
```

## 📊 Datastruktur

- **`data/kot_data.duckdb`**: Lokal DuckDB database med historiske optagelsestal, grænsekvotienter og DISCO-08 erhvervskoder.
- **`data/kot_data.parquet`**: Komprimeret columnar storage til ultra-hurtig OLAP-beregning.
- **`data/reports/`**: Mappe til arbejdsmarkeds- og AI-rapporter (PDF).
- **`data/curricula/`**: Mappe til universersitetsstudieordninger (PDF).

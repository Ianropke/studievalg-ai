# Production analytics engine

Vercel kan ikke køre projektets Python-venv og DuckDB-pipeline som en almindelig Next.js-serverless-funktion. Repositoryet indeholder derfor en lille HTTP-wrapper i `services/analytics_api.py`, som skal deployes som en separat Python-service.

## Deploy

Brug eksempelvis Railway, Render eller Fly.io med:

- Build/install: `pip install -r requirements.txt`
- Start: `python services/analytics_api.py`
- Health check: `/health`

Sæt disse miljøvariabler på Python-servicen:

- `ANALYTICS_API_TOKEN`: en lang tilfældig token
- `CORS_ORIGIN`: `https://uddannelsesindsigt.com`

Sæt derefter disse miljøvariabler i Vercel Production:

- `ANALYTICS_ENGINE_URL`: den fulde URL til `/analyze`
- `ANALYTICS_ENGINE_TOKEN`: samme token som på Python-servicen

Frontendens `/api/pipeline` bruger den eksterne engine først og falder kun tilbage til lokal Python, når den findes. Hvis engine-servicen er nede, returneres fortsat en ærlig `503` uden fabrikerede anbefalinger.

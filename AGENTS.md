# Uddannelsesindsigt — repository contract

Uddannelsesindsigt is a Danish education decision-support platform with a client-side Next.js catalogue/ranking experience and a separate Python/DuckDB analytics service. It must help users compare options without presenting model estimates, occupational crosswalks or incomplete provenance as observed Danish programme outcomes.

Keep this file high-signal. Load deeper context only when the active task needs it.

## Context routing

- Model semantics, formulas and epistemic levels → `docs/MODEL_METHODOLOGY.md`.
- Current implementation and evidence status → `docs/PROJECT_STATE.md`.
- Data/source and mapping requirements → `data/DATA_SOURCE_CONTRACT.md` and `data/sources/README.md`.
- Known coverage limitations → `docs/DATA_PROVENANCE_GAPS.md`.
- Production analytics boundary → `docs/PRODUCTION_ANALYTICS.md`, `services/analytics_api.py`, `web/src/app/api/pipeline/route.ts`.
- Web scoring/ranking → `web/src/lib/domainScoring.ts`, `web/src/lib/preferenceMatching.ts` and relevant web tests.
- Python recommendation engine → `agents/multi_agent_engine.py` and `tests/`.
- ETL-specific rules → `etl/AGENTS.md`.
- Release checks → `.github/workflows/quality.yml`.

Historical `antigravity-*.md`, design briefs and generated artefacts are context, not current runtime authority. Do not read all documents before every edit.

## Evidence semantics

Keep these classes distinct:

1. **OBSERVED** — a value directly measured in a named source dataset for a documented population/period.
2. **DERIVED** — a deterministic transformation of documented observations.
3. **CROSSWALK** — a value transferred through a documented taxonomy/classification mapping.
4. **MODEL** — a value produced from explicit assumptions/formulas.
5. **PROVENANCE_REQUIRED / UNKNOWN** — insufficient programme-level evidence for an empirical claim.

A global source registry is not programme-level evidence. A programme metric requires a concrete source-to-claim relationship.

### AI/O*NET

O*NET 31.0 is US occupational/task data. The programme AI score is a model/crosswalk indicator transferred through O*NET–ESCO/ISCO/DISCO and programme-to-occupation mappings. It is not a Danish observed job-loss rate, employment forecast, probability of automation or job guarantee.

Legacy/default AI baselines must not create relative ranking advantages over programmes with no defensible programme-specific mapping. Missing evidence should be neutral or unavailable, never made precise with plausible defaults.

### Labour and salary

Client-catalogue job/salary values must not drive programme-to-programme claims as observed outcomes until source, population, period, transformation and programme mapping are documented. The stricter Python analytics dataset may use derived labour/salary metrics only when its source and mapping contract has passed.

Monte Carlo percentiles are simulation ranges, not empirical confidence intervals.

## Data and mapping invariants

- Never fabricate missing metric values, mappings, citations or recommendations to keep a pipeline/UI complete.
- Fuzzy/title similarity alone is not an authoritative programme→occupation or programme→education mapping.
- Preserve source, dataset/version, period, transformation, mapping method and confidence.
- KOT admissions describe admissions/selection, not labour-market demand.
- Generated catalogues/snapshots must be changed through their producer pipeline, not hand-edited to alter results.
- Frontend and backend implementations of the canonical AI-resilience formula must change together with regression tests and methodology documentation.
- Preserve the client/server boundary: browser catalogue/ranking remains usable without Python; deep analytics returns an explicit unavailable status rather than fallback recommendations.

## Safe autonomous loop

Within the requested scope, inspect relevant sources, implement, run focused checks, fix failures caused by the change and rerun affected checks without asking at every reversible step.

Stop for a genuine owner decision involving destructive data/schema changes, production/deployment architecture, secrets/permissions, paid-resource expansion, or a material change to the recommendation/scoring model not resolved by the request.

## Verification

Use risk-proportionate checks. Typical gates are:

```bash
npm run --prefix web typecheck
npm run --prefix web lint
npm run --prefix web algorithm:test
npm run --prefix web build
python -m unittest discover -s tests -p "test_*.py"
python etl/validate_model_stability.py
python etl/build_evidence_readiness_report.py
python etl/verify_all_data_integrity.py
```

Run browser/E2E checks for meaningful UI behavior changes and source-refresh checks when authoritative inputs change. Do not claim empirical validation from unit tests, deterministic fixtures or simulation output. Do not claim a check passed unless it actually ran.

## Completion

Do not stop at the first plausible implementation. Continue until the requested behavior exists, affected checks pass, documentation matches the implementation, and residual uncertainty is stated at the correct evidence level.

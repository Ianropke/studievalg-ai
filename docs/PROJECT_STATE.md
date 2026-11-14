# Uddannelsesindsigt — current project state

Last reconciled: 2026-09-20. Admissions evidence updated: 2026-11-10.

## Canonical implementation

The active product is a hybrid system:

- `web/`: Next.js client catalogue, search, filtering and preference ranking over 1,413 Danish higher-education offerings.
- Python/DuckDB: deeper analytics, ETL, source acquisition and evidence processing.
- `web/public/data/all_programs_catalog.json`: deployable static catalogue used by the web application.
- `/api/pipeline`: boundary to the external/local analytics engine; when no analytics engine is available, the API reports an explicit unavailable state rather than inventing recommendations.

## Evidence status

### Admissions

The catalogue's `kvotient_2026` is a placeholder in all 1,413 rows, not a 2026 threshold. Its `latest_kvotient` falls back to the field labelled 2025. On 10 November 2026, all 345 numeric 2025 values matched the official [2025 workbook](https://ufsn.dk/media/ibmjfhzj/hovedtal-2025-til-ufm-dk.xlsx) by KOT number (SHA-256 `62b7d682186744f91e8562a65577e6625b21d562af530e1097b3e9f37e2c46ef`). Of 1,068 catalogue values labelled `Alle optaget`, 518 match an official all-admitted status; 77 have a different official status and 473 IDs are absent from that workbook. Therefore do not interpret a non-numeric value as proof that all applicants were admitted, or describe these as current 2026 results. Admissions thresholds describe admissions/selection and do not measure labour-market demand or future outcomes.

The separate 2026 snapshot is reproducibly generated from the official [2026 KOT workbook](https://ufsn.dk/media/omyojnzg/kot-hovedtal-2026.xlsx), SHA-256 `98efdeeffdee67b470c3ee24ccdb6c68d735a365f0c39c32d9b7eda75b221ce4`, with `python etl/import_kot_2026.py --input /path/to/kot-hovedtal-2026.xlsx`. The producer verifies the workbook hash, sheet, schema, unique identifiers, values and known status vocabulary before producing `web/src/data/kot2026.json`. It records the exact source row and preserves each categorical status. The checked-in legacy catalogue's placeholder fields are not updated or used for public 2026 admissions.

Of 957 official IDs, 919 occur in the 1,413-row catalogue. For 879 the ID and normalized complete title match and the public site displays the official 2026 outcome. Forty shared IDs have differing titles and are quarantined rather than joined (some are formatting differences); 494 catalogue IDs do not appear in the workbook; and 38 official IDs are absent from the catalogue. This is a conservative identity check, not proof of current availability. Public discovery on the homepage, comparison picker and related-programme cards now uses only the 879 exact identity matches (`web/src/lib/browseCatalog.ts`), including 410 programmes with eligible AI estimates. Legacy records remain accessible through existing detail and saved links; no source catalogue or scoring formula was changed. The 38 source-only programmes are not currently searchable in the legacy catalogue. Historic vacancy statuses must not be presented as current vacancies. New versions require a reviewed source and producer update, not replacement of the workbook behind the fixed hash.

### AI/O*NET

Model version 2026.6 uses O*NET 31.0 Work Activities for 569 of 1,413 programmes (40.3%) through O*NET–ESCO/ISCO/DISCO and programme-to-occupation mappings. O*NET is US occupational/task data; the resulting AI-resilience indicator is a crosswalk/model estimate, not a Danish observed automation probability or employment forecast.

The remaining 844 programmes have no defensible O*NET 31.0 programme mapping and retain a legacy baseline in the checked-in catalogue. Legacy/default values must not create programme-to-programme ranking differences as if they were programme-specific evidence.

### Labour and salary

The static client catalogue still lacks complete programme-level provenance for labour-demand and salary scores. Until source, population, period, transformation and programme mapping are attached, those values are `PROVENANCE_REQUIRED` and must not create programme-to-programme evidence claims.

The stricter Python `education_profile_scores` pipeline is different: `etl/build_education_profiles.py` requires complete education, labour, salary, DISCO and AI source coverage before rebuilding its table and derives labour/salary indicators from explicitly sourced education-group observations. Do not transfer that stronger evidence status to the legacy static catalogue unless the catalogue export carries the same provenance.

### Source readiness after the September hardening

- The obsolete Datavejviser CKAN `package_show` dependency has been removed from the scheduled refresh. Current official DCAT metadata and Statistics Denmark education-register files are snapshotted with hashes.
- A reviewed, bounded LONS11 extract now contains 522 usable observations across 87 official education categories for 2019–2024. It uses total sector, combined pay form, employees excluding young people and apprentices, earnings per hour worked, all sexes, and six annual observations.
- LONS11 is source-ready at education-category grain, but it is not programme-mapped evidence. No salary value enters the client ranking until a documented KOT-to-compatible-education mapping exists.
- UFM employment remains blocked because the official metadata currently points its CSV distribution at a rendered Power BI report rather than a verified machine-readable CSV URL. The pipeline records this status and does not scrape or relabel the report.
- On 14 September 2026, UFM Datavarehus replied to a request for machine-readable employment data, schema, KOT→UDD/AUDD mapping and reuse terms: "Det har vi af ressourcemæssige årsager desværre ikke mulighed for at hjælpe med." Ian acknowledged the reply the same day. This closes the direct request; it does not establish that the data or mapping do not exist, nor does it validate any programme-level join. Keep the blocked evidence status until an independently verifiable source and mapping are available.
- `data/EVIDENCE_READINESS_REPORT.json` is the canonical machine-readable coverage/readiness summary. Current status is `PARTIAL_BLOCKED`.

### Model sensitivity

`data/MODEL_STABILITY_REPORT.json` measures deterministic ranking sensitivity for the 569 O*NET-mapped programmes only. The 70/30 and 80/20 alternatives remain very close to the canonical 75/25 ordering (Spearman 0.999938 and complete top-20 overlap). Wider 60/40 and 90/10 alternatives produce material rank movement, amplified by coarse occupational groups and tied programme scores. This is robustness evidence, not predictive or causal validation; independent human/domain validation remains required.

## Ranking policy

The deployed client ranking must not gain relative score differences from unsupported legacy/default metrics. Missing or provenance-incomplete ranking dimensions are represented neutrally so they do not reward or penalise a programme relative to another programme.

A neutral placeholder is not an estimate of the true programme value. UI text must make this explicit.

## Validation status

- Unit tests, typecheck, lint, build and browser tests establish implementation correctness only.
- The browser gate covers serious/critical automated WCAG findings on five central routes, mobile horizontal overflow, representative internal links and discovery metadata. It does not replace manual keyboard, screen-reader or physical-device testing.
- Secondary copy and affected red/green status text meet the automated WCAG AA contrast gate after the September 2026 contrast hardening.
- O*NET crosswalk tests establish deterministic transformation behavior, not Danish predictive validity.
- Scenario simulation ranges are model uncertainty/sensitivity ranges, not empirical confidence intervals.
- The model stability report establishes deterministic rank robustness only. It does not establish Danish predictive validity.
- No score is an individual guarantee of admission, employment, salary or protection from AI-driven task change.

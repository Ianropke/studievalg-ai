# Data provenance gaps

Last reviewed: 2026-09-20

The production catalogue is usable for exploratory decision support, but it is not yet a fully documented programme-level statistical dataset.

## Current audit findings
- The strict provenance audit reports that the default occupational mapping is used for approximately 59.7% of programme records; the gate currently allows at most 1%.
- A repeated score vector covers 844 of 1,413 programmes.
- 4,514 metric values are currently `PROVENANCE_REQUIRED`: 844 automation inputs, 844 augmentation inputs, 1,413 labour indicators and 1,413 salary indicators.
- A reviewed LONS11 source extract now provides 522 usable annual observations across 87 education categories for 2019–2024, but zero client programmes have the required KOT-to-compatible-education mapping. Source readiness is therefore not programme-level provenance.
- The official UFM employment report is reachable, but no reviewed machine-readable distribution URL is currently available to the pipeline.
- UFM Datavarehus declined to assist with the 13 September 2026 request for machine-readable employment data and KOT→UDD/AUDD mapping, citing resource constraints in its 14 September reply. The request was acknowledged and is closed. This is not evidence that the requested data or mapping do not exist.

These findings are why the UI labels relevant values as `Crosswalk-estimat`, `Modelestimat` or `Kilde kræver dokumentation`. They must not be presented as observed programme outcomes. The audit report is generated as `data/DATA_PROVENANCE_REPORT.json` in CI and is intentionally not committed as a hand-maintained data source.

## Conditions before programme-level labour or salary claims
1. Add a programme-level source mapping for each labour-demand and salary metric.
2. Store source URL, dataset version, population, observation period and transformation for every mapped metric.
3. Replace the default occupational mapping with explicit programme-to-occupation crosswalks where possible.
4. Add coverage and confidence fields to the published catalogue.
5. Keep the strict provenance audit manual until the catalogue meets the coverage thresholds, then make it a required CI gate again. Ordinary CI still builds and uploads the report so every change exposes the current coverage.

Machine-readable readiness is tracked in `data/EVIDENCE_READINESS_REPORT.json`. A blocked mapping or distribution must remain visibly blocked; scheduled refreshes may record that state but may not reinterpret it as passing programme-level coverage.

The public product should remain centred on education search, observed admissions data and the explicitly optional AI model indicator for the 569 O*NET-mapped programmes. Do not add programme-level employment or salary claims merely to fill these gaps; reassess them only if a verifiable source and mapping become available.

## Product interpretation
AI resilience is a derived crosswalk/model index. Labour demand and salary are model-/register-derived indicators until their programme-level provenance is complete. None of these scores is a guarantee about an individual student's admission, employment or salary.

# Data provenance gaps

Last reviewed: 2026-08-11

The production catalogue is usable for exploratory decision support, but it is not yet a fully documented programme-level statistical dataset.

## Current audit findings
- The strict provenance audit reports that the default occupational mapping is used for approximately 59.7% of programme records; the gate currently allows at most 1%.
- A repeated score vector covers 844 of 1,413 programmes.
- 2,826 metric values do not yet have a documented raw-source mapping with population, period and transformation details.

These findings are why the UI labels relevant values as `Crosswalk-estimat`, `Modelestimat` or `Kilde kræver dokumentation`. They must not be presented as observed programme outcomes.

## Required remediation
1. Add a programme-level source mapping for each labour-demand and salary metric.
2. Store source URL, dataset version, population, observation period and transformation for every mapped metric.
3. Replace the default occupational mapping with explicit programme-to-occupation crosswalks where possible.
4. Add coverage and confidence fields to the published catalogue.
5. Keep the strict provenance audit manual until the catalogue meets the coverage thresholds, then make it a required CI gate again.

## Product interpretation
AI resilience is a derived crosswalk/model index. Labour demand and salary are model-/register-derived indicators until their programme-level provenance is complete. None of these scores is a guarantee about an individual student's admission, employment or salary.
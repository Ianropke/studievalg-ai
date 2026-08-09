# Data Source Contract — Education Scoring

This contract defines the only inputs accepted by `etl/build_education_profiles.py`.
The purpose is to prevent plausible-looking but undocumented scores from entering the production catalogue.

## 1. KOT → official education mapping

File: `data/sources/programme_education_mapping.csv`

Required columns:

- `kot_nr`
- `education_code`
- `education_title`
- `mapping_method`
- `mapping_source`
- `mapping_period`
- `mapping_confidence`

Rules:

- One row per KOT programme.
- `education_code` must be an official programme/education identifier or a documented crosswalk to one.
- Title similarity/fuzzy matching alone is forbidden.
- The source and version/year must be recorded.

The authoritative Danish education register is maintained by Statistics Denmark. It exposes UDD (education programme/activity) and AUDD (completed qualification) identifiers and their classifications. The current DDU-AUDD v1:2026 classification is valid from 1 February 2026. citeturn1view0turn1view1

## 2. KOT → DISCO mapping

File: `data/sources/programme_disco_mapping.csv`

Required columns:

- `kot_nr`
- `disco08_code`
- `mapping_method`
- `mapping_source`
- `mapping_period`
- `mapping_confidence`

Rules:

- One row per `kot_nr`.
- `DEFAULT` is forbidden.
- Title similarity alone is not acceptable.
- A mapping is a crosswalk/model input, never an observed labour-market value.

## 3. Graduate labour-market observations

File: `data/sources/labour_market_by_education.csv`

Required columns:

- `education_code`
- `period`
- `employment_rate` — decimal 0–1.
- `unemployment_rate` — decimal 0–1.
- `source`
- `dataset`
- `source_url`

Important grain rule: observations are attached to the official education group, not directly to KOT programmes. Multiple KOT programmes may therefore legitimately share an observation.

Preferred official source: **UFM Datavarehus — Beskæftigelse.** The published measure is graduate employment during months 12–23 after completion, calculated as days in employment divided by days in employment plus days unemployed. The public Datavejviser catalogue identifies UFM as publisher, gives the dataset a CC BY 4.0 licence, and exposes HTML, XLSX and CSV distributions. citeturn4search0turn4search3

## 4. Salary observations

File: `data/sources/salary_by_education.csv`

Required columns:

- `education_code`
- `period` — calendar/statistical year as an integer year.
- `salary_value` — positive observed amount.
- `salary_measure` — exact LONS11 measure/component selected.
- `salary_unit` — exact unit reported by the source.
- `source`
- `dataset`
- `source_url`

Preferred official source: **Danmarks Statistik LONS11 — Løn efter uddannelse, sektor, aflønningsform, lønmodtagergruppe, lønkomponenter og køn.** LONS11 is reported in DKK and has dimensions for education, sector, pay form, employee group, pay component, sex and year. citeturn7search0turn7search3

**Important correction:** LONS11 must not be labelled `salary_median` unless the selected source component explicitly provides a median. The source table generally reports an earnings measure; the exact component and unit must therefore be stored in `salary_measure` and `salary_unit`. Statistics Denmark's published description of LONS11 uses the unit DKK, and its explanatory material discusses average hourly earnings. citeturn7search0turn7search10

Rules:

- `salary_value` must be an observed value from the identified source.
- The exact LONS11 dimension selection must be recorded in the raw-source manifest.
- No interpolation, extrapolation or model-based replacement is permitted.
- The canonical pipeline calculates five-year growth only from comparable observations exactly five years apart for the same `education_code`, using the same salary measure and unit.
- If comparable five-year observations cannot be established, salary growth remains unavailable and the production build fails.

## 5. AI occupation exposure

File: `data/sources/ai_occupation_exposure.csv`

Required columns:

- `disco08_code`
- `automation_risk`
- `augmentation_potential`
- `source`
- `dataset`
- `period`
- `source_url`
- `mapping_confidence`

Rules:

- One row per DISCO-08 code.
- Foreign occupation sources such as O*NET require a documented DISCO crosswalk.
- `mapping_confidence` describes confidence in the occupation crosswalk, not confidence in the underlying AI study.
- These values are `CROSSWALK_OR_MODEL`, never observed Danish labour-market measurements.

## 6. Derived scores

The canonical pipeline derives:

`labour_demand = 0.7 × employment percentile + 0.3 × inverse unemployment percentile`

and:

`salary_growth = cross-sectional percentile of observed five-year salary growth`

Both are `DERIVED`, not observed. Percentiles are calculated across unique official education groups, so programme duplication cannot change the distribution.

The weights are model choices and must be exposed in methodology documentation.

## 7. KOT is admissions data, not labour demand

KOT observations are used for admissions-related features such as historical threshold values and demand/interest indicators. They must never be used as a proxy for employment, unemployment or salary.

## 8. Raw-source snapshots and refresh

`etl/fetch_authoritative_sources.py` retrieves public official distributions into `data/sources/raw/` and writes `raw_source_manifest.json` with source URL, retrieval timestamp, byte count and SHA-256 hash.

The scheduled workflow `.github/workflows/refresh-authoritative-data.yml` refreshes these snapshots monthly. It also supports manual execution.

The UFM employment and KOT datasets are obtained through the public Datavejviser CKAN API. The Statistics Denmark education register is obtained from the official education-register page, which publishes current CSV tables and documents the UDD/AUDD relationships. citeturn4search0turn5search0turn1view0

LONS11 schema metadata is fetched from the Statistics Bank API before any salary query is executed. The pipeline deliberately refuses to guess salary dimensions.

## 9. No synthetic fallback

Forbidden in production:

- constant fallback scores such as 70/70/70;
- `DEFAULT` mappings;
- programme values generated from programme titles alone;
- KOT thresholds used as labour-demand proxies;
- synthetic regression outcomes based on the platform's own scores;
- assigning a source merely because it exists in the global evidence registry.

If required source coverage is incomplete, the build must fail rather than fill the gap.

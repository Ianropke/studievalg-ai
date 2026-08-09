# Data Source Contract — Education Scoring

This contract defines the only inputs accepted by `etl/build_education_profiles.py`.
The purpose is to prevent plausible-looking but undocumented scores from entering the production catalogue.

## 1. KOT → official education-group mapping

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
- `education_code` must come from an identified official education classification or documented crosswalk.
- Title similarity/fuzzy matching alone is forbidden.
- The mapping must say whether it is `OFFICIAL`, `DOCUMENTED_CROSSWALK`, or `EXPERT_REVIEW`.
- The source and version/year must be recorded.

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

Important grain rule: labour-market observations are attached to the official education group, not directly to KOT programmes. Multiple KOT programmes may map to the same education group and therefore legitimately share the same underlying observation.

Preferred official source: **UFM Datavarehus — Beskæftigelse.** The published measure is graduate employment during months 12–23 after completion, calculated as days in employment divided by days in employment plus days unemployed. UFM states that the source is its Datavarehus based on Danish Statistics register data. If the available source grain is an education group rather than an individual KOT programme, the mapping must be explicit and the UI must not describe it as a programme-specific observation.

UFM also publishes cross-education indicators for graduate unemployment and time to first job. These should remain separate metrics rather than silently being folded into employment rate.

## 4. Salary observations

File: `data/sources/salary_by_education.csv`

Required columns:

- `education_code`
- `period` — calendar/statistical year as an integer year.
- `salary_median` — positive amount in the documented unit.
- `source`
- `dataset`
- `source_url`

Preferred official source: **Danmarks Statistik LONS11 — Løn efter uddannelse, sektor, aflønningsform, lønmodtagergruppe, lønkomponenter og køn.** The ingestion manifest must record the exact dimensions selected, including sector, pay form, employee group, pay component, sex and unit.

Rules:

- `salary_median` must be an observed value from the identified salary source.
- The canonical pipeline calculates five-year growth itself from comparable observations exactly five years apart for the same `education_code`.
- No interpolation, extrapolation or model-based replacement is permitted.
- If comparable five-year data cannot be established, salary growth remains unavailable and the production build fails rather than inventing it.
- `salary_5y_growth` is no longer an input column; it is a derived value.

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

## 8. No synthetic fallback

Forbidden in production:

- constant fallback scores such as 70/70/70;
- `DEFAULT` mappings;
- programme values generated from programme titles alone;
- KOT thresholds used as labour-demand proxies;
- synthetic regression outcomes based on the platform's own scores;
- assigning a source merely because it exists in the global evidence registry.

If required source coverage is incomplete, the build must fail rather than fill the gap.

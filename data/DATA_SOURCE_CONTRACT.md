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

File: `data/sources/labour_market_by_programme.csv`

Required columns:

- `kot_nr`
- `period`
- `employment_rate` — decimal 0–1.
- `unemployment_rate` — decimal 0–1.
- `source`
- `dataset`
- `source_url`

Preferred official source:

**UFM Datavarehus — Beskæftigelse.** The published measure is the graduate employment rate during months 12–23 after completion, calculated from days in employment versus days unemployed. UFM states that the source is its Datavarehus based on Danish Statistics register data. If the available source grain is education group rather than individual KOT programme, the education mapping must be explicit and the UI must not describe it as a programme-specific observation.

Supporting sources may include other official UFM/DST labour-market datasets where their population and grain are documented.

## 4. Salary observations

File: `data/sources/salary_by_education.csv`

Required columns:

- `education_code`
- `period`
- `salary_median`
- `salary_5y_growth`
- `source`
- `dataset`
- `source_url`

Preferred official source:

**Danmarks Statistik LONS11 — Løn efter uddannelse, sektor, aflønningsform, lønmodtagergruppe, lønkomponenter og køn.** The repository must record the exact dimensions selected and the unit. Salary data must be linked to programmes through `programme_education_mapping.csv`, never fuzzy title matching.

Rules:

- `salary_median` must be an observed value from the identified salary source.
- `salary_5y_growth` must be calculated from a comparable salary series or supplied as a documented source-derived measure.
- It may never be generated from `labour_demand`, KOT scores, or another model score.
- If comparable five-year data cannot be established, the pipeline must leave the growth metric unavailable rather than invent it.

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

Rules:

- One row per DISCO-08 code.
- Foreign occupation sources such as O*NET require a documented DISCO crosswalk.
- These values are `CROSSWALK_OR_MODEL`, never observed Danish labour-market measurements.

## 6. Derived scores

The canonical pipeline derives:

`labour_demand = 0.7 × employment percentile + 0.3 × inverse unemployment percentile`

and:

`salary_growth = cross-sectional percentile of observed five-year salary growth`

Both are `DERIVED`, not observed.

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

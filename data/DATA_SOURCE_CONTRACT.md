# Data Source Contract — Education Scoring

This contract defines the only inputs accepted by `etl/build_education_profiles.py`.
The purpose is to prevent plausible-looking but undocumented scores from entering the production catalogue.

## 1. Programme → DISCO mapping

File: `data/sources/programme_disco_mapping.csv`

Required columns:

- `kot_nr` — UFM KOT programme identifier.
- `disco08_code` — DISCO-08 occupation code.
- `mapping_method` — `OFFICIAL`, `DOCUMENTED_CROSSWALK`, or `EXPERT_REVIEW`.
- `mapping_source` — named source supporting the mapping.
- `mapping_period` — version/year of the mapping source.
- `mapping_confidence` — `HIGH`, `MEDIUM`, or `LOW`.

Rules:

- One row per `kot_nr`.
- `DEFAULT` is forbidden.
- A mapping without a named source is rejected.
- A mapping is a crosswalk/model input, never an observed labour-market value.
- Title similarity alone is not an acceptable mapping method.

## 2. Labour-market and salary observations

File: `data/sources/labour_market_by_programme.csv`

Required columns:

- `kot_nr`
- `labour_period`
- `employment_rate` — decimal 0–1.
- `unemployment_rate` — decimal 0–1.
- `labour_source`
- `labour_dataset`
- `labour_source_url`
- `salary_median` — observed salary level in the source's stated units.
- `salary_5y_growth` — observed/derived five-year salary growth, in decimal form.
- `salary_source`
- `salary_dataset`
- `salary_period`
- `salary_source_url`

### Approved official source families

The preferred Danish sources are:

1. **UFM Datavarehus — Beskæftigelse**: graduate employment measured 12–23 months after completion, based on Danish register data. This is the preferred source when the required programme/education grain is available.
2. **Danmarks Statistik OVGARB10**: education-to-labour-market outcomes. Use when the required education-group grain is appropriate and document that it is an education-group, not necessarily KOT-programme, observation.
3. **Danmarks Statistik LONS11**: salary by education. Salary observations must be linked through an explicit, documented education-code mapping; never by fuzzy programme-title matching.

The repository contains `etl/fetch_official_statbank_sources.py` to retrieve raw OVGARB10 and LONS11 extracts from the public Statbank API. Raw files are stored under `data/sources/raw/` together with a source manifest.

Rules:

- One row per programme for the stated period in the final programme-level input.
- Employment/unemployment must be observed or deterministically derived from an identified official dataset.
- Salary growth must be calculated from salary observations from the identified salary dataset. It may not be generated from `labour_demand`, KOT scores, or another model score.
- If an official source is only available at education-group level, the final row must carry the exact education-group code and documented crosswalk used to connect it to the programme. Do not imply that the observation is programme-specific.
- The pipeline derives `labour_demand` as:

  `0.7 × employment percentile + 0.3 × inverse unemployment percentile`

- The pipeline derives `salary_growth` as the cross-sectional percentile of the observed five-year salary-growth measure.
- Resulting scores are `DERIVED`, not `OBSERVED`.

## 3. AI occupation exposure

File: `data/sources/ai_occupation_exposure.csv`

Columns:

- `disco08_code`
- `automation_risk` — decimal 0–1.
- `augmentation_potential` — decimal 0–1.
- `source`
- `dataset`
- `period`
- `source_url`

Rules:

- One row per DISCO-08 code.
- Values must be traceable to a named source/model.
- If the source is O*NET or another foreign occupation taxonomy, the DISCO mapping must be documented separately.
- These values are `CROSSWALK_OR_MODEL`, never observed Danish labour-market measurements.

## 4. KOT data is admissions data, not labour demand

KOT observations are used for admission-related product features such as historical threshold values and demand/interest indicators. They must never be used as a proxy for employment, unemployment or salary.

## 5. No synthetic fallback

The following are explicitly forbidden in production:

- constant fallback scores such as 70/70/70;
- `DEFAULT` DISCO mappings;
- generated values based on programme title alone;
- using KOT threshold values as a proxy for labour demand;
- constructing a regression outcome from the platform's own scores;
- assigning a source merely because it exists in the global evidence registry.

If required source coverage is incomplete, the build must fail rather than fill the gap.

# Data Source Contract — Education Scoring

This contract defines the only inputs accepted by `etl/build_education_profiles.py`.
The purpose is to prevent plausible-looking but undocumented scores from entering the production catalogue.

## 1. Programme → DISCO mapping

File: `data/sources/programme_disco_mapping.csv`

Columns:

- `kot_nr` — UFM KOT programme identifier.
- `disco08_code` — DISCO-08 occupation code.
- `mapping_method` — e.g. `OFFICIAL`, `DOCUMENTED_CROSSWALK`, `EXPERT_REVIEW`.
- `mapping_source` — named source supporting the mapping.
- `mapping_period` — version/year of the mapping source.
- `mapping_confidence` — `HIGH`, `MEDIUM`, or `LOW`.

Rules:

- One row per `kot_nr`.
- `DEFAULT` is forbidden.
- A mapping without a named source is rejected.
- A mapping is a crosswalk/model input, never an observed labour-market value.

## 2. Labour-market and salary observations

File: `data/sources/labour_market_by_programme.csv`

Columns:

- `kot_nr`
- `period`
- `employment_rate` — decimal 0–1.
- `unemployment_rate` — decimal 0–1.
- `salary_median` — observed salary level in the source's stated units.
- `salary_5y_growth` — observed/derived five-year salary growth, in decimal form.
- `source` — named official/research source.
- `dataset` — exact table/dataset identifier.
- `source_url` — canonical source URL.

Rules:

- One row per programme for the stated period.
- Employment/unemployment must be observed or deterministically derived from an identified source dataset.
- Salary growth must be based on identified salary observations; it may not be generated from `labour_demand`, KOT scores, or other model scores.
- The pipeline derives `labour_demand` as:

  `0.7 × employment percentile + 0.3 × inverse unemployment percentile`

- The pipeline derives `salary_growth` as the cross-sectional percentile of the observed five-year salary-growth measure.
- These resulting scores are `DERIVED`, not `OBSERVED`.

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

## 4. No synthetic fallback

The following are explicitly forbidden in production:

- constant fallback scores such as 70/70/70;
- `DEFAULT` DISCO mappings;
- generated values based on programme title alone;
- using KOT threshold values as a proxy for labour demand;
- constructing a regression outcome from the platform's own scores;
- assigning a source merely because it exists in the global evidence registry.

If required source coverage is incomplete, the build must fail rather than fill the gap.

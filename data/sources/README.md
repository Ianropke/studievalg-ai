# Official source acquisition

The production score pipeline intentionally fails until every required source is present.

## O*NET 31.0 AI model input

The active partial migration uses the official **O*NET 31.0 Database** (August
2026) and the O*NET-ESCO crosswalk:

- https://www.onetcenter.org/database.html
- https://www.onetcenter.org/dl_files/database/db_31_0_excel.zip
- https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx

The exact input subsets are stored under `data/sources/raw/onet-31.0/`. Their
SHA-256 hashes, licence, release, transformation and limitations are recorded
in `data/sources/onet31_source_manifest.json`.

Regenerate and verify the partial migration with:

```bash
python etl/migrate_onet31.py
python etl/migrate_onet31.py --check
```

`automation_risk` and `augmentation_potential` are model outputs derived from
O*NET work-activity importance ratings. They are not fields published by O*NET
and are not observed probabilities. O*NET-SOC occupations are aggregated via
the model-assisted, human-validated O*NET-ESCO crosswalk to ISCO/DISCO groups.

The programme-to-DISCO mapping remains the limiting step. O*NET 31.0 is active
only for programmes with a non-`DEFAULT` DISCO code. A non-default code in the
legacy catalogue is still a low-confidence model mapping, not an official
Danish education-to-occupation crosswalk. Programmes without such a mapping
retain a labelled legacy baseline and must never be presented as O*NET
31.0-derived.

Every migration must regenerate `data/ONET31_MIGRATION_REPORT.json` and review
coverage, score deltas and the largest rank-relevant changes before release.

## UFM graduate employment

Official source: UFM Datavarehus, **Beskæftigelse**:

- https://datavarehus.ufm.dk/rapporter/beskaeftigelse
- Definition: graduate employment rate measured in months 12–23 after completion.
- Provider: Uddannelses- og Forskningsstyrelsen, based on Danish Statistics register data.
- Licence metadata is published through Datavejviser; the dataset is publicly accessible.

Set the current official CSV distribution URL in `UFM_EMPLOYMENT_CSV_URL` before running:

```bash
export UFM_EMPLOYMENT_CSV_URL='CURRENT_OFFICIAL_UFM_CSV_DISTRIBUTION_URL'
python etl/fetch_official_statbank_sources.py
```

Do not replace this with a scrape of the rendered report or a third-party mirror.

## Salary

Official source: Statistics Denmark Statbank table **LONS11**:

- https://www.statistikbanken.dk/LONS11

The ingestion script retrieves a bounded recent-year extract and records table metadata. The final salary input must still document the exact education category, sector, wage-earner group, wage components, sex and year selections used.

## Programme mapping

The source files `programme_education_mapping.csv` and `programme_disco_mapping.csv` are deliberately separate. A KOT programme must never be connected to an education or occupation by fuzzy title matching.

Each mapping requires:

- source
- version/period
- method
- confidence

If no defensible mapping exists, the programme remains unavailable for the corresponding metric.

## Important

Downloading an official dataset is not sufficient to establish programme-level validity. The grain, population and classification must match the score being displayed. The pipeline therefore fails on incomplete or ambiguous joins rather than creating fallback values.

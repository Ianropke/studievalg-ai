# Official source acquisition

The production score pipeline intentionally fails until every required source is present.

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

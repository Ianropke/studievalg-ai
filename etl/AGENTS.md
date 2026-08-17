# Scoped Agent Contract — ETL/data

The root `AGENTS.md` remains authoritative. These rules specialize review of ETL code under `etl/`.

## Code Review Rules

### Missing coverage is not permission to invent values
Flag transforms that fill absent programme-level labour, salary, source, mapping, or provenance data with plausible defaults while presenting it as observed/authoritative. The safe path is explicit missing/unknown/provenance-required status.

### Preserve mapping evidence
Flag mappings that become authoritative from fuzzy/title similarity alone or lose method, source, period/version, or confidence. The safe path is an auditable mapping record consistent with `data/DATA_SOURCE_CONTRACT.md`.

### Generated artefacts must come from the producing pipeline
Flag manual edits to deployable catalogues/snapshots that bypass the authoritative refresh and quality gates. The safe path is to change the producer/contract, regenerate, and validate the artefact.

# Ian Data Integrity Standard v1.0

Correctness takes priority over completeness. This contract applies to material factual claims from ingestion through storage, calculation, ranking, API and presentation.

## Claim meaning
- `OBSERVED`: directly present in an identified source; not a claim of truth.
- `VERIFIED`: passed an application-owned, versioned field/domain validation rule with identified evidence. Schema validity alone never establishes this status.
- `DERIVED`: deterministic calculation from identified claims, reproducible by a registered versioned transformation. Inputs can be inferred only when the consumer explicitly accepts inference throughout the lineage.
- `INFERRED`: model/heuristic interpretation, classification or estimate. Confidence does not upgrade evidence.
- `UNKNOWN`: insufficient evidence; value is null and limitations explain why.
- `CONFLICT`: unresolved disagreement; value is null, limitations explain it, and at least two differing claims for the same field/context are retained.

`evidence_type` is separate: `REAL_WORLD`, `SYNTHETIC`, `MOCK`, `TEST`. It describes evidence origin, not execution environment. A real observation used in a test remains REAL_WORLD; test output does not thereby prove production performance. Mixed artificial origins may be labelled TEST with limitations, never REAL_WORLD.

## Mechanical invariants
1. Every material value uses `schemas/claim.schema.json`. Source ref, locator, publisher, times, identity/unit context and limitations travel with it. Source existence/authenticity must be checked by the project adapter.
2. Unsupported values remain UNKNOWN; never use zero, a plausible guess or a silent fallback to fill missing evidence.
3. Keep claim IDs immutable in host storage. Evidence/status/value changes create a new ID. Do not mutate an INFERRED claim into VERIFIED: create a new claim with new evidence and an approved verifier. This template cannot enforce database immutability without host integration.
4. Preserve semantics. Retailer discount is not market value; observed use is not lifetime use; forecast is not measurement; synthetic correctness is not empirical accuracy. Explicit proxies remain labelled as proxies in field/context and presentation.
5. Register deterministic functions by method AND version in trusted application code. Recompute DERIVED values from the complete input graph; reject missing references, duplicate IDs, cycles and mismatches. Never execute transformation code supplied in a claim.
6. VERIFIED requires an approved verifier that actually checks the value and evidence. A boolean claim supplied by a model is not verification. Preserve verification time, rule and version. Conflict resolution is a new claim with evidence and a domain rule; retain originals.
7. Consumers declare exact output field/context, allowed statuses, evidence types and an observation-age limit (or explicit null for time-insensitive data). Apply evidence/status/freshness gates to all ancestors. Retrieval or calculation time cannot refresh an old observation.
8. Missing, stale, conflicting, incompatible or insufficient evidence produces explicit degraded output, not a fabricated answer. `present` returns typed states; `consume` raises `IntegrityError`.
9. UI/API preserves claim envelope and lineage. Status, evidence type, limitations and stale/degraded states must be visible where material. No stronger “verified”, “market price”, “complete”, “accurate” or performance label than domain evidence allows.
10. Completion requires testing the actual source → ingestion → transformation → storage → scoring → API → UI/output path and checking legacy/fallback paths. The included synthetic example proves only the template path.

## Boundaries
Core gates validate declared metadata and approved computations; they cannot establish source truth, source independence, model quality, legal approval, or that every host endpoint calls them. Trusted adapters/policies/registries, database constraints, production-path tests and human review supply those boundaries. Keep source documents private; reference access-controlled snapshots without embedding secrets/PII.
Load only the relevant domain file. Domain defaults here are example OWNER DECISIONS, not empirical results or universal market standards.

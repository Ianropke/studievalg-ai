# Scoped Agent Contract — web

The root `AGENTS.md` remains authoritative. These rules specialize review of the Next.js application under `web/`.

## Code Review Rules

### Preserve epistemic labels in user-facing claims
Flag UI/API changes that present crosswalk/model/derived values as observed Danish outcomes, guarantees, or individual forecasts. The safe path is to preserve explicit epistemic labels and source/coverage limitations.

### Keep ranking semantics synchronized
Flag changes that alter weighting, requirements mode, GPA eligibility, institution filtering, or scoring explanations without updating the corresponding executable scoring contract and regression tests. The safe path is one consistent behavior across UI, backend-facing contracts, tests, and explanation text.

### Significant UI changes need rendered acceptance
After deterministic tests/build, verify the actual rendered flow with browser/E2E tooling and, when available, Codex Computer Use. Check interaction, responsive layout, loading/error/empty states, and whether the app remains usable when the analytics service is unavailable.

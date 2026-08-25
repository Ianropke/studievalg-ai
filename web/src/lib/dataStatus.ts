/**
 * Shared publication metadata for the client catalogue and its score model.
 *
 * These dates describe the checked-in release, not a promise that upstream
 * sources are updated continuously. Keeping them together prevents pages from
 * quietly presenting different freshness claims.
 */
export const DATA_STATUS = {
  catalogue: {
    programmeCount: 1413,
    admissionsUpdatedAt: "2026-07-26",
    admissionsUpdatedLabel: "26. juli 2026",
    source: "UFM/KOT",
  },
  scoring: {
    updatedAt: "2026-07-29",
    updatedLabel: "29. juli 2026",
    datasetVersion: "2026.1 (Release July 2026)",
    methodologyVersion: "2026.5",
    source: "O*NET 28.1 / DISCO-08",
  },
  methodologyReviewedAt: "2026-08-12",
  registeredSourceCount: 42,
  provenanceCoverageLabel: "Ikke fuldt etableret på uddannelsesniveau",
} as const;

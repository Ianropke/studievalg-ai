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
    updatedAt: "2026-09-10",
    updatedLabel: "10. september 2026",
    datasetVersion: "2026.6 (O*NET 31.0, delvis aktiveret)",
    methodologyVersion: "2026.6",
    source: "O*NET 31.0 Work Activities / O*NET-ESCO / DISCO-08",
    mappedProgrammeCount: 569,
    baselineProgrammeCount: 844,
    mappedProgrammeShare: 0.4027,
  },
  methodologyReviewedAt: "2026-09-10",
  provenanceCoverageLabel: "O*NET 31.0 anvendes for 569 af 1.413 uddannelser; 844 udelukkes fra AI-rangering",
} as const;

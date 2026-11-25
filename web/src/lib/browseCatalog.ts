import browseIndex from "@/data/browse_programs_index.json";
import { getAdmission2026, type AdmissionProgram } from "./admissions2026";
import type { CatalogProgramItem } from "./slugUtils";
import { BROWSE_COVERAGE } from "./browseCoverage";

export { BROWSE_COVERAGE };

/**
 * Public discovery uses a checked identity in the 2026 intake snapshot.
 * Keep the legacy catalogue intact for old links and saved programme IDs.
 * No fuzzy matching, renaming or transfer of scores to a different identity.
 */
export function selectBrowsePrograms<T extends AdmissionProgram>(programs: readonly T[]): T[] {
  return programs.filter((program) => getAdmission2026(program).kind === "matched");
}

export const browsePrograms = browseIndex as unknown as CatalogProgramItem[];

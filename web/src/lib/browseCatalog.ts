import catalogue from "../../public/data/all_programs_catalog.json";
import { getAdmission2026, type AdmissionProgram } from "./admissions2026";
import { getEnrichedScores, type RawProgramScores } from "./domainScoring";

/** Public discovery uses a checked identity in the 2026 intake snapshot.
 * Keep the legacy catalogue intact for old links and saved programme IDs.
 * No fuzzy matching, renaming or transfer of scores to a different identity.
 */
export function selectBrowsePrograms<T extends AdmissionProgram>(programs: readonly T[]): T[] {
  return programs.filter((program) => getAdmission2026(program).kind === "matched");
}

export const browsePrograms = selectBrowsePrograms(catalogue);
export const BROWSE_COVERAGE = {
  programmeCount: browsePrograms.length,
  aiProgrammeCount: browsePrograms.filter((program) => getEnrichedScores(program.udbud_titel, program.scores as RawProgramScores).ranking_eligible.ai).length,
};

export const SHAREABLE_UNIVERSITIES = [
  "all",
  "ku",
  "dtu",
  "au",
  "cbs",
  "sdu",
  "aau",
  "ruc",
  "itu",
  "professionshojskole",
] as const;

export type ShareableUniversity = (typeof SHAREABLE_UNIVERSITIES)[number];

export interface MatchShareState {
  gpa: number;
  includeAiModels: boolean;
  university: ShareableUniversity;
  query: string;
}

export type ParsedMatchShareState = Partial<MatchShareState>;

function readBoundedNumber(params: URLSearchParams, key: string, min: number, max: number): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

export function parseMatchShareParams(search: string): ParsedMatchShareState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const parsed: ParsedMatchShareState = {};

  const gpa = readBoundedNumber(params, "gpa", 2, 12);
  const includeAi = params.get("ai");
  const university = params.get("u");
  const query = params.get("q");

  if (gpa !== undefined) parsed.gpa = gpa;
  if (includeAi === "1" || includeAi === "true") parsed.includeAiModels = true;
  if (includeAi === "0" || includeAi === "false") parsed.includeAiModels = false;
  // Shared links from the previous three-slider interface explicitly opted into AI.
  if (includeAi === null && params.has("wAi")) parsed.includeAiModels = true;
  if (university && SHAREABLE_UNIVERSITIES.includes(university as ShareableUniversity)) {
    parsed.university = university as ShareableUniversity;
  }
  if (query) parsed.query = query.trim().slice(0, 120);

  return parsed;
}

export function buildMatchSharePath(state: MatchShareState): string {
  const params = new URLSearchParams({
    gpa: state.gpa.toFixed(1),
    ai: state.includeAiModels ? "1" : "0",
  });

  if (state.university !== "all") params.set("u", state.university);
  if (state.query.trim()) params.set("q", state.query.trim().slice(0, 120));

  return `/?${params.toString()}`;
}

import type { PreferenceMode, RequirementMatchMode } from "./preferenceMatching";

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
  ai: number;
  job: number;
  salary: number;
  mode: PreferenceMode;
  requirementMatchMode: RequirementMatchMode;
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
  const ai = readBoundedNumber(params, "wAi", 0, 100);
  const job = readBoundedNumber(params, "wJob", 0, 100);
  const salary = readBoundedNumber(params, "wSal", 0, 100);
  const mode = params.get("mode");
  const match = params.get("match");
  const university = params.get("u");
  const query = params.get("q");

  if (gpa !== undefined) parsed.gpa = gpa;
  if (ai !== undefined) parsed.ai = ai;
  if (job !== undefined) parsed.job = job;
  if (salary !== undefined) parsed.salary = salary;
  if (mode === "priority" || mode === "requirements") parsed.mode = mode;
  if (match === "all" || match === "any") parsed.requirementMatchMode = match;
  if (university && SHAREABLE_UNIVERSITIES.includes(university as ShareableUniversity)) {
    parsed.university = university as ShareableUniversity;
  }
  if (query) parsed.query = query.trim().slice(0, 120);

  return parsed;
}

export function buildMatchSharePath(state: MatchShareState): string {
  const params = new URLSearchParams({
    gpa: state.gpa.toFixed(1),
    wAi: String(Math.round(state.ai)),
    wJob: String(Math.round(state.job)),
    wSal: String(Math.round(state.salary)),
    mode: state.mode,
    match: state.requirementMatchMode,
  });

  if (state.university !== "all") params.set("u", state.university);
  if (state.query.trim()) params.set("q", state.query.trim().slice(0, 120));

  return `/?${params.toString()}`;
}

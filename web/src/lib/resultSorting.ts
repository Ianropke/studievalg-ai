/** Presentation-only comparisons with a historical, numeric KOT threshold. */
export type ResultSort = "closest" | "highest" | "alphabetical" | "ai";
export type AdmissionGroup = "at_or_above" | "near_above" | "further_above" | "unknown" | "all";

export function parseGpaInput(value: string): number | null {
  const text = value.trim();
  if (!/^\d{1,2}([.,]\d{0,2})?$/.test(text)) return null;
  const number = Number(text.replace(",", "."));
  return Number.isFinite(number) && number >= 2 && number <= 12 ? number : null;
}

export const formatDanishNumber = (value: number) => value.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function admissionGroup(threshold: number | null, gpa: number | null): AdmissionGroup {
  if (gpa === null) return "all";
  if (threshold === null) return "unknown";
  // Integer hundredths avoid floating-point errors at the +/-1.0 boundary.
  const delta = Math.round((threshold - gpa) * 100);
  if (delta <= 0) return "at_or_above";
  return delta <= 100 ? "near_above" : "further_above";
}

export function marginLabel(threshold: number, gpa: number): string {
  const margin = Math.round((gpa - threshold) * 100) / 100;
  const amount = formatDanishNumber(Math.abs(margin));
  if (margin < 0) return `${amount} under kvotienten`;
  if (margin === 0) return "Samme som kvotienten";
  if (margin <= 0.4) return `Lige over · +${amount}`;
  if (margin <= 1) return `Tæt på · +${amount}`;
  return `God margen · +${amount}`;
}

export interface SortableResult {
  udbud_titel?: string;
  kot_nr?: string;
  kvNum: number | null;
  robustScore: number;
  relevanceBoost: number;
}

const groupOrder: Record<AdmissionGroup, number> = { at_or_above: 0, near_above: 1, further_above: 2, unknown: 3, all: 0 };

export function compareResults(a: SortableResult, b: SortableResult, sort: ResultSort, gpa: number | null, hasQuery: boolean): number {
  if (hasQuery && a.relevanceBoost !== b.relevanceBoost) return b.relevanceBoost - a.relevanceBoost;
  if (sort === "closest" && gpa !== null) {
    const groupDifference = groupOrder[admissionGroup(a.kvNum, gpa)] - groupOrder[admissionGroup(b.kvNum, gpa)];
    if (groupDifference) return groupDifference;
    if (a.kvNum !== null && b.kvNum !== null) {
      const distanceDifference = Math.abs(gpa - a.kvNum) - Math.abs(gpa - b.kvNum);
      if (Math.abs(distanceDifference) > 1e-9) return distanceDifference;
    }
  } else if (sort === "highest") {
    if (a.kvNum === null && b.kvNum !== null) return 1;
    if (a.kvNum !== null && b.kvNum === null) return -1;
    if (a.kvNum !== null && b.kvNum !== null && a.kvNum !== b.kvNum) return b.kvNum - a.kvNum;
  } else if (sort === "ai" && a.robustScore !== b.robustScore) return b.robustScore - a.robustScore;
  return String(a.udbud_titel ?? "").localeCompare(String(b.udbud_titel ?? ""), "da") || String(a.kot_nr ?? "").localeCompare(String(b.kot_nr ?? ""));
}

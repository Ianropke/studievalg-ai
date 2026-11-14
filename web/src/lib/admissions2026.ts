import kot2026 from "@/data/kot2026.json";

/** The catalogue is older than the KOT file. Never attach a result by ID alone. */
export interface AdmissionProgram {
  kot_nr?: string | number | null;
  udbud_titel?: string | null;
}

type Record2026 = (typeof kot2026.records)[number];
export type Admission2026 =
  | { kind: "matched"; record: Record2026 }
  | { kind: "identity_conflict"; officialTitle: string }
  | { kind: "not_in_source" };

const byKot = new Map(kot2026.records.map((record) => [String(record.kot_nr), record]));
const normalizeTitle = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

export function getAdmission2026(program: AdmissionProgram): Admission2026 {
  const record = byKot.get(String(program.kot_nr ?? ""));
  if (!record) return { kind: "not_in_source" };
  if (normalizeTitle(program.udbud_titel ?? "") !== normalizeTitle(record.title)) {
    return { kind: "identity_conflict", officialTitle: record.title };
  }
  return { kind: "matched", record };
}

export function admission2026Label(admission: Admission2026): string {
  if (admission.kind === "identity_conflict") return "Adgangstal mangler";
  if (admission.kind === "not_in_source") return "Adgangstal mangler";
  if (admission.record.threshold !== null) return admission.record.threshold.toLocaleString("da-DK", { maximumFractionDigits: 1 });
  return admission.record.kvote1_raw;
}

export function admission2026Threshold(admission: Admission2026): number | null {
  return admission.kind === "matched" ? admission.record.threshold : null;
}

export function admission2026Institution(program: AdmissionProgram): string {
  const admission = getAdmission2026(program);
  return admission.kind === "matched" ? admission.record.institution : "Uddannelsessted ikke oplyst";
}

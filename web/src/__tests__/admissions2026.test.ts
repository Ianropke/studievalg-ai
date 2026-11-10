import assert from "node:assert/strict";
import catalog from "../../public/data/all_programs_catalog.json";
import snapshot from "../data/kot2026.json";
import { admission2026Label, admission2026Threshold, getAdmission2026 } from "../lib/admissions2026";

const counts = { matched: 0, identity_conflict: 0, not_in_source: 0 };
for (const program of catalog) counts[getAdmission2026(program).kind]++;
assert.deepEqual(counts, { matched: 879, identity_conflict: 40, not_in_source: 494 });
assert.equal(snapshot.records.length, 957);
const example = catalog.find((program) => program.kot_nr === "10234")!;
assert.equal(admission2026Threshold(getAdmission2026(example)), 7.2);
assert.equal(admission2026Label(getAdmission2026(example)), "7,2");
const conflict = catalog.find((program) => program.kot_nr === "10334")!;
assert.equal(getAdmission2026(conflict).kind, "identity_conflict");
assert.equal(admission2026Threshold(getAdmission2026(conflict)), null);
const absent = catalog.find((program) => program.kot_nr === "10318")!;
assert.equal(getAdmission2026(absent).kind, "not_in_source");
assert.equal(admission2026Threshold(getAdmission2026(absent)), null);
for (const row of snapshot.records.filter((record) => record.threshold === null)) {
  assert.equal(admission2026Label(getAdmission2026({ kot_nr: row.kot_nr, udbud_titel: row.title })), row.kvote1_raw);
}
console.log("Admissions 2026: matching, omissions, threshold and source statuses verified");

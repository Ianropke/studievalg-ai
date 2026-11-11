import assert from "node:assert/strict";
import { admissionGroup, compareResults, formatDanishNumber, marginLabel, parseGpaInput, type SortableResult } from "../lib/resultSorting";
import { buildMatchSharePath, choiceParams, parseMatchShareParams } from "../lib/shareMatch";

assert.equal(parseGpaInput("9,5"), 9.5);
assert.equal(parseGpaInput("9.55"), 9.55);
for (const invalid of ["", " ", "1,9", "12,1", "abc", "9,5.2"]) assert.equal(parseGpaInput(invalid), null);
assert.equal(formatDanishNumber(9.55), "9,55");
assert.equal(admissionGroup(9.5, 9.5), "at_or_above");
assert.equal(admissionGroup(10.5, 9.5), "near_above");
assert.equal(admissionGroup(10.6, 9.5), "further_above");
assert.equal(admissionGroup(null, 9.5), "unknown");
assert.equal(marginLabel(9.5, 9.5), "Samme som kvotienten");
assert.match(marginLabel(10.5, 9.5), /1,0 under/);
const row = (name: string, kvNum: number | null, relevanceBoost = 0, robustScore = 50): SortableResult => ({ udbud_titel: name, kvNum, relevanceBoost, robustScore });
const results = [row("Ukendt", null), row("Langt under", 3), row("Udenfor", 10.5), row("Nær", 9.2), row("Langt over", 11)];
assert.deepEqual(results.toSorted((a, b) => compareResults(a, b, "closest", 9.5, false)).map((r) => r.udbud_titel), ["Nær", "Langt under", "Udenfor", "Langt over", "Ukendt"]);
assert.deepEqual(results.toSorted((a, b) => compareResults(a, b, "highest", 9.5, false)).map((r) => r.udbud_titel), ["Langt over", "Udenfor", "Nær", "Langt under", "Ukendt"]);
assert.equal(compareResults(row("Medicin", 10.5, 1100), row("Biomedicin", 8, 300), "closest", 9.5, true) < 0, true);
for (const sort of ["closest", "highest", "alphabetical", "ai"] as const) {
  const url = buildMatchSharePath({ gpa: 9.5, includeAiModels: sort === "ai", university: "all", query: "", sort });
  assert.ok(url.startsWith("/#valg?"));
  assert.equal(parseMatchShareParams(url.slice(1)).sort, sort);
}
assert.equal(parseMatchShareParams("?ai=0&sort=ai").sort, undefined);
assert.equal(parseMatchShareParams("?sort=invalid").sort, undefined);
assert.equal(parseMatchShareParams("?gpa=7.0", "#valg?gpa=9.5").gpa, 9.5);
assert.equal(parseMatchShareParams("?gpa=7.0", "#main-content").gpa, 7);
assert.equal(choiceParams("?a=legacy", "#valg?a=private").get("a"), "private");
console.log("Result sorting: validated input, historical-margin groups and ordering");

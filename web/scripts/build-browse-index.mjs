import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(webRoot, "public", "data", "all_programs_catalog.json");
const kotPath = path.join(webRoot, "src", "data", "kot2026.json");
const outPath = path.join(webRoot, "src", "data", "browse_programs_index.json");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const kot = JSON.parse(fs.readFileSync(kotPath, "utf8"));

const byKot = new Map(kot.records.map((r) => [String(r.kot_nr), r]));
const normalizeTitle = (value) =>
  String(value || "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function extractCity(title) {
  const parts = String(title || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const withoutStart = parts.filter(
    (part) => !/^studiestart:/i.test(part) && !/^study start:/i.test(part),
  );
  return withoutStart.length >= 2 ? withoutStart[withoutStart.length - 1] : "";
}

const SCORE_KEYS = [
  "automation_risk",
  "augmentation_potential",
  "ai_dataset_version",
  "ai_model_status",
  "ai_mapping_confidence",
  "ai_is_baseline_estimate",
  "labour_demand",
  "salary_growth",
  "labour_evidence_status",
  "salary_evidence_status",
  "labour_source",
  "salary_source",
  "labour_period",
  "salary_period",
];

const slim = [];
for (const prog of catalog) {
  const record = byKot.get(String(prog.kot_nr ?? ""));
  if (!record || normalizeTitle(prog.udbud_titel) !== normalizeTitle(record.title)) {
    continue;
  }

  const slimScores = {};
  if (prog.scores && typeof prog.scores === "object") {
    for (const key of SCORE_KEYS) {
      if (prog.scores[key] !== undefined && prog.scores[key] !== null) {
        slimScores[key] = prog.scores[key];
      }
    }
  }

  const entry = {
    kot_nr: String(prog.kot_nr),
    udbud_titel: String(prog.udbud_titel),
    by: extractCity(prog.udbud_titel),
    ...(prog.disco_titel ? { disco_titel: String(prog.disco_titel) } : {}),
    scores: slimScores,
    ...(prog.skills_hierarchy?.skills?.length
      ? { skills_hierarchy: { skills: prog.skills_hierarchy.skills.slice(0, 6) } }
      : {}),
  };
  slim.push(entry);
}

fs.writeFileSync(outPath, JSON.stringify(slim));
const bytes = fs.statSync(outPath).size;
console.log(`Generated ${outPath}: ${slim.length} active programmes (${(bytes / 1024).toFixed(1)} KB)`);

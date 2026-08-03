import initialProgramsCatalog from "@public/data/all_programs_catalog.json";
import { getEnrichedScores } from "./domainScoring";

export interface ProgramItem {
  id: string;
  udbud_titel: string;
  institution?: string;
  institution_navn?: string;
  by?: string;
  kot_nr?: number | string;
  latest_kvotient?: string;
  scores?: {
    automation_risk?: number;
    labour_demand?: number;
    salary_growth?: number;
  };
  skills_hierarchy?: {
    tasks?: string;
    skills?: string[];
    learning_outcomes?: string;
  };
  rag_evidence?: Array<{ source?: string; page?: string; quote?: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ListConfig {
  slug: string;
  title: string;
  badge: string;
  description: string;
  introHedge: string;
  metricLabel: string;
  limit: number;
  getValue: (p: ProgramItem) => { display: string; numeric: number; raw: unknown };
  sortOrder: "asc" | "desc";
}

export const LIST_CONFIGS: Record<string, ListConfig> = {
  "top-10-mest-ai-robuste-uddannelser": {
    slug: "top-10-mest-ai-robuste-uddannelser",
    title: "Top 10 Mest AI-robuste Uddannelser i Danmark",
    badge: "100% Modellerede O*NET-data",
    description: "De 10 videregående uddannelser i Danmark med den højeste beregnede AI-robusthedsscore baseret på opgavetaksonomi og økonometriske fremskrivninger.",
    introHedge: "Ifølge vores beregningsmodel er disse uddannelser vurderet mest AI-robuste pr. juli 2026. Tallene bygger på opgavedata fra O*NET og analyser af studieordninger — se 'Bag om dine scorer' for fuld metode.",
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = 100 - (enriched.automation_risk || 0);
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-10-hoejest-loennede-uddannelser": {
    slug: "top-10-hoejest-loennede-uddannelser",
    title: "Top 10 Bedst Lønnede Uddannelser",
    badge: "DST & UFM Registerdata",
    description: "De 10 videregående uddannelser med det højeste beregnede lønpotentiale og stærkeste historiske lønudvikling for nyligt uddannede dimittender.",
    introHedge: "Baseret på data fra Danmarks Statistik og UFM viser denne liste de 10 uddannelser med det højeste vurderede lønpotentiale. Tallene er vores bedste bud ud fra statistik og modeller — ikke en garanti for individuel startløn.",
    metricLabel: "Lønpotentiale",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.salary_growth || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-10-laveste-ledighed": {
    slug: "top-10-laveste-ledighed",
    title: "Top 10 Uddannelser med Laveste Ledighed",
    badge: "Offentlig Dimittend-registerdata",
    description: "De 10 uddannelser med den højeste efterspørgsel på arbejdsmarkedet og laveste observerede dimittendledighed 1-2 år efter fuldførelse.",
    introHedge: "Registerbaseret oversigt over de 10 uddannelser med stærkest observeret jobefterspørgsel. Tallene afspejler historiske data for dimittendbeskæftigelse.",
    metricLabel: "Jobmuligheder",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.labour_demand || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-20-bedste-samlede-match": {
    slug: "top-20-bedste-samlede-match",
    title: "Top 20 Bedste Samlede Match i Danmark",
    badge: "Kombineret PEFF Trekant-Score",
    description: "De 20 uddannelser der opnår den højeste vægtede kombination af AI-robusthed, jobmuligheder og lønpotentiale.",
    introHedge: "Denne rangering bygger på det samlede gennemsnit af vores tre kernemål (AI-robusthed, jobmuligheder og lønpotentiale). Listen giver et afbalanceret overblik over uddannelser der klarer sig stærkt over hele linjen.",
    metricLabel: "Samlet Trekant-score",
    limit: 20,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const rob = 100 - (enriched.automation_risk || 0);
      const job = enriched.labour_demand || 50;
      const sal = enriched.salary_growth || 50;
      const avg = Math.round((rob + job + sal) / 3);
      return { display: `${avg}/100`, numeric: avg, raw: avg };
    },
    sortOrder: "desc",
  },
  "top-10-stoerste-ai-omstilling": {
    slug: "top-10-stoerste-ai-omstilling",
    title: "Top 10 Uddannelser i Størst AI-omstilling",
    badge: "Strukturel AI-analyse",
    description: "De 10 uddannelser hvor flest kerneopgaver forventes suppleret eller effektiviseret af kunstig intelligens og sprogmodeller.",
    introHedge: "Gennemskuelighed og balance er afgørende. Denne liste fremhæver de 10 uddannelser med lavest beregnede AI-robusthedsscore — det betyder ikke at faget forsvinder, men at opgaverne forventes at ændre sig markant i takt med AI.",
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = 100 - (enriched.automation_risk || 0);
      return { display: `${val}/100 (Lav)`, numeric: val, raw: val };
    },
    sortOrder: "asc",
  },
  "top-10-svaereste-adgangskvotienter": {
    slug: "top-10-svaereste-adgangskvotienter",
    title: "Top 10 Sværeste Uddannelser at Komme Ind På",
    badge: "Kvote 1 Hovedtal 2026",
    description: "De 10 videregående uddannelser med de højeste Kvote 1 adgangskvotienter i Danmark.",
    introHedge: "Officiel opgørelse over de 10 uddannelser i Danmark med de højeste Kvote 1 adgangskvotienter ifølge seneste optagelsesdata fra UFM.",
    metricLabel: "Adgangskvotient",
    limit: 10,
    getValue: (p) => {
      const kvStr = String(p.latest_kvotient || "");
      const num = parseFloat(kvStr.replace(",", "."));
      const isNum = !isNaN(num);
      return { display: kvStr || "Alle optaget", numeric: isNum ? num : 0, raw: kvStr };
    },
    sortOrder: "desc",
  },
  "top-10-letteste-adgangskvotienter": {
    slug: "top-10-letteste-adgangskvotienter",
    title: "Top 10 Uddannelser Hvor Alle Optages",
    badge: "Kvote 1 Hovedtal 2026",
    description: "Udvalgte videregående uddannelser med ledige pladser eller hvor alle ansøgere der opfylder adgangskravene optages.",
    introHedge: "Oversigt over 10 populære uddannelser med høj faglig kvalitet, hvor der senest var adgang for alle ansøgere der opfyldte adgangskravene (Kvotient: Alle optaget).",
    metricLabel: "Adgangskvotient",
    limit: 10,
    getValue: (p) => {
      const kvStr = String(p.latest_kvotient || "Alle optaget");
      const isAlle = kvStr.toLowerCase().includes("alle") || kvStr === "";
      return { display: kvStr, numeric: isAlle ? 1 : 99, raw: kvStr };
    },
    sortOrder: "asc",
  },
};

/**
 * Normalizes an uddannelse title to a canonical program name for deduplication.
 *
 * Danish KOT data format: "<Uddannelse>[, <Specialisering>][, <By>][, Studiestart: ...]"
 *
 * Rules:
 * 1. Strip "Studiestart: ...", "E-læring", start-type qualifiers.
 * 2. Split by comma.
 * 3. The canonical key is:
 *    - 1 token if token[0] is a standalone programme (no specialization follows).
 *      We detect this by checking if token[1] looks like a city (short, proper-cased, no "bach" etc.)
 *    - 2 tokens if token[1] is a specialization (e.g. "sygeplejerske", "tandplejer", "cybersikkerhed")
 *
 * City heuristic: a token is a city if it is ≤ 2 words, does NOT contain "bach", "kand", "cand",
 * "ing", "mester", "plejer", "moder", "læge", "psyk", "økon", "videnskab".
 */
function normalizeProgramName(title: string): string {
  let s = title;
  // Strip "Studiestart: ..." and everything after
  s = s.replace(/,?\s*[Ss]tudiestart:.*$/i, "").trim();
  // Strip "Study start: ..." (English variant)
  s = s.replace(/,?\s*[Ss]tudy start:.*$/i, "").trim();
  // Strip "E-læring"
  s = s.replace(/,?\s*[Ee]-læring/i, "").trim();
  // Strip standalone start-type tokens
  s = s.replace(/,?\s*(sommer- og vinterstart|vinterstart|sommerstart)/gi, "").trim();

  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return title.toLowerCase().slice(0, 40);

  const token0 = parts[0];
  const token1 = parts[1];

  // If only one token, use it
  if (!token1) return token0.toLowerCase();

  // Check if token1 looks like a city (not a specialization)
  const specializationKeywords = [
    "bach", "kand", "cand", "ing.", "ing ", "mester", "plejer", "moder",
    "læge", "psyk", "økon", "videnskab", "teknik", "studie", "science",
    "business", "design", "kunst", "pæd", "social", "fysiote", "biomed",
    "kemi", "biolog", "matematik", "inform", "logi", "grafi", "terapi",
    "audiolo", "tand", "cyber", "robot", "data", "maskin", "maskinme",
  ];
  const token1Lower = token1.toLowerCase();
  const isSpecialization = specializationKeywords.some((kw) => token1Lower.includes(kw));
  const isCityLike = !isSpecialization && token1.split(" ").length <= 3;

  if (isCityLike) {
    // token1 is a city — use only token0
    return token0.toLowerCase();
  }

  // token1 is a specialization — use both
  return `${token0}, ${token1}`.toLowerCase();
}


export function getListData(slug: string): { config: ListConfig; items: Array<{ program: ProgramItem; rank: number; valueDisplay: string; numeric: number }> } | null {
  const config = LIST_CONFIGS[slug];
  if (!config) return null;

  const catalog = initialProgramsCatalog as unknown as ProgramItem[];

  const scored = catalog.map((prog) => {
    const val = config.getValue(prog);
    return {
      program: prog,
      valueDisplay: val.display,
      numeric: val.numeric,
    };
  });

  // Sort all programs by the list metric
  if (config.sortOrder === "desc") {
    scored.sort((a, b) => b.numeric - a.numeric);
  } else {
    scored.sort((a, b) => a.numeric - b.numeric);
  }

  // Deduplicate: keep only the best representative per normalized program name.
  // "Best" = first encountered after sorting (highest/lowest metric score).
  // Within a tie, prefer the entry with the highest kvotient (most selective = most recognized).
  const seen = new Map<string, typeof scored[0]>();
  for (const item of scored) {
    const key = normalizeProgramName(item.program.udbud_titel);
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      // Tie-break: prefer higher kvotient (more selective = canonical program)
      const existing = seen.get(key)!;
      const existingKv = parseFloat(String(existing.program.latest_kvotient || "0").replace(",", ".")) || 0;
      const currentKv = parseFloat(String(item.program.latest_kvotient || "0").replace(",", ".")) || 0;
      if (currentKv > existingKv) {
        seen.set(key, item);
      }
    }
  }

  const deduplicated = Array.from(seen.values());

  // Re-sort after deduplication (Map iteration preserves insertion order which is already sorted,
  // but explicit sort ensures correctness after any tie-break swaps)
  if (config.sortOrder === "desc") {
    deduplicated.sort((a, b) => b.numeric - a.numeric);
  } else {
    deduplicated.sort((a, b) => a.numeric - b.numeric);
  }

  const items = deduplicated.slice(0, config.limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return { config, items };
}


import { getProgramCatalog } from "./programCatalog";
import { getEnrichedScores } from "./domainScoring";
import { normalizeProgramName } from "./programName";

export { normalizeProgramName };

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
      const rob = enriched.ai_resilience;
      const job = enriched.labour_demand;
      const sal = enriched.salary_growth;
      const score = Math.round(0.40 * rob + 0.35 * job + 0.25 * sal);
      return { display: `${score}/100`, numeric: score, raw: score };
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

export function getListData(slug: string): { config: ListConfig; items: Array<{ program: ProgramItem; rank: number; valueDisplay: string; numeric: number }> } | null {
  const config = LIST_CONFIGS[slug];
  if (!config) return null;

  const catalog = getProgramCatalog() as ProgramItem[];
  const scored = catalog.map((prog) => {
    const val = config.getValue(prog);
    return { program: prog, valueDisplay: val.display, numeric: val.numeric };
  });

  if (config.sortOrder === "desc") scored.sort((a, b) => b.numeric - a.numeric);
  else scored.sort((a, b) => a.numeric - b.numeric);

  const seen = new Map<string, typeof scored[0]>();
  for (const item of scored) {
    const key = normalizeProgramName(item.program.udbud_titel);
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      const existing = seen.get(key)!;
      const existingKv = parseFloat(String(existing.program.latest_kvotient || "0").replace(",", ".")) || 0;
      const currentKv = parseFloat(String(item.program.latest_kvotient || "0").replace(",", ".")) || 0;
      if (currentKv > existingKv) seen.set(key, item);
    }
  }

  const deduplicated = Array.from(seen.values());
  if (config.sortOrder === "desc") deduplicated.sort((a, b) => b.numeric - a.numeric);
  else deduplicated.sort((a, b) => a.numeric - b.numeric);

  const items = deduplicated.slice(0, config.limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return { config, items };
}

import { getProgramCatalog } from "./programCatalog";
import { getEnrichedScores, isAllAdmitted } from "./domainScoring";
import { normalizeProgramName } from "./programName";
import { DATA_STATUS } from "./dataStatus";
import { roundAiScore } from "./aiPresentation";

export { normalizeProgramName, isAllAdmitted };

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
    augmentation_potential?: number;
    labour_demand?: number;
    salary_growth?: number;
    ai_dataset_version?: string;
    ai_model_status?: string;
    ai_mapping_confidence?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
    ai_is_baseline_estimate?: boolean;
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
  seoTitle?: string;
  badge: string;
  description: string;
  introHedge: string;
  metricLabel: string;
  limit: number;
  getValue: (p: ProgramItem) => { display: string; numeric: number; raw: unknown };
  sortOrder: "asc" | "desc";
  filter?: (p: ProgramItem) => boolean;
  readerQuestions?: Array<{ question: string; answer: string }>;
}

export const LIST_CONFIGS: Record<string, ListConfig> = {
  "top-10-mest-ai-robuste-uddannelser": {
    slug: "top-10-mest-ai-robuste-uddannelser",
    title: "Top 10 Mest AI-robuste Uddannelser i Danmark",
    seoTitle: "AI-robuste uddannelser i Danmark 2026",
    badge: "AI-modelestimat · O*NET 31.0 med oplyst dækning",
    description: `De 10 højeste AI-modelestimater blandt de ${DATA_STATUS.scoring.mappedProgrammeCount} uddannelser med O*NET 31.0-dækning. ${DATA_STATUS.catalogue.programmeCount - DATA_STATUS.scoring.mappedProgrammeCount} uddannelser uden en defensibel programkobling er udeladt.`,
    introHedge: `Listen omfatter kun ${DATA_STATUS.scoring.mappedProgrammeCount} af ${DATA_STATUS.catalogue.programmeCount} uddannelser. AI-robusthed er et opgavebaseret crosswalk-/modelestimat, ikke observerede danske jobudfald, en automatiseringssandsynlighed eller en anbefaling om at vælge uddannelsen.`,
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.ai_resilience;
      return { display: `ca. ${roundAiScore(val)}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
    filter: (p) => getEnrichedScores(p.udbud_titel, p.scores).ranking_eligible.ai,
    readerQuestions: [
      {
        question: "Er en høj AI-robusthed en garanti for arbejde?",
        answer: "Nej. AI-robusthed er et modelestimat for opgavernes karakter og skal læses sammen med fagligt indhold, dine interesser og datakvaliteten.",
      },
      {
        question: "Hvordan beregnes AI-robusthed?",
        answer: "Modellen kombinerer estimeret automatiseringsrisiko og augmentationspotentiale. Se den aktuelle formel, modelversion og kildebegrænsninger på evidenssiden.",
      },
    ],
  },
  "top-10-stoerste-ai-omstilling": {
    slug: "top-10-stoerste-ai-omstilling",
    title: "Top 10 Uddannelser i Størst AI-omstilling",
    seoTitle: "Uddannelser der påvirkes mest af AI i 2026",
    badge: "AI-modelestimat · O*NET 31.0 med oplyst dækning",
    description: `De 10 laveste AI-modelestimater blandt de ${DATA_STATUS.scoring.mappedProgrammeCount} uddannelser med O*NET 31.0-dækning. Listen handler om mulig opgaveforandring — ikke om at fag forsvinder.`,
    introHedge: `Listen omfatter kun ${DATA_STATUS.scoring.mappedProgrammeCount} af ${DATA_STATUS.catalogue.programmeCount} uddannelser. Et lavere estimat betyder, at flere opgaver kan ændres eller understøttes af AI; det er ikke en prognose for ledighed eller uddannelsens værdi.`,
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.ai_resilience;
      return { display: `ca. ${roundAiScore(val)}/100`, numeric: val, raw: val };
    },
    sortOrder: "asc",
    filter: (p) => getEnrichedScores(p.udbud_titel, p.scores).ranking_eligible.ai,
  },
  "top-10-svaereste-adgangskvotienter": {
    slug: "top-10-svaereste-adgangskvotienter",
    title: "Top 10 Sværeste Uddannelser at Komme Ind På",
    seoTitle: "Uddannelser med de højeste adgangskvotienter 2026",
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
    readerQuestions: [
      {
        question: "Er en høj adgangskvotient et fast adgangskrav?",
        answer: "Nej. Kvotienten viser den laveste registrerede Kvote 1-kvotient ved et bestemt optag og kan ændre sig fra år til år.",
      },
      {
        question: "Kan jeg søge gennem Kvote 2?",
        answer: "Ja, hvis uddannelsen tilbyder Kvote 2 og du opfylder kriterierne. Kontrollér altid frister og krav hos uddannelsesstedet og Optagelse.dk.",
      },
    ],
  },
  "top-10-letteste-adgangskvotienter": {
    slug: "top-10-letteste-adgangskvotienter",
    title: "Top 10 Uddannelser Hvor Alle Optages",
    seoTitle: "Uddannelser hvor alle blev optaget i 2026",
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
    readerQuestions: [
      {
        question: "Betyder “Alle optaget”, at der ikke er adgangskrav?",
        answer: "Nej. Du skal stadig opfylde uddannelsens adgangskrav. Betegnelsen beskriver blot udfaldet blandt kvalificerede ansøgere ved det seneste optag.",
      },
      {
        question: "Vil alle også blive optaget næste år?",
        answer: "Det kan ikke garanteres. Antal ansøgere og studiepladser ændrer sig, så kontrollér altid de aktuelle oplysninger.",
      },
    ],
  },
};

export function getListData(slug: string): { config: ListConfig; items: Array<{ program: ProgramItem; rank: number; valueDisplay: string; numeric: number }> } | null {
  const config = LIST_CONFIGS[slug];
  if (!config) return null;

  const catalog = getProgramCatalog() as ProgramItem[];
  const candidates = config.filter ? catalog.filter(config.filter) : catalog;
  const scored = candidates.map((prog) => {
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

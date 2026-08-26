import { getProgramCatalog } from "./programCatalog";
import { getEnrichedScores, isAllAdmitted } from "./domainScoring";
import { normalizeProgramName } from "./programName";
import { DATA_STATUS } from "./dataStatus";

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
    badge: "AI-modelestimat fra O*NET-opgaver",
    description: "De 10 videregående uddannelser i Danmark med den højeste beregnede AI-robusthedsscore. Scoren er et modelestimat baseret på opgavetaksonomi — ikke observerede uddannelsesudfald.",
    introHedge: `Ifølge vores beregningsmodel er disse uddannelser vurderet mest AI-robuste pr. ${DATA_STATUS.scoring.updatedLabel}. Tallene bygger på opgavedata fra O*NET og analyser af studieordninger — se 'Bag om dine scorer' for fuld metode.`,
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.ai_resilience;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
    readerQuestions: [
      {
        question: "Er en høj AI-robusthed en garanti for arbejde?",
        answer: "Nej. AI-robusthed er et modelestimat for opgavernes karakter og skal læses sammen med jobindikator, fagligt indhold og datakvalitet.",
      },
      {
        question: "Hvordan beregnes AI-robusthed?",
        answer: "Modellen kombinerer estimeret automatiseringsrisiko og augmentationspotentiale. Se den aktuelle formel, modelversion og kildebegrænsninger på evidenssiden.",
      },
    ],
  },
  "top-10-hoejest-loennede-uddannelser": {
    slug: "top-10-hoejest-loennede-uddannelser",
    title: "Top 10 Uddannelser med Højt Lønpotentiale",
    seoTitle: "Uddannelser med højt lønpotentiale 2026",
    badge: "Model-/registerafledt indikator",
    description: "De 10 videregående uddannelser med det højeste beregnede lønpotentiale. Scoren er en model-/registerafledt indikator og ikke en garanti for individuel løn.",
    introHedge: "Baseret på data fra Danmarks Statistik og UFM viser denne liste de 10 uddannelser med det højeste vurderede lønpotentiale. Tallene er vores bedste bud ud fra statistik og modeller — ikke en garanti for individuel startløn.",
    metricLabel: "Lønpotentiale",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.salary_growth || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
    readerQuestions: [
      {
        question: "Viser listen den faktiske løn for alle dimittender?",
        answer: "Nej. Lønpotentialet er en model-/registerafledt indikator og ikke en dokumenteret individuel startløn eller løngaranti.",
      },
      {
        question: "Bør jeg vælge uddannelse alene efter lønpotentiale?",
        answer: "Nej. Sammenlign lønpotentiale med faglig interesse, jobmuligheder, adgangskrav og datakvalitet.",
      },
    ],
  },
  "top-10-laveste-ledighed": {
    slug: "top-10-laveste-ledighed",
    title: "Top 10 Uddannelser med Gode Jobmuligheder",
    seoTitle: "Uddannelser med gode jobmuligheder 2026",
    badge: "Historisk arbejdsmarkedsindikator",
    description: "De 10 uddannelser med den højeste beregnede jobmulighedsindikator. Tallet skal læses som en historisk/modelafledt indikator — ikke som en sikker individuel ledighedsprognose.",
    introHedge: "Oversigten rangerer uddannelser efter den aktuelle jobmulighedsindikator. Indikatoren er model-/registerafledt og må ikke læses som en dokumenteret individuel ledighedsprognose.",
    metricLabel: "Jobmuligheder",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.labour_demand || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
    readerQuestions: [
      {
        question: "Er jobmulighedsscoren det samme som observeret ledighed?",
        answer: "Nej. Scoren er en model-/registerafledt indikator. Uddannelsesspecifik dokumentation er ikke fuldt etableret for alle programmer.",
      },
      {
        question: "Kan jobmuligheder ændre sig efter studiestart?",
        answer: "Ja. Arbejdsmarkedet kan ændre sig væsentligt i løbet af en uddannelse, så brug indikatoren som ét signal blandt flere.",
      },
    ],
  },
  "top-20-bedste-samlede-match": {
    slug: "top-20-bedste-samlede-match",
    title: "Top 20 Bedste Samlede Match i Danmark",
    seoTitle: "Bedste samlede uddannelsesmatch i Danmark 2026",
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
    seoTitle: "Uddannelser der påvirkes mest af AI i 2026",
    badge: "Strukturel AI-analyse",
    description: "De 10 uddannelser hvor flest kerneopgaver forventes suppleret eller effektiviseret af kunstig intelligens og sprogmodeller.",
    introHedge: "Gennemskuelighed og balance er afgørende. Denne liste fremhæver de 10 uddannelser med lavest beregnede AI-robusthedsscore — det betyder ikke at faget forsvinder, men at opgaverne forventes at ændre sig markant i takt med AI.",
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const enriched = getEnrichedScores(p.udbud_titel, p.scores);
      const val = enriched.ai_resilience;
      return { display: `${val}/100 (Lav)`, numeric: val, raw: val };
    },
    sortOrder: "asc",
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

import initialProgramsCatalog from "../../public/data/all_programs_catalog.json";

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
  rag_evidence?: Array<{ quote: string; source: string }>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue: (p: ProgramItem) => { display: string; numeric: number; raw: any };
  sortOrder: "asc" | "desc";
}

export const LIST_CONFIGS: Record<string, ListConfig> = {
  "top-10-mest-ai-robuste-uddannelser": {
    slug: "top-10-mest-ai-robuste-uddannelser",
    title: "Top 10 Mest AI-robuste Uddannelser i Danmark",
    badge: "100% Modellerede O*NET-data",
    description: "De 10 videregående uddannelser i Danmark med den højeste beregnede AI-robusthedsscore baseret på opgavetaksonomi og økonometriske fremskrivninger.",
    introHedge: "Ifølge vores økonometriske datamodel er disse ti uddannelser vurderet mest AI-robuste pr. juli 2026. Scorerne bygger på opgavetaksonomi fra O*NET samt analyser af studieordninger — se Evidens for fuld metode.",
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const val = 100 - (p.scores?.automation_risk || 0);
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-10-hoejest-loennede-uddannelser": {
    slug: "top-10-hoejest-loennede-uddannelser",
    title: "Top 10 Bedst Lønnede Uddannelser",
    badge: "DST & UFM Registerdata",
    description: "De 10 videregående uddannelser med det højeste beregnede lønpotentiale og stærkeste historiske lønudvikling for nyligt uddannede dimittender.",
    introHedge: "Baseret på registerdata fra Danmarks Statistik og UFM viser denne liste de 10 uddannelser med højeste vurderede lønpotentiale. Vurderingerne udgør statistiske modelestimater og garanterer ikke individuel startløn.",
    metricLabel: "Lønpotentiale",
    limit: 10,
    getValue: (p) => {
      const val = p.scores?.salary_growth || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-10-laveste-ledighed": {
    slug: "top-10-laveste-ledighed",
    title: "Top 10 Uddannelser med Laveste Ledighed",
    badge: "Offentlig Dimittend-registerdata",
    description: "De 10 uddannelser med den højeste efterspørgsel på arbejdsmarkedet og laveste observerede dimittendledighed 1-2 år efter fuldførelse.",
    introHedge: "Registerbaseret oversigt over de 10 uddannelser med stærkest observeret jobefterspørgsel. Tallene afspejler historiske registerdata for dimittendbeskæftigelse.",
    metricLabel: "Jobmuligheder",
    limit: 10,
    getValue: (p) => {
      const val = p.scores?.labour_demand || 50;
      return { display: `${val}/100`, numeric: val, raw: val };
    },
    sortOrder: "desc",
  },
  "top-20-bedste-samlede-match": {
    slug: "top-20-bedste-samlede-match",
    title: "Top 20 Bedste Samlede Match i Danmark",
    badge: "Kombineret PEFF Trekant-Score",
    description: "De 20 uddannelser der opnår den højeste vægtede kombination af AI-robusthed, jobmuligheder og lønpotentiale.",
    introHedge: "Denne rangering bygger på det samlede gennemsnit af vores tre kernemetrics (AI-robusthed, jobmuligheder og lønpotentiale). Listen giver et afbalanceret overblik over uddannelser der klarer sig stærkt over hele linjen.",
    metricLabel: "Samlet Trekant-score",
    limit: 20,
    getValue: (p) => {
      const rob = 100 - (p.scores?.automation_risk || 0);
      const job = p.scores?.labour_demand || 50;
      const sal = p.scores?.salary_growth || 50;
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
    introHedge: "Gennemskuelighed og balance er afgørende. Denne liste fremhæver de 10 uddannelser med lavest beregnede AI-robusthedsscore — det betyder ikke at faget forsvinder, men at opgaverne står overfor markant AI-støttet omstilling.",
    metricLabel: "AI-robusthed",
    limit: 10,
    getValue: (p) => {
      const val = 100 - (p.scores?.automation_risk || 0);
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

  const catalog = initialProgramsCatalog as unknown as ProgramItem[];

  const scored = catalog.map((prog) => {
    const val = config.getValue(prog);
    return {
      program: prog,
      valueDisplay: val.display,
      numeric: val.numeric,
    };
  });

  if (config.sortOrder === "desc") {
    scored.sort((a, b) => b.numeric - a.numeric);
  } else {
    scored.sort((a, b) => a.numeric - b.numeric);
  }

  const items = scored.slice(0, config.limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return { config, items };
}

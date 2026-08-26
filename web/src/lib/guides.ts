export interface GuideSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface GuideLink {
  href: string;
  label: string;
  description: string;
}

export interface GuideConfig {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  badge: string;
  intro: string;
  sections: GuideSection[];
  primaryCta: GuideLink;
  relatedLinks: GuideLink[];
  questions: Array<{ question: string; answer: string }>;
}

export const GUIDE_UPDATED_AT = "2026-08-26";

export const GUIDE_CONFIGS: Record<string, GuideConfig> = {
  "hvad-kan-jeg-laese-med-mit-snit": {
    slug: "hvad-kan-jeg-laese-med-mit-snit",
    title: "Hvad kan jeg læse med mit snit?",
    seoTitle: "Hvad kan jeg læse med mit snit? Adgangskvotienter 2026",
    description:
      "Brug dit gymnasiale gennemsnit til at finde og sammenligne danske uddannelser med de seneste Kvote 1-adgangskvotienter fra UFM.",
    badge: "Kvote 1 og optagelsesdata 2026",
    intro:
      "Dit gennemsnit er et praktisk filter, men ikke et facit for dit studievalg. Matchværktøjet sammenholder dit snit med den senest registrerede Kvote 1-kvotient og lader dig samtidig prioritere AI-robusthed, jobmuligheder og lønpotentiale.",
    sections: [
      {
        title: "Start med dit faktiske gennemsnit",
        paragraphs: [
          "Indstil dit snit i matchværktøjet. Uddannelser med en numerisk adgangskvotient markeres, når dit snit lå over eller under den senest registrerede Kvote 1-kvotient.",
          "Adgangskvotienten beskriver sidste optag og kan ændre sig fra år til år. Den er derfor ikke et løfte om optagelse næste år.",
        ],
        bullets: [
          "Se både uddannelser, du sandsynligvis kunne søge via Kvote 1, og relevante alternativer.",
          "Brug institutionsfilteret, hvis geografi eller uddannelsessted betyder meget.",
          "Åbn uddannelsesprofilen for at kontrollere KOT-nummer, datadato og modelstatus.",
        ],
      },
      {
        title: "Sådan læser du optagelsestallene",
        paragraphs: [
          "En numerisk kvotient er den laveste registrerede Kvote 1-kvotient ved det seneste optag. “Alle optaget” betyder, at alle kvalificerede ansøgere blev optaget i det pågældende optag — ikke at uddannelsen er uden adgangskrav.",
          "Hvis dit snit ligger under den seneste kvotient, kan Kvote 2 eller beslægtede uddannelser stadig være relevante. Kontrollér altid de aktuelle adgangskrav og frister hos de officielle myndigheder.",
        ],
      },
      {
        title: "Vælg mere end bare efter snit",
        paragraphs: [
          "Brug job-, løn- og AI-indikatorerne som supplerende signaler. De er model- eller registerafledte indikatorer og skal ikke læses som garantier for dit fremtidige arbejdsliv.",
        ],
        bullets: [
          "Sammenlign mindst to uddannelser side om side.",
          "Læs fagindhold og officielle adgangskrav.",
          "Tal med en studievejleder, hvis dit valg afhænger af Kvote 2 eller særlige adgangskrav.",
        ],
      },
    ],
    primaryCta: {
      href: "/?gpa=8.0",
      label: "Find uddannelser med dit snit",
      description: "Åbn matchværktøjet med et eksempel, og indstil derefter dit eget gennemsnit.",
    },
    relatedLinks: [
      {
        href: "/lister/top-10-letteste-adgangskvotienter",
        label: "Uddannelser hvor alle blev optaget",
        description: "Se udvalgte uddannelser med “Alle optaget” i seneste optag.",
      },
      {
        href: "/lister/top-10-svaereste-adgangskvotienter",
        label: "Højeste adgangskvotienter",
        description: "Se uddannelserne med de højeste registrerede Kvote 1-kvotienter.",
      },
      {
        href: "/sammenlign",
        label: "Sammenlign uddannelser",
        description: "Sammenlign op til tre uddannelser på samme skærm.",
      },
    ],
    questions: [
      {
        question: "Er adgangskvotienten det samme som et adgangskrav?",
        answer:
          "Nej. Adgangskrav afgør, om du er kvalificeret til at søge. Adgangskvotienten viser den laveste registrerede Kvote 1-kvotient ved et bestemt optag og kan ændre sig.",
      },
      {
        question: "Kan jeg stadig søge, hvis mit snit ligger under kvotienten?",
        answer:
          "Ja, du kan blandt andet undersøge Kvote 2 og beslægtede uddannelser. Uddannelsesindsigt viser historiske optagelsestal, men den officielle vurdering sker hos uddannelsesstedet og Optagelse.dk.",
      },
    ],
  },
  "ai-og-uddannelsesvalg": {
    slug: "ai-og-uddannelsesvalg",
    title: "AI og uddannelsesvalg",
    seoTitle: "AI og uddannelsesvalg: Sådan bruger du AI-robusthed",
    description:
      "Forstå hvad AI-robusthed betyder, hvad modellen ikke kan forudsige, og hvordan du kombinerer AI med job, løn og faglig interesse i dit studievalg.",
    badge: "Modelguide med tydelige forbehold",
    intro:
      "AI ændrer opgaver forskelligt på tværs af fag. Uddannelsesindsigts AI-robusthed er et crosswalk-/modelestimat baseret på opgaveeksponering og potentialet for menneske-AI-samarbejde — ikke en prognose for arbejdsløshed.",
    sections: [
      {
        title: "Hvad måler AI-robusthed?",
        paragraphs: [
          "Scoren sammenfatter estimeret automatiseringsrisiko og augmentationspotentiale på en skala fra 0 til 100. En højere score peger på opgaver, hvor menneskelig vurdering, relationer, fysisk udførelse eller komplekst ansvar forventes at fylde meget.",
          "Scoren er ikke et observeret dansk jobudfald for dimittender fra den enkelte uddannelse. Se altid modelstatus og evidensforklaring sammen med tallet.",
        ],
      },
      {
        title: "Brug tre signaler sammen",
        paragraphs: [
          "Et robust studievalg handler sjældent om ét tal. Matchværktøjet lader dig afveje AI-robusthed, jobmuligheder og lønpotentiale, mens adgangskvotienten behandles som observeret historisk optagelsesdata.",
        ],
        bullets: [
          "AI-robusthed: modelestimat for opgavernes karakter.",
          "Jobmuligheder: model-/registerafledt arbejdsmarkedsindikator.",
          "Lønpotentiale: model-/registerafledt indikator, ikke individuel lønprognose.",
        ],
      },
      {
        title: "Stil de rigtige spørgsmål",
        paragraphs: [
          "Spørg ikke kun, om AI kan udføre en opgave. Spørg også, hvem der har ansvaret, hvor vigtigt menneskelig kontakt er, og om AI primært erstatter rutiner eller gør fagpersonen mere produktiv.",
        ],
        bullets: [
          "Hvilke opgaver er centrale i faget — og hvilke er rutineprægede?",
          "Skaber AI nye specialer eller kompetencekrav i området?",
          "Vil du trives med at bruge AI som arbejdsredskab i faget?",
        ],
      },
    ],
    primaryCta: {
      href: "/?wAi=90&wJob=70&wSal=60",
      label: "Prøv et AI-fokuseret match",
      description: "Åbn matchværktøjet med høj AI-prioritet og justér derefter vægtene.",
    },
    relatedLinks: [
      {
        href: "/lister/top-10-mest-ai-robuste-uddannelser",
        label: "AI-robuste uddannelser",
        description: "Se den aktuelle modelbaserede topliste.",
      },
      {
        href: "/lister/top-10-stoerste-ai-omstilling",
        label: "Uddannelser i AI-omstilling",
        description: "Se fag hvor opgaverne forventes at ændre sig mest.",
      },
      {
        href: "/evidens",
        label: "Bag om scorerne",
        description: "Læs modelversion, datakilder og kendte begrænsninger.",
      },
    ],
    questions: [
      {
        question: "Er en lav AI-robusthed det samme som dårlige jobmuligheder?",
        answer:
          "Nej. AI-robusthed og jobmuligheder er forskellige indikatorer. Et fag kan have stor efterspørgsel og samtidig være i betydelig teknologisk omstilling.",
      },
      {
        question: "Kan modellen forudsige, hvilke job der forsvinder?",
        answer:
          "Nej. Modellen vurderer opgaveeksponering og potentiale for AI-støtte. Den er ikke en sikker prognose for jobtab, arbejdsløshed eller den enkelte persons karriere.",
      },
    ],
  },
  "saadan-sammenligner-du-uddannelser": {
    slug: "saadan-sammenligner-du-uddannelser",
    title: "Sådan sammenligner du uddannelser",
    seoTitle: "Sammenlign uddannelser: Snit, job, løn og AI",
    description:
      "En praktisk guide til at sammenligne danske videregående uddannelser på adgangskvotient, fagligt indhold, jobmuligheder, lønpotentiale og AI-robusthed.",
    badge: "Beslutningsguide i fem trin",
    intro:
      "En god sammenligning starter med dine egne kriterier og skelner mellem observerede optagelsestal og modelbaserede fremtidsindikatorer. Brug guiden som en enkel tjekliste før dit endelige valg.",
    sections: [
      {
        title: "1. Afgræns dine reelle muligheder",
        paragraphs: [
          "Sammenhold dit gennemsnit med den seneste Kvote 1-kvotient, men behold relevante Kvote 2-muligheder og beslægtede uddannelser i feltet. Geografi, transport og studiemiljø kan være lige så afgørende som uddannelsens navn.",
        ],
      },
      {
        title: "2. Sammenlign indhold før scorer",
        paragraphs: [
          "To uddannelser med lignende navn kan have forskellige fag, specialiseringer og undervisningsformer. Kontrollér altid de officielle studieordninger og adgangskrav.",
        ],
        bullets: [
          "Hvilke fag fylder mest de første år?",
          "Er uddannelsen teoretisk, praktisk eller en kombination?",
          "Hvilke kandidat-, praktik- eller specialiseringsmuligheder følger med?",
        ],
      },
      {
        title: "3. Brug indikatorerne som beslutningsstøtte",
        paragraphs: [
          "Job-, løn- og AI-scorer kan gøre forskelle synlige, men de kan ikke afgøre dit valg alene. Se efter den samlede profil og læs datakvaliteten, før du konkluderer noget ud fra få point i forskel.",
        ],
        bullets: [
          "Store forskelle er mere informative end små afrundingsforskelle.",
          "Modelestimater er ikke garantier for individuelle udfald.",
          "Din motivation og faglige interesse bør indgå eksplicit i valget.",
        ],
      },
      {
        title: "4. Gem spørgsmålene til åbent hus",
        paragraphs: [
          "Brug sammenligningen til at formulere konkrete spørgsmål til studerende, undervisere og studievejledere. Det gør værktøjet til et afsæt for bedre research frem for en automatisk beslutning.",
        ],
      },
    ],
    primaryCta: {
      href: "/sammenlign",
      label: "Sammenlign uddannelser side om side",
      description: "Vælg op til tre uddannelser og se nøgletallene samlet.",
    },
    relatedLinks: [
      {
        href: "/",
        label: "Find dit match",
        description: "Sortér kataloget efter dine egne prioriteter.",
      },
      {
        href: "/guides/hvad-kan-jeg-laese-med-mit-snit",
        label: "Hvad kan jeg læse med mit snit?",
        description: "Forstå hvordan adgangskvotienter bruges i matchværktøjet.",
      },
      {
        href: "/evidens",
        label: "Kontrollér datagrundlaget",
        description: "Se hvilke tal der er observerede, afledte eller modellerede.",
      },
    ],
    questions: [
      {
        question: "Hvilke tal bør jeg lægge mest vægt på?",
        answer:
          "Det afhænger af dine mål. Brug adgangskvotienten til at forstå seneste optag, og brug job-, løn- og AI-indikatorerne som supplerende signaler sammen med fagligt indhold og trivsel.",
      },
      {
        question: "Er uddannelsen med den højeste samlede score altid bedst?",
        answer:
          "Nej. Den samlede score afspejler valgte vægte og modellens datagrundlag. Den bedste uddannelse er den, der passer til dine faglige interesser, muligheder og prioriteter.",
      },
    ],
  },
};

export function getGuide(slug: string): GuideConfig | undefined {
  return GUIDE_CONFIGS[slug];
}

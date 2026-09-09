export type ResearchStatus = "OBSERVERET" | "FORSKNINGSRESULTAT" | "MODELINDIKATOR";

export interface AIResearchInsight {
  id: string;
  value: string;
  title: string;
  summary: string;
  meaningForStudents: string;
  caution: string;
  geography: string;
  published: string;
  status: ResearchStatus;
  sourceLabel: string;
  sourceUrl: string;
}

export const AI_RESEARCH_UPDATED_AT = "9. september 2026";

/**
 * Curated context for young people choosing an education.
 *
 * These observations are deliberately separate from programme scores. A source
 * about countries, companies or occupations is not evidence for the outcome of
 * one Danish programme.
 */
export const AI_RESEARCH_INSIGHTS: AIResearchInsight[] = [
  {
    id: "dk-young-ai-use",
    value: "66%",
    title: "af de 16–24-årige brugte AI ugentligt i 2025",
    summary: "Andelen steg fra 34% i 2024. 62% af de unge brugte AI i forbindelse med skole eller uddannelse.",
    meaningForStudents: "Evnen til at bruge AI kritisk og fagligt er allerede en studiekompetence. Se derfor også på, hvordan en uddannelse lærer dig at vurdere, kontrollere og anvende AI — ikke kun om faget er eksponeret.",
    caution: "Tallet beskriver brug blandt unge i Danmark, ikke om en bestemt uddannelse giver bedre jobmuligheder.",
    geography: "Danmark",
    published: "4. marts 2026",
    status: "OBSERVERET",
    sourceLabel: "Danmarks Statistik",
    sourceUrl: "https://www.dst.dk/da/Statistik/udgivelser/NytHtml?cid=52821",
  },
  {
    id: "dk-business-ai-use",
    value: "42%",
    title: "af danske virksomheder anvendte AI i 2025",
    summary: "Danmark havde den højeste andel i EU blandt virksomheder med mindst 10 ansatte. EU-gennemsnittet var 20%.",
    meaningForStudents: "AI-kompetencer bliver relevante i mange brancher. Det taler for at vælge et fag, du vil fordybe dig i, og samtidig lære at bruge AI som arbejdsredskab.",
    caution: "Virksomhedsbrug siger ikke, hvilke job der forsvinder, eller hvordan en bestemt dimittend klarer sig.",
    geography: "Danmark og EU",
    published: "11. december 2025",
    status: "OBSERVERET",
    sourceLabel: "Eurostat",
    sourceUrl: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251211-2",
  },
  {
    id: "ilo-transformation",
    value: "1 af 4",
    title: "job globalt er potentielt eksponeret for generativ AI",
    summary: "ILO og NASK vurderer, at transformation af arbejdsopgaver er mere sandsynlig end fuld erstatning af hele job.",
    meaningForStudents: "Undersøg hvilke opgaver du gerne vil være god til, og om AI mest kan overtage rutiner eller hjælpe fagpersonen. Et job består næsten altid af flere forskellige opgaver.",
    caution: "Det er et globalt eksponeringsindeks baseret på arbejdsopgaver — ikke en måling af jobtab i Danmark.",
    geography: "Globalt",
    published: "20. maj 2025",
    status: "MODELINDIKATOR",
    sourceLabel: "ILO–NASK",
    sourceUrl: "https://www.ilo.org/resource/news/one-four-jobs-risk-being-transformed-genai-new-ilo%E2%80%93nask-global-index-shows",
  },
  {
    id: "star-recruitment-2026",
    value: "10,6%",
    title: "af danske rekrutteringsforsøg var forgæves",
    summary: "STAR opgjorde 46.100 forgæves rekrutteringer. Udfordringen var størst i jern, metal og auto samt bygge og anlæg.",
    meaningForStudents: "Aktuel efterspørgsel kan være et nyttigt signal, men den bør læses sammen med dimittendledighed, uddannelsens indhold og dine egne interesser.",
    caution: "Tallene gælder fagområder og regioner, ikke direkte den enkelte videregående uddannelse.",
    geography: "Danmark",
    published: "25. juni 2026",
    status: "OBSERVERET",
    sourceLabel: "STAR",
    sourceUrl: "https://star.dk/om-styrelsen/nyt/nyheder-og-aktuelt-fra-styrelsen-for-arbejdsmarked-og-rekruttering/2026/06/rekrutteringssurvey-sommer-2026-fortsat-flest-rekrutteringsudfordringer-i-de-haandvaerksmaessige-fag",
  },
  {
    id: "stanford-entry-level",
    value: "−19%",
    title: "relativ beskæftigelsesudvikling for unge i stærkt AI-eksponerede job",
    summary: "Et amerikansk studie finder en foreløbig forskel for 22–25-årige, især gennem lavere nyansættelse frem for flere afskedigelser.",
    meaningForStudents: "De første jobår kan ændre sig hurtigere end hele fag forsvinder. Praktik, portfolio, domæneviden og evnen til at arbejde sammen med AI kan derfor få større betydning.",
    caution: "Amerikansk observationsstudie. Resultatet svækkes ved kontrol for uddannelse og er ikke dokumenteret for danske dimittender.",
    geography: "USA",
    published: "12. august 2026, revideret analyse",
    status: "FORSKNINGSRESULTAT",
    sourceLabel: "Stanford Digital Economy Lab",
    sourceUrl: "https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/",
  },
  {
    id: "anthropic-augmentation",
    value: "52 / 45",
    title: "augmentation kontra automation i observeret Claude-brug",
    summary: "I november 2025 blev 52% af de analyserede brugsmønstre klassificeret som samarbejde med mennesker og 45% som automatisering.",
    meaningForStudents: "Spørg ikke kun, om AI kan udføre en opgave. Spørg også, om du kan blive bedre til faget ved at bruge AI, og hvilke dele der fortsat kræver dømmekraft og ansvar.",
    caution: "Platformsspecifik analyse af Claude-brug. Fordelingen ændrer sig over tid og er ikke en universel arbejdsmarkedsprognose.",
    geography: "Global platformstrafik",
    published: "15. januar 2026",
    status: "FORSKNINGSRESULTAT",
    sourceLabel: "Anthropic Economic Index",
    sourceUrl: "https://www.anthropic.com/research/economic-index-primitives",
  },
];

export const STATUS_LABELS: Record<ResearchStatus, string> = {
  OBSERVERET: "Observeret statistik",
  FORSKNINGSRESULTAT: "Forskningsresultat",
  MODELINDIKATOR: "Modelbaseret eksponering",
};

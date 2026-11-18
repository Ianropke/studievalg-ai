import type { GuideConfig } from "./guides";

export interface StudyNewsArticle extends GuideConfig {
  publishedAt: string;
  source: {
    publisher: string;
    title: string;
    href: string;
    date: string;
    dateLabel: string;
  };
}

export const STUDY_NEWS: StudyNewsArticle[] = [
  {
    slug: "ai-og-det-danske-arbejdsmarked",
    title: "Hvad betyder AI for det arbejdsliv, du vælger?",
    seoTitle: "AI på det danske arbejdsmarked: Hvad betyder det for dit studievalg?",
    description: "Ny dansk analyse af AI og beskæftigelse. Få tre spørgsmål, du kan bruge, når du sammenligner uddannelser eller tager til åbent hus.",
    badge: "AI og arbejdsliv",
    publishedAt: "2026-11-18",
    intro: "Overvejer du en uddannelse, hvor AI allerede fylder? Start med at finde ud af, hvilke opgaver du får lyst til at lære, og hvordan uddannelsen lærer dig at bruge og vurdere AI i praksis.",
    source: {
      publisher: "Danmarks Nationalbank",
      title: "Kunstig intelligens og arbejdsmarkedet: Omstillingen er begyndt",
      href: "https://www.nationalbanken.dk/da/viden-og-nyheder/publikationer-og-taler/analyse/2026/kunstig-intelligens-og-arbejdsmarkedet-omstillingen-er-begyndt",
      date: "2026-09-16",
      dateLabel: "16. september 2026",
    },
    sections: [
      {
        title: "Hvad viser analysen?",
        paragraphs: [
          "Danmarks Nationalbank finder tegn på, at virksomheder tilpasser deres efterspørgsel efter arbejdskraft, når de tager AI i brug. I de undersøgte data ser den samlede danske beskæftigelse endnu ikke ud til at være påvirket. Udviklingen på længere sigt er usikker.",
          "Analysen handler om det danske arbejdsmarked samlet og giver ingen prognose for jobmulighederne efter en bestemt uddannelse.",
        ],
      },
      {
        title: "Tre spørgsmål, du kan tage med til åbent hus",
        paragraphs: ["Stil de samme spørgsmål på to uddannelser, der interesserer dig. Bed gerne om et eksempel på en opgave fra undervisningen eller praktikken."],
        bullets: [
          "Hvordan bruger I AI i konkrete fag eller projekter?",
          "Hvordan lærer jeg at opdage fejl og vurdere, hvornår et AI-svar kan bruges?",
          "Hvilke opgaver løser dimittender i deres første job, og hvor bruger de deres faglige dømmekraft?",
        ],
      },
    ],
    primaryCta: {
      href: "/guides/ai-og-uddannelsesvalg",
      label: "Læs guiden om AI og uddannelsesvalg",
      description: "Se, hvordan du kan inddrage AI, når du sammenligner uddannelser.",
    },
    relatedLinks: [
      { href: "/analyse", label: "AI og arbejdsmarkedet", description: "Se flere undersøgelser og deres begrænsninger." },
      { href: "/evidens", label: "Kilder og metode", description: "Se, hvordan sidens AI-modelestimater er beregnet." },
    ],
    questions: [],
  },
  {
    slug: "foerste-aar-paa-laereruddannelsen",
    title: "Hvordan er det første år på læreruddannelsen?",
    seoTitle: "Første år på læreruddannelsen: Undervisning, studieliv og praktik",
    description: "Overvejer du at blive lærer? Brug EVA’s rapport om første studieår til at undersøge undervisning og praktik på de læreruddannelser, du overvejer.",
    badge: "Læreruddannelse og praktik",
    publishedAt: "2026-11-18",
    intro: "Hvis du overvejer at blive lærer, kan det gøre valget lettere at se på, hvornår du kommer ud i en skole, og hvilken støtte du får, mens du lærer at undervise.",
    source: {
      publisher: "Danmarks Evalueringsinstitut (EVA)",
      title: "Det første år på den nye læreruddannelse",
      href: "https://eva.dk/udgivelser/2026/jun/det-foerste-aar-paa-den-nye-laereruddannelse",
      date: "2026-06-09",
      dateLabel: "9. juni 2026",
    },
    sections: [
      {
        title: "Hvad undersøger EVA?",
        paragraphs: [
          "Halvdelen af de førsteårsstuderende, der svarede i EVA’s spørgeskemaundersøgelse, angav, at praktikken i høj grad øgede deres lyst til at arbejde som lærer. Samtidig efterlyste flere tydeligere mål for praktikken. Spørg det enkelte studiested, hvad du skal lære i den første praktik, og hvordan du får feedback.",
        ],
      },
      {
        title: "Sådan sammenligner du to læreruddannelser",
        paragraphs: ["Se på første års studieplan og praktikbeskrivelse for to steder, du kunne tænke dig at læse. Brug åbent hus eller studievejledningen til at få svar på det, der mangler."],
        bullets: [
          "Hvornår kommer jeg i praktik, og hvad får jeg selv lov til at prøve i en klasse?",
          "Hvem giver mig feedback på min undervisning?",
          "Hvordan vælger jeg undervisningsfag, og hvilke fag udbydes på det studiested, jeg overvejer?",
        ],
      },
    ],
    primaryCta: {
      href: "/#valg?q=l%C3%A6rer",
      label: "Find læreruddannelser",
      description: "Se udbud i kataloget, og gem de steder, du vil undersøge nærmere.",
    },
    relatedLinks: [
      { href: "/guides/saadan-sammenligner-du-uddannelser", label: "Sådan sammenligner du uddannelser", description: "Brug samme kriterier på de steder, du overvejer." },
    ],
    questions: [],
  },
  {
    slug: "studiemiljoe-og-undervisning-paa-bachelor",
    title: "Hvordan er hverdagen på en bacheloruddannelse?",
    seoTitle: "Studiemiljø på universitetet: Tre spørgsmål til åbent hus",
    description: "Brug en EVA-undersøgelse af danske universiteter og tre konkrete spørgsmål til at sammenligne studiehverdagen på to bacheloruddannelser.",
    badge: "Studieliv og åbent hus",
    publishedAt: "2026-11-18",
    intro: "To bacheloruddannelser kan lyde ens, selv om ugen ser forskellig ud. Bed om et konkret eksempel på et første semester, så du bedre kan vurdere, hvor du vil trives.",
    source: {
      publisher: "Danmarks Evalueringsinstitut (EVA)",
      title: "Undervisning, studiemiljø og organisering på universiteternes bacheloruddannelser",
      href: "https://eva.dk/udgivelser/2026/maj/undervisning-studiemiljoe-og-organisering-paa-universiteternes-bacheloruddannelser",
      date: "2026-05-27",
      dateLabel: "27. maj 2026",
    },
    sections: [
      {
        title: "Hvad undersøger EVA?",
        paragraphs: [
          "I EVA’s spørgeskemaundersøgelse på danske universiteters bacheloruddannelser var 82 % af de studerende helt eller overvejende enige i, at fagindholdet interesserede dem. Samtidig vurderede kun tre ud af ti undervisere, at det i høj grad var let for de studerende at se, hvordan fagene hænger sammen. Bed om et eksempel på, hvordan to fag fra første semester spiller sammen.",
        ],
      },
      {
        title: "Spørg ind til en almindelig uge",
        paragraphs: ["Spørg en studerende på hvert af de steder, du overvejer. Skriv ned, hvad der lyder motiverende for dig, og hvad du gerne vil se et eksempel på."],
        bullets: [
          "Hvordan fordeler en typisk uge sig mellem undervisning, gruppearbejde og selvstudie?",
          "Hvornår får jeg feedback på mit arbejde, og hvem får jeg den fra?",
          "Hvordan finder man en studiegruppe, og hvad gør I for at hjælpe nye studerende ind i fællesskabet?",
        ],
      },
    ],
    primaryCta: {
      href: "/guides/saadan-sammenligner-du-uddannelser",
      label: "Få en tjekliste til dit studievalg",
      description: "Sammenlign også fag, adgangskrav og studiested.",
    },
    relatedLinks: [
      { href: "/sammenlign", label: "Sammenlign dine uddannelser", description: "Se op til tre af dine uddannelser side om side." },
    ],
    questions: [],
  },
];

import type { GuideConfig } from "./guides";

interface StudyNewsSource {
  publisher: string;
  title: string;
  href: string;
  date: string;
  dateLabel: string;
}

export interface StudyNewsArticle extends GuideConfig {
  publishedAt: string;
  source: StudyNewsSource;
  additionalSources?: StudyNewsSource[];
}

export const STUDY_NEWS: StudyNewsArticle[] = [
  {
    slug: "i-tvivl-om-uddannelse",
    title: "Er du i tvivl om, hvad du skal læse?",
    seoTitle: "I tvivl om uddannelse? Prøv en øvelse til dit studievalg",
    description: "Er du usikker på dit studievalg? Brug to korte samtaler til at sammenligne studiehverdag og arbejdsliv, før du vælger uddannelse.",
    badge: "Tvivl og studievalg",
    publishedAt: "2026-11-18",
    intro: "Du behøver ikke vide, hvad du vil arbejde med om ti år. Start med én uddannelse, du er nysgerrig på, og undersøg, hvordan hverdagen ser ud både under og efter studiet.",
    source: {
      publisher: "OECD",
      title: "The State of Global Teenage Career Preparation",
      href: "https://www.oecd.org/en/publications/the-state-of-global-teenage-career-preparation_d5f8e3f2-en.html",
      date: "2025-05-20",
      dateLabel: "20. maj 2025",
    },
    sections: [
      {
        title: "Du er ikke alene om at være i tvivl",
        paragraphs: [
          "OECD’s rapport om 15-årige viser, at mange er usikre på, hvad de vil arbejde med. Unge, der har deltaget i flere aktiviteter som vejledning og møder med folk i arbejde, har typisk klarere planer.",
        ],
      },
      {
        title: "Prøv to korte samtaler",
        paragraphs: [
          "Tal med en studerende og en person, der arbejder inden for faget. Det kan være til åbent hus, gennem studievejledningen eller ved at spørge nogen, du kender.",
        ],
        bullets: [
          "Spørg den studerende, hvordan en almindelig uge ser ud, og hvad der overraskede ved studiestart.",
          "Spørg den, der arbejder i faget, hvilke opgaver der fylder mest, og hvordan en af dem ser ud i praksis.",
          "Skriv én ting ned, du fik mere lyst til, og ét spørgsmål, du stadig har. Brug det spørgsmål til at undersøge en anden uddannelse.",
        ],
      },
    ],
    primaryCta: {
      href: "/",
      label: "Find en uddannelse at undersøge",
      description: "Søg på et fag eller en interesse, og gem de uddannelser, du vil vide mere om.",
    },
    relatedLinks: [
      {
        href: "/guides/saadan-sammenligner-du-uddannelser",
        label: "Sådan sammenligner du uddannelser",
        description: "Brug dine svar til at sammenligne indhold, adgang og studiested.",
      },
    ],
    questions: [],
  },
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
    additionalSources: [{
      publisher: "Higher Education Policy Institute (HEPI)",
      title: "Student Generative AI Survey 2026",
      href: "https://www.hepi.ac.uk/reports/student-generative-ai-survey-2026/",
      date: "2026-03-12",
      dateLabel: "12. marts 2026",
    }],
    sections: [
      {
        title: "Hvad viser analysen?",
        paragraphs: [
          "Danmarks Nationalbank finder tegn på, at virksomheder tilpasser deres efterspørgsel efter arbejdskraft, når de tager AI i brug. I de undersøgte data ser den samlede danske beskæftigelse endnu ikke ud til at være påvirket. Udviklingen på længere sigt er usikker.",
          "Analysen handler om det danske arbejdsmarked samlet og giver ingen prognose for jobmulighederne efter en bestemt uddannelse.",
        ],
      },
      {
        title: "Hvordan lærer du at bruge AI på studiet?",
        paragraphs: [
          "I en undersøgelse blandt 1.054 britiske fuldtidsstuderende på bachelorniveau mente 68 %, at AI-kompetencer er nødvendige, mens 48 % oplevede, at deres undervisere hjalp dem med at udvikle kompetencerne til arbejdslivet.",
          "På en dansk uddannelse, du overvejer, kan du spørge, om AI indgår i konkrete opgaver, og hvordan underviserne hjælper dig med at vurdere svarene.",
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
    additionalSources: [{
      publisher: "OECD",
      title: "Education at a Glance 2026: Denmark",
      href: "https://www.oecd.org/en/publications/education-at-a-glance-2026_c0e523a9-en/denmark_79c3e727-en.html",
      date: "2026-09-29",
      dateLabel: "29. september 2026",
    }],
    sections: [
      {
        title: "Hvad undersøger EVA?",
        paragraphs: [
          "Halvdelen af de førsteårsstuderende, der svarede i EVA’s spørgeskemaundersøgelse, angav, at praktikken i høj grad øgede deres lyst til at arbejde som lærer. Samtidig efterlyste flere tydeligere mål for praktikken. Spørg det enkelte studiested, hvad du skal lære i den første praktik, og hvordan du får feedback.",
        ],
      },
      {
        title: "Hvad fylder i jobbet som lærer?",
        paragraphs: [
          "OECD’s landenotat gengiver svar fra TALIS 2024. Her var 71 % af de danske lærere på udskolingsniveau tilfredse med deres ansættelsesvilkår, når lønnen holdes udenfor. OECD-gennemsnittet var 68,4 %.",
          "Hvis du får mulighed for at tale med en lærer, så spørg, hvordan en almindelig uge fordeler sig mellem undervisning, forberedelse og samarbejde. Det giver dig et konkret billede af de opgaver, du kommer til at øve i praktikken.",
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

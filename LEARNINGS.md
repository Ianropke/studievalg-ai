# Læringer & Designprincipper (AI-Studievalgsplatform)

Dette dokument opsummerer de vigtigste læringer fra udviklingen af platformen, baseret på input fra Claude, ChatGPT (Senior QA/Architect review) og iterative tests.

## 1. UX & UI: "Nordisk Myndigheds-Dashboard"
- **Data > Dekoration:** Undgå emojis, tunge kasser-i-kasser, gradienter og unødigt "støj". Et rent, køligt og stramt layout udstråler autoritet og tillid.
- **Fladt Hierarki:** Brug simple indikationer som `border-l-4` i signaturfarver frem for at wrappe elementer ind i uendelige div-kasser med skygger på.
- **Mono-Fonte til Data:** Talværdier (kvotienter, AI-procenter, slider-værdier) skal altid bruge en tabulær monospaced font (fx `IBM Plex Mono`). Det gør lister letlæselige og skaber en præcis, matematisk æstetik.
- **Native SVG Geometri:** Frem for at lade store diagram-biblioteker (som Recharts eller Chart.js) sløve applikationen, kan simple radar- og trekantsgrafer tegnes perfekt og lynhurtigt med native `<svg>` og basal trigonometri, direkte baseret på props.

## 2. Redaktionelt & Sprog: Statistisk Ydmyghed
- **Estimat vs. Fakta:** Platformen bygger på forudsigelser og modelestimater. Dette *skal* afspejles i sproget. Skriv aldrig "Faktisk observeret udvikling" om en tendens fremskrevet af en model. Brug i stedet "Modelbaseret estimat" og "peger på".
- **Realistisk Præcision:** Undgå at give procenter uden kontekst. Hvis en AI-skaber påvirker en arbejdsopgave, er tallet aldrig 100% eksakt. Brug ord som "ca." og henvis synligt til kilden (fx O*NET) lige ved siden af tallet.
- **Drop stjerne-rating på statistik:** P-værdier og konfidensintervaller er komplekse mål, der ikke bør oversættes til anmeldelses-stjerner (★★★★★). Skriv "Høj (p < 0,01)" i stedet.
- **Dansk Retskrivning:** Jobtitler og programnavne skrives på dansk uden "Store Bogstaver I Hvert Ord", med undtagelse af det første ord og faste akronymer (IT, HA).
- **Kontekstuel Variabilitet:** Begrundelsestekster (whyText) skal variere matematisk og sprogligt alt efter brugerens specifikke input (snit vs. kvotient), for at undgå at virke som en copy-paste skabelon.

## 3. Teknisk Arkitektur
- **Asynkron Statisk JSON:** I stedet for at server-siderendere 1.413 komplekse datalinjer, hentes de klient-side fra en statisk JSON (`/data/all_programs_catalog.json`). Det sikrer øjeblikkelige filtre.
- **INP Optimering:** For ikke at fryse main-thread under søgning og slider-filtrering på store arrays, håndteres user-input (søgetermer og slider-værdier) via Reacts `useDeferredValue`.
- **Intelligent Synonymsøgning:** Da brugere sjældent kender de eksakte akademiske titler, har appen implementeret et synonym-lag (fx "kodning" → Datalogi, "læge" → Medicin) der via Relevance Boost placerer disse som #1 hits uden eksakt tekst-match.

## 4. QA & Testplan Standard (Enterprise & Academic Lead Level)
- **Opdeling af Dokumenter:** Adskil altid *Technical Test Plan* (verificerbare mål, testmetoder, acceptkriterier og audit trails) fra *Release Notes* (visuelle udgivelser og produktfunktioner).
- **Sporbar Evidens (Audit Trail):** Påstande om målinger (LCP, INP, Uptime, Security) skal have en direkte reference til et konkret artefakt (fx Git Commit Hash, Dataset SHA-256, Lighthouse log eller Build log ID).
- **Negativ & Edge-Case Testing:** Testplanen må aldrig kun dække "happy path". Eksplicitte scenarier for offline resiliens, korrupt JSON, script-injection (XSS), 0%/100% slider-grænser og deaktiveret JS skal dokumenteres og verificeres.
- **Videnskabelig Formulering:** Undgå absolutte påstande som "100% objektiv" eller "hallucinationsforbud". Formulér i stedet præcist (*"Eksklusion af demografiske variabler eliminerer direkte diskrimination, men udgør ikke empirisk bevis mod indirekte statistisk bias i kildedata"*).
- **Nul-Tolerance Quality Gate:** En udgivelse kræver 0 ESLint errors/warnings, 0 TypeScript fejl (`npx tsc --noEmit`) og et grønt statisk produktion-build før den deklareres produktionstjenlig.

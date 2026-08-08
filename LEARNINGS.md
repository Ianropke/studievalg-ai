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

## 5. Data QA & Domæne-Isolering (KOT-Koder vs. Geografisk By-match)
- **Undgå Geografiske Mismatches:** Filtrering af uddannelsessteder (f.eks. CBS, KU, DTU) må aldrig baseres på naive bynavne (fx `"frederiksberg"` eller `"københavn"`). By-matchning udløser alvorlige datadiskrepanser (fx at *Veterinærmedicin KU Science* placeres under *CBS*, blot fordi det ligger på Frederiksberg Campus).
- **Optagelsesdatabaser som Ground Truth:** Anvend i stedet officielle optagelses-prefixer fra **Den Danske KOT-Optagelsesdatabase**:
  - `10xxx` = Københavns Universitet (KU)
  - `13xxx` = Copenhagen Business School (CBS)
  - `14xxx` & `15xxx` = Danmarks Tekniske Universitet (DTU)
  - `16xxx` = Roskilde Universitet (RUC)
  - `17xxx`, `18xxx`, `19xxx` = Syddansk Universitet (SDU)
  - `20xxx`, `21xxx`, `22xxx` = Aarhus Universitet (AU)
  - `24xxx` = IT-Universitetet (ITU)
  - `25xxx`, `26xxx` = Aalborg Universitet (AAU)
  - `30xxx`+ / Professionsbachelorer / Erhvervsakademier = Professionshøjskoler

## 6. Interaktivitet & Dynamisk Slider Re-rangering
- **Realtids Indikation ved Karakter-Slider:** Når en bruger trækker i `Dit gymnasiale gennemsnit (Kvote 1)` slideren, opdateres kvotestatus-badges, forklarende tekster og anbefalingsrækkefølgen dynamisk via en eligibility-bonus (`meetsGpa ? +15 : 0`).
- **Jævn Rendering med `useDeferredValue`:** Ved at udskyde array-genberegningen via Reacts `useDeferredValue` holdes main-thread responsiv (INP < 16ms) under kontinuerlig slider-drag på 1.413 elementer.

## 7. Grafisk UI & Visuel Kvalitetsindikator
- **Direkte Status i Radar- og Trekantsdiagrammer:** Geometriske grafer bør ikke kræve manuel tal-aflæsning. Indbyg 50% og 100% benchmark-ringe samt dynamisk farvekodning direkte på polygon og badge:
  - 🟢 **Stærk (≥78/100)**: Grøn polygon & statusbadge (`#0F9D6E`)
  - 🔵 **Moderat (65-77/100)**: Blå polygon & statusbadge (`#2563EB`)
  - 🟡 **Lavere (<65/100)**: Amber polygon & statusbadge (`#D97706`)

## 8. Custom Domæne & Produktopsetning (uddannelsesindsigt.dk)
- **Eget Domæne Opsætning:** Domænet `uddannelsesindsigt.dk` er opsat som det primære produktionsdomæne på Vercel med `A-record` (`76.76.21.21`) og `CNAME-record` (`cname.vercel-dns.com.`) administreret via Simply.com.
- **Domæne-Konsistens på Tværs af Systemet:** Alle kanoniske URLs, `sitemap.xml`, `robots.txt` og `llms.txt` opdateres automatisk til at anvende domænet `https://uddannelsesindsigt.dk` for optimal SEO og AI-agent discoverability.

## 9. Virality & Social Sharing ("Del dit match")
- **URL Permalink Hydrering:** Direkte delingslinks anvender URL query parametre (`?gpa=9.5&wAi=80&wJob=70&wSal=60&q=...`). Hydrering af state ved sideindlæsning foretages via `requestAnimationFrame` for at undgå React 19 / Next.js 16 `react-hooks/set-state-in-effect` fnidder og unødige cascading re-renders.
- **Web Share API Integration:** Mobil-enheder (iOS/Android) åbner telefonens native delingsmenu via `navigator.share()` med direkte adgang til Instagram Stories, WhatsApp, iMessage og Messenger.
- **Visual Social Card Preview:** Delings-modalen præsenterer et mørkt, højkontrast "Social Card" preview med #1 matchtitel, score-badge, institution og nøjagtige slider-værdier.

## 10. AI-Agent Discoverability & Bot-Politik (robots.txt & llms.txt)
- **Skelnen Mellem AI-Bots:** Trænings-bots (`GPTBot`, `Google-Extended`, `CCBot`, `Bytespider`) blokeres i `robots.txt`, mens live søge- og citerings-bots (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `PerplexityBot`) eksplicit tillades.
- **Ren Tekststruktur (`/llms.txt`):** En uformel, men udbredt standard placeret i domæneroden (`/llms.txt`), der giver LLM'er et uforstyrret, støjfrit overblik over platformens formål, vigtigste sider og PEFF-metode uden JS- eller DOM-støj.

## 11. Route-Specifik Metadata Arkitektur (`layout.tsx` i undersider)
- **Undgå Delt Statisk Metadata:** En fælles metadata-konstant i `layout.tsx` medfører, at `/`, `/analyse` og `/evidens` deler samme canonical og OpenGraph-titler.
- **Dedikerede Layout-filer per Subroute:** Opret eksplicitte `layout.tsx` filer i `/analyse/` og `/evidens/` med unikke `title`, `canonical`, `og:title` og `og:url` tags for at sikre 100% præcis sociale kort og SEO-indeksering.

## 12. Pre-rendering af Statisk Initial Tilstand (Nul "Henter..." Skeletons)
- **Statisk Import af Katalog-data:** I stedet for kun at hente `all_programs_catalog.json` via client-side `fetch()` i `useEffect`, importeres kataloget direkte som statisk initial state i `page.tsx` og `evidens/page.tsx`. Dette sikrer, at Next.js SSG pre-rendereren udskriver al data i den første rå HTML-respons uden tomme loading-skeletter for søgerobotter.

## 13. CI/CD Pipeline & TypeScript Test Runner
- **npx tsx i GitHub Actions:** Da standard Node.js ikke kan fortolke `.ts`-filer direkte via `node -e`, skal GitHub CI-workflowet (`.github/workflows/ci.yml`) afvikle unit-test suiterne via `npx tsx src/__tests__/algorithm.test.ts` for 100% konsistent og grøn CI/CD validering.

## 14. v2.6 Virale Lister & Sammenligningsarkitektur
- **ItemList Schema.org for AI-Svarmaskiner:** De 7 statistiske top 10/20 listersider (`/lister/[slug]`) injecter `ItemList` og `ListItem` JSON-LD direkte i HTML-hovedet. Det gør listerne lynhurtige at hente for ChatGPT, Claude og Perplexity samt forbedrer muligheden for Google Rich Snippets.
- **Sikker String-Normalisering af Kvotienter:** Ved sortering af `latest_kvotient` (som i JSON-kataloget kan være et tal som `10.2` eller en tekst som `"Alle optaget"`), skal feltet altid eksplicit konverteres via `String(p.latest_kvotient || "")` før strengoperationer (som `.toLowerCase()` eller `.includes()`) udføres.

## 15. Systematisk Fejlanalyse & Forebyggelsesprotokol
- **Sikker Type-støbning af JSON-felter (Defensiv Kodning):** Eksterne og udtrudte JSON-felter kan have hybride typer (fx `latest_kvotient` kan være både `number` som `10.2` og `string` som `"Alle optaget"`). Udfør ALTDIG eksplicit `String(val || "")` før der kaldes strengmetoder som `.toLowerCase()`.
- **Minimal Vercel Schema v3:** Undgå forældede Vercel JSON-nøgler (`name`, `rootDirectory`) inde i `vercel.json`. Brug altid den minimalistiske v3-standard `{"framework": "nextjs"}` i repositoriets rod for at undgå CLI-skemavalideringsfejl.
- **Python / Node Hybrid Repositories:** Når et git-repo indeholder både Python-scripting (`requirements.txt`, `engine/`) og et Next.js webapp-projekt (`web/`), SKAL der ligge en `vercel.json` i repo-roden fra dag 1. Ellers gætter Vercels GitHub-integration at projektet er Python og fejler ved automatiske git push triggers.
- **Lokal Build-validering før Push:** Afvikl altid `npm run build` og `npx tsc --noEmit` lokalt i `web/` mappen før der laves git commit/push, for at fange SSG-prerender fejl med det samme.

## 16. Kanonisk Deduplicering af Top 10 Lister & Anbefalinger
- **Geografisk Mangfoldighed i Anbefalinger:** KOT-data indeholder samme uddannelse fra flere byer (fx Sygeplejerske i Vejle, Slagelse, Roskilde, København). Uden deduplicering blev lister fyldt med 5-7 geografiske varianter af samme fag.
- **Kanonisk Nøgle-normalisering (`normalizeProgramName`):** Ved at strippe geografiske og studiestart-tokens samles campus-varianter af samme uddannelse under én repræsentant, udvalgt defensivt med højeste adgangskvotient som tie-breaker.

## 17. URL Slug Arkitektur uden Titel-Duplikering
- **Undgå Dobbelte Programnavne i URLs:** Sammensætning af `${kot}-${title}-${inst}-${city}` medfører dobbelte titler i URL'en, hvis `title` i kildedata i forvejen indeholder by/institution (fx `10160-professionsbachelor-tandplejer-...-professionsbachelor-tandplejer`).
- **Ren Slug Formel:** `createProgramSlug(prog)` sammensætter udelukkende `${kot}-${title}`, hvilket giver krystalklare, SEO-venlige URLs (fx `/uddannelse/10160-professionsbachelor-tandplejer-koebenhavn-n-studiestart-sommerstart`).

## 18. Centraliseret Tekst- & Bynavn Normalisering (`textUtils.ts`)
- **Ingen Ad-hoc Formattering:** Formattering af bynavne (*København N*, *Aarhus C*, *Odense M*, *Aalborg Øst*) og jobtitler (*Sundhedsadministrativ koordinator*, *Erhvervssprog og tekstredigering*) skal samles centralt i `textUtils.ts` med regelsæt og city maps — ikke ad-hoc i visningskomponenter.
- **UI Label Beskyttelse:** Danske UI-labels (*Studiestart: sommerstart*) beskyttes mod utilsigtet engelsk oversættelse på engelsksprogede linjer.

## 19. Én Samlet, Professionel Global Footer (`Footer.tsx`)
- **Slå Duplikerede Footere Sammen:** Undgå at renderere inline `<footer>` elementer inde i undersider. Konsolidér i stedet Om-os, Transparens, Datakilder, Værktøjer og Legal disclaimers i én fælles global `<Footer />` i root `layout.tsx`.

## 20. Advanced SEO Rich Results & Schema.org Integration (`FAQPage` + `WebSite`)
- **Udvidede Google Snippets**: Injecting af `@type: FAQPage` på metodesider (`/evidens`) og `@type: WebSite` med `SearchAction` på forsiden åbner for Google Rich Results og Sitelinks Search Box.
- **Enriched Scores i Metadata**: `generateMetadata` anvender `getEnrichedScores` fremfor rå tal til meta descriptions.

## 21. Baggrundstask Management & Stream Cleanup
- **Stuck CLI Task Resolution**: Kommandoer som `npx vercel deploy` kan holde stdout-streamen åben efter at Vercel deployment er fuldført. Overvåg og afslut hængende processer defensivt med `manage_task` for at holde agentens workflow rent og støjfrit.

## 22. Flerords-bynavne & Ordbogs-Lookup (`formatCityName`)
- **Direkte Ordbogsopslag på Hele Strengen**: Naiv ordopdeling (`split(" ")`) kapitaliserede ikke andet ord i flerords-byer (fx `"Kgs. lyngby"` med lille `"l"`). `formatCityName` tjekker nu mod en fuld-streng ordbog før ord-opdeling. Det sikrer at bynavne og forkortelser som *"Kgs. Lyngby"*, *"Kongens Lyngby"*, *"Kbh. S"*, *"Kbh. N"*, *"Kbh. Ø"* og *"Kbh. NV"* altid kapitaliseres 100% korrekt.

## 23. Automatisk Adskillelse af Sammensatte Fagtitler
- **Konsistent Sætningsstruktur**: Når kildedata klistrer to titelfragmenter sammen (fx `Teknisk videnskab (civilingeniør)` og `Teknisk biomedicin`), indsætter en central sætningsregel i `formatProgramTitle` automatisk en tankestreg (` — `) mellem fragmenterne, så titlen fremstår som ét naturligt, sammenhængende fagnavn (*"Teknisk videnskab (civilingeniør) — Teknisk biomedicin"*).

## 24. Pædagogisk Campus-lokations Badging (`locationsCount`)
- **Gennemskuelig Gruppering**: Ved deduplikering af uddannelsestyper beriges det repræsentative element med `locationsCount` og `locationsList`. Recommendation Cards præsenterer herefter et pædagogisk badge (`Findes 4 steder (Aalborg, Odense, Esbjerg, +1)`), der informerer om geografiske udbud uden at fylde top 10 listen med duplikeret indhold.

## 25. Vercel Monorepo Workspace Configuration (`package.json` Workspaces)
- **NPM Workspace Root**: Ved monorepo-opsætning i Git, hvor Next.js appen ligger i en undermappe (`web/`), SKAL repositoriets rod `package.json` definere `"workspaces": ["web"]` og `"scripts": { "build": "npm run build --workspace=web" }`.
- **Lokale Lockfiles**: Der må kun eksistere én `package-lock.json` i repositoriets rod for at forhindre SWC/dep resolution-fejl i Vercel CI.

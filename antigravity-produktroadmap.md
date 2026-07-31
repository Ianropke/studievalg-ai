# Produktroadmap til Antigravity (Gemini 3.6 Flash): evolution af Uddannelsesindsigt.dk

Dette dokument bygger oven på de fem tidligere instrukser og erstatter ingen af dem:
1. `antigravity-instruks-endelig.md` — design (farver, typografi, layout, trekant-graf)
2. `antigravity-tekstinstruks.md` — sprog (hedge-sprog, jobtitler, stjerner/p-værdi)
3. `antigravity-evidens-sprogfix.md` — jargon-oprydning på Evidens-siden
4. `antigravity-seo-instruks.md` — statiske uddannelsessider, schema.org, sitemap
5. `antigravity-ai-agent-tilfojelse.md` — robots.txt og llms.txt for AI-agenter

Dette dokument tilføjer **indholdsstrukturen** til de individuelle uddannelsessider (som SEO-instruksen bad om at bygge, men ikke beskrev indholdet af) samt en prioriteret roadmap derudover. Alt heri skal overholde de allerede fastlagte design- og sprogregler — der introduceres ingen nye farver, fonte, komponentmønstre eller frameworks.

---

## 0. Grundprincip: evolution, ikke rewrite

Den eksisterende arkitektur, komponentstruktur, PEFF-model og datastrømme bevares. Målet er gradvis forbedring af informationsarkitektur og indhold — ikke et redesign. Genbrug eksisterende komponenter frem for at erstatte dem. Hver ændring skal kunne deployes selvstændigt uden at bryde eksisterende funktionalitet.

**Definition of Done** for enhver ændring under denne plan:
- Eksisterende funktionalitet er uændret, ingen regressioner.
- Lighthouse-score uændret eller forbedret; Core Web Vitals fortsat grønne.
- WCAG 2.2 AA fortsat overholdt.
- TypeScript-, ESLint- og build-checks fejlfrie.
- Ny funktionalitet dækket af tests.
- Indhold og UI konsistent med de fem tidligere instrukser (farver, typografi, sprogregler).

---

## 1. Prioritet 1 — gør uddannelsessiden til platformens centrum

Dette er selve indholdet til de statiske sider fra SEO-instruksens punkt 1 (`/uddannelse/{slug}`). Byg følgende sektioner i denne rækkefølge:

### A. Kort resume
3–5 linjer, almindeligt dansk, ingen akademisk jargon. Svarer på: hvad handler uddannelsen om, hvem passer den til, hvad arbejder man typisk med bagefter.

### B. Kort svar-boks
En fremhævet boks lige efter overskriften, læsbar på under 20 sekunder. Eksempel:
> "Kort fortalt: denne uddannelse vurderes fortsat at stå stærkt i en AI-verden, fordi arbejdet hovedsageligt bygger på analyse, samarbejde og menneskelig vurdering, mens AI primært forventes at assistere rutineopgaver."

**Ekstra:** giv denne boks sin egen `FAQPage`/`Answer`-markup (schema.org) og hold den som ét selvstændigt, citerbart afsnit — det er præcis den slags kort, præcist formulerede tekst, som AI-svarmaskiner foretrækker at citere direkte (se AI-agent-tilføjelsen). Design den visuelt som et fremhævet kort i den lette tint-baggrund fra en af de tre signaturfarver, ikke en ny farve.

### C. AI-vurdering
Den eksisterende PEFF-score bevares uændret i beregning. Præsentér score + usikkerhed + kort forklaring — **ingen** akademiske termer som første information ("95% CI", "Bayesian Fusion", "Posterior"). Disse hører hjemme under en udfoldelig "Metode"-sektion, præcis som allerede besluttet for Evidens-sidens "RAG/LLM"-sprog i tekstfix-dokumentet — samme regel, nyt sted.

Brug den eksisterende trekant-graf (stor variant, med akse-labels) som den visuelle kerne i dette afsnit.

### D. Hvorfor denne vurdering?
Platformens vigtigste sektion. Forklar i almindeligt sprog: hvilke opgaver påvirkes mest, hvilke bliver assisteret, hvilke kræver fortsat mennesker, hvilke datakilder vejer tungest, hvor stor usikkerheden er, og hvad der kan ændre vurderingen fremover. Genbrug vægt-badge-mønsteret fra evidens-fixet (Niveau 1/2/3 med tydelig vægtangivelse), så brugeren kan se hvor meget af *denne konkrete uddannelses* score der hviler på hårde tal versus AI-fortolkning.

### E. Dataoverblik
Kompakt faktaboks: adgangskvotient, medianløn, ledighed, varighed, universitet, AI-vurdering, seneste dataopdatering. Brug mono-font til alle tal (etableret regel). Vis datoen for seneste opdatering tydeligt — samme mønster som "Seneste Optagelsesdata 26. juli 2026" på forsiden; det er både en tillidssignal til brugeren og et friskheds-signal til AI-agenter og Google.

### F. Hvem passer uddannelsen til?
Kort liste med typiske interesser/evner ("God hvis du kan lide: problemløsning, mennesker, matematik...").

**Ekstra:** gør punkterne klikbare, så et klik justerer vægtfaktorerne i hovedværktøjet og sender brugeren derhen — det kobler indholdssiden direkte til matchværktøjet uden at bygge ny logik, kun et link med forududfyldte parametre.

### G. Lignende uddannelser
4–6 relaterede uddannelser, genereret automatisk.

**Ekstra, udnytter noget I allerede har bygget:** ranger "lignende" efter afstand mellem trekant-profilerne (kort geometrisk afstand mellem de tre score-punkter), ikke kun samme fagområde. Det gør anbefalingen personlig og datadrevet — og det er reelt gratis at beregne, da I allerede har de tre tal for hver uddannelse. Det er en oplagt "kun os"-detalje, der adskiller platformen fra en simpel fag-kategori-liste.

---

## 2. Prioritet 2 — Sammenligning

Udbyg eksisterende datastruktur, ingen ny backend. Mulighed for at sammenligne 2–3 uddannelser side om side (AI, løn, ledighed, kvotient, varighed, kompetencer, typiske job, forklaringer). Genbrug den overlappende trekant-graf, der allerede er specificeret til analyse-siden i designinstruksen.

## 3. Prioritet 3 — Toplister som statiske SEO-sider

Selvstændige, statisk genererede sider: Top 100 AI-vurderede uddannelser, Top 100 højeste løn, Top 100 laveste ledighed, bedste kombination, største fremgang/tilbagegang. Dette er en direkte udvidelse af SEO-instruksens sitemap-punkt — føj dem til sitemap.xml og internt link fra AI Insights-siden, som allerede anbefalet.

## 4. Prioritet 4 — Kompetenceunivers

Udnyt eksisterende ESCO- og O*NET-data (allerede en del af Evidens-lag 3). Lad brugeren søge på konkrete kompetencer (Python, projektledelse, statistik osv.) og se hvilke uddannelser, job og kompetencer der overlapper.

## 5. Prioritet 5 — Karriereveje

Simpel visning: uddannelse → første job → specialiseringer → senere karriere. Kun dokumenterede karriereveje, ingen avancerede prognoser. Laveste prioritet — byg først når 1–4 er på plads og stabile.

---

## 6. AI Insights — udbygning, ikke omskrivning

Bevar eksisterende analysesektion. Udbyg gradvist med historiske grafer, udvikling, event-study og kontrafaktiske scenarier. Alle analyser skal fortsat tydeligt adskille observerede data, modelestimater og hypoteser — samme hedge-sprogsregel som allerede indført (se tekstinstruksen: "modelbaseret estimat" i stedet for "faktisk observeret").

---

## 7. Sprog og målgruppe

Skrives til unge mellem ca. 17 og 25 år: korte afsnit, aktivt sprog, almindelige ord, forklaringer frem for fagudtryk. Akademiske begreber skal altid kunne foldes ud under "Læs mere" — aldrig stå som første information. Dette er samme princip som allerede fastlagt for Evidens-siden, nu gjort til en gennemgående regel for hele platformen.

---

## 8. Design — ingen ændringer i forhold til det etablerede

Behold den nordiske stil fra designinstruksen: ingen gradienter, ingen store animationer, ingen unødvendige effekter. Nye visuelle elementer tilføjes kun, hvis de forbedrer forståelsen — fx den klikbare "Hvem passer uddannelsen til?"-liste ovenfor er en funktionel tilføjelse, ikke en dekorativ. Designet skal fortsat signalere myndighed, ro, troværdighed og gennemsigtighed.

---

## 9. Teknisk strategi

- Genbrug eksisterende komponenter, undgå dublering af logik.
- Udbyg eksisterende hooks/mønstre frem for at introducere nye.
- PEFF forbliver den centrale beregningsmotor — ingen ny scoringslogik.
- Hold dataflow entydigt og modulært.
- Nye features skal kunne feature-flages og deployes uafhængigt af hinanden.

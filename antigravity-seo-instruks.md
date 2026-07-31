# SEO-instruks til Antigravity: AI-Studievalgsplatform

Stack: Next.js på Vercel. Det ændrer ikke SEO-grundprincipperne, men det betyder at den største og mest værdifulde SEO-gevinst er en teknisk arkitekturbeslutning, ikke tekst-finpudsning — se punkt 1 først.

---

## 1. Det vigtigste: gør hver af de 1.413 uddannelser til sin egen indekserbare side

Lige nu er hele værktøjet formentlig én client-side-rendered side, hvor listen af uddannelser opdateres, når man trækker i sliderne. Det betyder, at Google reelt kun ser **én** side — ikke 1.413 potentielle indgange fra søgning.

**Byg i stedet en statisk/SSG-side pr. uddannelse**, fx:
```
/uddannelse/laegemiddelvidenskab-kobenhavn
/uddannelse/medicin-odense-m-sommerstart
/uddannelse/klinisk-tandtekniker-aarhus-c
```
Brug Next.js' `generateStaticParams` (App Router) til at generere alle 1.413 sider ved build, med Incremental Static Regeneration så nye KOT-tal (fx efter 26. juli-optaget) opdaterer siderne uden fuld redeploy.

**Hver side skal indeholde unikt indhold**, ikke bare et udsnit af det generelle værktøj:
- Uddannelsesnavn, KOT-nummer, seneste adgangskvotient (Kvote 1 og evt. Kvote 2)
- De tre kernescorer (AI-robusthed, jobmuligheder, lønpotentiale) med den individualiserede begrundelsestekst (se tidligere tekstinstruks)
- Et link tilbage til hovedværktøjet ("Se hvor godt den matcher dine egne prioriteter")

Dette er den samme model som Boliga eller Jobindex bruger til at ranke på tusindvis af long-tail-søgninger — det er sandsynligvis jeres største enkeltstående SEO-mulighed, fordi I i forvejen sidder på strukturerede data, som konkurrenterne ikke nødvendigvis har i samme detaljegrad.

---

## 2. Metadata pr. side

Hver uddannelsesside skal have unikke, dynamisk genererede:

```
<title>{Uddannelse} — Adgangskvotient {år}, AI-robusthed & jobudsigter | Studievalg</title>
<meta name="description" content="{Uddannelse} i {by}: Kvote 1-kvotient {tal} ({år}). AI-robusthedsscore {score}/100, jobmuligheder {score}/100. Se fuld analyse og sammenlign med dine egne prioriteter." />
<link rel="canonical" href="https://[domæne]/uddannelse/{slug}" />
```

Undgå generiske titler som "Studievalg AI" på alle sider — det er det, forsiden allerede har, og duplikeret titel-tag på tværs af 1.413 sider skader mere end det hjælper.

---

## 3. Struktureret data (schema.org)

- **Uddannelsessider:** `EducationalOccupationalProgram` eller `Course`, med felter for `provider` (universitetet), og gerne et `aggregateRating`-lignende felt hvis I har en objektiv metrik (brug ikke stjerner her heller — samme princip som i tekstinstruksen).
- **Evidens-siden:** `FAQPage` markup på de spørgsmål/svar-lignende sektioner ("Hvorfor er denne side her?" osv.) — giver mulighed for rich results i Google.
- **Forsiden/organisation:** `Organization` eller `WebSite` med `SearchAction` hvis søgefeltet skal kunne trigge Google Sitelinks Search Box.
- Valider alt med Google's Rich Results Test før launch.

---

## 4. Sitemap og indeksering

- Generér `sitemap.xml` dynamisk, der inkluderer alle 1.413 uddannelsessider + hovedsiderne (Studievalg, AI Insights, PEFF Evidens).
- `robots.txt` skal tillade indeksering af `/uddannelse/*`, men kan blokere evt. interne API-routes eller debug-ruter.
- Indsend sitemap til Google Search Console efter launch, og tjek dækningsrapporten løbende for at se om alle 1.413 sider rent faktisk bliver indekseret (Google indekserer ikke nødvendigvis alt på en ny, stor site med det samme — "Discovered, currently not indexed" er normalt de første uger).

---

## 5. Performance (Core Web Vitals)

Værktøjet er interaktivt og datatungt, hvilket let går ud over LCP/CLS hvis det ikke håndteres bevidst:

- Brug `next/font` til Space Grotesk / IBM Plex Sans / IBM Plex Mono, så fontindlæsning ikke forårsager layout-shift (CLS).
- De ti anbefalingskort på forsiden bør have en fast/reserveret højde, før data er indlæst, så trekant-grafik og tal ikke "popper ind" og flytter layoutet.
- Lazy-load det, der er under skærmkanten (fx graferne længere nede på AI Insights-siden), så første indlæsning (LCP) ikke ventes på alt indhold.
- Vercel Analytics/Speed Insights bør slås til, så I kan følge reelle Core Web Vitals-tal fra rigtige besøgende, ikke kun lab-data.

---

## 6. Nøgleordsstrategi (dansk søgeadfærd)

Byg titler/tekst omkring de faktiske termer, danske gymnasieelever søger på, ikke kun jeres egne interne begreber:

| Intern term | Faktisk søgt term at inkludere |
|---|---|
| "Kvote 1 adgangskvotient" | "adgangskvotient {år}", "kvote 2 krav" |
| "AI-robusthed" | "hvilke uddannelser er sikre mod AI", "AI og fremtidens job" |
| "Match" | "hvilken uddannelse skal jeg vælge", "uddannelsestest" |
| "PEFF Evidens" | (kun intern — indgår ikke i søgesprog, hold det ude af sidetitler) |

Overvej også en let content-sektion (fx "Guide: sådan beregnes adgangskvotienter i {år}") som fanger informationssøgende trafik og linker videre ind i selve værktøjet — det er en klassisk model for at opbygge autoritet omkring et data-værktøj som dette.

---

## 7. Interne links

- Fra AI Insights' ranglister ("AI-vindere"/"AI-udsatte") skal hvert uddannelsesnavn linke direkte til dens egen uddannelsesside (punkt 1) — det skaber både bedre brugeroplevelse og intern linkjuice til de 1.413 sider.
- Fra hver uddannelsesside: link tilbage til forsidens værktøj med uddannelsen forudvalgt, så brugeren kan sammenligne med egne prioriteter uden at skulle søge forfra.

---

## 8. Tjekliste før launch

- [ ] Alle 1.413 uddannelser har egen statisk/ISR-genereret side med unikt indhold
- [ ] Unikke title/description pr. side, ingen duplikater
- [ ] Sitemap.xml genereret og indsendt til Search Console
- [ ] robots.txt tillader indeksering af de rigtige ruter
- [ ] Schema.org markup valideret
- [ ] Core Web Vitals målt via Vercel Speed Insights eller PageSpeed Insights, ikke kun antaget
- [ ] Interne links mellem Insights-ranglister og uddannelsessider på plads

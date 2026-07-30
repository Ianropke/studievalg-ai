# Tekstinstruks til Antigravity: sprog og formuleringer

Supplement til designbriefet — denne omhandler kun tekst og formuleringer, ikke visuel stil. Formålet er at bringe sprogets sikkerhedsgrad ned på niveau med det, dataene faktisk understøtter, uden at det bliver mindre overbevisende.

---

## 0. Overordnet princip

Platformen er allerede god til at hedge korrekt de steder, hvor metodikken forklares (Evidens-siden, vægtningsregler, tidsforældelse osv.). Problemet er, at den samme ydmyghed ikke altid følger med, når resultaterne præsenteres på forsiden og Insights-siden — der bliver skøn og modelestimater nogle steder formuleret som observerede kendsgerninger. Gennemgå al resultat-tekst og spørg: "er dette en måling, eller er det et modelestimat?" — og lad formuleringen afspejle svaret.

---

## 1. Konkrete tekstrettelser

### 1.1 Evidens-siden, hero-tekst

**Nuværende:**
> "Det betyder, at vi samler og vægter over 42 uafhængige datakilder — fra Danmarks Statistik og UFM til OECD, MIT og Harvard-forskning — for at give dig et sandfærdigt og gennemskueligt billede af din fremtid."

**Ny:**
> "Det betyder, at vi samler og vægter over 42 uafhængige datakilder — fra Danmarks Statistik og UFM til OECD, MIT og Harvard-forskning — for at give dig et mere nuanceret og gennemsigtigt grundlag at træffe dit valg på."

**Hvorfor:** "sandfærdigt billede af din fremtid" er et løfte om forudsigelse, som ingen datamodel kan indfri. "Et grundlag at træffe dit valg på" bevarer styrken i budskabet (mange kilder, gennemsigtig metode) uden at hæve et løfte, produktet ikke kan honorere.

### 1.2 AI Insights, signaturanalyse

**Nuværende:**
> "Faktisk observeret udvikling: Efter lanceringen af ChatGPT i slutningen af 2022 har vi set et markant fald på ca. 8,9% i ansøgninger til skrive- og tekstprægede fag, hvorimod fysiske og menneskenære fag (fx Odontologi og Medicin) har oplevet øget søgning."

**Ny:**
> "Modelbaseret estimat: Sammenlignet med en kontrafaktisk fremskrivning (hvad ansøgertallet formentlig ville have været uden ChatGPT) peger data på et fald på ca. 8,9% i ansøgninger til skrive- og tekstprægede fag efter udgangen af 2022, mens fysiske og menneskenære fag (fx Odontologi og Medicin) har oplevet øget søgning i samme periode."

**Hvorfor:** overskriften "Faktisk observeret udvikling" og "har vi set" beskriver et modelestimat (kontrafaktisk sammenligning) som en direkte måling. Selve tallet (8,9%) kan sagtens være retvisende — det er kun *rammesætningen* der skal ændres, ikke metoden bag.

### 1.3 Samme sted, resultatboks

**Nuværende:**
> "Estimeret søgningsdivergens: −8,9% på AI-udsatte fag
> Statistisk evidens: ★★★★★ (p < 0,01)"

**Ny:**
> "Estimeret søgningsdivergens: −8,9% på AI-udsatte fag
> Statistisk sikkerhed: Høj (p < 0,01)"

**Hvorfor:** stjerner signalerer en uformel anmeldelses-skala ("5 ud af 5"), mens en p-værdi er en præcis statistisk størrelse. Sammen giver de indtryk af en enkel, absolut sikkerhed, som en p-værdi ikke i sig selv udtrykker. Behold p-værdien til de læsere, der forstår den, men drop stjernerne — brug i stedet et kvalitativt ord ("Høj"/"Moderat") hvis I vil have en hurtig visuel indikator.

### 1.4 AI-termometeret, Radiolog/Læge-eksempel

**Nuværende:**
> "AI analyserer scanninger med høj præcision, hvornår lægen træffer den endelige beslutning og varetager patientkontakten."

**Ny:**
> "AI analyserer scanninger med høj præcision, mens lægen fortsat træffer den endelige beslutning og varetager patientkontakten."

**Hvorfor:** "hvornår" er sandsynligvis en fejlskrivning for "mens"/"hvorimod" — som det står nu, betyder sætningen grammatisk noget andet end det tydeligvis er ment ("på hvilket tidspunkt", ikke "samtidig med at"). Ren korrektur, ikke en indholdsændring.

### 1.5 Samme sted, opgavepunkter

**Nuværende:**
> "MR- og CT-billedsegmentering (AI) — 95% AI
> Anomalidetektion i røntgenbilleder (AI) — 90% AI
> Patientkonsultation og diagnoseformidling — 20% AI
> Klinisk biopsi og kirurgisk indgreb — 5% AI"
> (samlet: "90% AI-STØTTE I HVERDAGEN")

**Ny:** tilføj "ca." foran hvert procenttal, eller — bedre — tilføj en lille kildehenvisning direkte ved siden af det samlede tal, fx:
> "~90% AI-støtte i hverdagen · Baseret på O*NET-opgavedata, se metode"

**Hvorfor:** enkeltprocenter ned til procentpoint ("95%", "90%", "20%", "5%") for en hel arbejdsopgave-kategori fremstår mere præcist målt, end en opgavekortlægning realistisk kan være. Et "ca." eller en synlig kilde pr. tal (ikke kun én fælles kildehenvisning øverst i sektionen) gør præcisionsniveauet mere ærligt uden at svække pointen.

---

## 2. Individualiseret begrundelsestekst på anbefalingskort

Genbrug ikke samme sætning på tværs af kort. Byg teksten dynamisk af korttets egne værdier — her er tre eksempler på output, der bør se forskellige ud selvom det er "samme type" begrundelse:

**Kort med opfyldt kvote 1, høj AI-robusthed:**
> "Med et snit på 9.5 er du sikkert inde på {uddannelse}s Kvote 1-krav på 10.2. AI-robustheden er høj (88/100), og feltet har historisk stabil efterspørgsel."

**Kort med kvote 2-anbefaling:**
> "Kvote 1-kvotienten var senest 10.5 — med et snit på 9.5 anbefales ansøgning via Kvote 2. AI-robustheden er høj (88/100), så uddannelsen vurderes fortsat sikker på længere sigt."

**Kort med lavere AI-robusthed (til variation, selvom ikke i top 10 lige nu):**
> "{Uddannelse} har en mere moderat AI-robusthedsscore (fx 60/100) — det betyder større usikkerhed om hvordan feltet udvikler sig, men jobmulighederne er fortsat stærke (95/100)."

**Regel:** kvote-tal, uddannelsesnavn og den konkrete sammenligning med brugerens eget snit skal *altid* variere efter det faktiske kort. Kun den afsluttende kvalitative vurdering ("høj"/"moderat"/"stabil") må genbruges mellem kort med samme underliggende score.

---

## 3. Dansk stort/småt bogstav i overskrifter og titler

Flere jobtitler og fagnavne er skrevet med Stort Forbogstav I Hvert Ord (engelsk konvention), hvor dansk retskrivning kun bruger stort forbogstav på det første ord og egennavne:

| Nuværende | Ny |
|---|---|
| Sundhedsadministrativ Koordinator | Sundhedsadministrativ koordinator |
| Erhvervssprog og Tekstredigering | Erhvervssprog og tekstredigering |

Gennemgå alle jobtitler, fagnavne og sektionsoverskrifter på tværs af siderne for samme mønster, og ret konsekvent til dansk normalisering (kun første bogstav stort, medmindre det er et egennavn).

---

## 4. Label-omdøbning

**Nuværende:** "Trekant-profil" (label under grafikken på hvert kort)
**Ny:** "Din matchprofil"

**Hvorfor:** "Trekant-profil" beskriver grafikkens form, ikke hvad den betyder for brugeren. "Din matchprofil" er det brugeren rent faktisk vil forstå den som.

---

## 5. Juridisk forbehold — tilføjelse

Det nuværende forbehold forklarer korrekt, at platformen er uafhængig, og at officiel ansøgning sker via Optagelse.dk. Tilføj en sætning, der eksplicit anbefaler at inddrage en studievejleder i selve valget — ikke kun i ansøgningsprocessen — så platformen positionerer sig som ét input blandt flere, frem for et facit:

> "Vi anbefaler desuden at tale med en studievejleder om dit konkrete valg — denne platform er ét godt input blandt flere, ikke en erstatning for personlig vejledning."

---

## 6. Generel korrekturtjekliste til Antigravity

- Søg efter alle steder, hvor et modelestimat, en fremskrivning eller et kontrafaktisk scenarie er formuleret som en direkte observation ("vi har set", "det viser sig", "faktisk udvikling") — omformulér til estimat-sprog ("peger på", "estimeret", "ifølge modellen").
- Søg efter stjerne-skalaer kombineret med statistiske mål (p-værdier, konfidensintervaller) og fjern stjernerne, behold tallet.
- Søg efter enkeltprocenter uden kildehenvisning i umiddelbar nærhed, og tilføj enten "ca." eller en lokal kildehenvisning.
- Søg efter Stort Forbogstav I Hvert Ord i titler/overskrifter og normalisér til dansk retskrivning.

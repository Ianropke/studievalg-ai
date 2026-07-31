# Instruks til Antigravity: bekræftede fund fra live-gennemgang af uddannelsesindsigt.dk

## 1. Kritisk: verificér og ret side-specifik metadata (højeste prioritet)

Ved hentning af `/`, `/evidens` og `/analyse` var `canonical`, `og:title` og `og:url` identiske på tværs af alle tre sider — alle pegede på forsidens værdier.

- **Tjek:** brug Next.js' `generateMetadata` (App Router) pr. route, så hver side får sin egen `canonical`, `og:title`, `og:description` og `og:url` baseret på faktisk sideindhold, ikke en delt/statisk konstant.
- Dette er særligt kritisk for de kommende 1.413 uddannelsessider (SEO-instruksens punkt 1) og for "del dit match"-knappen (vækstplanens punkt 1) — begge dele forudsætter at hver URL har sin egen metadata. Uden det virker deling og indeksering af undersider slet ikke som tiltænkt.
- Test med Facebook Sharing Debugger og Twitter Card Validator på mindst tre forskellige URL'er efter rettelsen, for at bekræfte at de rent faktisk viser forskelligt indhold.

## 2. Server-rendér det indhold, der lige nu vises som "Henter..."

Bekræftet på flere sider i den rå HTML:
- Forsidens anbefalingsliste: "Henter... / Downloader nyeste optagelsesdata..."
- Evidens-siden: "Datapunkter: 0" og "Seneste Opdatering: Henter..."
- Analyse-siden, duelvælgeren: "Uddannelse A: Henter data..." / "Uddannelse B: Henter data..."

Undersøg om dette er (a) en reel fejl i dataflowet, hvor tallene rent faktisk fejler, eller (b) indhold der udelukkende hentes client-side efter sideindlæsning og derfor er usynligt for crawlere uden JavaScript. Uanset årsag: flyt denne datahentning til server-side rendering eller static generation (samme løsning som allerede besluttet for de 1.413 uddannelsessider i SEO-instruksen), så det faktiske indhold er til stede i den første HTML-respons — ikke kun en loading-skeleton.

## 3. Stadig ikke rettet: dansk stort/småt bogstav i jobtitler

Følgende optræder stadig med Stort Forbogstav I Hvert Ord på Analyse-siden:
- "Sundhedsadministrativ Koordinator" → "Sundhedsadministrativ koordinator"
- "Erhvervssprog & Tekstredigering" → "Erhvervssprog og tekstredigering"

Dette er tredje gang punktet nævnes — lav i stedet et globalt søg-og-erstat gennem hele kodebasen/datasættet for dette mønster, fremfor at rette enkeltstående forekomster, så det ikke dukker op et fjerde sted.

## 4. Lille inkonsistens: signaturanalysens label modsiger sit eget indhold

**Nuværende:**
> "Faktisk udvikling (Med AI): Sammenlignet med en kontrafaktisk fremskrivning... peger data på et fald på ca. 8,9%..."

Label'et "Faktisk udvikling" (Med AI) modsiger den hedge-sprogede sætning lige efter. Ret label til noget i stil med:
> "Modelbaseret sammenligning (med vs. uden AI): Sammenlignet med en kontrafaktisk fremskrivning..."

## 5. Bekræft ægtheden af RAG-eksempel-citaterne

De to eksempel-citater under "Eksempler på udtrukne citater via RAG" på Evidens-siden (Odontologi-citatet og CBS-citatet, hver med "Score Impact") skal være reelt udtrukket af systemet, ikke illustrative pladsholdere fremstillet som ægte fund. Hvis de er illustrative, markér dem tydeligt som eksempler ("Sådan kunne et udtræk se ud"), ellers underminerer det arbejdet med at holde platformens sprog ærligt og ikke-overdrevet sikkert.

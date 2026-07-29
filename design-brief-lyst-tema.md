# Design-brief v3: AI-Studievalgsplatform — Lyst tema

Formål: omdanne platformen fra "AI-genereret standard" til et stramt, troværdigt data-værktøj i stil med en officiel statistikportal — men med jeres eget signaturtræk: den grønne/blå/lilla treakse-vurdering (AI-robusthed / Jobmuligheder / Lønpotentiale).

Undgå de tre AI-designdefaults: (1) varm cremefarvet baggrund + terracotta-accent, (2) næsten-sort + én neonaccent, (3) avis-layout med skarpe hjørner og tynde streger overalt. Denne brief går bevidst en fjerde vej: **lys, kølig, "nordisk myndigheds-dashboard"** — fordi indholdet reelt er registerdata fra UFM og Danmarks Statistik, og designet bør signalere præcis den slags nøgternhed.

---

## 0. Ryd op først

- Fjern den røde **"1 Issue"**-widget fastgjort i venstre side på alle sider — det ligner et debug/dev-overlay (muligvis fra en byggeproces eller et tilføjet script) og bør ikke være synligt i produktion.
- Gennemgå om der er andre glemte debug-elementer samme sted.

---

## 1. Farvesystem

### Baggrunde og neutraler (kold gråtone, ikke varm cremefarve)

| Rolle | Hex | Brug |
|---|---|---|
| Sideb baggrund | `#F7F8FA` | Body/page background |
| Kort/overflade | `#FFFFFF` | Alle kort, paneler, dropdowns |
| Kort-hover | `#FBFBFD` + let skygge | Hover-tilstand på klikbare kort |
| Kant, svag | `#E7E9EF` | Adskillelse mellem sektioner/rækker |
| Kant, standard | `#D8DBE4` | Input-felter, aktive kort-kanter |
| Tekst, primær | `#12172B` | Overskrifter, brødtekst — kontrast 17.75:1 mod hvid |
| Tekst, sekundær | `#545D71` | Metadata, hjælpetekst — kontrast 6.60:1 mod hvid |
| Tekst, tertiær/placeholder | `#8891A3` | Placeholder, deaktiveret tekst |

### Signaturfarver — kun til de tre kernemetrics

Dette er jeres faktiske identitet. Brug **aldrig** disse farver til andet i UI'et (ikke badges, ikke links, ikke dekorative streger) — så bevarer de betydning, når brugeren ser dem.

| Metric | Grafik/store elementer | Tekst/ikon (skal have ≥4.5:1) | Tint-baggrund (chips/badges) |
|---|---|---|---|
| 🟢 AI-robusthed | `#0F9D6E` (kontrast 3.46:1 — kun til bjælker, radar-fyld, store tal ≥24px bold) | `#0B7A57` (kontrast 5.34:1 — brug denne til almindelig brødtekst-størrelse) | `#E3F6EE` |
| 🔵 Jobmuligheder | `#2563EB` (kontrast 5.17:1 — sikker til både tekst og grafik) | `#1D4ED8` | `#E7EEFE` |
| 🟣 Lønpotentiale | `#7C3AED` (kontrast 5.70:1 — sikker til både tekst og grafik) | `#6D28D9` (kontrast 7.10:1) | `#F1E9FE` |
| 🟠 Advarsel (fx "Søg Kvote 2") | `#B45309` (kontrast 5.02:1) | samme | `#FDF1E3` |

**Vigtig regel:** grøn (`#0F9D6E`) er den eneste af de fire, der falder under 4.5:1 — brug den kun til brede bjælker, ikoner og store bold-tal. Til løbende tekst (fx "88/100 · Meget robust" i normal vægt) skal I bruge den mørkere `#0B7A57`.

**Semantisk disciplin:** ingen femte accentfarve må introduceres. Hvis der opstår behov for en ny status (fx "høj AI-eksponering" på Insights-siden), genbrug advarselsfarven `#B45309` frem for at tilføje rød eller pink — I skal kunne tælle jeres accentfarver på én hånd.

---

## 2. Typografi

Brug én familie til display + brødtekst, og dens matchende mono-variant til tal — det giver en "ingeniør-præcision"-fornemmelse der passer til et datatungt produkt, uden at det bliver endnu en generisk Inter-side.

- **Display (H1, H2, store tal):** Space Grotesk, vægt 600–700
- **Brødtekst/UI:** IBM Plex Sans, vægt 400 (tekst), 500 (labels/knapper)
- **Tal, scores, kvotienter, KOT-numre:** IBM Plex Mono, vægt 500 — konsekvent på *alle* tal på siden, så øjet lærer "mono = data, du kan stole på"

### Typeskala

| Element | Font | Str./linjehøjde | Vægt | Note |
|---|---|---|---|---|
| H1 (hero) | Space Grotesk | 52px / 1.08 | 600 | Ingen gradient-tekst — se afsnit 6 |
| H2 (sektion) | Space Grotesk | 30px / 1.15 | 600 | |
| H3 (kort-titel) | IBM Plex Sans | 19px / 1.3 | 600 | |
| Eyebrow-label (fx "FORMÅL OG KONCEPT") | IBM Plex Sans | 12px, +0.06em tracking | 600, UPPERCASE | Farve: `#545D71`, ikke neon |
| Brødtekst | IBM Plex Sans | 16px / 1.6 | 400 | |
| Meta/småtekst | IBM Plex Sans | 13px / 1.4 | 500 | |
| Data/tal | IBM Plex Mono | matcher konteksten | 500 | |

---

## 3. Ikonografi

Erstat samtlige emoji (🎯🏛️⚙️🔍🏆✂️🩺💡) med **ét** konsekvent SVG-ikonsæt — fx Lucide eller Phosphor (line-style, 1.5px stroke). Ikoner er som udgangspunkt `#545D71` (neutral); de får kun farve, når de repræsenterer én af de tre kernemetrics eller advarselsstatus, og skal så bruge farverne fra afsnit 1.

---

## 4. Spacing & grid

- Basisenhed: 8px. Kortpadding: 24px. Afstand mellem kort i en liste: 16px. Afstand mellem sektioner: 64–80px.
- Ét fladt kortlag — **ingen kort-i-kort.** Nuværende design har mørke bokse med farvede bokse indeni igen (tydeligst på Evidens-siden). I det lyse tema: hvide kort på grå sidebaggrund, adskilt af luft og evt. en 1px kant (`#E7E9EF`), aldrig en ny baggrundsfarve indeni.
- Hjørneradius: 12px på kort, 8px på badges/pills, 999px (fuld runding) kun på status-pills og knapper. Konsekvent gennem hele siden.
- Skygge i stedet for mørke kanter til at signalere hierarki: `0 1px 2px rgba(18,23,43,0.04), 0 4px 12px rgba(18,23,43,0.04)` som standardkort-skygge; øget ved hover.

---

## 5. Signaturelement: trekant-graf

Byg en lille radar/trekant-visualisering med tre akser (AI / Job / Løn) der erstatter de tre separate bjælker på hvert anbefalingskort. Dette er jeres eneste rigtige unikke visuelle aktiv — brug den overalt hvor tre-metric-scoren vises:

- **Kort (kompakt, 64–80px):** simpel udfyldt trekant, ét datapunkt, ingen labels — kun til hurtigt genkendelige mønstre i en liste.
- **Detaljevisning/sammenligning (stor, 200px+):** fuld radar med aksetekst, gridlines i `#E7E9EF`, udfyldt polygon med 15% opacity af metricens farve + 2px stroke i fuld farve, prikker i hjørnerne.
- Til "Sammenlign to uddannelser side om side" (analyse-siden): to overlappende, semi-transparente polygoner (fx uddannelse A i blå stroke, B i lilla stroke) i samme graf — det gør sammenligningen langt mere øjeblikkelig end den nuværende tabel.

---

## 6. Sidespecifik gennemgang

### Forsiden (Studievalg)
- H1: drop gradient-tekst-effekten på "AI-robust eller udsat" — det er et af de mest genkendelige AI-genereret-design-tegn lige nu. Brug i stedet fast `#12172B`, og fremhæv evt. ét nøgleord med understregning i en af signaturfarverne (tynd, 3px, ikke baggrundsfarve).
- Slider-panel: hvidt kort, spor i `#E7E9EF`, udfyldt del i respektive metricfarve, håndtag som hvid cirkel med farvet ring + skygge.
- Universitets-pills ("Alle", "KU", "DTU"...): neutral outline som standard, aktiv pill = fyldt `#12172B` med hvid tekst — ikke en fjerde accentfarve.
- **De 10 anbefalingskort:** i dag identiske i layout og delvist i tekst. Ret ved at:
  - Gøre #1-match visuelt større/fremhævet (bredere kort, evt. let baggrundstint i grøn tint-farve `#E3F6EE`)
  - Erstatte de tre bjælker med den kompakte trekant-graf
  - Generere individuel begrundelsestekst pr. uddannelse — indsæt konkrete tal ("Med et gennemsnit på 9.5 er du sikkert inde på Kvote 1-kravet 7.3") i stedet for identisk boilerplate
  - Kvote-status som pill: grøn tint ("Alle optaget") eller amber tint ("Søg Kvote 2")
  - CTA "Se fuld analyse" som tekst-link med pil, ikke en tung outline-knap gentaget 10 gange

### Evidens-siden
- De tre nummererede kort under "Hvorfor er denne side her" (1/2/3) — behold nummerering, det er reelt en sekvens, så det er en velbegrundet brug (modsat vilkårlig 01/02/03-pynt).
- **"De tre evidenslag A/B/C":** i dag tre farvede bokse indeni én stor mørk boks. I lyst tema: flad liste på hvid baggrund, hvert lag adskilt af en tynd linje og markeret med en 3px farvet venstrekant (grøn/blå/lilla) i stedet for fuld baggrundsfarve. Vægt-badge ("Højeste vægt") som lille mono-tag til højre, neutral grå med farvet tekst.
- "Tre smarte regler"-kortene: samme fladdesign, ikon i neutral grå.
- Interaktivt evidens-eksempel (citat + kilde): citatet i letkursiveret IBM Plex Sans, kildehenvisning som lille meta-linje med to kolonner (kilde / evidensvægt), evidensvægt som farvet tag.
- "Vis akademiske formler og LOSO": behold som collapsible, men style knappen neutralt (outline, ikke fyldt farve) — det er sekundær funktionalitet.

### AI Insights-siden
- Størst oprydningsbehov: i dag har hvert panel sin egen farvede baggrund (grøn-tonet boks, orange-tonet boks osv.), hvilket skaber den "julebelysning"-effekt. Ret: **alle paneler får samme neutrale hvide baggrund** — farve forbeholdes udelukkende data i graferne og tal.
- Linjegraf ("Ansøgerindeks"): gridlines i `#E7E9EF`, faktisk-linje i `#12172B` eller blå, kontrafaktisk linje stiplet i `#8891A3`. Annotationsmarkør ("2022: ChatGPT-lancering") som lodret stiplet linje + lille label-chip, ikke en farvet baggrundsboks.
- "Tidsmaskine"-slider: samme sliderstil som forsiden, for genkendelighed på tværs af platformen.
- Ranglister ("AI-vindere" / "AI-udsatte"): to neutrale kolonner, rangnummer i mono, procent i grøn (robust) hhv. amber (eksponeret) — **ikke** rød, hold jer til de fire definerede semantiske farver.
- "Sammenlign to uddannelser": en ren tabel med hårfine rækkeadskillere og meget svag zebra-striping (`#FAFBFC`), afvigende værdier fremhævet med bold — suppler evt. med trekant-graf-overlay som nævnt i afsnit 5, det vil gøre denne sektion markant stærkere end tabellen alene.

### Header/navigation (alle sider)
- Logomærke "S": behold som farvet badge, men i én fast farve (fx `#12172B` med hvid "S", eller den grønne signaturfarve) — ikke en gradient.
- Aktiv nav-item: understregning eller tekstfarve i `#12172B`, ikke neon-grøn glow.

---

## 7. Bevægelse

- Sideindlæsning: blød fade-up på hero og kort, forskudt 60–80ms pr. element — ét orkestreret øjeblik, ikke spredte effekter.
- Slider-træk: liste re-sorterer med blød reflow-animation (200–250ms ease-out).
- Kort-hover: 2px løft + skyggeforstærkning, intet farveskift på selve kortet.
- Undgå pulserende/skinnende "AI-loading"-effekter — de er en af de tydeligste kendetegn ved skabelonagtigt AI-design.

---

## 8. Tilgængelighed — tjekliste

- Al brødtekst i signaturfarver skal bruge tekst-varianterne fra afsnit 1 (`#0B7A57`, `#1D4ED8`, `#6D28D9`, `#B45309`), ikke basisfarverne, undtagen ved stor/fed skrift (≥18.66px bold eller ≥24px normal).
- Fokusring på alle interaktive elementer: 2px solid i `#2563EB` med 2px offset — synlig, ikke fjernet.
- Sliderhåndtag skal have tilstrækkelig klikflade (min. 24×24px) og aria-labels med nuværende værdi.
- Respekter `prefers-reduced-motion` — deaktiver fade/reflow-animationer for brugere der har slået det fra.

---

## 9. Kort opsummering: gør / undgå

**Gør:** neutral gråtoneskala som base, farve kun til de tre kernemetrics + én advarselsfarve, fladt ét-lags kortsystem, mono til alle tal, trekant-graf som signaturelement, individualiseret tekst pr. kort.

**Undgå:** emoji som ikoner, gradient-tekst, kort-i-kort, mere end 4 accentfarver totalt, identisk boilerplate-tekst gentaget på tværs af kort, farvede paneler til andet end data.

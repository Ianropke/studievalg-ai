# Nye fund ved gennemgang af live-data på forsiden

## 1. Top-10-anbefalinger mangler reel mangfoldighed

Ved standard-vægtningen (AI 80% / Job 70% / Løn 60%) viser 7 af de 10 anbefalede kort **identisk score** (88/100 AI-robusthed, 95/100 job, 78/100 løn) — kun by/campus varierer. Scoren beregnes tilsyneladende på fag-niveau og genbruges uændret for hver geografisk udgave af samme uddannelse.

**Anbefalet rettelse:** grupér geografiske varianter af samme uddannelse i listevisningen, fx:
> "#3 Match (89%) · Medicin med industriel specialisering · findes 4 steder (Aalborg, Odense, Esbjerg, +1) → se alle varianter"

i stedet for at vise hver by som sit eget kort. Det sikrer at "10 anbefalinger" rent faktisk viser 10 forskellige retninger, ikke 3-4 fag gentaget. Alternativt: hvis I bevidst vil vise alle geografiske varianter, så tilføj i det mindste en tydelig visuel markering af, at kortene deler samme underliggende score, så det ikke fremstår som en fejl.

## 2. URL-slugs indeholder uddannelsesnavnet dobbelt

Eksempel fra live data:
```
/uddannelse/10160-professionsbachelor-tandplejer-koebenhavn-n-studiestart-sommerstart-professionsbachelor-tandplejer
```
"professionsbachelor-tandplejer" gentages i slutningen af slug'en. Dette ses konsekvent på tværs af flere kort. Undersøg slug-genereringsfunktionen — det ligner en sammensætning, hvor uddannelsestypen tilføjes både i starten og i en afsluttende skabelon-streng. Ret til én ren forekomst pr. felt, fx:
```
/uddannelse/10160-professionsbachelor-tandplejer-koebenhavn-n-sommerstart
```

## 3. Bynavne mangler stort begyndelsesbogstav — systematisk på tværs af alle kort

Eksempler fra live data: "københavn N", "aarhus C", "odense M", "aalborg øst", "sønderborg" — skal være "København N", "Aarhus C", "Odense M", "Aalborg Øst", "Sønderborg".

Dette optræder konsekvent på *alle* uddannelseskort, hvilket tyder på én fælles rodårsag i datapipelinen (fx en `.lower()`-transformation anvendt på hele titel-strengen før byen indsættes, eller et datafelt der er gemt i småt i kildedata og aldrig title-cases ved rendering). Ret ét sted centralt (fx en formatteringsfunktion for bynavne), ikke felt for felt — ellers dukker samme mønster op et fjerde sted, ligesom jobtitel-fejlen gjorde tidligere.

Samme rodårsag ser ud til at ramme sammensatte fagnavne som "Teknisk videnskab (civilingeniør) Teknisk biomedicin" og "Teknisk videnskab (civilingeniør) Medicin og teknologi" — to felter med hver sin Title Case sat sammen uden en fælles sætningsregel. Overvej én central tekst-normaliseringsfunktion, der køres på alle sammensatte titelfelter (uddannelsesnavn + by + studiestart), så det altid bliver én sammenhængende, korrekt sætning.

## 4. To stakkede footer-blokke med indbyrdes modstridende indhold

Siden har i dag to separate blokke med overlappende formål:
- En "Om Uddannelsesindsigt / Transparens / Datakilder"-blok inde i hovedindholdet, med copyright-linjen "© 2026 Uddannelsesindsigt • Uafhængig pædagogisk beslutningsstøtte" og "Data senest opdateret: Juli 2026".
- En efterfølgende, selvstændig `<footer>` med egen "Værktøjer"-navigation, egne datakilde-links, og en *anden* copyright-linje: "© 2026 Uddannelsesindsigt Danmark. Alle data er vejledende og erstatter ikke professionel rådgivning." samt "Data opdateret: Juli 2026" (uden "senest").

**Anbefalet rettelse:** slå dem sammen til én footer. Behold navigationslinkene og de eksterne datakilde-links fra den anden blok, behold "Om/Transparens"-indholdet fra den første, og brug kun **én** konsekvent formuleret copyright- og opdaterings-linje.

## 5. Mindre ting

- Link-ikonet ved hvert korts titel (🔗) bør erstattes af det samme SVG-ikonsæt som resten af siden, ikke en rå emoji-karakter, jf. den etablerede ikonografi-regel.
- Kort #10 (en engelsksproget uddannelse) viser "study start: summer start" i stedet for "studiestart: sommerstart" — sandsynligvis fordi programnavnet er på engelsk og en oversættelsesfunktion fejlagtigt oversætter skabelon-teksten med. Sørg for at UI-labels (studiestart, adgangskvotient osv.) altid forbliver danske, uanset uddannelsens eget sprog.
- Bekræft at den afsluttende sætning i begrundelsesteksten ("...med stærk efterspørgsel") rent faktisk beregnes dynamisk ud fra Jobmuligheder-scoren, og ikke er en hardkodet streng — det er svært at se forskel lige nu, fordi alle 10 viste kort tilfældigvis har høj jobscore (90-95).

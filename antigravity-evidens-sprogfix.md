# Instruks til Antigravity: ret sprogregression på Evidens-siden + bekræft status

## 1. Evidens-siden er blevet mere teknisk, ikke mindre — det skal rettes tilbage

Siden hed før "Evidensforklaring" med undertekst "Pædagogisk guide til, hvordan vores AI-robusthedsscores beregnes". Den er nu omdøbt til "PEFF Evidens" / "PEFF Evidensmotoren" med undertekst "Metode, datagrundlag og transparens" — en koldere, mere teknisk-dokumentation-agtig ramme. **Gå tilbage til den pædagogiske ramme:** siden skal stadig føles som en guide skrevet til en gymnasieelev, ikke en teknisk spec skrevet til en udvikler. Den dybe tekniske jargon har allerede sit rette sted i den udfoldelige "Vis akademiske formler og LOSO"-sektion — den skal ikke rykke op i hovedteksten.

### Konkrete rettelser til de tre niveauer

**Nuværende (Tier 1):**
> "TIER 1: OFFICIEL REGISTERDATA (HARD DATA)
> Danmarks Statistik og UFM (KOT). Udgør det urokkelige fundament for alle adgangskvotienter, frafaldsprocenter og dimittendledighed. Vægtes som **ground truth** i alle beregninger og overrides aldrig af AI."

**Ny:**
> "NIVEAU 1: OFFICIEL REGISTERDATA (HÅRDE TAL)
> Danmarks Statistik og UFM (KOT). Udgør det urokkelige fundament for alle adgangskvotienter, frafaldsprocenter og dimittendledighed. Vægtes som **facit** i alle beregninger og kan aldrig overstyres af AI."

**Nuværende (Tier 2):**
> "TIER 2: ØKONOMETRISKE MODELLER (FREMSKRIVNINGER)
> Udnytter 10 års tidsseriedata på tværs af de 1.413 udbud. Modeller forudsiger vækst i løn og efterspørgsel via Bayesiansk inferens, som justerer de lineære kvotienter ud fra observerede mega-trends i STEM og omsorg."

**Ny:**
> "NIVEAU 2: ØKONOMETRISKE MODELLER (FREMSKRIVNINGER)
> Udnytter 10 års tidsseriedata på tværs af de 1.413 udbud. Modellerne forudsiger vækst i løn og efterspørgsel ved hjælp af statistiske sandsynlighedsmodeller (Bayesiansk inferens), der justerer kvotienterne ud fra observerede, langsigtede tendenser inden for fx STEM og omsorgsfag."

*(Behold gerne fagtermen "Bayesiansk inferens" i parentes til de nysgerrige — bare giv den en almindeligsprog-forklaring først. Drop "mega-trends", det er et hypeord, ikke en beskrivelse.)*

**Nuværende (Tier 3):**
> "TIER 3: RAG & LLM SEMANTIK (SOFT DATA)
> Retrieval-Augmented Generation analyserer tusindvis af siders PDF-studieordninger for at klassificere 'AI-robusthed'. Den fanger, om undervisningen reelt indeholder anvendt AI, og trækker citater til begrundelserne."

**Ny:**
> "NIVEAU 3: AI-LÆSNING AF STUDIEORDNINGER (KVALITATIV VURDERING)
> En AI gennemlæser tusindvis af sider studieordninger for at vurdere, om undervisningen reelt inddrager brug af AI-værktøjer — og finder konkrete citater som begrundelse for scoren. (Teknisk kaldet Retrieval-Augmented Generation, RAG.)"

### Generel regel for denne side
- Ingen engelske fagtermer optræder alene i en overskrift eller parentes uden en dansk forklaring lige ved siden af (fx ikke bare "(HARD DATA)" — skriv "(hårde tal)").
- Hvis et teknisk begreb er nødvendigt for præcisionen (Bayesiansk inferens, RAG), skal det stå i parentes *efter* en almindeligsprog-forklaring, ikke i stedet for den.
- "TIER" oversættes konsekvent til "NIVEAU" i overskrifterne.

## 2. Genindfør vægt-badge pr. niveau

Den tidligere version havde en tydelig vægtangivelse ved hvert lag ("Højeste vægt (100% fakta)", "Høj vægt (Statistisk evidens)", "Moderat vægt (Strukturel viden)"). Den ser ud til at mangle i den nye version. Tilføj den tilbage som et lille mono-tag til højre for hvert niveau — det er vigtigt for brugerens tillid at kunne se, hvor meget af scoren der hviler på hårde tal versus AI-fortolkning.

## 3. Bekræft status på tidligere punkter (ikke synlige i seneste screenshots)

Følgende blev bedt om rettet tidligere, men kan ikke bekræftes ud fra de nyeste skærmbilleder, da anbefalingskort-listen på forsiden ikke var med i denne omgang. Bekræft eller send et opdateret screenshot af selve kortlisten under "Dine anbefalinger":
- Er trekant-grafen ("Din matchprofil") nu beregnet dynamisk ud fra hvert korts egne tre scorer (se formel i det tidligere designdokument), eller viser den stadig samme statiske form på alle kort?
- Er de tre farvebjælker fjernet eller komprimeret, nu hvor trekanten bærer informationen?
- Er begrundelsesteksten under hvert kort individualiseret, eller gentages den stadig ordret på tværs af kort med samme AI-score?

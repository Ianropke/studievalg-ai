# VibeWine — Compliance & Risikovurdering (v3 — Permanent Non-Profit)

> **Status:** Internt arbejdsdokument. Denne version bygger på en eksplicit og bindende forudsætning: **VibeWine drives og vil fortsat blive drevet uden nogen form for indtægt, betaling, modydelse eller kommerciel interesse.** Ændres denne forudsætning på noget tidspunkt, skal dokumentet revideres fra bunden — se afsnit 8.

---

## 0. Kerneforudsætning

Hele risikovurderingen i dette dokument hviler på følgende, som skal være reelt sandt — ikke kun formuleret:

- Ingen affiliate-links, provisionsordninger eller trackede henvisningslinks, nogensinde.
- Ingen gratis produkter, vareprøver, rejser eller andre modydelser fra vinhuse, forhandlere eller tredjeparter (betaling "in natura" tæller som betaling).
- Ingen betalt eller sponsoreret fremhævning, badges eller placering.
- Ingen annoncer eller anden form for tredjepartsindtægt på sitet.
- Intet CVR-nummer, ingen erhvervsmæssig registrering.

Så længe disse punkter holder, opererer platformen efter al sandsynlighed **uden for det personelle anvendelsesområde for markedsføringsretten og en stor del af forbrugerbeskyttelsesretten**, som begge forudsætter, at man handler som "erhvervsdrivende". Det ændrer risikobilledet væsentligt i forhold til v2 — men fjerner ikke alt.

---

## 1. Dataindsamling & Scraping (Ophavsret, Databaseret, DSM)

**Uændret i forhold til v2 — non-profit-status reducerer ikke denne eksponering.**

Ophavsret og databaseret (Ophavsretslovens § 71, sui generis) er ikke betinget af, at *jeres* brug er kommerciel. En forhandler eller producent, hvis database bliver systematisk udtrukket, kan i princippet gøre indsigelse uanset formålet med udtrækket.

- Fasthold en dokumenteret teknisk grænse for, hvor stor en andel af en forhandlers sortiment der udtrækkes pr. kørsel, og hvor ofte.
- Fasthold TDM-opt-out-detektion (DSM art. 4) — se implementeringsbrief.
- Robots.txt-overholdelse er fortsat god praksis, men ingen juridisk fritagelse i sig selv.

**Vurdering: Lav til moderat risiko**, uafhængig af non-profit-status — men sandsynligheden for, at en forhandler reelt forfølger en non-profit hobbyside, vurderes lavere end for en kommerciel aktør.

---

## 2. Tekst, "Anmeldelser" & Billeder

**Ophavsretligt uændret lav risiko** (ingen kopiering af forhandlerbilleder/-tekster).

**Den forbrugerretlige "anmeldelses"-problematik fra v2 (Omnibus-direktivet / CRD art. 6a) er efter vores vurdering ikke længere relevant**, da den forudsætter en erhvervsdrivende afsender. Ordet "anmeldelse" kan derfor genindføres uden den specifikke forbrugerretlige risiko.

**Vigtigt — dette punkt er uafhængigt af kommerciel status:** Hvis AI-genereret indhold indeholder faktuelt forkerte eller nedsættende udsagn om en navngiven forhandler eller producent, kan det efter omstændighederne rejse spørgsmål om **ærekrænkelse (Straffeloven §§ 267-268)** eller almindeligt erstatningsansvar. Dette gælder, uanset om afsenderen er erhvervsdrivende eller privat. Editorial Independence-disclaimeren (afsnit 6) er derfor fortsat relevant — men nu som god skik/omdømmebeskyttelse frem for lovpligtig forbrugeroplysning.

---

## 3. Varemærkeret & Nominativ Fair Use

Varemærkeretlig håndhævelse forudsætter typisk erhvervsmæssig brug ("brug i erhvervsmæssigt øjemed", Varemærkelovens §§ 4 og 10). Ren omtale af brands i en ikke-kommerciel, redaktionel/hobbysammenhæng ligger tættere på beskyttet ytringsfrihed end på varemærkekrænkelse.

**Vurdering: Lav risiko**, lavere end i v2. Behold alligevel en synlig uafhængighedsdisclaimer — den koster intet og fjerner enhver tvivl om et fejlagtigt indtryk af officielt samarbejde.

---

## 4. Markedsføringsloven & Forbrugerbeskyttelse

**Efter vores vurdering ikke anvendelig, så længe kerneforudsætningen i afsnit 0 er opfyldt.**

MFL § 13 (sammenlignende reklame), Omnibus-direktivets krav om rangordningstransparens og reglerne om ægte forbrugeranmeldelser retter sig alle mod "erhvervsdrivende". En platform uden indtægt, betaling eller kommerciel interesse falder som udgangspunkt uden for definitionen.

**Bemærk:** Dette er en juridisk vurdering baseret på formål og adfærd — ikke kun på fravær af en synlig prisskilt. Hvis platformen fx modtager gratis produkter mod omtale, kan den alligevel blive anset for erhvervsdrivende, selvom der ikke veksles kontanter. Se "vagthund"-mekanismen i afsnit 8.

---

## 5. GDPR & Databeskyttelse

**Uændret — gælder fuldt ud, uanset kommerciel status.**

GDPR's undtagelse for "rent personlig eller familiemæssig aktivitet" dækker efter EU-domstolens praksis (Lindqvist-sagen, C-101/01) ikke en offentligt tilgængelig hjemmeside. Serverlogs, IP-adresser og evt. analytics udgør derfor fortsat databehandling, der kræver en Privacy Policy og en behandlingshjemmel (typisk legitim interesse, art. 6(1)(f)).

Cookiebekendtgørelsens krav om samtykke til lagring af/adgang til oplysninger på brugerens udstyr er heller ikke betinget af kommerciel status og skal fortsat vurderes ud fra den konkrete analytics-teknologi.

---

## 6. AI-Ansvar & Editorial Independence

Uændret anbefaling: behold en synlig disclaimer om, at indholdet er AI-genereret og kan indeholde fejl. Begrundelsen er nu primært **omdømme- og ærekrænkelsesrisiko**, ikke forbrugerret — men praktisk set samme tekst virker.

---

## 7. Notice-and-Takedown & Governance

Uændret. God praksis uanset forretningsmodel — reducerer risiko for både ophavsret/databaseret-klager og eventuelle ærekrænkelsespåstande, og signalerer god tro.

---

## 8. "Permanent Non-Profit"-vagthund — hvad der udløser en ny vurdering

Denne sektion erstatter det tidligere afsnit om "overgang til kommerciel drift". I stedet for at planlægge overgangen, dokumenterer vi her, **hvad der aldrig må ske uden en fuld juridisk revurdering:**

| Trigger-hændelse | Konsekvens hvis det sker |
|---|---|
| Ét eneste affiliate-/provisionslink indsættes | Hele afsnit 4 (MFL, Omnibus, anmeldelsesregler) bliver relevant igen |
| Modtagelse af gratis produkter/vareprøver mod omtale | Kan kvalificere platformen som erhvervsdrivende, selv uden pengestrøm |
| Betalt eller sponsoreret badge/placering | Genindfører krav om rangordningstransparens (Omnibus) |
| Visning af tredjepartsannoncer | Kan udløse erhvervsmæssig klassifikation afhængig af model |
| CVR-registrering eller momsregistrering | Definitivt punkt for fuld revurdering |

**Anbefaling:** Implementér en teknisk "vagthund" i kodebasen (se implementeringsbrief B.5), der forhindrer, at nogen af disse elementer utilsigtet indføres uden en bevidst, dokumenteret beslutning og en opdateret juridisk vurdering.

---

## 9. Compliance Matrix

| Krav | Status | Kommentar |
|---|---|---|
| Ophavsret (billeder/tekst) | OK | Uændret fra v2 |
| Databaseret (scraping-volumen) | Delvist | Kræver dokumenteret grænse og logning — uafhængigt af non-profit-status |
| TDM opt-out-detektion | Planlagt | Uændret |
| Varemærker | OK | Lavere risiko end v2 pga. ikke-kommerciel brug |
| MFL / sammenlignende reklame | Ikke anvendelig | Forudsætter erhvervsdrivende — se afsnit 4 |
| Omnibus / rangordningstransparens | Ikke anvendelig | Se afsnit 4 og 8 |
| Ægte anmeldelser-krav | Ikke anvendelig | Se afsnit 2 og 4 |
| Ærekrænkelse/omdømme (uafhængig af MFL) | God praksis anbefalet | Se afsnit 2 og 6 |
| GDPR — serverlogs/analytics | Under præcisering | Uændret, gælder fortsat |
| Cookie-/samtykkeregler | Under vurdering | Uændret, gælder fortsat |
| Editorial Independence-disclaimer | Mangler, anbefales | Nu omdømme-begrundet, ikke lovkrav |
| Notice-and-Takedown-proces | Mangler, anbefales | God praksis |
| Non-profit-vagthund (teknisk) | Mangler, anbefales | Se afsnit 8 og implementeringsbrief B.5 |
| Terms of Use / Privacy / Cookie Policy | Mangler | Se implementeringsbrief |

---

## 10. Samlet risikovurdering

- **Markedsføringsret/forbrugerret:** Falder efter vores vurdering praktisk talt bort, så længe kerneforudsætningen i afsnit 0 er reel.
- **Ophavsret/databaseret:** Uændret lav-moderat risiko — upåvirket af non-profit-status.
- **Varemærker:** Lavere risiko end i v2.
- **GDPR:** Uændret, kræver stadig præcisering (ikke omlægning).
- **Ærekrænkelse/omdømme:** Nyt, lavt liggende men reelt punkt — værd at holde disclaimeren, selv uden lovkrav.

**Samlet:** Et permanent non-profit VibeWine har en **lavere og smallere** risikoprofil end den kommercielle variant i v2 — hovedsageligt fordi en hel retsgren (markedsførings- og forbrugerret) falder bort. Den resterende eksponering (databaseret, GDPR, evt. ærekrænkelse) er uafhængig af forretningsmodel og bør fortsat håndteres teknisk og redaktionelt, som beskrevet i implementeringsbriefen.

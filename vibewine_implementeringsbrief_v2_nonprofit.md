# VibeWine — Juridiske Tekster & Implementeringsbrief v2 (Permanent Non-Profit)

> Denne version forudsætter, at VibeWine **aldrig** vil generere indtægt, modtage betaling/modydelser eller indgå kommercielle samarbejder. Del A og B er justeret i forhold til dette. Se compliance-dokument v3 for den juridiske begrundelse.

---

# DEL A — Juridiske tekster (klar til publicering)

## A.1 Editorial Independence & AI Disclaimer
*(Uændret formål — nu begrundet i omdømme/ærekrænkelse frem for forbrugerret)*

> **Uafhængighed & AI-gennemsigtighed**
>
> VibeWine er et ikke-kommercielt, uafhængigt hobbyprojekt. Vi er ikke tilknyttet, sponsoreret af eller officiel partner for de vinhuse eller forhandlere, der omtales på sitet. VibeWine modtager ingen betaling, produkter eller andre modydelser fra nogen forhandler eller producent, og har ingen kommerciel interesse i, hvilken forhandler du vælger.
>
> De vurderinger, "Vibe Scores" og tekstbeskrivelser, du ser her, er **genereret af en AI-model** på baggrund af objektive, offentligt tilgængelige datapunkter (pris, årgang, region, forhandler). De udtrykker en algoritmisk vurdering — ikke en menneskelig smagsdommers eller forbrugers personlige oplevelse.
>
> Indholdet kan indeholde fejl eller forældede oplysninger. Priser og lagerstatus kan ændre sig hos forhandleren uden varsel. Køb sker altid direkte hos forhandleren, på forhandlerens egne vilkår.
>
> Har du bemærket en fejl eller en urimelig omtale? Kontakt os på **legal@vibewine.dk**.

## A.2 Metode- og transparensside
*(Forenklet — ikke længere et lovkrav, men bevares for troværdighed)*

> **Sådan beregnes Vibe Score**
>
> Vibe Score og badges (VIBE STEAL, SWEET SPOT, FAIR DEAL, PRESTIGE PICK) tildeles udelukkende ud fra faste, algoritmiske tærskelværdier baseret på pris og tilgængelighed. Algoritmen anvendes ens for alle forhandlere. VibeWine er ikke-kommercielt og modtager ikke betaling af nogen art for at fremhæve en forhandler, et produkt eller et badge.

## A.3 Terms of Use — inkl. Permanent Non-Profit-klausul (ny)

Tilføj som selvstændigt, fremhævet punkt i Terms of Use:

> **§ X — Ikke-kommerciel erklæring**
>
> VibeWine drives udelukkende som et ikke-kommercielt hobbyprojekt. VibeWine:
> - sælger ikke produkter eller tjenester,
> - anvender ikke affiliate-links, provisionsordninger eller trackede henvisningslinks,
> - modtager ikke betaling, gratis produkter, vareprøver eller andre modydelser fra forhandlere, vinhuse eller tredjeparter,
> - viser ikke tredjepartsannoncer,
> - tilbyder ikke betalt eller sponsoreret fremhævning af forhandlere, produkter eller badges.
>
> Skulle dette nogensinde ændre sig, vil det blive oplyst tydeligt på forsiden og i denne sektion, forud for ikrafttræden, og platformens juridiske grundlag vil blive revurderet i sin helhed.

Øvrige punkter (uændret fra v1): beskrivelse af tjeneste, ansvarsfraskrivelse for tredjepartsdata, immaterielle rettigheder til eget indhold, forbud mod scraping af VibeWines egne data, lovvalg/værneting, kontakt.

## A.4 Privacy Policy (uændret fra v1 — se tidligere skelet)
GDPR er upåvirket af non-profit-status. Behold skelettet: dataansvarlig, kategorier af data (serverlogs/IP), formål/hjemmel, databehandlere, opbevaringsperiode, rettigheder, evt. tredjelandsoverførsel.

## A.5 Cookie/Samtykke-politik (uændret fra v1)
Afhænger fortsat af den konkrete analytics-teknologi, ikke af forretningsmodel.

---

# DEL B — Teknisk implementeringsspec

## B.1 Sider (uændret fra v1)
`/disclaimer`, `/metode`, `/vilkaar`, `/privatlivspolitik`, `/cookies`, `/kontakt-juridisk`.

## B.2 Rate limiting & scraping-governance
**Uændret fra v1** — se tidligere pseudokode. Databaseret er upåvirket af kommerciel status.

## B.3 TDM opt-out-detektion
**Uændret fra v1** — se tidligere pseudokode (robots.txt + TDMRep-protokol).

## B.4 Governance-log for badge/score-ændringer
Uændret — stadig god praksis for troværdighed, selvom det ikke længere er et lovkrav.

## B.5 NY: Teknisk "Non-Profit-vagthund" (CI/CD-guard)

Formålet er at forhindre, at kommercielle elementer utilsigtet sniger sig ind i kodebasen uden en bevidst beslutning og opdateret juridisk vurdering (jf. compliance v3 §8).

**Automatisk check i CI-pipeline (kører ved hver commit/PR):**

```python
FORBIDDEN_PATTERNS = [
    r"(?i)affiliate",
    r"(?i)ref=[a-zA-Z0-9_-]+",       # typiske affiliate/tracking-parametre
    r"(?i)utm_source=partner",
    r"(?i)sponsored",
    r"(?i)\bads?\b.*(banner|slot|placement)",
    r"(?i)stripe|paypal|checkout",   # betalingsintegrationer
    r"(?i)cvr[-_]?number|momsnummer",
]

def scan_codebase_for_commercial_creep(diff_text):
    hits = []
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, diff_text):
            hits.append(pattern)
    if hits:
        raise CIBlockError(
            f"Kommercielt element detekteret: {hits}. "
            "Kræver eksplicit godkendelse + juridisk revurdering (se compliance v3 §8) "
            "før merge. Tilføj label 'legal-review-required' for at fortsætte."
        )
```

- Ved et hit **blokeres merge automatisk**, indtil en person aktivt tilføjer et label (fx `legal-review-required`) og bekræfter, at ændringen er en bevidst, dokumenteret beslutning om at forlade non-profit-modellen.
- Dette er bevidst en "speed bump", ikke en absolut spærring — formålet er at sikre, at en overgang til kommerciel drift aldrig sker ved et uheld eller en enkelt udviklers isolerede beslutning, men altid trigger compliance v3 §8.

## B.6 Notice-and-Takedown (uændret fra v1)
Samme fire-trins workflow: modtagelse → vurdering → svar → korrektion.

## B.7 Cookie-consent (uændret fra v1)
Samme princip: verificér teknisk om noget gemmes på klienten, før banner designes.

---

**Rækkefølge til Antigravity:**
1. Opret siderne i B.1 med teksterne fra Del A (inkl. den nye non-profit-klausul i A.3).
2. Implementér B.5 (CI-guard) tidligt — det er den billigste og mest langtidsholdbare beskyttelse.
3. Implementér B.2 + B.3 (scraping-governance) i pipelinen.
4. Byg B.6 (takedown-workflow).
5. Afklar og implementér B.7 (cookie-banner) sidst.

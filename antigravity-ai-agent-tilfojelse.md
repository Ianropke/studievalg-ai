# Tilføjelse til SEO-instruksen: gør siden fundbar for AI-agenter

Dette er ikke Google-SEO — det er specifikt rettet mod at Studievalg AI kan blive fundet, læst og citeret af AI-chatbots og -søgemaskiner (ChatGPT, Claude, Perplexity m.fl.), når en bruger spørger dem om uddannelsesvalg.

---

## 1. robots.txt — skeln mellem trænings-bots og søge/citerings-bots

Der findes to kategorier AI-bots. Behandl dem forskelligt:

- **Trænings-bots** henter indhold til fremtidig modeltræning og giver intet tilbage. Kan blokeres uden at det påvirker om platformen kan findes/citeres i dag.
- **Søge/citerings-bots** (inkl. "live"-bots, der henter en side i det øjeblik en bruger spørger en AI om noget) er dem, der gør at I kan dukke op som kilde eller anbefaling i et AI-svar. Disse bør tillades, hvis målet er synlighed.

```
# --- Traditionelle søgemaskiner ---
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# --- AI søge- og citerings-bots: TILLAD ---
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# --- AI trænings-bots: BLOKÉR ---
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

# --- Standard ---
User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://[jeres-domæne]/sitemap.xml
```

**Vigtigt forbehold:** feltet ændrer sig hurtigt, og kilderne er ikke 100% enige om hvorvidt "ClaudeBot" specifikt tæller som trænings- eller søgebot (Anthropic har opdelt deres bots flere gange de seneste år). Tjek Anthropics, OpenAIs og Perplexitys egne, aktuelle bot-dokumentationssider, før dette låses fast, og genbesøg det med jævne mellemrum — det er ikke en fil, man skriver én gang og glemmer.

robots.txt er desuden en anmodning, ikke en teknisk spærring — velvillige bots respekterer den, men den forhindrer ikke en bot, der vælger at ignorere den.

---

## 2. Tilføj en llms.txt

En uformel, men udbredt konvention: en ren tekstfil i roden af domænet (`/llms.txt`), der giver AI-systemer et hurtigt, støjfrit overblik over sidens struktur og formål — uden navigation, styling eller JS-støj. Sæt ikke for høje forventninger til dens effekt (ingen udbyder har officielt bekræftet, at den påvirker hvordan de henter eller citerer indhold), men den koster stort set intet at tilføje og skader ikke.

```markdown
# Studievalg AI

> Statistisk beslutningsstøtte til danske uddannelsessøgende, baseret på officielle
> UFM- og Danmarks Statistik-registerdata samt videnskabelig forskning (PEFF-framework).

Studievalg AI hjælper unge med at finde uddannelser der matcher deres eget
adgangskvotient-snit og prioriteter på tre akser: AI-robusthed, jobmuligheder
og lønpotentiale. Data opdateres løbende med de nyeste optagelsestal.

## Vigtige sider

- [Forside / matchværktøj](https://[domæne]/): interaktivt værktøj til at finde uddannelser ud fra eget snit og prioriteter
- [AI Insights](https://[domæne]/insights): dataanalyser af hvordan AI påvirker studievalg og arbejdsmarked
- [PEFF Evidens](https://[domæne]/evidens): metode og datagrundlag bag scorerne
- [Uddannelsesdatabase](https://[domæne]/uddannelse/): individuelle sider for alle 1.413 uddannelser med kvotienter og scorer

## Metode

Data kombinerer officiel registerdata (Danmarks Statistik, UFM/KOT), økonometriske
fremskrivningsmodeller og AI-baseret analyse af studieordninger. Se PEFF Evidens-siden
for fuld metodebeskrivelse og kildevægtning.
```

---

## 3. Hvorfor det allerede forberedte arbejde tæller dobbelt

De to ting, der gør mest for AI-agent-synlighed, er allerede dækket af tidligere instrukser, blot af andre grunde:

- **De 1.413 individuelle, statisk genererede uddannelsessider** (fra SEO-instruksens punkt 1) er lige så vigtige her — en AI-agent kan ikke citere data, den ikke kan se, og de fleste AI-crawlere kører ikke JavaScript.
- **Det hedge-sprog og de kildeangivne tal**, vi rettede i tekstinstruksen, gør indholdet mere attraktivt at citere for en AI-svarmaskine — præcise, kildeangivne udsagn er nemmere for en AI at genbruge trygt end skråsikre, ukildebelagte påstande.

Der er altså ikke noget modsætningsforhold mellem "skrevet ordentligt til mennesker" og "fundbart for AI-agenter" her — det er stort set samme arbejde set fra to vinkler.

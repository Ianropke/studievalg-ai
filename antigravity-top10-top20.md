# Instruks til Antigravity: Top 10/20-lister (adskilt fra Top 100)

Supplement til produktroadmappets Prioritet 3. Byg to niveauer af toplister, ikke kun ét:

| Format | Formål | Bruges til |
|---|---|---|
| **Top 100** | SEO-bredde, fanger long-tail søgninger | Organisk Google-trafik over tid |
| **Top 10 / Top 20** | Hurtig læsning, deling, citering | Sociale medier, nyhedsbrev, presse, AI-svarmaskiner |

Byg Top 10/20-siderne som selvstændige statiske sider, samme teknik som Top 100 (ingen ny backend — samme datasæt, blot afskåret ved 10/20 i stedet for 100).

---

## 1. Konkrete lister at bygge først

- Top 10 mest AI-robuste uddannelser
- Top 10 bedst lønnede uddannelser
- Top 10 laveste ledighed
- Top 20 bedste samlede match (kombination af alle tre kernemetrics — brug samme vægtningslogik som trekant-graf-scoren)
- Top 10 uddannelser i størst AI-omstilling (dem med lavest robusthed) — **vigtigt at have med**, ikke kun de positive lister. Det holder platformen balanceret og undgår at ligne et reklameskilt for bestemte fag.
- Top 10 letteste/sværeste at komme ind på (efter kvotient) — genbruger data I allerede har, kræver ingen ny beregning.

## 2. Sidestruktur

Hver liste er én statisk side (`/top-10/{slug}` eller `/lister/{slug}`), opbygget sådan:

1. **Kort intro (3-4 linjer)**, hedge-sprog konsistent med resten af platformen: "Ifølge vores model er disse ti uddannelser vurderet mest AI-robuste pr. {dato} — se metode for hvordan scoren beregnes." Aldrig "Disse ER de mest robuste uddannelser" som en absolut kendsgerning.
2. **Nummereret liste**, hvor hvert punkt:
   - Linker til uddannelsens egen side (internt link, jf. SEO-instruksen)
   - Viser den relevante nøgletal inline i mono-font (fx "92/100" eller "645.000 kr.")
   - Bruger samme farve-/vægt-regler som resten af platformen — ingen nye farver til dette formål
3. **Dato for seneste opdatering** tydeligt vist øverst (samme mønster som "Seneste Optagelsesdata")
4. **Link til metode/Evidens-siden** i bunden

## 3. Teknisk: markup til citérbarhed

Brug `ItemList`-schema (schema.org) på selve listen, med hvert `ListItem` peget på uddannelsens egen URL. Det gør listen let at parse for både Google og AI-søgemaskiner, og øger sandsynligheden for at blive vist som en direkte, struktureret liste i et AI-svar eller en Google-rich-result.

## 4. Opdateringscadence

Generér listerne automatisk (ISR) hver gang KOT-data opdateres — ingen manuel vedligeholdelse. Det er det, der gør dem brugbare i vækstplanens tre faste vinduer (juli/marts/januar) uden ekstra arbejde: listen er allerede frisk, når du skal dele den.

## 5. Kobling til vækstplanen

- **Juli-vindue:** del Top 10-listerne direkte i de Facebook-grupper/subreddits, der er nævnt i vækstplanen — en Top 10-liste er markant mere delbar end en Top 100-side.
- **Nyhedsbrev:** brug Top 10-listen som selve indholdet i den automatiske email, i stedet for at skulle skrive nyt indhold hver gang.
- **Presse-pitch:** en konkret Top 10 ("De 10 uddannelser, der klarer sig bedst i en AI-fremtid") er en langt nemmere historie for en journalist at bruge end en generel omtale af platformen — brug den som ophæng i pitchen.

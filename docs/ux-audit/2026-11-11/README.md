# UX-audit: 11. november 2026

Før-billederne viser den offentlige version ved 375, 768 og 1280 px for forsiden, en uddannelsesside, sammenligningen, AI-analyse og guides. Alle 15 opslag svarede HTTP 200 og havde ingen vandret overflow på dokumentniveau; det dokumenterer ikke i sig selv fuld tilgængelighed.

Fase 1-billederne viser den lokale version efter indtastning af 9,5 ved 375 og 1280 px. De skal ses sammen med de tilsvarende før-billeder: før-billederne viser den daværende standard 9,5, mens efter-billederne viser en værdi, som er indtastet aktivt.

Fase 2-billederne viser lokal gemning og to valgte uddannelser samt sammenligningen. Fase 3-billederne viser institutionsfilteret på desktop og den åbne filterdialog på mobil. Filtrene omfatter alene uddannelsessteder, der kan identificeres i 2026-kilden; professions- og akademigruppen er ikke nødvendigvis komplet.

Fase 4-billederne viser AI-analysens nye danske navn og den udfoldede forklaring på forsiden. Ingen modelmetode eller kildetal er ændret.

Audit: den oprindelige nummerering og overskrift gav indtryk af en personlig rangering; det var ikke underbygget. Snit 9,5 var forudfyldt, institutionsfiltrene var gentaget, og forbeholdene optog meget plads inden resultaterne. Sammenligningssiden havde allerede en mobil vandret-rul-hjælp. Listen udelukkede ikke konsekvent uddannelser over snittet, selvom de øverste kort kunne give det indtryk.

Databegrænsning: katalogets `by` er afledt af titler og indeholder ikke kun byer. Der er ingen pålidelig selvstændig katalogkolonne for region, undervisningssprog, uddannelsestype eller fagområde. De filtre kræver bedre dokumenterede data; der er ikke etableret nye klassifikationer i UX-arbejdet.

Privatliv: Adressen indeholder de valg, brugeren selv indtaster. Web Analytics og Speed Insights afviser derfor hændelser fra forsiden og sammenligningssiden, også ved adresseændringer; sidernes trafik og performance vil dermed ikke længere indgå i disse målinger. Afskærmningen styrer ikke hostingens HTTP- eller serverlogs, og adresser kan ligge i browserhistorik og sendes ved sideindlæsning. Det oplyses ved filtrene.

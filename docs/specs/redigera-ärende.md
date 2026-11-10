# Spec: Redigera ärende

Ägare: Carolina
Se [docs/avgränsningar.md](../avgränsningar.md) för teknikval och avgränsning.
Återanvänder fält och valideringsregler (Felfall) från [registrera-ärende.md](./registrera-ärende.md).

## Vad momentet gör
En handläggare redigerar ett befintligt ärendes uppgifter. Hur redigeringen
visas beskrivs under Antagande nedan. Samma validering som vid registrering
gäller för varje fält.

Momentet omfattar hela flödet: redigeringen i frontend och endpointen i backend.

## Ingår
- Redigering av: rubrik, beskrivning, kategori, prioritet, namn, email
- Fälten innehåller ärendets befintliga värden när redigeringen börjar
- Samma fältvalidering som registrera-ärende, i både frontend och backend
- Backend: endpoint `PATCH /api/tickets/{id}`
- Felhantering när ärendet inte går att hitta

## Ingår inte
- Statusändring (eget moment, se arbetsfördelning i avgränsningar.md)
- Versionshistorik över vad som ändrats (uttryckligen exkluderat,
  se avgränsningar.md)
- Möjlighet att spara ett utkast (uttryckligen exkluderat)

## Antagande som behöver följas upp
Detta är ett antagande från Carolina. Det är inte beslutat av gruppen.

- Antagande: Listan och detaljerna blir en gemensam vy, där ärendets
  detaljer visas till höger om listan. Redigering sker direkt i
  detaljpanelen. Knappen "Redigera" växlar den skrivskyddade visningen till
  redigeringsläge på samma plats, med oförändrad layout. Ingen ny vy och
  ingen drawer öppnas.
  Alternativ som inte valts i antagandet: separat redigeringsformulär, drawer.
  Motivering: samma utseende som detaljpanelen och färre steg för handläggaren.
- Beslut (2026-11-10): Carolina bygger redigeringskomponenten (validering,
  sparning, endpoint) och lägger själv in knappen "Redigera" i detaljpanelen.
  Detaljsidan ägs av Linus (se arbetsfördelningen i avgränsningar.md), så
  ändringen i hans fil hålls så liten som möjligt.

Att följa upp:
1. Fråga Linus om detaljpanelen kan visa redigeringskomponenten.
2. ~~Fråga gruppen om vem som bygger redigeringen (Carolina eller Linus).~~
   Besvarad 2026-11-10: Carolina bygger den, inklusive knappen.
3. Fråga Linus om AK-3 (ärendet finns inte) hör till detaljpanelen eller
   till detta moment, eftersom ingen egen redigeringsvy finns.
4. Uppdatera specen och acceptanskriterierna efter svaren.

## Acceptanskriterier

### Redigering

**AK-1**
- Given: Ett eller flera fält ändras till giltiga värden
- When: Ändringen sparas
- Then: Ärendet uppdateras

**AK-2**
- Given: Ett fält bryter mot en regel i Felfall i registrera-ärende.md
- When: Ändringen sparas
- Then: Felmeddelandet från tabellen visas kopplat till fältet via
  aria-describedby, och ärendets tidigare värden behålls oförändrade

**AK-3**
- Given: Det finns inget ärende med angivet id (t.ex. ett felskrivet
  eller påhittat id i URL:en)
- When: Ärendet öppnas
- Then: "Ärendet kunde inte hittas" visas, och inga redigerbara fält visas

### API (backend)

**AK-4**
- Given: Ett anrop till `PATCH /api/tickets/{id}` med giltiga ändringar
- When: Anropet skickas
- Then: Svaret är `200` och ärendet är uppdaterat

**AK-5**
- Given: Ett anrop där ett fält bryter mot en regel i Felfall
- When: Anropet skickas
- Then: Svaret är `400` med felet kopplat till fältet, och ärendet är oförändrat

**AK-6**
- Given: Ett anrop med ett id som inte finns
- When: Anropet skickas
- Then: Svaret är `404`

### Redigeringsläge

**AK-7**
- Given: Ett ärende är valt och visas i detaljpanelen
- When: Hen väljer "Redigera"
- Then: De sex fälten blir redigerbara och innehåller ärendets nuvarande värden

**AK-8**
- Given: Hen redigerar fälten
- When: Hen väljer "Avbryt"
- Then: Fälten blir skrivskyddade igen, ändringarna sparas inte, och fokus går tillbaka till "Redigera"

**AK-9**
- Given: Ändringarna har sparats
- When: Svaret från servern är lyckat
- Then: Fälten blir skrivskyddade igen och visar de nya värdena, en bekräftelse visas som även läses upp av skärmläsare, och fokus går tillbaka till "Redigera"

**AK-10**
- Given: Hen har ändrat minst ett fält
- When: Hen väljer ett annat ärende i listan
- Then: En dialog frågar om ändringarna ska sparas, med valen "Spara",
  "Släng ändringar" och "Fortsätt redigera". Fokus flyttas till dialogen.
  - "Spara": ändringarna sparas som i AK-9, sedan visas det nya ärendet.
    Vid valideringsfel visas felen som i AK-2 och det nya ärendet visas inte.
  - "Släng ändringar": ändringarna sparas inte, och det nya ärendet visas.
  - "Fortsätt redigera": dialogen stängs, redigeringen och ändringarna finns
    kvar, och fokus går tillbaka till fältet som hade fokus.

**AK-11**
- Given: Hen är i redigeringsläge men har inte ändrat något fält
- When: Hen väljer ett annat ärende i listan
- Then: Ingen dialog visas, och det nya ärendet visas direkt

## Beslut: byta ärende under redigering (2026-11-10)
Alternativ som jämfördes:

| Alternativ | Fördel | Nackdel |
|---|---|---|
| A. Avbryt utan att spara | Minst arbete | Ändringar kan försvinna av misstag |
| B. Fråga alltid | Inga ändringar försvinner | Mest arbete. Dialog även när inget ändrats |
| C. Fråga bara om något fält ändrats | Inga ändringar försvinner, ingen onödig dialog | Mer arbete än A. Kräver att komponenten vet om något ändrats |

Valt: C. Motivering: samma skydd som B, men handläggaren störs inte när
inget har ändrats.

## Gränsfall (beslutade 2026-11-10)
- PATCH-semantik: ett fält som saknas eller är `null` ändras inte. Ett fält som
  skickas valideras med samma regel och meddelande som i Felfall. En tom sträng
  eller bara mellanslag ger fel, den betyder inte "ändra inte".
- Spara utan några ändringar (tomt anrop): svaret är `200` med ärendet oförändrat.
- Status, ärendenummer, id och tidpunkt kan inte ändras här. Skickas de ignoreras de.
- Maxlängd: rubrik 200 tecken, beskrivning 5000 tecken (samma som registrera-ärende.md).
- Redigering skapar ingen händelse i ärendehistoriken. Det hör till en senare spec
  för ärendehistorik.

## Verifieringsmetod
- Automatiserade tester (happy path + error paths per rad i Felfall +
  ärende-finns-inte)
- Backend-tester (API) för validering, uppdatering och 404 när id saknas
- Playwright end-to-end-test för redigeringsflödet

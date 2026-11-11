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
- Felhantering när ärendet inte finns vid sparning (`404` från API:t, se AK-6)

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

**AK-3** (utanför detta moment, beslut 2026-11-11)
- Ett ärende som inte finns kan inte öppnas i redigeringsläge. "Redigera"
  finns bara när detaljpanelen visar ett ärende som har laddats.
- Vad som händer när ett ärende inte finns ägs av detaljpanelen, se
  [visa-ärende-och-ändra-status.md](./visa-ärende-och-ändra-status.md),
  "Regler och fel":
  - En okänd äldre detaljlänk (`/tickets/{id}`) öppnar startsidan med listans normala val.
  - Om detaljerna inte kan hämtas visas "Ärendedetaljerna är inte tillgängliga."
- Den tidigare texten "Ärendet kunde inte hittas" byggdes inte. Den skrevs innan
  detaljvyn blev en panel, och den skulle motsäga visa-specen.
- Om ärendet tas bort under redigering ger sparningen `404` (AK-6), och
  formuläret visar "Ärendet kunde inte sparas. Försök igen."

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

**AK-12**
- Given: Ett eller flera fält bryter mot en regel i Felfall i registrera-ärende.md
- When: Ändringen sparas
- Then: Fokus flyttas till det första fältet med fel, i formulärets ordning

**AK-13**
- Given: Ändringen har skickats och svaret från servern har inte kommit
- When: Hen väljer "Spara ändringar" igen
- Then: Inget nytt anrop skickas

AK-12 och AK-13 lades till 2026-11-10 av Carolina, med samma beteende som AK-11 och AK-12 i
registrera-ärende.md.

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

## Beslut: sparning som pågår (2026-11-11)
Frågorna kom från uppdrag B1 och beslutades av Carolina i uppdrag B2.

1. "Avbryt" går inte att välja medan en sparning pågår.
2. En sparning som blir klar efter att formuläret har stängts, till exempel efter "Släng ändringar",
   uppdaterar listan och panelen med det sparade ärendet. Inget annat händer: fokus flyttas inte och
   ingen bekräftelse visas.

## Verifieringsmetod
- Automatiserade tester (happy path + error paths per rad i Felfall +
  `404` vid sparning)
- Backend-tester (API) för validering, uppdatering och 404 när id saknas
- Playwright end-to-end-test för redigeringsflödet

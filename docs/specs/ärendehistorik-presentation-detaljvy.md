# Spec: Ärendehistorik i den valda ärendepanelen

**Ägare:** Sebastian  
**Senast uppdaterad:** 2026-11-10

## Sammanfattning

Visa ärendets registreringshändelse i historiksektionen på startsidans valda ärendepanel. Ändringen omfattar frontend och frontendtester; backend och API-kontraktet ändras inte.

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- Handläggaren ser när det valda ärendet registrerades.
- Tom historik och hämtningsfel har tydliga tillstånd.
- Statusformuläret och ärendets uppgifter fungerar även när historiken inte kan hämtas.

## Ingår

- Presentation av `Created`, inklusive tidpunkt, på `/tickets`.
- Laddningstillstånd, tomtillstånd och felmeddelande.
- Historik hämtas för det valda ärendet; svar för tidigare val ignoreras.

## Ingår inte

- Historikhändelser för statusändringar eller redigering.
- Ändringar av backend, databas eller API-kontrakt.
- Knapp för att försöka hämta historiken igen. Handläggaren laddar om sidan.

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Startsidan har laddat listan och ett ärende är valt.
- **Beroenden:** [Ärendehistorik, grund](ärendehistorik-grund.md), [visa ärende och ändra status](visa-ärende-och-ändra-status.md) och `GET /api/tickets/{id}/history`.

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| `type` | Händelsetyp | `Created`. Fler värden kan tillkomma |
| `occurredAt` | Händelsens tidpunkt | ISO 8601, UTC |
| Tidpunkt | Hur `occurredAt` visas | Svenskt datum och klockslag i webbläsarens tidszon |

## Regler och fel

| Situation | Regel | Förväntat resultat/felmeddelande |
|---|---|---|
| Inget ärende är valt | Ingen historik visas | Panelens tomtillstånd visas |
| Historiken laddas | Svaret har inte kommit | "Laddar historik…" visas i historiksektionen |
| Händelser finns | Visa i API:ts ordning | `Created` visas som "Ärendet registrerades" med tidpunkt |
| Okänd `type` | Händelsen visas inte | Övriga kända händelser visas; om inga återstår visas tomtillståndet |
| Tom historik (`[]`) | Ingen lista visas | "Det finns inga händelser för ärendet." |
| Historikanrop misslyckas | Visa ingen lista | "Historiken kunde inte hämtas. Försök igen."; ärendeuppgifter och statusformulär fungerar |
| Status sparas | Historiken hämtas inte igen | Historiken är oförändrad |
| Ett annat ärende väljs | Ignorera svar för tidigare val | Endast aktuellt ärendes historik visas |

## Acceptanskriterier

### Vald ärendepanel

**AK-6: Historik visas**
- Given: Ett registrerat ärende är valt på startsidan
- When: Ärendepanelen har laddats
- Then: Under rubriken "Historik" visas händelsen "Ärendet registrerades" och en tidpunkt vars `datetime` motsvarar `occurredAt` efter `new Date(occurredAt).toISOString()`

**AK-7: Historiken kunde inte hämtas**
- Given: Ett ärende är valt på startsidan
- When: Historikanropet svarar med 5xx eller inte går att nå
- Then: "Historiken kunde inte hämtas. Försök igen." läses upp i stället för listan; uppgifter och statusformulär visas fortfarande

**AK-10: Tom historik**
- Given: Ett valt ärende utan historikhändelser
- When: Historiken har laddats
- Then: "Det finns inga händelser för ärendet." visas i stället för listan

**AK-11: Historiken laddas**
- Given: Ett ärende har valts
- When: Historiksvaret ännu inte har kommit
- Then: "Laddar historik…" visas i historiksektionen medan ärendets uppgifter visas

**AK-12: Okänd händelsetyp**
- Given: Historiken innehåller en okänd och en känd händelse
- When: Historiken visas i den valda ärendepanelen
- Then: Den okända händelsen visas inte och den kända händelsen visas som vanligt

## API- och datakontrakt

- **Endpoint/händelse:** Befintligt `GET /api/tickets/{id}/history`.
- **Inkommande data:** `id` i sökvägen.
- **Lyckat svar:** `200` med händelser nyast först eller `[]`.
- **Fel:** `404` `problem+json` för okänt ärende; alla fel ger samma frontendmeddelande.
- **Beständighet:** Frontend sparar inga historikhändelser.
- **Källor:** [API-kontrakt](../api/kontrakt.md) och [grundspecifikation](ärendehistorik-grund.md).

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Historiken är en sektion med rubriken "Historik" (`h2`) och en lista (`ul`). Tidpunkter är `time`-element med ISO `datetime`. Laddnings- och felmeddelanden har egna live-regioner, skilda från listans och statusformulärets live-regioner. Tillstånd visas med text, inte enbart färg.
- **Integritet/säkerhet:** Inga nya personuppgifter visas.
- **Övrigt:** Historikfel får inte blockera andra funktioner i panelen.

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | Historik visas bara för valt ärende; föråldrade svar ignoreras | Förhindrar att historik från föregående val visas | Sebastian | Beslutat |
| D-2 | Historiken har ett eget laddningstillstånd och blockerar inte panelen | Ärendet ska kunna användas även om historiken är långsam | Sebastian | Beslutat |
| D-3 | Tomtillståndets text är "Det finns inga händelser för ärendet." | Ärenden kan sakna historik | Sebastian | Beslutat |
| D-4 | Händelser med okänd `type` visas inte | Framtida typer ska inte ge felaktig text eller krascha klienten | Sebastian | Beslutat |
| D-5 | Alla misslyckade historikanrop ger samma felmeddelande | Ärendet finns redan i den laddade listan | Sebastian | Beslutat |
| D-6 | Endast `Created` visas; status sparas utan att hämta om historiken | Statushistorik ingår inte i denna ändring | Sebastian | Beslutat |

## Verifiering

Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-6 | Välj ett ärende och kontrollera text, tid och normaliserat `datetime` | E2E, full stack | Automatisk |
| AK-7 | Historikserverfel och nätverksfel var för sig; kontrollera att uppgifter och status fungerar | E2E, mockat API | Automatisk |
| AK-10 | Tomt historiksvar | E2E, mockat API | Automatisk |
| AK-11 | Fördröjt historiksvar | E2E, mockat API | Automatisk |
| AK-12 | Okänd och känd händelse samtidigt | E2E, mockat API | Automatisk |
| D-1 | Byt valt ärende under pågående historikanrop och kontrollera aktuellt resultat | Kodgranskning | Manuell |
| D-6 | Spara status och kontrollera att inget nytt historikanrop görs | E2E, full stack | Automatisk |
| Tillgänglighet | Rubrik, lista, `time` och live-regioner kontrolleras med skärmläsare | Manuell kontroll | Manuell |

## Referenser

- [Ärendehistorik, grund](ärendehistorik-grund.md)
- [Visa ärende och ändra status](visa-ärende-och-ändra-status.md)
- [API-kontrakt](../api/kontrakt.md)
- [Specmall](_mall.md), [arbetssätt](../arbetssätt.md) och [teststrategi](../teststrategi.md)
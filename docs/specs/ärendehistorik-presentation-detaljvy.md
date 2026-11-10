# Spec: Ärendehistorik i detaljvyn

**Ägare:** Sebastian  
**Senast uppdaterad:** 2026-11-10

## Sammanfattning

Utöka ärendets detaljvy med presentation av den befintliga registreringshändelsen. Ändringen omfattar frontend och frontendtester; grundspecifikationen, backend och API-kontraktet ändras inte.

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- Handläggaren ser när ärendet registrerades.
- Tom historik och hämtningsfel har tydliga tillstånd.
- Resten av detaljvyn fungerar även när historiken inte kan hämtas.

## Ingår

- Presentation av `Created`, inklusive tidpunkt.
- Laddningstillstånd, tomtillstånd och felmeddelande.
- Historiktyper och hämtning i frontendens API-klient samt frontendtester.

## Ingår inte

- Att skapa eller visa historikhändelser för statusändringar eller redigering. Dessa får en separat specifikation.
- Ändringar av befintlig statusfunktion, backend, databas eller API-kontrakt.
- Knapp för att försöka hämta historiken igen. Handläggaren laddar om sidan.

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Ärendet finns och detaljvyn har laddat det.
- **Beroenden:** [Ärendehistorik, grund](ärendehistorik-grund.md), [visa ärende och ändra status](visa-ärende-och-ändra-status.md) och `GET /api/tickets/{id}/history`.

## Begrepp och tillåtna värden

Fälten definieras i [API-kontraktet](../api/kontrakt.md) och [grundspecifikationen](ärendehistorik-grund.md). Dessa dokument är referenser för det befintliga backend- och API-beteendet, inte ändringsmål för den här specifikationen.

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| `type` | Händelsetyp | `Created`. Fler värden kan tillkomma (se D-4) |
| `occurredAt` | Händelsens tidpunkt | ISO 8601, UTC |
| Tidpunkt | Hur `occurredAt` visas | Samma format som ”Skapad” i detaljvyn, t.ex. ”10 nov. 2026 14:30”, i webbläsarens tidszon |

## Regler och fel

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| Ärendet laddas, saknas eller kunde inte hämtas | Historiksektionen visas inte | Bara detaljvyns befintliga tillstånd visas | D-1 |
| Historiken hämtas | Svar har inte kommit | ”Laddar historik…” visas i historiksektionen | D-2 |
| Händelser finns | Visa dem i API:ts ordning | Varje händelse visar tidpunkt och ”Ärendet registrerades” för `Created` | [Grundspec](ärendehistorik-grund.md) D-2 |
| Okänd `type` | Händelsen visas inte | Övriga händelser visas. Återstår inga visas tomtillståndet | D-4 |
| Tom historik (`[]`) | Ingen lista visas | ”Det finns inga händelser för ärendet.” | D-3 |
| Hämtningen misslyckas (5xx, annan felstatus som 404, eller nätverksfel) | Ingen lista visas | ”Historiken kunde inte hämtas. Försök igen.” Ärendets uppgifter och statusformulär fungerar | [Grundspec](ärendehistorik-grund.md) AK-7, D-5 |
| Status sparas | Historiken hämtas inte om | Historiken är oförändrad | D-6 |
| Navigering till ett annat ärende | Svar för föregående ärende ignoreras | Bara det aktuella ärendets historik visas | D-1 |

## Acceptanskriterier

AK-6 och AK-7 preciserar frontendbeteendet i grundspecifikationen. AK-10 till AK-12 gäller den här frontendutökningen och ändrar inte grundspecifikationens acceptanskriterier eller backendkrav.

### Detaljvyn

**AK-6: Historik visas**
- Given: Ett registrerat ärende
- When: Handläggaren öppnar ärendets detaljvy
- Then: Under rubriken ”Historik” visas en lista där händelsen har beskrivningen ”Ärendet registrerades” och en tidpunkt vars `datetime` motsvarar händelsens `occurredAt` efter normalisering med `new Date(occurredAt).toISOString()`

**AK-7: Historiken kunde inte hämtas**
- Given: Handläggaren öppnar ett ärendes detaljvy
- When: Historikanropet svarar med 5xx eller inte går att nå
- Then: ”Historiken kunde inte hämtas. Försök igen.” läses upp i stället för listan, och ärendets rubrik, uppgifter och statusformulär visas

**AK-10: Tom historik**
- Given: Ett ärende utan händelser
- When: Handläggaren öppnar ärendets detaljvy
- Then: ”Det finns inga händelser för ärendet.” visas i stället för listan

**AK-11: Historiken laddas**
- Given: Ärendet har laddats
- When: Historiksvaret ännu inte har kommit
- Then: ”Laddar historik…” visas i historiksektionen, och ärendets uppgifter visas

**AK-12: Okänd händelsetyp**
- Given: Historiken innehåller en händelse med en `type` som frontend inte känner till
- When: Handläggaren öppnar ärendets detaljvy
- Then: Den händelsen visas inte, och övriga händelser visas som vanligt

## API- och datakontrakt

- **Endpoint/händelse:** Befintligt `GET /api/tickets/{id}/history`.
- **Inkommande data:** Ingen, bara `id` i sökvägen.
- **Lyckat svar:** `200` med en lista av händelser, nyast först, eller `[]`.
- **Fel:** `404` `problem+json` för okänt ärende. Frontend behandlar alla fel lika (D-5).
- **Beständighet:** Frontend sparar inga historikhändelser.
- **Källor:** [API-kontrakt](../api/kontrakt.md), som fortsatt är källa för kontraktet.

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Historiken är en egen sektion med rubriken ”Historik” (`h2`, som övriga kort) och en lista (`ul`). Tidpunkter är `time`-element. Attributet `datetime` sätts till `new Date(occurredAt).toISOString()` (ISO-format med millisekunder och `Z`); den synliga tiden formateras i webbläsarens tidszon. Laddnings- och felmeddelandena har egna live-regioner som finns i DOM innan texten sätts, skilda från detaljvyns befintliga `status` och `alert`. Tillstånd förmedlas med text, inte bara färg.
- **Integritet/säkerhet:** Inga nya personuppgifter visas.
- **Övrigt:** Befintlig responsivitet och tillgänglighet i detaljvyn behålls.

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | Historiken visas bara när ärendet har laddats. Svar för ett tidigare ärende ignoreras | Historik utan ärende saknar sammanhang. Förhindrar fel historik vid snabb navigering | Sebastian | Beslutat |
| D-2 | Historiken har ett eget laddningstillstånd och blockerar inte resten av detaljvyn | Ärendet ska kunna användas även om historiken är långsam | Sebastian | Beslutat |
| D-3 | Tomtillståndets text är ”Det finns inga händelser för ärendet.” | Ärenden registrerade före historiken saknar händelser | Sebastian | Beslutat |
| D-4 | Händelser med okänd `type` visas inte | Kontraktet tillåter fler typer senare. Frontend ska inte gå sönder eller visa felaktig text | Sebastian | Beslutat |
| D-5 | Alla misslyckade historikanrop, även 404 och andra 4xx, ger samma felmeddelande | Ärendet har redan laddats, så 404 betyder ett oväntat läge. En text räcker | Sebastian | Beslutat |
| D-6 | Endast `Created` visas. Statusändringar skapar ännu inga händelser, så historiken hämtas inte om efter sparad status | Statushistorik får en egen spec. Det här arbetet ändrar inte grundspecifikationen | Sebastian | Beslutat |
| D-7 | Grundspecifikationen och API-kontraktet förblir auktoritativa för befintligt backend- och API-beteende. Den här specen äger frontendutökningens krav | Håller frontendkrav åtskilda från befintliga backendkrav | Sebastian | Beslutat |

## Öppna frågor

| Fråga | Påverkan om obesvarad | Ansvarig | Status |
|---|---|---|---|
| Inga öppna frågor | Inga | Sebastian | Stängd |

## Verifiering

Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-6 | Skapa ett ärende via API:t, öppna detaljvyn och kontrollera rubrik, listobjekt, beskrivning och att `datetime` motsvarar händelsens `occurredAt` efter `toISOString()`-normalisering | E2E, full stack | Automatisk |
| AK-7 | Serverfel och nätverksfel för historiken, var för sig. Ärendets rubrik och statusformulär visas | E2E, mockat API | Automatisk |
| AK-10 | Tomt historiksvar (kan inte skapas av riktiga stacken på begäran) | E2E, mockat API | Automatisk |
| AK-11 | Fördröjt historiksvar | E2E, mockat API | Automatisk |
| AK-12 | Svar med en okänd och en känd händelse | E2E, mockat API | Automatisk |
| D-1 | Öppna ett okänt ticket-id och kontrollera att ingen historiksektion visas | E2E, full stack | Automatisk |
| D-1 (föråldrat svar) | Granska att svar från föregående ticket ignoreras vid navigation; inget separat test | Kodgranskning | Manuell |
| D-6 | Spara en ny status och kontrollera att inget nytt historikanrop görs | E2E, full stack | Automatisk |
| D-5 | `404` för historiken ger felmeddelandet | E2E, mockat API | Automatisk |
| API-klient | Anropets sökväg, mappning av svar och fel till `ApiError` | Frontend unit (Vitest) | Automatisk |
| Tillgänglighet | Rubrik, lista och `time` hittas via roll och namn i E2E-testerna | E2E | Automatisk |
| Tillgänglighet | Laddnings- och felmeddelandet läses upp | Skärmläsare | Manuell |

## Genomförande

1. Skriv frontendtester utifrån acceptanskriterierna och se dem falla på beteende före implementation.
2. Lägg till historiktyper och hämtning i [API-klienten](../../frontend/src/api/client.ts).
3. Lägg till en separat historiksektion i [detaljvyn](../../frontend/src/pages/TicketDetailPage.tsx). Återanvänd `formatCreatedAt` för tidpunkten.
4. Mocka historikanropet i befintliga mockade detaljvytester ([laddning](../../frontend/e2e-mocked/ticket-detail-load.spec.ts), [sparning](../../frontend/e2e-mocked/ticket-detail-save.spec.ts)). Testernas krav ändras inte.
5. Kör verifieringen: frontendens lint, typecheck, unit-tester, build, mockade Playwright-svit och fullstacksviten via `compose.test.yaml`. Rapportera faktisk unit-täckning och eventuella hinder för manuell kontroll.

## Referenser

- [Ärendehistorik, grund](ärendehistorik-grund.md)
- [Visa ärende och ändra status](visa-ärende-och-ändra-status.md)
- [API-kontrakt](../api/kontrakt.md)
- [Specmall](_mall.md), [arbetssätt](../arbetssätt.md) och [teststrategi](../teststrategi.md)

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-10 | Specifikationen strukturerad efter specmallen | Sebastian |
| 2026-11-10 | Efter granskning: laddningstillstånd, okänd typ, alla fel lika, tidpunktsformat, beslut D-1 till D-7, AK-10 till AK-12 i Given/When/Then, verifiering per AK och relativa länkar | Sebastian |
| 2026-11-10 | Avgränsade ändringen till frontend; grundspecifikationen och API-kontraktet ändras inte | Sebastian |
| 2026-11-10 | Preciserade `datetime`, lade till verifiering för D-1 och D-6 samt kodgranskning av föråldrade svar | Sebastian |

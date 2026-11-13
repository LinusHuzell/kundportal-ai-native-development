# Spec: Ärendehistorik, grund

Ägare: Sebastian
Senast uppdaterad: 2026-11-10

## Sammanfattning

En handläggare ska i startsidans valda ärendepanel kunna se vad som har hänt med ärendet och när. Den här grundspecen beskriver registreringshändelsen (`Created`). Spårning av statusändringar utökas i [specifikationen för statusändringar](ärendehistorik-statusändringar.md); redigering ingår inte. Historiken är en enkel, skrivskyddad händelselogg.

Arbetssättet beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- Handläggaren kan se att och när ett ärende registrerades, i den valda ärendepanelen på startsidan.
- Historiken finns kvar efter omstart av applikationen.
- Modellen kan utökas med fler händelsetyper utan att befintlig historikdata går förlorad; API-utökningar beskrivs i respektive händelsespecifikation.

## Ingår

- Grundfunktionen skapar händelsetypen `Created`; statusändringar hanteras i [specifikationen för statusändringar](ärendehistorik-statusändringar.md).
- Backend skapar händelsen automatiskt när ett ärende registreras.
- Endpoint som returnerar ett ärendes historik, som en lista.
- Frontend: lista med händelser i den valda ärendepanelen på startsidan.
- Beständig lagring av händelserna (ny tabell, ny migration).
- Databasen tar bort historiken när ett ärende tas bort. Det finns ännu inget API för att radera ärenden.

## Ingår inte

- Statusändringshändelser ingår inte i grundfunktionens leverans; de specificeras i [specifikationen för statusändringar](ärendehistorik-statusändringar.md). Händelser för redigering ingår inte.
- Versionshistorik: vilka fält som ändrades och deras gamla och nya värden (se [avgränsningar](../avgränsningar.md)).
- Vem som gjorde ändringen, eftersom inloggning saknas.
- Kommentarer, anteckningar och manuella händelser.
- Redigering eller enskild radering av händelser. Händelser följer med när ärendet raderas.
- Filtrering, sökning och paginering.
- Registrering av ärenden. Den ägs av [registrera ärende](registrera-ärende.md), den här specen bygger på den.

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Ärendet finns.
- **Beroenden:** [Registrera ärende](registrera-ärende.md) och ärendelistan på startsidan.

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| Händelse | En post i ett ärendes historik | Skapas bara av backend |
| `type` | Vilken sorts händelse | `Created` i grundfunktionen; `StatusChanged` definieras i [specifikationen för statusändringar](ärendehistorik-statusändringar.md) |
| `occurredAt` | När händelsen inträffade, serverns tid i UTC | ISO 8601 |

## Regler och fel

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| Registrering | Ett ärende sparas | En `Created`-händelse skapas med samma tidpunkt som ärendets `createdAt` | D-1 |
| Misslyckad registrering | Anropet ger `400` | Inget ärende och ingen händelse sparas | [Registrera ärende](registrera-ärende.md) |
| Okänt ärende | `GET /api/tickets/{id}/history` med ett id som inte finns | `404` `problem+json` | [API-kontraktet](../api/kontrakt.md) |
| Ordning | Händelser listas nyast först. Vid samma tidpunkt gäller högst id först | Ordningen är entydig | D-2 |
| Atomicitet | Ärendet och dess händelse sparas tillsammans | Antingen sparas båda eller ingen | D-3 |
| Ärendet tas bort ur databasen | Ärendets händelser tas bort tillsammans med ärendet | Inga händelser utan ärende blir kvar | D-4 |
| Ärende utan händelser | `GET /api/tickets/{id}/history` för ett ärende som finns men saknar händelser | `200` med en tom lista | [API-kontraktet](../api/kontrakt.md) |

## Acceptanskriterier

### Händelser skapas

**AK-1: Registrering loggas**
- Given: Ett giltigt ärende registreras
- When: Ärendet sparas
- Then: Historiken för ärendet innehåller en händelse av typen `Created` med samma tidpunkt som ärendets `createdAt`

**AK-2: Misslyckad registrering loggas inte**
- Given: Ett ärende som bryter mot en regel i [registrera ärende](registrera-ärende.md)
- When: Anropet avvisas med `400`
- Then: Inget ärende och ingen händelse sparas

### API (backend)

**AK-3: Hämta historik**
- Given: Ett registrerat ärende
- When: `GET /api/tickets/{id}/history` anropas
- Then: Svaret är `200` med en lista som innehåller en `Created`-händelse

**AK-4: Okänt ärende**
- Given: Ett id som inte finns
- When: `GET /api/tickets/{id}/history` anropas
- Then: Svaret är `404` `problem+json`

**AK-5: Historiken finns kvar**
- Given: Ett ärende med en `Created`-händelse
- When: Applikationen startas om
- Then: Händelsen finns kvar

**AK-9: Ärende utan historik**
- Given: Ett ärende som finns men saknar händelser
- When: `GET /api/tickets/{id}/history` anropas
- Then: Svaret är `200` med en tom lista `[]`

### Startsida (frontend)

**AK-6: Historik visas**
- Given: Handläggaren väljer ett ärende på startsidan
- When: Ärendepanelen har laddats
- Then: Historiken visas som en lista med tidpunkt och beskrivningen "Ärendet registrerades"

**AK-7: Historiken kunde inte hämtas**
- Given: Handläggaren har valt ett ärende på startsidan
- When: Servern svarar med ett serverfel (5xx) eller inte går att nå
- Then: Meddelandet "Historiken kunde inte hämtas. Försök igen." visas i stället för listan, och resten av panelen fungerar

### Radering

**AK-8: Historiken raderas med ärendet**
- Given: Ett ärende med en `Created`-händelse
- When: Ärendet tas bort direkt i databasen
- Then: Händelsen finns inte kvar

## API- och datakontrakt

- **Endpoint/händelse:** `GET /api/tickets/{id}/history`
- **Inkommande data:** Ingen, bara `id` i sökvägen.
- **Lyckat svar:** `200` med en lista av händelser, nyast först:

  ```json
  [
    {
      "type": "Created",
      "occurredAt": "2026-11-10T09:00:00Z"
    }
  ]
  ```

  Om ärendet saknar händelser är svaret en tom lista (`[]`). Svarsfält för `StatusChanged` beskrivs i [specifikationen för statusändringar](ärendehistorik-statusändringar.md).

- **Fel:** `404` `problem+json` utan `errors` om ärendet inte finns.
- **Beständighet:** Händelserna sparas i en egen tabell kopplad till ärendet, finns kvar efter omstart och raderas när ärendet raderas.
- **Källor:** [API-kontrakt](../api/kontrakt.md). Kontraktet och `openapi.json` ska uppdateras när endpointen läggs till.

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Historiken är en lista (`ul`) med en rubrik. Tidpunkten är ett `time`-element. Felmeddelandet i AK-7 läses upp av skärmläsare.
- **Integritet/säkerhet:** Historiken innehåller inga personuppgifter utöver det som redan finns i ärendet.
- **Övrigt:** Inga särskilda krav.

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | Den här specen loggar bara registrering. Statusändring och redigering får en egen spec | Låg komplexitet. Redigering och statusändring ägs av andra och är inte klara | Sebastian | Beslutat |
| D-2 | Nyast först | Samma ordning som ärendelistan. Behövs när fler händelser finns | Sebastian | Beslutat |
| D-3 | Ärendet och händelsen sparas i samma transaktion | Annars kan historiken och ärendet bli osynkade | Sebastian | Beslutat |
| D-4 | Historiken raderas när ärendet raderas | Historik utan ärende saknar värde och skulle bryta främmande nyckeln | Sebastian | Beslutat |
| D-5 | Den här specen fortsätter vara grundspecifikation för `Created`; statusändringar har en separat normerande spec | Bevarar ursprungliga acceptanskriterier och ger utökningen en tydlig källa | Sebastian | Beslutat |

## Öppna frågor

Inga.

## Verifiering

Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-1 | Registrering skapar `Created`, läses tillbaka via API | Integration | Automatisk |
| AK-2 | `400` sparar ingen händelse | Integration | Automatisk |
| AK-3 | Historik hämtas för ett registrerat ärende | Integration | Automatisk |
| AK-4 | `404` `problem+json` för okänt ärende | Integration | Automatisk |
| AK-5 | Läs tillbaka via ny `DbContext` (`Fixture.CreateDbContext()`) | Integration | Automatisk |
| AK-6 | Händelsen visas i startsidans valda ärendepanel | Frontend E2E | Automatisk |
| AK-7 | Serverfel och nätverksfel vid hämtning (kan inte skapas av riktiga stacken på begäran) | E2E med mockat API | Automatisk |
| AK-8 | Ta bort ärendet via `DbContext` och läs tillbaka händelsen via en ny `Fixture.CreateDbContext()` | Integration | Automatisk |
| AK-9 | Historik hämtas för ett ärende utan händelser | Integration | Automatisk |
| Tillgänglighet | Lista, rubrik och `time`-element | Manuell kontroll med skärmläsare | Manuell |

## Referenser

- [Arbetssätt](../arbetssätt.md)
- [Avgränsningar](../avgränsningar.md)
- [API-kontrakt](../api/kontrakt.md)
- [Registrera ärende](registrera-ärende.md)
- [Ärendehistorik för statusändringar](ärendehistorik-statusändringar.md)

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-10 | Första utkast. Avgränsat till registrering, omdöpt till "grund" | Sebastian |
| 2026-11-10 | Beslutade att historiken raderas med ärendet och lade till AK-8 | Sebastian |
| 2026-11-10 | Lade till AK-9: tom lista för ärende utan händelser | Sebastian |
| 2026-11-12 | D-5: Behöll grundspecen som normerande källa för `Created` och hänvisade statusändringar till den separata utökningsspecen | Sebastian |

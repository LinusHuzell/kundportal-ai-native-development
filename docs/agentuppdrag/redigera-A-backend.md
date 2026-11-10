# Agentuppdrag: Redigera ärende, uppdrag A (backend)

Ansvarig: Carolina
Branch: `feat/redigera-ärende`
Spec: [docs/specs/redigera-ärende.md](../specs/redigera-ärende.md)

## 1. Prompt

```text
# Task A: backend for "Redigera ärende"

## Context
- Repo: Kundserviceportalen. Backend .NET 10 minimal API, EF Core, Postgres.
- Branch: feat/redigera-ärende. Work only here.
- Spec: docs/specs/redigera-ärende.md. It reuses the Felfall table in
  docs/specs/registrera-ärende.md, which is the only source for validation rules and
  error messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing) and docs/teststrategi.md. Follow them.
- API contract: docs/api/kontrakt.md and docs/api/openapi.json. PATCH /api/tickets/{id}:
  same fields as CreateTicketRequest, all optional, sent fields validated with the same rules.
- Current state: UpdateTicket.Handle is a stub that returns 501. UpdateTicketRequest takes
  TicketCategory and TicketPriority, so an unknown value gives a JSON binding error instead
  of a field error. CreateTicket.cs is implemented and shows the pattern to follow,
  including CreateTicketValidator.
- Code and comments in English. Docs and error messages in Swedish.

## Goal
PATCH /api/tickets/{id} works as the spec says. Covers the backend part of AK-1 and AK-2,
and AK-4, AK-5 and AK-6.

## Decisions already made (do not ask again)
1. A field that is missing or null means "do not change". A field that is sent is
   validated with the same rule and message as in Felfall. An empty string or only
   spaces is an error, not "do not change".
2. Category and priority arrive as strings, like in CreateTicketRequest, so an unknown
   value becomes a 400 on that field. Case must match (Medium, not medium).
3. The rules must not be copied. Both create and update use the same rule code. If you
   refactor CreateTicketValidator to share it, its behaviour must stay exactly the same,
   and the existing CreateTicketValidatorTests must pass without any change.
4. Status, ticketNumber, id and createdAt cannot be changed with PATCH. If they are sent,
   they are ignored.
5. A request with no fields (empty object) gives 200 and the unchanged ticket.
6. On a 400, nothing is saved. All invalid fields are reported in the same response.
7. Unknown id gives 404 (ProblemDetails, like GetTicket).
8. No history event for edits. That belongs to a later ärendehistorik spec.
9. Values are not trimmed. Length is counted on the value as sent.

## Stage 0: plan only
1. Read the spec, registrera-ärende.md (Felfall), AGENTS.md, docs/teststrategi.md,
   kontrakt.md and the backend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec, the contract and the code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- backend/src/CustomerService.Api/Features/Tickets/UpdateTicket.cs
- backend/src/CustomerService.Api/Features/Tickets/CreateTicket.cs (only to share the
  validation rules, decision 3)
- backend/tests/CustomerService.Api.UnitTests/ (new test files only)
- backend/tests/CustomerService.Api.IntegrationTests/ (new test files only)
- docs/api/openapi.json (regenerated, never by hand) and docs/api/kontrakt.md
- This log file, sections 2, 3 and 4
Ask before touching anything else.

## Tests
- Unit (xUnit): one test per Felfall row for a sent field, plus boundaries (200/201 and
  5000/5001 characters). A request with only one valid field gives no errors. A request
  with all fields null gives no errors.
- Integration (WebApplicationFactory + Testcontainers), on a ticket you create in the test:
  - Valid change of one field gives 200, the new value, and the other fields unchanged.
  - Valid change of all six fields gives 200 and all new values.
  - One 400 test per rule, each checking the field key and that the ticket in the
    database is unchanged (read back with a new DbContext).
  - Unknown id gives 404.
  - Sending status gives 200 and the status is unchanged (decision 4).
  - Empty object gives 200 and the unchanged ticket (decision 5).
- Red first: show each test failing on an assertion before the code exists.
- Sabotage-check, one at a time: remove the empty rule for a sent title, treat a missing
  field as an error, remove SaveChangesAsync, let status be changed. Report which tests failed.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green, with the final report.

## Commands
- cd backend && dotnet test CustomerService.slnx
- cd backend && dotnet build src/CustomerService.Api -p:GenerateOpenApi=true

## Boundaries
- No frontend changes. That is task B.
- No new packages without asking.
- Do not change other endpoints (create, list, get, status, history) other than decision 3.
- No database changes and no new migration.
- Never weaken, skip or delete a test to make it pass.
- Do not commit, push or open a pull request.

## Report (section 4 of this file)
- Changed files.
- Commands run and their real output.
- AK covered, and AK not verified with the reason.
- Anything you are unsure about.
- Never say something works unless you ran the check.
```

### Varför prompten ser ut så här

| Del | Varför |
|---|---|
| Beslut 1 (saknat fält jämfört med tomt fält) | Specen lämnar det öppet under Gränsfall. Utan beslutet gissar agenten. |
| Beslut 2 (strängar för kategori och prioritet) | Annars ger ett okänt värde ett JSON-fel utan fältkoppling. Det bryter mot AK-5. |
| Beslut 3 (samma regelkod) | Registrera och redigera ska ge exakt samma felmeddelanden. Kopierade regler kan glida isär. |
| Befintliga tester får inte ändras | Visar att registrera fortfarande fungerar efter en refaktorering. |
| Beslut 4 (status ignoreras) | Statusändring är Linus moment och har en egen endpoint. |
| Beslut 8 (ingen historikhändelse) | Ärendehistorikens spec säger att redigering hör till en kommande spec. |
| Lista över filer | Andra i gruppen äger de andra endpoints. |
| Röda tester först och sabotagekontroll | Teststrategin kräver det. Det visar att testerna kan falla. |
| Tre kontrollpunkter | Jag granskar planen, testerna och resultatet var för sig. |

## 2. Plan

Skriven av Claude (steg 0). Inga andra filer är ändrade.

### Utgångsläge (läst i koden)

- `UpdateTicket.Handle` returnerar `501`. `UpdateTicketRequest` har `TicketCategory?` och
  `TicketPriority?`, så `"category": "Foo"` ger ett JSON-bindningsfel utan `errors`. Den har också
  `[EmailAddress]` på `customerEmail`, som i OpenAPI dokumenterar ett annat format än Felfall-regexen.
- `CreateTicketValidator` (i `CreateTicket.cs`) har alla regler inbakade i en metod. Ett saknat
  fält (`null`) ger fel, vilket är rätt för POST men fel för PATCH (beslut 1).
- `UpdateTicketStatus` visar mönstret för 404: `FindAsync`, sedan `Results.Problem(404)`, och
  validerar före uppslaget.
- System.Text.Json ignorerar okända egenskaper som standard, så `status`, `id`, `ticketNumber` och
  `createdAt` ignoreras redan om de inte finns i `UpdateTicketRequest` (beslut 4).

### Design

Regeln per fält bryts ut till en gemensam klass, `TicketFieldRules`, med en metod per fält som tar
värdet och returnerar felmeddelandet eller `null`:

```csharp
public static partial class TicketFieldRules
{
    public static string? Title(string? value);        // tomt/mellanslag, > 200
    public static string? Description(string? value); // tomt/mellanslag, > 5000
    public static string? Category(string? value);     // inte exakt enum-namn
    public static string? Priority(string? value);     // inte exakt enum-namn
    public static string? CustomerName(string? value); // tomt/mellanslag
    public static string? CustomerEmail(string? value);// tomt/mellanslag, regex med \z
}
```

- `CreateTicketValidator.Validate` anropar alla sex för varje fält (`null` ger "måste fyllas i"
  som i dag). Beteendet är oförändrat och de befintliga testerna rörs inte.
- `UpdateTicketValidator.Validate(UpdateTicketRequest)` anropar regeln bara för fält som inte är
  `null`. En tom sträng eller bara mellanslag skickas alltså till regeln och ger fel (beslut 1).
- Klassen läggs i `CreateTicket.cs`, eftersom nya filer i `src/` inte finns i listan över tillåtna
  filer (se fråga 1).

### Steg

| # | Vad | AK | Filer | Tester |
|---|---|---|---|---|
| 1 | Bryt ut `TicketFieldRules` och låt `CreateTicketValidator` använda den. Ingen beteendeändring. | – (beslut 3) | `CreateTicket.cs` | Befintliga `CreateTicketValidatorTests` och `CreateTicketTests` ska vara gröna utan ändring, före och efter. |
| 2 | Ändra `UpdateTicketRequest`: `Category` och `Priority` blir `string?`, `[EmailAddress]` tas bort, `[MaxLength]` behålls för OpenAPI. Lägg till en stub `UpdateTicketValidator.Validate` som returnerar en tom ordbok, så att unit-testerna kompilerar och faller på påståenden. | AK-5 | `UpdateTicket.cs` | – |
| 3 | Skriv unit-tester (röda). | AK-2, AK-5 | ny `UnitTests/Features/Tickets/UpdateTicketValidatorTests.cs` | Se "Unit-tester" nedan |
| 4 | Skriv integrationstester (röda mot `501`-stubben). | AK-1, AK-2, AK-4, AK-5, AK-6 | ny `IntegrationTests/Features/Tickets/UpdateTicketTests.cs` | Se "Integrationstester" nedan |
| — | **Kontrollpunkt 2**: visa röd utdata. | | | |
| 5 | Implementera `UpdateTicketValidator` med `TicketFieldRules`. | AK-2, AK-5 | `UpdateTicket.cs` | Unit-testerna blir gröna |
| 6 | Implementera `Handle`: validera → `400` (inget sparas); `FindAsync` → `404` som problem+json; sätt bara de fält som inte är `null`; `SaveChangesAsync`; `200` med `TicketResponse.From`. Ingen `TicketEvent` (beslut 8). Inget trimmas (beslut 9). | AK-1, AK-4, AK-5, AK-6 | `UpdateTicket.cs` | Integrationstesterna blir gröna |
| 7 | Sabotagekontroller, en i taget, och återställ: (a) ta bort tom-regeln för skickad rubrik, (b) behandla saknat fält som fel, (c) ta bort `SaveChangesAsync`, (d) låt status ändras (lägg tillfälligt till `Status` i requesten och sätt den). Rapportera vilka tester som föll. | – | `UpdateTicket.cs` (tillfälligt) | – |
| 8 | Generera om `openapi.json` och uppdatera `kontrakt.md` (avsnittet `UpdateTicketRequest` och Validering). | – | `docs/api/openapi.json`, `docs/api/kontrakt.md` | Backend CI:s kontroll av `openapi.json` |
| 9 | Kör hela `dotnet test CustomerService.slnx`, skriv avsnitt 4. **Kontrollpunkt 3.** | | detta dokument | |

### Unit-tester (`UpdateTicketValidatorTests`)

Basen är en request med alla fält `null`. Varje test sätter ett fält.

- Alla fält `null` ger inga fel.
- Ett giltigt fält i taget ger inga fel (`[Theory]` över de sex fälten med giltiga värden).
- Rubrik: `""` och `"   "` ger "Rubrik måste fyllas i". 200 tecken godkänns, 201 ger
  "Rubrik får vara högst 200 tecken". 199 tecken + två mellanslag ger längdfel (inte trimmat).
- Beskrivning: `""` och `"   "` ger "Beskrivning måste fyllas i". 5000 godkänns, 5001 ger
  "Beskrivning får vara högst 5000 tecken".
- Kategori: `""`, `"   "` ger "Välj en kategori" (raden "Inget val gjort" för ett skickat fält).
  `"Foo"`, `"other"`, `"0"` ger "Välj en kategori".
- Prioritet: `""`, `"   "` ger "Välj en prioritet". `"Foo"`, `"medium"`, `"1"`, `"Low, High"` ger
  "Välj en prioritet".
- Namn: `""`, `"   "` ger "Namn måste fyllas i".
- Email: `""`, `"   "` ger "E-postadress måste fyllas i". Fel format (samma värden som i
  `CreateTicketValidatorTests`, inklusive avslutande `\n`) ger "Ange en giltig e-postadress".
- Två ogiltiga fält ger två nycklar (beslut 6).

Varje test kontrollerar att det bara finns just den nyckeln och just det meddelandet.

### Integrationstester (`UpdateTicketTests`)

Varje test skapar sitt ärende via `POST /api/tickets`. "Oförändrat i databasen" läses med en ny
`Fixture.CreateDbContext()` och jämförs med värdena från skapandet.

- Giltig ändring av rubriken ger `200`, ny rubrik i svaret, övriga fält oförändrade; ändringen är
  sparad (läst med ny `DbContext`). (AK-1, AK-4)
- Giltig ändring av alla sex fält ger `200` och alla nya värden, sparade. (AK-1, AK-4)
- En `400` per regel, var och en med fältnyckeln i `errors`, problem+json och ärendet oförändrat i
  databasen (AK-2, AK-5):
  tom rubrik, rubrik 201 tecken, tom beskrivning, beskrivning 5001 tecken, okänd kategori,
  okänd prioritet, tomt namn, tom email, email med fel format.
- En giltig och en ogiltig ändring i samma anrop ger `400` och inte heller den giltiga sparas
  (beslut 6).
- Okänt id ger `404` som problem+json utan `errors`. (AK-6)
- `status`, `ticketNumber`, `id` och `createdAt` i anropet ger `200` och värdena är oförändrade.
  (beslut 4) Uppdraget nämner bara status; jag föreslår att alla fyra skickas i samma test.
- `{}` ger `200` och ärendet oförändrat i svaret och i databasen. (beslut 5)
- Ingen ny `TicketEvent` efter en redigering (beslut 8), via `GET /api/tickets/{id}/history`.
  Se fråga 5.

### Oklart eller motsägelsefullt

1. **Var den gemensamma regelkoden ska ligga.** Renast är en ny fil, t.ex.
   `Features/Tickets/TicketFieldRules.cs`, men nya filer i `src/` finns inte i listan. Planen lägger
   den i `CreateTicket.cs`. Vill du ha en egen fil?
2. **Ordning mellan 400 och 404.** Varken specen eller kontraktet säger vad ett ogiltigt anrop
   mot ett okänt id ger. Planen gör som `PUT /status`: validering först (`400`), sedan `404`.
   Ska detta stå i kontrakt.md?
3. **Kontraktets valideringstabell** säger "Saknas, tomt …" för `POST`. För `PATCH` gäller "saknas
   eller `null` = ändra inte". Jag lägger till det under `UpdateTicketRequest` i kontrakt.md, plus
   att `status`, `id`, `ticketNumber` och `createdAt` ignoreras, att `{}` ger `200`, och att ingen
   historikhändelse skapas.
4. **`kontrakt.md` har ett inaktuellt stycke** direkt efter status-tabellen: "Ärendet får också ett
   internt ärendenummer … som inte finns i API:t". Det motsäger avsnittet ovanför, där
   `ticketNumber` finns i alla svar. Det hör inte till detta uppdrag. Ska jag ta bort det eller
   låta det vara?
5. **Test för "ingen historikhändelse"** (beslut 8) står inte i uppdragets testlista. Gränsfallet
   finns i specen, så enligt AGENTS.md ska det ha ett test. Får jag lägga till det?
6. **`backend/README.md`** säger att handlers är stubbar som returnerar `501`. Det stämmer inte
   längre efter detta. Filen finns inte i listan. Ska jag uppdatera den?
7. **AK-1 och AK-2** handlar om visning i frontend (aria-describedby, "ärendet uppdateras" i UI).
   Här täcks bara backenddelen. AK-3 och AK-7–AK-11 är frontend (uppdrag B) och verifieras inte här.
8. **Explicit `null` och saknat fält** går inte att skilja åt med en record och System.Text.Json.
   Båda betyder "ändra inte" enligt beslut 1, så det spelar ingen roll, men det går alltså inte att
   nollställa ett fält med PATCH. Alla sex fält är obligatoriska i databasen, så det är avsiktligt.
9. **`[MaxLength]` på `UpdateTicketRequest`** behålls bara för OpenAPI, som i `CreateTicketRequest`.
   `[EmailAddress]` tas bort eftersom det dokumenterar `format: email`, som inte är Felfall-regeln.
   `openapi.json` ändras därför för `category`, `priority` (blir `string`/`null`) och `customerEmail`.

## 3. Kontrollpunkter

### Kontrollpunkt 1 (plan godkänd 2026-11-10)

Svar från Carolina:
1. Ny fil `Features/Tickets/TicketFieldRules.cs` för de gemensamma reglerna.
2. Validering först, som `PUT /status`. En rad om det i kontrakt.md.
3. Ta bort det inaktuella stycket om ärendenumret i kontrakt.md.
4. Lägg till test för att redigering inte skapar historikhändelse, och skicka `id`, `ticketNumber`
   och `createdAt` i samma test som `status`.
5. Uppdatera bara raden om 501-stubbar i `backend/README.md`.

### Kontrollpunkt 2 (röda tester)

Gjort:
- `TicketFieldRules.cs` skapad. `CreateTicketValidator` använder den.
- `UpdateTicketRequest`: `category` och `priority` är `string?`, `[EmailAddress]` borttagen.
  `UpdateTicketValidator.Validate` är en stub som returnerar inga fel.
- Nya testfiler: `UpdateTicketValidatorTests.cs` (unit) och `UpdateTicketTests.cs` (integration).

Unit (`dotnet test tests/CustomerService.Api.UnitTests`):
`Failed: 30, Passed: 68, Total: 98`. Alla 30 fel ligger i `UpdateTicketValidatorTests` och faller
på påståendet (`Expected ["title"] Actual []` osv.). De 9 som går igenom där är de som väntar sig
inga fel (alla null, ett giltigt fält ×6, 200 och 5000 tecken), vilket stubben ger. De prövas av
sabotage (b). `CreateTicketValidatorTests` 47/47 gröna efter refaktoreringen, filen oförändrad.

Blockerat: integrationstestprojektet kompilerar inte, redan på `HEAD`/`origin/main` (8b070f4),
utan mina ändringar (kontrollerat i en ren worktree). `ListTicketsTests.cs` rad 16 och 26 skapar
`Ticket` utan de obligatoriska `CustomerName` och `CustomerEmail` (CS9035). Filen finns inte i
listan över tillåtna filer.

Beslut (Carolina): rätta det på denna branch. `CustomerName` och `CustomerEmail` är tillagda i de
två `new Ticket { … }` i `ListTicketsTests.cs`. Inga påståenden ändrade.

Integration (`dotnet test tests/CustomerService.Api.IntegrationTests`):
`Passed: 39, Failed: 18`. Alla 18 fel ligger i `UpdateTicketTests` (alla tester där) och faller på
statuskodspåståendet, med `Actual: NotImplemented` (501-stubben) i alla 18. Alla befintliga
integrationstester är gröna, även `ListTicketsTests` efter rättningen.

## 4. Resultat

Skrivet av Claude 2026-11-10. Inget är committat eller pushat.

### Ändrade filer

| Fil | Ändring |
|---|---|
| `backend/src/CustomerService.Api/Features/Tickets/TicketFieldRules.cs` | Ny. En regel per fält, delad av registrera och redigera (beslut 3). |
| `backend/src/CustomerService.Api/Features/Tickets/CreateTicket.cs` | `CreateTicketValidator` använder `TicketFieldRules`. Samma beteende. |
| `backend/src/CustomerService.Api/Features/Tickets/UpdateTicket.cs` | `category`/`priority` som `string?`, `[EmailAddress]` borttagen, `UpdateTicketValidator`, riktig `Handle`. |
| `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/UpdateTicketValidatorTests.cs` | Ny, 39 testfall. |
| `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/UpdateTicketTests.cs` | Ny, 18 testfall. |
| `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/ListTicketsTests.cs` | `CustomerName`/`CustomerEmail` i två `new Ticket`, så att projektet kompilerar (godkänt vid kontrollpunkt 2). Inga påståenden ändrade. |
| `docs/api/openapi.json` | Omgenererad. `category` och `priority` i `UpdateTicketRequest` är nu `string`/`null`. |
| `docs/api/kontrakt.md` | PATCH-regler under `UpdateTicketRequest`, rad om validering före 404, `PATCH` nämnd vid Felfall, inaktuellt stycke om internt ärendenummer borttaget. |
| `backend/README.md` | Bara raden om 501-stubbar. |

`CreateTicketValidatorTests.cs` är oförändrad (`git diff` tom).

### Körda kommandon och utdata

`cd backend && dotnet test CustomerService.slnx` (slutlig körning):

```
Passed!  - Failed:     0, Passed:    98, Skipped:     0, Total:    98 - CustomerService.Api.UnitTests.dll (net10.0)
Passed!  - Failed:     0, Passed:    57, Skipped:     0, Total:    57 - CustomerService.Api.IntegrationTests.dll (net10.0)
```

`cd backend && dotnet build src/CustomerService.Api -p:GenerateOpenApi=true`: `0 Warning(s)`,
`0 Error(s)`. En andra omgenerering gav en byte-identisk fil, så CI:s kontroll bör gå igenom
(CI-jobbet självt är inte kört).

Röda tester: se avsnitt 3 (unit 30 röda, integration 18 röda, alla på påståenden).

### Sabotagekontroller (en i taget, återställda efter varje)

| Sabotage | Tester som föll |
|---|---|
| (a) Tom-regeln för rubrik borttagen (`IsNullOrWhiteSpace` → `is null` i `TicketFieldRules.Title`) | Unit 6: `Empty_title_is_rejected` ×2, `Sent_empty_title_is_rejected` ×2, `Each_invalid_field_gets_its_own_error` ×2 (create och update). Integration 4: `UpdateTicketTests.InvalidValue…(title, "")`, `UnknownIdWithInvalidFieldReturns400…`, `CreateTicketTests.InvalidValue…(title, "   ")`, `TicketHistoryTests.RejectedRegistrationSavesNeitherTicketNorEvent`. |
| (b) Saknat fält behandlas som fel (`value is not null` borttaget) | Unit 39, alla i `UpdateTicketValidatorTests`, även de 9 som var gröna mot stubben. Integration 17 av 18 i `UpdateTicketTests` (inte `ValidChangeOfAllSixFields…`, som skickar alla fält). |
| (c) `SaveChangesAsync` borttagen | Integration 3: `ValidChangeOfOneField…`, `ValidChangeOfAllSixFields…`, `StatusIdTicketNumberAndCreatedAt…Ignored`. Unit 0. |
| (d) Status går att ändra (`Status` tillfälligt i requesten och satt i `Handle`) | Integration 1: `StatusIdTicketNumberAndCreatedAtInRequestAreIgnored`. Unit 0. |

Efter återställningen visade `git diff` bara de avsedda ändringarna, och slutkörningen ovan är grön.

### AK

| AK | Status | Test |
|---|---|---|
| AK-1 (backenddelen) | Täckt | `ValidChangeOfOneField…`, `ValidChangeOfAllSixFields…` |
| AK-2 (backenddelen) | Täckt | `InvalidValue…`, `TooLongValue…`, `ValidAndInvalidFieldTogether…` + unit |
| AK-4 | Täckt | Som AK-1, med `200` och läsning via ny `DbContext` |
| AK-5 | Täckt | En `400` per Felfall-regel med fältnyckel, meddelande och oförändrat ärende |
| AK-6 | Täckt | `UnknownIdReturns404AsProblemJson` |
| Gränsfall | Täckt | `{}` och alla `null` (200, oförändrat), status/id/ticketNumber/createdAt ignoreras, ingen historikhändelse, längd räknas utan trimning (unit), validering före 404 |
| AK-1/AK-2 frontenddelen, AK-3, AK-7–AK-11 | Inte verifierade här | Frontend, uppdrag B |

### Osäkert eller värt att veta

- **Planens punkt 9 stämde inte helt.** `[EmailAddress]` gav inget `format: email` i den gamla
  `openapi.json`, så `customerEmail` ändrades inte där. Attributet är ändå borttaget, eftersom det
  inte är Felfall-regeln.
- **`main` var trasigt** för integrationstesterna (`ListTicketsTests.cs`, CS9035) före detta
  uppdrag. Backend CI på `main` lär ha fallit av det. Rättningen följer med denna branch; Linus bör
  få veta, eftersom filen är hans.
- **Sabotage (a) gav även fel i registrera-testerna**, eftersom regeln nu är gemensam. Det visar
  att båda endpoints använder samma kod, som beslut 3 kräver.
- **Explicit `null` och saknat fält** går inte att skilja åt. Båda betyder "ändra inte", så det
  går inte att nollställa ett fält med PATCH. Det är avsiktligt, eftersom alla sex fält är
  obligatoriska.
- **Samtidiga redigeringar**: den sista som sparar vinner, utan konfliktkontroll. Specen säger
  inget om det.
- E2E (Playwright) och frontend är inte körda. De berörs inte av ändringen, men E2E-workflowen
  körs i CI vid ändringar i backend.

## 5. Min granskning

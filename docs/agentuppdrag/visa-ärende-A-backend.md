# Agentuppdrag: Visa ärende och ändra status, uppdrag A (backend)

Ansvarig: Linus
Datum: 2026-11-10
Branch: `feat/visa-arende`
Spec: [docs/specs/visa-ärende-och-ändra-status.md](../specs/visa-ärende-och-ändra-status.md)

## 1. Prompt

Utkast av Claude utifrån specen och mina beslut. Granskad, ändrad och godkänd av Linus.

```text
# Task A: backend for "Visa ärende och ändra status"

## Context
- Repo: Kundserviceportalen. Backend .NET 10 minimal API, EF Core, Postgres.
- Branch: feat/visa-arende. Work only here.
- Spec: docs/specs/visa-ärende-och-ändra-status.md. The Felfall table is the only source
  for rules and error messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing) and docs/teststrategi.md. Follow them.
- API contract: docs/api/kontrakt.md and docs/api/openapi.json.
- Current state: GetTicket.Handle and UpdateTicketStatus.Handle are stubs that return 501.
  UpdateStatusRequest takes TicketStatus, so an unknown value gives a JSON binding error
  instead of a field error. CreateTicket.cs is implemented and shows the pattern to follow.
- Code and comments in English. Docs and error messages in Swedish.

## Goal
GET /api/tickets/{id} and PUT /api/tickets/{id}/status work as the spec says.
Covers AK-13 to AK-19.

## Decisions already made (do not ask again)
1. Status arrives as a string (UpdateStatusRequest(string? Status)), so a missing or
   unknown value becomes a 400 on "status", not a JSON parsing error. Case must match.
2. Rules live in a static UpdateTicketStatusValidator, like CreateTicketValidator, so they
   can be unit tested without HTTP or a database.
3. "New" is never a valid target, also when the ticket already has status New.
4. The same status as the current one is not an error: 200, ticket unchanged.
5. Error key is "status" (camelCase). 404 is problem+json without errors.
6. The order between 400 and 404 (invalid status on an unknown id) is not in the spec.
   Do not test it.
7. Ticket-to-TicketResponse mapping may move to one shared place in TicketModels.cs.
   Do not change CreateTicket.cs to use it.

## Stage 0: plan only
1. Read the spec, AGENTS.md, docs/teststrategi.md, kontrakt.md and the backend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec and code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- backend/src/CustomerService.Api/Features/Tickets/GetTicket.cs
- backend/src/CustomerService.Api/Features/Tickets/UpdateTicketStatus.cs
- backend/src/CustomerService.Api/Features/Tickets/TicketModels.cs (mapping only)
- backend/tests/CustomerService.Api.UnitTests/Features/Tickets/ (new test files)
- backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/ (new test files)
- docs/api/openapi.json (regenerated, never by hand) and docs/api/kontrakt.md
- This file, sections 2, 3 and 4
Ask before touching anything else.

## Tests
- Unit (xUnit): one test per API row in Felfall (New; missing, null, empty, whitespace,
  unknown, wrong case), plus each valid target (InProgress, WaitingForCustomer, Closed).
  Use one [Theory] for the invalid values that share a message, and one for the valid
  targets. New gets its own test.
- Integration (WebApplicationFactory + Testcontainers): one test per AK-13 to AK-19.
  Create the test data through POST /api/tickets. Read persistence back through
  GET /api/tickets/{id}, never from the DbContext that wrote it. Every 400 test also
  checks that the status is unchanged.
- Red first: show each test failing on an assertion, not a compile error.
- Sabotage-check: (a) skip SaveChanges in the status update, (b) remove the New rule.
  Report which tests failed and why, then restore.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green and sabotage-checked, with the final report.

## Commands
- cd backend && dotnet test CustomerService.slnx
- cd backend && dotnet build src/CustomerService.Api -p:GenerateOpenApi=true

## Boundaries
- No frontend changes. That is task B.
- No new packages without asking.
- Do not change other endpoints, the Ticket entity, migrations or seed data.
- Never weaken, skip or delete a test to make it pass.
- Do not commit, push or open a pull request.

## Report (section 4 of this file)
- Changed files.
- Commands run and their real output (shortened to the decisive lines).
- AK covered, and AK not verified with the reason.
- Sabotage results.
- Anything you are unsure about.
- Never say something works unless you ran the check.
```

### Varför prompten ser ut så här

| Del | Varför |
|---|---|
| Nuläge med stubbar och `TicketStatus` i requesten | Utan det skulle agenten behålla enum-bindningen, och då ger `"Foo"` ett generiskt JSON-fel i stället för felet "Välj en giltig status" på fältet. |
| Beslut redan fattade | Fattade i specarbetet. Utan dem frågar agenten igen eller gissar, till exempel om samma status är ett fel. |
| Beslut 6, ordningen 400/404 | Medvetet utanför specen. Agenten ska inte uppfinna och testa beteende som inte är specat. |
| Plan först, stopp | Jag vill granska planen mot specen innan någon kod skrivs. |
| Lista över filer | Andra delar av backend ägs av andra i gruppen. Agenten ska inte röra dem. |
| Testdata via `POST`, läsa tillbaka via `GET` | `AGENTS.md`: varje feature testar sin persistens genom sitt API. |
| Röda tester först och två sabotage | Visar att testerna kan falla av rätt anledning, särskilt för sparningen och Nytt-regeln. |
| Verkliga körresultat | AI:s besked räcker inte. Kontrollerna måste vara körda. |

## 2. Plan

Skriven av agenten i Stage 0. Inga andra filer är ändrade.

### Läst

Specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md`, `docs/api/openapi.json`
(status-endpointen och `UpdateStatusRequest`), planen i `registrera-A-backend.md` som förebild, och
koden under `backend/src/CustomerService.Api` (`Features/Tickets/*`, `Data/Ticket.cs`, `Program.cs`)
och `backend/tests` (fixture, `CreateTicketTests`, `CreateTicketValidatorTests`, `TicketStatusTests`).

### Steg

**Steg 1. Request som sträng och en tom validator (AK-17, AK-18)**
- Fil: `Features/Tickets/UpdateTicketStatus.cs`.
- `UpdateStatusRequest([property: Required] string? Status)` (beslut 1). `[Required]` är bara
  dokumentation för OpenAPI, som i `CreateTicketRequest`, eftersom `AddValidation()` inte är på.
- Ny `public static class UpdateTicketStatusValidator` med
  `Validate(UpdateStatusRequest) → Dictionary<string, string[]>` (beslut 2). I det här steget
  returnerar den alltid ett platshållarfel på `status`, så att både giltiga och ogiltiga fall
  kompilerar och faller på påståenden. Handlern är kvar som 501-stubbe.
- Tester: inga. Steget finns för att testerna i steg 2 och 3 ska kompilera.

**Steg 2. Enhetstester för statusregeln (AK-17, AK-18)**
- Ny fil: `tests/CustomerService.Api.UnitTests/Features/Tickets/UpdateTicketStatusValidatorTests.cs`.
- Varje test kontrollerar att `errors` bara har nyckeln `status` och exakt meddelande.
  - `[Fact]` `"New"` ger "Status kan inte ändras till Nytt" (beslut 3).
  - `[Theory]` ogiltiga värden ger "Välj en giltig status": `null` (saknas eller null), `""`,
    `"   "`, `"Foo"`, `"new"` och `"inprogress"` (fel skiftläge), `"1"` (enumens talvärde).
  - `[Theory]` giltiga mål ger inga fel: `InProgress`, `WaitingForCustomer`, `Closed`.

**Steg 3. Integrationstester (AK-13 till AK-19)**
- Nya filer i `tests/CustomerService.Api.IntegrationTests/Features/Tickets/`: `GetTicketTests.cs` och
  `UpdateTicketStatusTests.cs`, båda ärver `IntegrationTest`. Ärenden skapas via `POST /api/tickets`.
  Status läses tillbaka via `GET /api/tickets/{id}` med en ny `HttpClient`. PUT-anropen skickar rå JSON,
  så att `{}` och `"status": ""` går att skicka.
- AK-13: skapa ett ärende, `GET` ger `200` och samma nio fält med samma värden som `POST`-svaret.
- AK-14: `GET /api/tickets/999` på tom databas ger `404`, `application/problem+json`, `status: 404`
  i kroppen och ingen `errors` (beslut 5).
- AK-15: `PUT` med `WaitingForCustomer` ger `200` med ärendet och den nya statusen, och `GET`
  efteråt visar `WaitingForCustomer`. Se fråga 2 om ett eller två tester.
- AK-16: sätt `InProgress`, läs ärendet med `GET`, `PUT` `InProgress` igen. Svaret är `200` och lika
  med ärendet före, och `GET` efteråt är också lika (beslut 4).
- AK-17: sätt först `InProgress`, sedan `PUT` `New`. Svaret är `400`, problem+json,
  `errors` = `{ status: ["Status kan inte ändras till Nytt"] }`, och `GET` visar fortfarande
  `InProgress`. Förstatusen `InProgress` gör kontrollen "oförändrad" meningsfull: med `New` som
  förstatus skulle en borttagen regel ge samma status.
- AK-18: `[Theory]` med kropparna `{}`, `{"status":""}` och `{"status":"Foo"}`. Svaret är `400`,
  problem+json, `errors` = `{ status: ["Välj en giltig status"] }`, och `GET` visar fortfarande `New`.
- AK-19: `PUT /api/tickets/999/status` med `InProgress` ger `404` som problem+json utan `errors`.
- Ordningen mellan 400 och 404 testas inte (beslut 6).

**Kontrollpunkt 2:** kör `dotnet test` och visa verklig utskrift. Enhetstesterna ska falla på
platshållarfelet. Integrationstesterna ska falla på statuskoden `501`.

**Steg 4. Validatorn (AK-17, AK-18)**
- Fil: `Features/Tickets/UpdateTicketStatus.cs`.
- `"New"` (ordinal jämförelse) ger "Status kan inte ändras till Nytt". Annars ger ett värde som inte
  finns exakt i `Enum.GetNames<TicketStatus>()` "Välj en giltig status". Det täcker saknat, `null`,
  tomt, bara mellanslag, okänt, fel skiftläge och `"1"`. Ingen `Enum.TryParse`.
- Hjälpfunktionen `IsEnumName` i `CreateTicketValidator` är privat, och `CreateTicket.cs` ska inte
  ändras. Jag skriver därför en egen enradare i den nya validatorn.

**Steg 5. Mappning och `GET /api/tickets/{id}` (AK-13, AK-14)**
- Filer: `Features/Tickets/TicketModels.cs`, `Features/Tickets/GetTicket.cs`.
- `TicketModels.cs`: en statisk `TicketResponse.From(Ticket)` (bara mappning, beslut 7).
  `CreateTicket.cs` lämnas orörd.
- `GetTicket.Handle`: `FindAsync(id)` med `ApplicationDbContext`. Saknas ärendet:
  `Results.Problem(statusCode: 404)`, som ger problem+json utan `errors` även utan
  `AddProblemDetails()`. `Results.NotFound()` ger en tom kropp och används därför inte.

**Steg 6. `PUT /api/tickets/{id}/status` (AK-15 till AK-19)**
- Fil: `Features/Tickets/UpdateTicketStatus.cs`.
- Validera först. Vid fel `Results.ValidationProblem(errors)`. Sedan `FindAsync(id)`, och saknas
  ärendet `Results.Problem(statusCode: 404)`. Annars `Status = Enum.Parse<TicketStatus>(...)`,
  `SaveChangesAsync`, och `Results.Ok(TicketResponse.From(ticket))`. Samma status ger ingen ändring,
  eftersom EF inte skriver oförändrade värden.

**Steg 7. Sabotagekontroll**
- (a) Ta bort `SaveChangesAsync`. Väntat: AK-15:s persistenskontroll faller (`GET` visar `New`).
  AK-16 och AK-17 faller också, eftersom förstatusen `InProgress` inte sparas. Svaret i AK-15
  är ändå `200` med ny status, så bara läsningen via `GET` fångar felet.
- (b) Ta bort New-regeln. Väntat: enhetstestet för `"New"` faller (inga fel), och AK-17 faller
  (`200` i stället för `400`, och statusen blir `New`).
- Rapportera vilka tester som föll och varför, och återställ koden efter varje sabotage.

**Steg 8. Kontrakt**
- Kör `dotnet build src/CustomerService.Api -p:GenerateOpenApi=true`. `UpdateStatusRequest.status`
  blir `string` i stället för en referens till `TicketStatus`.
- `docs/api/kontrakt.md`: under `UpdateStatusRequest` står att `status` tas emot som sträng med exakt
  skiftläge. Valideringen får två rader för `status` med meddelandena från Felfall och en hänvisning
  till den nya specen. Raden "`status` måste vara ett giltigt enum-värde" ersätts.

**Steg 9. Slutkörning och rapport**
- `cd backend && dotnet test CustomerService.slnx`. Verklig utskrift och rapport i avsnitt 4
  (kontrollpunkt 3).

### Oklarheter och skillnader mellan spec och kod

1. **"Saknas" och "null" går inte att skilja på enhetsnivå.** Båda blir `Status = null` i requesten.
   Enhetstestet har därför ett fall (`null`). Att fältet saknas i JSON testas i integrationstestet
   för AK-18 (`{}`). Räcker det?
2. **AK-15 har två utfall:** svaret och att statusen är sparad. Ska det bli ett test eller två?
   Jag föreslår två (`..._returns_200_with_new_status` och `..._is_saved`), så att sabotage (a)
   pekar ut just persistenstestet. Prompten säger "ett test per AK", och jag tolkar det som minst ett.
3. **AK-16 och AK-17 bygger på PUT för att få förstatusen `InProgress`.** Ett ärende kan bara
   skapas med `New` via `POST`. Därför faller de också vid sabotage (a). Förstatusen kontrolleras med
   `GET` i testet, så att felet visar sig i förberedelsen och inte ser ut som ett fel i själva
   regeln. Alternativet är att sätta förstatusen direkt i databasen, men det bryter mot "skapa
   testdata via `POST`".
4. **Kroppar som Felfall inte täcker:** fel JSON-typ (`"status": 1`), trasig JSON eller ingen kropp
   ger ramverkets `400` utan `errors`, samma som för `POST`. Jag lämnar dem otestade.
5. **Id som inte är ett tal** (`/api/tickets/abc`) stoppas av routevillkoret `{id:int}` och ger `404`
   med tom kropp, inte problem+json. Felfall nämner "adressen har inget giltigt id" men bara för
   detaljsidan (frontend), och AK-14 gäller ett id som inte finns. Jag ändrar och testar det inte.
6. **`"   "` och `"1"` är inte nämnda i Felfall.** Jag räknar dem som "inte en giltig status" enligt
   fotnot 2 och tar med dem i enhetstestets theory.
7. **Text i `AGENTS.md` och `docs/teststrategi.md` blir inaktuell.** Båda säger att endpoints är
   stubbar. Filerna finns inte i min lista, så jag rör dem inte. Uppdatera dem gärna separat.
8. **OpenAPI och uppdrag B.** När `status` blir `string` försvinner enumlistan ur requestens schema
   i `openapi.json`. Svaret (`TicketResponse.status`) behåller enumen. Uppdrag B bör typa requesten
   med klientens `TicketStatus` och använda listan i `kontrakt.md`.
9. **Hjälpfunktion i testerna.** Att skapa ett ärende via `POST` behövs i båda integrationsklasserna.
   Jag lägger en privat hjälpfunktion i varje klass i stället för att ändra `CreateTicketTests.cs`
   eller lägga till en delad fil. Säg till om du hellre vill ha en ny delad hjälpfil i samma mapp.

## 3. Kontrollpunkter

### Kontrollpunkt 1: planen (2026-11-10)
Godkänd utan ändringar. Svar på agentens oklarheter: ett enhetsfall för saknat och `null`
(`{}` täcks i integrationstestet), två tester för AK-15 (svar och persistens), förstatusen
`InProgress` sätts via `PUT` och kontrolleras med `GET`, trasig JSON och `/api/tickets/abc`
testas inte, `"   "` och `"1"` räknas som ogiltiga, en privat hjälpfunktion per testklass.
Inaktuell text i `AGENTS.md` och `docs/teststrategi.md` rättas separat.

### Kontrollpunkt 2: röda tester (2026-11-10)
Körde `dotnet test` själv och fick samma utfall som agenten: 11 enhetstester och 10
integrationstester faller på påståenden, inga kompileringsfel, alla befintliga gröna.

Granskningen hittade en brist: AK-13 jämförde hela `POST`-svaret med `GET`-svaret. `createdAt`
i `POST`-svaret har sju decimaler, men Postgres sparar sex, så testet hade fallit på
tidsstämpeln och inte på beteendet. Felet doldes av att endpointen gav `501`. Ändrat så att
övriga fält jämförs exakt och `createdAt` med 1 µs tolerans, Postgres precision. Testet är
fortfarande rött på `501`.

Känd begränsning: `POST`-svarets `createdAt` har högre precision än det som sparas.
Toleransen finns kvar tills det rättas där ärendet skapas.

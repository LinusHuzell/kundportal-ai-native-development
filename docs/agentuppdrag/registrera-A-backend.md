# Agentuppdrag: Registrera ärende, uppdrag A (backend)

Ansvarig: Carolina
Datum: 2026-11-09
Branch: `feat/registrera-arende`
Spec: [docs/specs/registrera-ärende.md](../specs/registrera-ärende.md)

## 1. Prompt

Skriven av Carolina.

```text
# Task A: backend for "Registrera ärende"

## Context
- Repo: Kundserviceportalen. Backend .NET 10 minimal API, EF Core, Postgres.
- Branch: feat/registrera-arende. Work only here.
- Spec: docs/specs/registrera-ärende.md. The Felfall table is the only source for
  validation rules and error messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing) and docs/teststrategi.md. Follow them.
- API contract: docs/api/kontrakt.md and docs/api/openapi.json.
- Current state: CreateTicket.Handle is a stub that returns 501. The Ticket entity has
  no CustomerName or CustomerEmail. TicketNumber is required but nothing sets it.
- Code and comments in English. Docs and error messages in Swedish.

## Goal
POST /api/tickets works as the spec says. Covers the backend part of AK-1, AK-2, AK-4,
AK-5 and AK-6.

## Decisions already made (do not ask again)
1. Add CustomerName and CustomerEmail to Ticket (required, no max length) with a new
   migration. Add fictional customers to the seed data.
2. TicketNumber is set to SR-<year>-<1000 + id>, so id 1 is SR-2026-1001 like the seed
   data. It is not sent in the API.
3. Category and priority arrive as strings, so a missing or unknown value becomes a 400
   on that field, not a JSON parsing error. Case must match (Medium, not medium).
4. Email rule: the regex in Felfall footnote 3. No normalization of upper case.
5. Error keys in the 400 response are camelCase field names (title, customerEmail).
6. Values are not trimmed before saving. Length is counted on the value as sent.

## Stage 0: plan only
1. Read the spec, AGENTS.md, docs/teststrategi.md, kontrakt.md and the backend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec and code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- backend/src/CustomerService.Api/Data/Ticket.cs
- backend/src/CustomerService.Api/Data/Configurations/TicketConfiguration.cs
- backend/src/CustomerService.Api/Data/SeedData.cs
- backend/src/CustomerService.Api/Data/Migrations/ (new migration and snapshot)
- backend/src/CustomerService.Api/Features/Tickets/CreateTicket.cs
- backend/src/CustomerService.Api/Features/Tickets/TicketModels.cs
- backend/tests/CustomerService.Api.UnitTests/ (new test files; existing tests only to
  add the new required fields)
- backend/tests/CustomerService.Api.IntegrationTests/ (new test files)
- docs/api/openapi.json (regenerated, never by hand) and docs/api/kontrakt.md
- This log file, sections 2, 3 and 4
Ask before touching anything else.

## Tests
- Unit (xUnit): one test per Felfall row, plus boundaries (200/201 and 5000/5001
  characters) and a valid request.
- Integration (WebApplicationFactory + Testcontainers): valid request gives 201 with a
  Location header, status New, id and createdAt. One 400 test per rule, each checking
  the field key and that nothing was saved. Persistence read back with a new DbContext.
- Red first: show each test failing on an assertion before the code exists.
- Sabotage-check the validation rules and the save. Report which tests failed.

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
- Do not change other endpoints (list, get, update, status).
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
| Beslut redan fattade | Jag har redan bestämt dem. Utan dem stannar agenten och frågar om varje punkt. |
| Plan först, stopp | `AGENTS.md` på `main` har bara testregler. Kravet på plan och stopp finns inte längre där, så det måste stå i prompten. |
| Lista över filer | Andra i gruppen bygger på `Ticket` och de andra endpoints. Agenten ska inte ändra deras delar. |
| Felfall som enda källa | Frontend och backend ska ge samma felmeddelanden. |
| Röda tester först och sabotagekontroll | Teststrategin kräver det. Det visar att testerna kan falla. |
| Tre kontrollpunkter | Jag granskar planen, testerna och resultatet var för sig. |
| Verkliga körresultat | AI:s besked räcker inte. Uppgiften kräver faktiska kontroller. |

## 2. Plan

Skriven av agenten i Stage 0. Inga andra filer är ändrade.

### Läst

Specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md`, `docs/api/openapi.json`,
`docs/avgränsningar.md`, `backend/README.md` och all kod under `backend/src` och `backend/tests`.

### Steg

**Steg 1. Kundfält i databasen (AK-1, AK-4, AK-6)**
- Filer: `Data/Ticket.cs`, `Data/Configurations/TicketConfiguration.cs`, `Data/SeedData.cs`,
  ny migration `AddCustomerFields` och uppdaterad snapshot i `Data/Migrations/`.
- `CustomerName` och `CustomerEmail` blir `required string`, `IsRequired()`, ingen maxlängd (beslut 1).
- Påhittade kunder läggs på de fem seedärendena (adresser på `example.com`).
- Tester: inga nya i detta steg. Steget testas av integrationstesterna i steg 4 och 5.
  Befintliga `ApplicationDbContextTests` måste få de nya fälten för att kompilera (se fråga 1).

**Steg 2. Validering som ren funktion (AK-5, Felfall)**
- Fil: `Features/Tickets/CreateTicket.cs`.
- `CreateTicketRequest` får `string?` för alla sex fält, även `category` och `priority` (beslut 3).
- Ny `public static class CreateTicketValidator` med
  `Validate(CreateTicketRequest) → Dictionary<string, string[]>`, nycklar i camelCase (beslut 5),
  meddelanden ordagrant från Felfall. Ett meddelande per fält. Alla felaktiga fält rapporteras.
- Regler:
  - Tomt eller bara mellanslag: `string.IsNullOrWhiteSpace` (fångar även tab och radbrytning).
  - Längd: `value.Length > 200` / `> 5000` på värdet som skickats, utan trim (beslut 6).
    Längdregeln körs bara om fältet inte är tomt.
  - Kategori och prioritet: saknas, tom sträng eller värde som inte finns exakt i
    `Enum.GetNames<T>()` (ordinal jämförelse) ger fel. Jag använder inte `Enum.TryParse`,
    eftersom den godtar `"1"`, `"medium"` med ignoreCase och `"Low, High"`.
  - E-post: först tomt-regeln, sedan regexen i fotnot 3 (beslut 4). Se fråga 4 om `$`.
- Ordning för red first: först en tom validator som alltid returnerar inga fel, så att
  enhetstesterna kompilerar och faller på påståenden.

**Steg 3. Enhetstester för valideringen (AK-5, Felfall)**
- Ny fil: `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/CreateTicketValidatorTests.cs`.
- Ett giltigt anrop ger inga fel.
- En test per Felfall-rad (11 rader). Varje test kontrollerar nyckel och exakt meddelande:
  - rubrik tom, bara mellanslag; rubrik 201 tecken
  - beskrivning tom, bara mellanslag; beskrivning 5001 tecken
  - kategori saknas (`null`) och tom; kategori `"Foo"`
  - prioritet saknas; prioritet `"Foo"`
  - namn tomt, bara mellanslag
  - e-post tom, bara mellanslag; e-post fel format
- Gränser: rubrik 200 och beskrivning 5000 tecken ger inget fel.
- Skiftläge: `"medium"` och `"other"` ger fel (beslut 3).
- E-postformat som `[Theory]`: utan `@`, två `@`, mellanslag, ingen punkt efter `@`. Giltig med versaler
  (`Anna@Example.COM`) godtas (beslut 4).
- Flera fel samtidigt ger en nyckel per fält.
- Ingen trim: rubrik med 199 tecken plus två mellanslag (201) ger längdfel.

**Steg 4. Handlern: spara och svara 201 (AK-1, AK-2, AK-4)**
- Fil: `Features/Tickets/CreateTicket.cs`. Ingen ändring i `TicketModels.cs` behövs
  (`TicketResponse` har redan kundfälten och ska inte ha `ticketNumber`, beslut 2).
- Validera. Vid fel: `Results.ValidationProblem(errors)` (problem+json), inget sparas.
- Annars: `Status = New`, `CreatedAt = DateTimeOffset.UtcNow`, värden sparas som de skickades.
- `TicketNumber`: hämta nästa id från sekvensen
  (`SELECT nextval(pg_get_serial_sequence('"Tickets"', 'Id'))`), sätt `Id` och
  `TicketNumber = $"SR-{CreatedAt.Year}-{1000 + id}"` och spara i ett enda INSERT.
  Kolumnen är `IdentityByDefault`, så ett uttryckligt id är tillåtet. Se fråga 3.
- Svar: `Results.Created($"/api/tickets/{id}", TicketResponse)`.

**Steg 5. Integrationstester (AK-1, AK-2, AK-4, AK-5, AK-6)**
- Ny fil: `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/CreateTicketTests.cs`
  (ärver `IntegrationTest`).
- Giltigt anrop: `201`, `Location` = `/api/tickets/{id}`, body med `id`, `status: "New"`, `createdAt`
  mellan tidpunkterna före och efter anropet, och de skickade värdena.
- Persistens: läs tillbaka med `Fixture.CreateDbContext()`, kontrollera alla fält, `Status.New`
  och `TicketNumber == "SR-<år>-1001"` (databasen töms och identity startas om före varje test).
- AK-2 (backenddelen): `priority: "Medium"` sparas som `Medium`.
- 400 per regel, en test per regel (rubrik tom, rubrik för lång, beskrivning tom, beskrivning för lång,
  kategori saknas, kategori ogiltig, prioritet saknas, prioritet ogiltig, namn tomt, e-post tom,
  e-post fel format). Varje test kontrollerar `400`, `application/problem+json`, nyckeln i `errors`
  och att tabellen är tom efteråt (ny `DbContext`). Meddelandetexten kontrolleras på enhetsnivå.
- AK-6: spara via API:t, starta en ny `WebApplicationFactory<Program>` mot samma databas
  (anslutningssträngen hämtas från `Fixture.CreateDbContext()`), och läs ärendet med en ny `DbContext`.
  Startup kör migrering och seedning, så testet visar också att seedningen inte rör befintliga ärenden.
  Läsning via `GET /api/tickets/{id}` går inte, eftersom den endpointen är en stubbe som inte är min.

**Steg 6. Red first och sabotagekontroll**
- Kör testerna mot den tomma validatorn och 501-stubben och visa verklig utskrift (kontrollpunkt 2).
- Sabotage, en i taget, kör igen, återställ:
  1. Ta bort tomt-regeln för rubrik.
  2. Ändra `> 200` till `> 201`.
  3. Godta okänd kategori.
  4. Byt e-postregexen mot "innehåller @".
  5. Ta bort `SaveChangesAsync`.
  6. Sätt `Status = InProgress`.
- Rapportera vilka tester som föll för varje sabotage.

**Steg 7. Kontrakt (alla AK, dokumentation)**
- Kör `dotnet build src/CustomerService.Api -p:GenerateOpenApi=true` och uppdatera `docs/api/kontrakt.md`:
  längdgränserna är beslutade (200/5000), felmeddelandena kommer från Felfall och exemplet i
  "Felformat" byts mot verkliga meddelanden. Öppna frågan om längdgränser stryks.

**Steg 8. Slutkörning och rapport**
- `cd backend && dotnet test CustomerService.slnx`, allt grönt, och verklig utskrift i avsnitt 4
  (kontrollpunkt 3).

### Oklarheter och skillnader mellan spec och kod

1. **`ApplicationDbContextTests.cs` går sönder.** Två tester där skapar `Ticket` utan kundfält.
   Med `required` kompilerar inte integrationsprojektet. Listan tillåter bara att jag lägger till
   fälten i befintliga *enhets*tester. Får jag lägga till `CustomerName` och `CustomerEmail` i de två
   befintliga integrationstesterna, och inget annat?
2. **`dotnet-ef` är inte installerat** (varken globalt eller som lokalt verktyg). Jag behöver det för
   att skapa migrationen. Förslag: `dotnet tool install --global dotnet-ef --version 10.0.*` (ändrar
   inget i repot). Alternativet, att lägga till ett lokalt verktyg i `.config/dotnet-tools.json`, ändrar
   en fil utanför listan. Att skriva migrationen för hand avråder jag från.
3. **Ärendenummer.** Vilket år? Jag föreslår årtalet från `CreatedAt` i UTC. Kring nyår kan det skilja
   från svensk tid. Jag använder `nextval` på sekvensen i stället för två sparningar, eftersom
   ärendenumret har ett unikt index och då aldrig behöver ett tillfälligt värde.
4. **E-postregexen beter sig olika i .NET och JavaScript.** I .NET matchar `$` även före en avslutande
   radbrytning, så `"anna@example.com\n"` godtas i backend men inte i frontend. Förslag: samma regex
   men med `\z` i stället för `$` i .NET, plus ett enhetstest för fallet. Detta avviker från texten
   "samma i frontend och backend" men ger samma beteende. Vill du hellre ha regexen ordagrant?
5. **Längd räknas i UTF-16-enheter** (`string.Length`, samma som `.length` i JavaScript). En emoji
   räknas som 2. Postgres `varchar(200)` räknar tecken, så backend avvisar aldrig mindre än databasen
   tål. Jag noterar det bara.
6. **OpenAPI ändras.** När `category` och `priority` blir strängar visar `openapi.json` dem som `string`
   i stället för en referens till enumen. Det påverkar frontend (uppdrag B), som läser kontraktet.
   Jag försöker behålla de tillåtna värdena med `[AllowedValues(...)]` och kontrollerar resultatet i den
   genererade filen. `[Required]` och `[MaxLength]` behålls bara som dokumentation, eftersom
   `AddValidation()` inte är på i `Program.cs`. Det är validatorn som gäller.
7. **AK-2 i backend.** Förvalet "Medel" finns i formuläret. Backend har inget förval, och om prioritet
   saknas blir det 400 enligt Felfall. Backenddelen av AK-2 blir därför att `Medium` sparas som `Medium`.
   Resten av AK-2 testas i uppdrag B.
8. **`Location` pekar på `GET /api/tickets/{id}`, som fortfarande är en stubbe (501).** Headern blir
   rätt, men den går inte att följa förrän Linus endpoint är klar.
9. **Fel JSON-typ** (t.ex. `"title": 123`) eller trasig JSON ger fortfarande ramverkets 400 utan
   `errors`. Felfall täcker inte det. Jag lämnar det utanför om du inte vill annat.
10. **Befintliga rader i utvecklingsdatabaser** får tom sträng i de nya kolumnerna när migrationen körs
    (EF:s standard för icke-null-kolumner). Seedningen körs inte igen eftersom tabellen inte är tom.
    En ny volym (`docker compose down -v`) ger seedärenden med kunder.
11. `CreateTicket.cs` har kommentaren "Max lengths are provisional". Jag tar bort den eftersom gränserna
    nu är beslutade i specen.

## 3. Kontrollpunkter

**Kontrollpunkt 1 (efter Stage 0):** Agenten stannade efter planen. Väntar på godkännande
och svar på fråga 1–4 och 6 i avsnitt 2.

Carolinas svar:
1. Ja. Lägg till det som behövs i `ApplicationDbContextTests.cs` och dokumentera det.
   Agenten lägger bara till `CustomerName` och `CustomerEmail` i de två befintliga tester som skapar
   `Ticket`. Inga påståenden ändras. Ändringen listas i avsnitt 4.
2. Ja, installera `dotnet-ef` globalt.
3. Ja, årtalet från `CreatedAt` i UTC.
4. Ja, `\z` i stället för `$` i .NET, plus ett enhetstest för avslutande radbrytning.
5. Oklart vad frågan betyder. Agenten förklarade: kontraktet genereras från koden, och när
   `category`/`priority` blir strängar visar `openapi.json` bara `string`. Beteendet är detsamma.
   Svar: alternativ A, `[AllowedValues]` så att kontraktet fortfarande listar de tillåtna värdena.
   Faller tillbaka till att lista värdena i `kontrakt.md` om den genererade filen inte blir rätt.

**Kontrollpunkt 2 (tester skrivna och röda):** Agenten stannade efter röd körning.

- Steg 1 och 2 är gjorda: kundfält, konfiguration, seed, migrationen `20261109083034_AddCustomerFields`
  och `CreateTicketRequest` med strängar och `[AllowedValues]`. Validatorn är en tom stubbe
  (`=> []`) och handlern returnerar fortfarande 501.
- `ApplicationDbContextTests.cs` (svar 1): i `SeedDataAddsNothingWhenDatabaseHasTickets` och
  `TicketPersistsAcrossDbContextInstances` lades bara `CustomerName` och `CustomerEmail` till, med
  påhittade värden. Inga påståenden ändrades.
- `dotnet test CustomerService.slnx` (verklig utskrift, sammanfattning):
  - `Failed!  - Failed: 36, Passed: 12, Skipped: 0, Total: 48` (UnitTests)
  - `Failed!  - Failed: 15, Passed: 5, Skipped: 0, Total: 20` (IntegrationTests)
- Alla 51 nya tester som föll gjorde det på ett påstående, inga undantag:
  - 36 enhetstester: `Assert.Equal() Failure: Collections differ`, väntad nyckel (t.ex. `["title"]`)
    men inga fel.
  - 15 integrationstester: `Assert.Equal() Failure: Values differ`, `Expected: BadRequest` (11) eller
    `Expected: Created` (4), `Actual: NotImplemented`.
- De 12 enhetstester som gick igenom är de 11 "is accepted"-testerna (giltigt anrop, 200/5000 tecken,
  varje kategori och prioritet, e-post med versaler) och det befintliga `TicketStatusTests`. De 5
  integrationstester som gick igenom är de befintliga (`ApplicationDbContextTests` ×4, `ApiSmokeTests`).
- För att se de 11 "is accepted"-testerna röda ändrades stubben tillfälligt till att alltid ge ett fel
  på `title`: `Failed!  - Failed: 47, Passed: 1, Total: 48`. Alla 11 föll på
  `Assert.Empty() Failure: Collection was not empty`. Stubben återställdes direkt.

Carolinas svar: "go ahead".

**Kontrollpunkt 3 (allt grönt):** Agenten stannade efter slutrapporten i avsnitt 4. Väntar på granskning.

Carolinas svar på avvikelse 1 i avsnitt 4: ingen regex i kontraktet. Hon frågade först om backend
kunde ta emot strängar utan kontroll och lämna valideringen till frontend. Agenten avrådde: Felfall
gäller både frontend och backend, AK-5 kräver 400 från API:t, API:t kan anropas direkt, och ett okänt
värde skulle ge 500 eller ogiltig data. Beslut: behåll som det är. Backend validerar `category` och
`priority`, och de tillåtna värdena står i `kontrakt.md`. Ingen kod ändrades.

## 4. Resultat

### Ändrade filer

| Fil | Ändring |
|---|---|
| `backend/src/CustomerService.Api/Data/Ticket.cs` | `CustomerName`, `CustomerEmail` (`required string`) |
| `backend/src/CustomerService.Api/Data/Configurations/TicketConfiguration.cs` | Båda kolumnerna `IsRequired()`, ingen maxlängd |
| `backend/src/CustomerService.Api/Data/SeedData.cs` | Påhittade kunder på de fem seedärendena (`@example.com`) |
| `backend/src/CustomerService.Api/Data/Migrations/20261109083034_AddCustomerFields.cs` och `.Designer.cs` | Ny migration, skapad med `dotnet-ef` 10.0.14 |
| `backend/src/CustomerService.Api/Data/Migrations/ApplicationDbContextModelSnapshot.cs` | Uppdaterad av `dotnet-ef` |
| `backend/src/CustomerService.Api/Features/Tickets/CreateTicket.cs` | Request med strängar, `CreateTicketValidator`, handler som sparar och svarar `201` |
| `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/CreateTicketValidatorTests.cs` | Ny, 47 testfall |
| `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/CreateTicketTests.cs` | Ny, 15 testfall |
| `backend/tests/CustomerService.Api.IntegrationTests/Data/ApplicationDbContextTests.cs` | Bara `CustomerName` och `CustomerEmail` i två tester (svar 1) |
| `docs/api/openapi.json` | Genererad, inte handskriven |
| `docs/api/kontrakt.md` | Request-exempel, regeltabell från Felfall, verkliga felmeddelanden, öppna frågan om längd struken |
| Denna fil | Avsnitt 2, 3 och 4 |

`TicketModels.cs` behövde ingen ändring. Utanför repot installerades `dotnet-ef` 10.0.14 globalt (svar 2).

### Avvikelser från planen

1. **`[AllowedValues]` fungerade inte (svar 5).** .NET 10:s OpenAPI-generator skriver inte ut attributet,
   så `category` och `priority` blev ändå bara `string`. Enligt överenskommen reserv (B) togs attributet
   bort, och de tillåtna värdena står i `kontrakt.md`. Ett alternativ som fungerar är
   `[RegularExpression("^(Low|Medium|High)$")]`, som blir `pattern` i `openapi.json`. Det är inte
   gjort, eftersom det inte var det vi kom överens om.
2. **`openapi.json` visar `["null", "string"]` för alla sex fält** i stället för `string`, eftersom
   fälten är `string?` i koden. De står kvar i `required`. Det är sant att ett saknat fält kommer fram
   som `null` och ger 400. Med `string` (utan `?`) i koden blir kontraktet renare, men då ljuger
   C#-typerna. Säg till om du vill byta.
3. **Integrationstesterna läser nu tillbaka med `Assert.Single(...)` i stället för `SingleAsync()`.**
   Sabotage 5 fick testerna att falla med `InvalidOperationException` (rätt orsak, men inte ett
   påstående). Efter bytet faller de på påståenden. Testerna blev strängare, inte svagare.

### Kommandon och verklig utskrift

`cd backend && dotnet test CustomerService.slnx` (slutkörning):
```
Passed!  - Failed:     0, Passed:    48, Skipped:     0, Total:    48, Duration: 25 ms - CustomerService.Api.UnitTests.dll (net10.0)
Passed!  - Failed:     0, Passed:    20, Skipped:     0, Total:    20, Duration: 363 ms - CustomerService.Api.IntegrationTests.dll (net10.0)
```

`cd backend && dotnet build src/CustomerService.Api -p:GenerateOpenApi=true` (efter sista kodändringen):
```
    0 Warning(s)
    0 Error(s)
```

`dotnet-ef migrations add AddCustomerFields ...`: `Build succeeded.` `Done.`

### Sabotagekontroll

En i taget, testerna körda, filen återställd (kontrollerat med `diff`).

| # | Sabotage | Tester som föll | Orsak |
|---|---|---|---|
| 1 | Tomt-regeln för rubrik borttagen | Unit: `Empty_title_is_rejected` ×3, `Each_invalid_field_gets_its_own_error`. Integration: `InvalidValue…(title, "   ")` | `Collections differ` / `Expected: BadRequest`. Fallet `null` gav `NullReferenceException`, eftersom sabotaget även tog bort null-skyddet |
| 2 | `> 200` ändrat till `> 201` | Unit: `Title_of_201_characters_is_rejected`, `Title_length_counts_surrounding_spaces`. Integration: `TooLongValue…(title, 201)` | `Collections differ` / `Expected: BadRequest` |
| 3 | Okänd kategori godtas | Unit: `Missing_category_is_rejected("")`, `("   ")`, `Unknown_category_is_rejected` ×3. Integration: `InvalidValue…(category, "Foo")` | `Collections differ` / `Expected: BadRequest` |
| 4 | E-postregex ersatt med "innehåller @" | Unit: `Malformed_customer_email_is_rejected` ×6 (alla utom `anna.example.com`). Integration: `InvalidValue…(customerEmail, "anna@example")` | `Collections differ` / `Expected: BadRequest` |
| 5 | `SaveChangesAsync` borttagen | Integration: `ValidRequestSavesTicketWithStatusNewAndAllFields`, `PriorityMediumIsSavedAsMedium`, `SavedTicketIsStillThereAfterTheAppRestarts` | Omkörd efter avvikelse 3: `Assert.Single() Failure: The collection was empty` ×2. Restart-testet: `contained 5 items`, eftersom den omstartade appen seedade en tom databas |
| 6 | `Status = InProgress` | Integration: `ValidRequestReturns201WithLocationAndNewTicket`, `ValidRequestSavesTicketWithStatusNewAndAllFields` | `Expected: New` |

### AK

| AK | Täckt av | Status |
|---|---|---|
| AK-1 (backenddel) | `ValidRequestSavesTicketWithStatusNewAndAllFields`, `ValidRequestReturns201WithLocationAndNewTicket` | Verifierad |
| AK-2 (backenddel) | `PriorityMediumIsSavedAsMedium` | Verifierad att `Medium` sparas. Förvalet i formuläret är uppdrag B |
| AK-4 | `ValidRequestReturns201WithLocationAndNewTicket` (201, `Location`, `id`, `New`, `createdAt`), `ValidRequestSavesTicketWithStatusNewAndAllFields` | Verifierad |
| AK-5 | `CreateTicketValidatorTests` (alla Felfall-rader, meddelanden ordagrant), 11 integrationsfall för 400 | Verifierad |
| AK-6 | `SavedTicketIsStillThereAfterTheAppRestarts` | Delvis, se nedan |
| AK-3, AK-7–AK-10 | | Ej i detta uppdrag (frontend, uppdrag B) |

### Osäkerheter

- **AK-6:** Testet startar en ny app-instans mot samma databas. Den delade app-instansen stoppas inte,
  så testet visar att en ny start (migrering och seedning) inte tappar ärenden, inte en riktig omstart
  av samma process eller av Docker-stacken. Omstart av stacken är inte provad.
- **Problem+json-formatet:** Testerna kontrollerar statuskod, content type och nycklar i `errors`.
  Fälten `type` och `title` i exemplet i `kontrakt.md` är inte kontrollerade.
- **`Location`** pekar på `GET /api/tickets/{id}`, som fortfarande svarar 501.
- **Utvecklingsdatabaser** som redan har seedärenden får tomma kundfält efter migrationen.
- Inte körda: frontendens lint, typecheck, Vitest och den mockade Playwright-sviten. Ingen frontendkod
  är ändrad.

### E2E (körd efter kontrollpunkt 3, på Carolinas begäran)

`docker compose -f compose.test.yaml run --build --rm e2e`, exit code 0:
```
Running 2 tests using 2 workers
  ✓  1 [fullstack] › e2e/smoke.spec.ts:3:1 › app shell renders and redirects / to the ticket list (759ms)
  ✓  2 [fullstack] › e2e/smoke.spec.ts:10:1 › navigation reaches the new ticket page (753ms)
  2 passed (1.7s)
```
Backendloggen visar `Applying migration '20261031093808_InitialCreate'` och
`Applying migration '20261109083034_AddCustomerFields'`. Före dem finns en `fail` för en fråga mot
`__EFMigrationsHistory`. EF loggar den när tabellen inte finns än i en ny databas. Den stoppar inte
migreringen. Sviten innehåller bara två smoke-tester. Registreringsflödet har inget E2E-test än (uppdrag B).
Stacken stoppades med `docker compose -f compose.test.yaml down`.


## 5. Min granskning


### Hur jag granskade

- Jag läste planen och svarade på agentens frågor vid kontrollpunkt 1.
- Jag läste den röda körningen vid kontrollpunkt 2 innan jag sa "go ahead".
- Jag läste slutrapporten och svarade på avvikelse 1 vid kontrollpunkt 3.
- Jag läste diffen i `CreateTicket.cs` och i testfilerna.
- Körde `dotnet test CustomerService.slnx` själv i terminalen och läste utskriften. Resultatet var detsamma som agentens slutkörning:
  ```text
  Test summary: total: 68, failed: 0, succeeded: 68, skipped: 0, duration: 4,6s
  Build succeeded in 5,5s
  ```

### Accepterat, ändrat, avvisat

| Förslag | Beslut | Varför |
|---|---|---|
| `\z` i stället för `$` i e-postregexen, plus ett test för avslutande radbrytning | Accepterat | I .NET godtar `$` en radbrytning i slutet. Då hade en ogiltig adress gått igenom. |
| Årtalet i ärendenumret från `CreatedAt` i UTC | Accepterat | Samma årtal oavsett tidszon. |
| `[AllowedValues]` så att kontraktet visar tillåtna värden | Ändrat | Generatorn skrev inte ut attributet. Värdena står i `kontrakt.md` i stället, som vi kommit överens om. |
| Regex som `pattern` i kontraktet | Avvisat | Inte det vi kom överens om, och `kontrakt.md` räcker. |
| `string?` i koden, alltså `null` i `openapi.json` | Accepterat | Ett saknat fält kommer fram som `null` och ger 400. Typerna stämmer med verkligheten. |
| `Assert.Single` i stället för `SingleAsync` | Accepterat | Testet faller nu på ett påstående i stället för ett undantag. |

### Vad jag ifrågasatte

Jag frågade om backend kunde ta emot kategori och prioritet utan kontroll och låta frontend validera. Agenten avrådde:
- Felfall gäller både frontend och backend.
- AK-5 kräver 400 från API:t.
- API:t kan anropas direkt, utan formuläret.

Jag höll med och behöll valideringen i backend. Det visade mig att specen styr även när en genväg verkar enklare.

### Begränsningar som är kvar

- AK-6 är bara delvis visat. Testet startar en ny app-instans mot samma databas. Det är inte en omstart av Docker-stacken.
- `Location` pekar på `GET /api/tickets/{id}`, som fortfarande svarar 501.
- Utvecklingsdatabaser som redan har seedärenden får tomma kundfält efter migrationen.


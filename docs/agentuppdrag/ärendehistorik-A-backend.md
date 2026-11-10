# Agentuppdrag: Ärendehistorik, grund (backend)

Status: Utkast till plan  
Spec: [docs/specs/ärendehistorik-grund.md](../specs/ärendehistorik-grund.md)

## Mål

Implementera backenddelen av Ärendehistorik, grund enligt specen: skapa en beständig `Created`-händelse atomärt med ärendet, och göra historiken tillgänglig via `GET /api/tickets/{id}/history`.

Planen omfattar AK-1 till AK-5, AK-8 och AK-9. Frontendimplementation ingår inte. Frontendens konsument behöver ett svar med `type` och `occurredAt` enligt specens API-kontrakt; frontendkoden ska inte ändras i det här uppdraget.

## Avgränsning

- Skapa en `Created`-händelse i samband med en lyckad ärenderegistrering.
- Ärendet och händelsen ska sparas i samma databastransaktion. Båda läggs till innan ett enda `SaveChangesAsync` anropas.
- Lägg till beständig lagring och en EF Core-migration.
- Ärendets händelser ska raderas när ärendet raderas direkt i databasen; det finns inget API för ärenderadering.
- Lägg till endpointen som returnerar händelser nyast först, med `Id` fallande som sekundär sortering.
- Okänt ärende ger `404 problem+json`; känt ärende utan historikrader ger `200` med en tom lista.
- Uppdatera API-kontraktet och generera OpenAPI från backendprojektet.
- Följ projektets TDD-, integrations- och sabotagekontrollregler i `AGENTS.md` och `docs/teststrategi.md`.

## Ingår inte

- Frontendkod eller frontendtester.
- Händelser för statusändring, redigering eller andra framtida funktioner.
- Backfill av historik för ärenden som skapats före den här ändringen.
- Aktör, kommentarer, manuella händelser, filtrering, sökning eller paginering.
- Ändringar av övriga ticket-endpoints eller registreringsregler.

## Arbetsordning

### Steg 1: Bekräfta kontrakt och lokala mönster

Läs specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md` och närliggande kod för ticket-registrering, EF Core-konfiguration, migrationer och integrationstester. Kontrollera hur projektet genererar OpenAPI och startar migrationer.

Specen har inga öppna frågor. Följ dess beslut: samma `createdAt`/`occurredAt`, atomisk lagring, `404 problem+json` och sorteringsordningen `occurredAt DESC, id DESC`.

### Steg 2: Skriv integrationstester först

Lägg till tester som ärver från `IntegrationTest` och använder riktig Postgres via befintlig Testcontainers-fixture. Se testerna falla på assertion innan produktionsbeteendet implementeras.

| Krav | Testbeteende |
|---|---|
| AK-1 | Registrera ett giltigt ärende via API:t. Läs historiken via API:t och kontrollera att den innehåller `Created` med samma tidpunkt som ärendets `createdAt`. |
| AK-2 | Skicka en ogiltig registrering som ger `400`. Läs tillbaka separat och kontrollera att varken ticket eller händelse sparats. |
| AK-3 | Hämta historik för ett registrerat ärende. Kontrollera `200`, listformatet och händelsens fält. |
| AK-4 | Hämta historik för ett okänt id. Kontrollera `404`, `application/problem+json` och att svaret saknar `errors`. |
| AK-5 | Läs händelsen med en ny `DbContext` från `Fixture.CreateDbContext()` efter skrivningen, enligt verifieringen i specen. |
| D-2 | Skapa kontrollerade händelser med olika och lika `occurredAt`-värden. Kontrollera nyast först och högst id först vid lika tid. |
| AK-8 | Skapa ett ärende med en `Created`-händelse, ta bort ärendet via en `DbContext`, och kontrollera via en ny `Fixture.CreateDbContext()` att händelsen inte finns kvar. |
| AK-9 | Skapa ett ärende utan händelser direkt via `DbContext`, hämta historiken via API:t och kontrollera `200` med en tom lista. |

Kontrollera händelsernas beständighet genom en separat kontext mot samma Postgres-databas. Testerna ska inte använda EF InMemory eller SQLite.

### Steg 3: Lägg till modell och migration

- Skapa en händelseentitet med primärnyckel, `TicketId`, typ och UTC-tid (`DateTimeOffset`).
- Spara typen som sträng, med `Created` som enda typ i den här leveransen. Det gör att nya värden kan läggas till utan att befintlig databasrepresentation eller API-kontrakt behöver byta format.
- Konfigurera obligatorisk FK till `Ticket` med `OnDelete(DeleteBehavior.Cascade)`, tabell och index på `TicketId` för historikuppslag.
- Registrera entiteten och konfigurationen i `ApplicationDbContext`.
- Skapa migration och uppdatera EF Core snapshot med projektets migrationsverktyg. Kontrollera att migrationen skapar främmande nyckeln med `ON DELETE CASCADE`. Granska den genererade migrationen; skriv inte snapshot eller OpenAPI för hand.

### Steg 4: Spara händelsen atomärt vid registrering

Uppdatera registreringshanteraren så att händelsen får samma `DateTimeOffset` som ticketens `CreatedAt`. Lägg ticket och händelse till samma `ApplicationDbContext` innan ett enda `SaveChangesAsync` anropas. EF Core ska därmed spara båda i samma transaktion.

Validering ska även fortsättningsvis ske före databasändringar. Vid `400` skapas och sparas varken ticket eller händelse. Ändra inte övriga fält, svar eller beteenden i registreringsendpointen.

### Steg 5: Lägg till läs-endpointen

Skapa en handler för `GET /api/tickets/{id}/history` och registrera den i den befintliga `/api/tickets`-routegruppen.

- Kontrollera att ticketen finns. Om den saknas, returnera `404 problem+json` utan `errors`.
- Hämta händelser för ticket-id:t och sortera på `OccurredAt` fallande, därefter `Id` fallande.
- Returnera `200` med en lista som endast innehåller `type` och `occurredAt`, i linje med specens exempel.
- För en befintlig ticket utan händelser returneras `200 []`; skapa ingen syntetisk historik.
- Lägg till OpenAPI-metadata för lyckat svar och `404` enligt befintliga endpointmönster.

### Steg 6: Uppdatera testfixture och sabotagekontrollera

Uppdatera `ApiFixture.ResetDatabaseAsync()` så att båda tabellerna töms i ett enda kommando: `TRUNCATE "TicketEvents", "Tickets" RESTART IDENTITY`. Postgres vägrar trunkera `Tickets` separat eftersom en främmande nyckel pekar dit, och `TRUNCATE` använder inte FK:ns `ON DELETE CASCADE`. Sabotagekontrollera AK-8 genom att tillfälligt byta kaskadbeteendet till `Restrict`, bekräfta att testet faller och återställ sedan `Cascade`.

Sabotagekontrollera kritisk persistens enligt teststrategin: koppla tillfälligt bort händelseskrivningen och bekräfta att AK-1-testet faller på den saknade händelsen. Återställ beteendet och kontrollera att sviten går grönt. Rapportera faktisk testutskrift; försvaga eller hoppa inte över tester.

### Steg 7: Uppdatera API-kontrakt och verifiera

- Dokumentera endpoint, listans fält och ordning, `404 problem+json` samt kopplingen till registrering i `docs/api/kontrakt.md`.
- Generera `docs/api/openapi.json` från backend, aldrig genom manuell redigering.
- Kör `cd backend && dotnet build src/CustomerService.Api -p:GenerateOpenApi=true`.
- Kör `cd backend && dotnet test CustomerService.slnx`.
- Rapportera faktiska kommandon och resultat, AK-täckning och eventuella krav som inte kunde verifieras. Gör ingen commit eller push.

## Filer inom scope

- `backend/src/CustomerService.Api/Data/TicketEvent.cs` — ny persistent händelseentitet.
- `backend/src/CustomerService.Api/Data/Configurations/TicketEventConfiguration.cs` — tabell, fält, FK och index.
- `backend/src/CustomerService.Api/Data/ApplicationDbContext.cs` — registrera händelseentiteten och dess konfiguration.
- `backend/src/CustomerService.Api/Data/Migrations/` — ny migration och genererad snapshot.
- `backend/src/CustomerService.Api/Features/Tickets/CreateTicket.cs` — skapa och spara händelsen atomärt med ticketen.
- `backend/src/CustomerService.Api/Features/Tickets/GetTicketHistory.cs` — ny historik-handler och svarstyp, om svarstypen inte passar i befintlig modellfil.
- `backend/src/CustomerService.Api/Features/Tickets/TicketsEndpoints.cs` — registrera historik-endpointen.
- `backend/tests/CustomerService.Api.IntegrationTests/ApiFixture.cs` — återställ händelserader mellan tester.
- `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/TicketHistoryTests.cs` — tester för AK-1–AK-5, AK-8, AK-9 och sortering. Dela endast upp i fler filer om det passar bättre med befintlig teststruktur.
- `docs/api/kontrakt.md` — dokumentera det nya API-kontraktet.
- `docs/api/openapi.json` — regenererad fil; aldrig handredigerad.

Fråga innan någon fil utanför listan ändras. Lägg inte till paket utan godkännande.

## Avslut och överlämning

Det här dokumentet är en plan, inte ett godkännande att börja implementationen. Efter granskning av planen inväntas klartecken innan tester eller produktionskod ändras. När implementationen godkänts rapporteras ändrade filer, körda kontroller med faktisk utdata, AK-täckning och eventuella avvikelser.
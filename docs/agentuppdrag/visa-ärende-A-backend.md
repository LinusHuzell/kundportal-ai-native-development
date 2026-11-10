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

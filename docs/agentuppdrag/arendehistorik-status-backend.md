# Task: backend for status-change ticket history

Ansvarig: Sebastian
Datum: 2026-11-12
Branch: `feat/ticket-history-status-changes`
Spec: [docs/specs/ärendehistorik-statusändringar.md](../specs/ärendehistorik-statusändringar.md)

## Context
- Repo: Kundserviceportalen. Backend .NET 10 minimal API, EF Core and PostgreSQL.
- Work only on the current branch.
- Spec: docs/specs/ärendehistorik-statusändringar.md. Treat its decisions D-1 to D-10
  and backend-relevant acceptance criteria as authoritative.
- Related specs: docs/specs/ärendehistorik-grund.md and
  docs/specs/visa-ärende-och-ändra-status.md.
- Testing rules: AGENTS.md and docs/teststrategi.md. Follow them.
- API contract: docs/api/kontrakt.md and docs/api/openapi.json.
- Current state: TicketEvent supports only Created. PUT /api/tickets/{id}/status
  saves the ticket status but creates no history event. GET
  /api/tickets/{id}/history returns only type and occurredAt.
- Code and comments in English. API enum values remain unchanged. The status labels
  returned in history are Swedish, as specified.

## Goal
Persist a StatusChanged event for each successful change to a different status and
return it from GET /api/tickets/{id}/history. Covers AK-1 to AK-4 and the backend
portion of AK-6. Do not implement frontend behavior AK-5 or AK-7.

## Decisions already made (do not ask again)
1. Create an event only when a different status is successfully saved. Rejected
   updates and unknown tickets create no event.
2. Saving the current status again remains a successful no-op and creates no event.
3. A StatusChanged event contains the previous and new status in fromStatus and
   toStatus.
4. Save the ticket status and history event atomically. Capture one UTC timestamp
   for the change and use it as the event's occurredAt. Do not change CreatedAt or
   introduce a general ticket UpdatedAt field.
5. fromStatus and toStatus in the API response contain Swedish labels, not enum
   values. Use the labels in docs/specs/visa-ärende-och-ändra-status.md.
6. Do not backfill or reconstruct status history from before this feature. Existing
   Created events and their API response remain unchanged.
7. Keep the existing status validation, HTTP status codes, problem+json behavior,
   event ordering (OccurredAt descending, then Id descending), and status-update
   response unchanged.

## Stage 0: plan only
1. Read the status-history spec, AGENTS.md, docs/teststrategi.md, docs/api/kontrakt.md,
   docs/api/openapi.json, and the relevant backend code and tests.
2. Write a plan in section 2 of this agent-assignment log: steps, AK per step, files,
   tests, migration and OpenAPI generation.
3. Explain how the implementation will preserve the existing Created response shape
   while returning fromStatus and toStatus only for StatusChanged events.
4. List any uncertainty or conflict between the spec, API contract and current code.
5. Stop and wait for approval. Do not change code, tests, migrations or API documents.

## Files you may change
- backend/src/CustomerService.Api/Data/TicketEvent.cs
- backend/src/CustomerService.Api/Data/Configurations/TicketEventConfiguration.cs
- backend/src/CustomerService.Api/Data/Migrations/ (generated migration and snapshot)
- backend/src/CustomerService.Api/Features/Tickets/UpdateTicketStatus.cs
- backend/src/CustomerService.Api/Features/Tickets/GetTicketHistory.cs
- backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/UpdateTicketStatusTests.cs
- backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/TicketHistoryTests.cs
- backend/tests/CustomerService.Api.UnitTests/Features/Tickets/ (new tests only, if needed)
- docs/api/kontrakt.md
- docs/api/openapi.json (generated, never edited by hand)
- This agent-assignment log, sections 2, 3 and 4

Ask before changing any other file.

## Tests
- Use real PostgreSQL through the existing IntegrationTest and Testcontainers setup.
  Do not use EF InMemory or SQLite.
- AK-1: change a ticket from one valid status to another; read history through the API
  and verify StatusChanged, old and new Swedish labels, and occurredAt.
- AK-2: verify the changed ticket and event persist together. Read back through the
  API or a new DbContext, not the context that wrote them.
- AK-3: verify invalid status and unknown ticket preserve existing errors and create
  no StatusChanged event.
- D-2: verify saving the same status returns the existing successful response and
  creates no event.
- AK-4: verify GET history returns the StatusChanged fields and that a Created event
  still has exactly its existing type and occurredAt fields.
- AK-6 backend portion: verify Created and StatusChanged events use the existing
  history ordering.
- Red first: make each new test fail on an assertion before implementing the behavior.
- Sabotage-check persistence: temporarily disable event creation or saving and confirm
  the relevant test fails for the expected assertion; restore the behavior afterward.

## Checkpoints
1. Stop after the plan and wait for approval.
2. After tests are written and fail, report the exact command and output, then wait.
3. After implementation, generated migration/OpenAPI, green tests and sabotage checks,
   report results and wait for review.

## Commands
- From backend/: dotnet test CustomerService.slnx
- From backend/: dotnet build src/CustomerService.Api -p:GenerateOpenApi=true
- Generate migrations with the repository's EF tooling. Do not hand-write the migration
  or snapshot.

## Boundaries
- No frontend changes.
- No changes to status rules, ticket creation, editing events, authentication, actor
  tracking, backfill, or unrelated endpoints.
- No new packages without approval.
- Never weaken, skip or delete tests to make a run pass.
- Do not commit, push or open a pull request.

## Report
- Changed files and generated migration.
- Commands run and their actual output.
- Acceptance criteria covered and anything not verified.
- Sabotage results and any remaining uncertainty.
- Never claim something works unless the check was run.
## 2. Plan (Stage 0, awaiting approval)

### Steps
1. **Model (AK-1, AK-2, D-3, D-6).** Add `TicketEventType.StatusChanged`. Add nullable `FromStatus` and `ToStatus` (`TicketStatus?`) to `TicketEvent`. In `TicketEventConfiguration` store them as strings (`HasConversion<string>()`, max length 32, nullable). Created rows keep both columns null, so no backfill.
2. **Migration.** Generate with `dotnet ef migrations add AddTicketEventStatusColumns` (from `backend/`, project `src/CustomerService.Api`). The migration only adds two nullable columns. Do not hand-edit it or the snapshot.
3. **Update endpoint (AK-1, AK-2, AK-3, D-1, D-2, D-4).** In `UpdateTicketStatus.Handle`, after validation and the 404 check: parse the new status; if it equals `ticket.Status`, return `200` as today with no event. Otherwise capture `var now = DateTimeOffset.UtcNow`, set `ticket.Status`, add a `StatusChanged` event (`OccurredAt = now`, previous and new status), and call `SaveChangesAsync` once. A single `SaveChanges` runs in one transaction, so status and event are atomic. `CreatedAt` and the response are unchanged.
4. **History endpoint (AK-4, AK-6).** `GetTicketHistory` keeps its query and ordering (OccurredAt desc, Id desc). Map events to a response with `Type`, `OccurredAt`, `FromStatus`, `ToStatus`. A small static helper maps `TicketStatus` to Swedish labels (Nytt, Pågående, Väntar på kund, Avslutat) per docs/specs/visa-ärende-och-ändra-status.md.
5. **Contract.** Regenerate `docs/api/openapi.json` with `dotnet build src/CustomerService.Api -p:GenerateOpenApi=true`. Update `docs/api/kontrakt.md`: `TicketEvent` model, `type` values, `fromStatus` and `toStatus`, status-endpoint note.

### Preserving the Created response shape
`TicketHistoryEventResponse` gets `FromStatus` and `ToStatus` as nullable `string?` properties with `[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]`. A Created event has null values, so its JSON stays exactly `{type, occurredAt}`. The existing test `HistoryIsAListOfEventsWithOnlyTypeAndOccurredAt` guards this.

### Tests (red first)
| Test | AK/D | Level | File |
|---|---|---|---|
| Valid change gives a `StatusChanged` event with Swedish labels and `occurredAt` | AK-1, D-8 | Integration | UpdateTicketStatusTests.cs |
| Ticket status and event read back through the API / a new `DbContext` | AK-2 | Integration | UpdateTicketStatusTests.cs |
| Invalid status and unknown ticket: existing errors, no event | AK-3 | Integration | UpdateTicketStatusTests.cs |
| Same status again: `200`, no event | D-2 | Integration | UpdateTicketStatusTests.cs |
| History returns `fromStatus`/`toStatus` only on `StatusChanged`; Created keeps exactly `type` and `occurredAt` | AK-4 | Integration | TicketHistoryTests.cs |
| Created and StatusChanged ordered newest first, ties by Id desc | AK-6 (backend) | Integration | TicketHistoryTests.cs |
| Label mapping covers all four statuses | D-8 | Unit (only if the mapper is a separate helper) | UnitTests/Features/Tickets/ |

Sabotage checks: (a) remove the event add, (b) remove the same-status guard, (c) write `OccurredAt` from a second `UtcNow`. Confirm the relevant test fails on an assertion, then restore.

### Uncertainties and conflicts
- `docs/api/kontrakt.md` has a duplicated paragraph under the status validation table ("Vid sparning sätts `status` till `New`..." appears twice, and the second describes creation). It looks like a merge leftover. I propose fixing it only if you approve, since it is outside this task's scope.
- The contract says "Bara `type` och `occurredAt` returneras" and "`type` är alltid `Created`". Both are updated in step 5.
- The spec says "Svensk etikett ... enligt statusändringsspecen". That spec lists the labels in a table row (line 58), so I take Nytt, Pågående, Väntar på kund, Avslutat from there. `New` can occur as `fromStatus` only.
- AK-2 atomicity: a failing second write is hard to provoke through the API. I propose verifying atomicity by design (single `SaveChanges`) plus the read-back test, and stating that in the report. Tell me if you want a stronger test.
- The `Closed` label is "Avslutat", not "Stängd".

## 3. Result
- Changed: `TicketEvent.cs`, `TicketEventConfiguration.cs`, `UpdateTicketStatus.cs`, `GetTicketHistory.cs`, migration `AddTicketEventStatusColumns` (generated with `dotnet ef`), `docs/api/openapi.json` (generated), `docs/api/kontrakt.md`, `UpdateTicketStatusTests.cs`, and `ListTicketsTests.cs` (added required `CustomerName`/`CustomerEmail`, approved).
- Red run: 7 of 17 `UpdateTicketStatusTests` failed on assertions before implementation.
- Green: `dotnet test CustomerService.slnx` gave 59 unit and 48 integration tests passed, 0 failed.
- AK-1 to AK-4 and the backend part of AK-6 are covered. AK-2 atomicity relies on a single `SaveChangesAsync` (decided) plus read-back through a new `DbContext`. The ordering tie-break by Id is existing behavior and not retested here.
- Not verified: AK-5, AK-7 (frontend, out of scope).

## 4. Sabotage checks
| Sabotage | Result |
|---|---|
| Event not added | 7 tests failed |
| Same-status guard removed | `SameStatusAddsNoStatusChangedEvent` failed |
| `SaveChangesAsync` skipped | 10 tests failed |
| Second `UtcNow` for `OccurredAt` | Not run; the tests only check a time range, so they would not detect it |

Each sabotage was restored; the final run passed 17 of 17.

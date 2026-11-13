# Slutrapport: Efter 1

Agentens sista svar, ordagrant. Se [jämförelsen](../teststrategi-agents.md).

I've written the tests for AK-15 to AK-18, and they all pass. `dotnet test CustomerService.slnx` ran 61 unit and 42 integration tests with no failures. `git diff -- src` is empty, so no production code was changed.

**Unit tests** in `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/UpdateTicketStatusValidatorTests.cs`:
- `InProgress`, `WaitingForCustomer` and `Closed` are accepted.
- `New` is rejected with "Status kan inte ändras till Nytt" (AK-17).
- A missing value (`null`, `""`, whitespace) is rejected with "Välj en giltig status" (AK-18).
- So are unknown values, including boundaries like `"new"`, `"inprogress"`, `" Closed"`, `"1"` and `"InProgress, Closed"`.

**Integration tests** in `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/UpdateTicketStatusTests.cs`, against real Postgres:
- **AK-15:** a valid status returns `200` with the updated ticket. A separate GET confirms it was saved, and a closed ticket can be set back to `InProgress`.
- **AK-16:** saving the current status returns `200`, and both the response and a later GET match the ticket from before.
- **AK-17:** `New` returns `400` problem+json with the error only in `errors.status`, and the saved status doesn't change.
- **AK-18:** a missing (`{}`, `null`, `""`) or invalid (`Foo`, `closed`, `3`) status returns `400` with "Välj en giltig status", and the saved status doesn't change.

**Sabotage checks:** because the endpoint already existed, I broke four behaviours one at a time to confirm the tests catch each, then restored the code:
- Status not saved: `ValidStatusIsSaved` failed (expected `WaitingForCustomer`, got `New`).
- `New` allowed: the AK-17 unit and integration tests failed.
- Lowercase or numeric values accepted: 5 unit cases and 2 integration cases failed.
- Ticket changed when saving the same status: `SameStatusReturns200AndLeavesTicketUnchanged` failed.

**Also changed:** `ListTicketsTests.cs` didn't compile at HEAD, which stopped the whole integration test project from building. `Ticket.CustomerName` and `CustomerEmail` are required, and that test didn't set them. I added the two fields to its test data; this is the only change outside the scope you asked for.

I didn't cover AK-19 (unknown ticket returns `404`) because it wasn't in the request.

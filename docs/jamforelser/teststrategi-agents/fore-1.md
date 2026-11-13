# Slutrapport: Före 1

Agentens sista svar, ordagrant. Se [jämförelsen](../teststrategi-agents.md).

I've written tests for AK-15 to AK-18 and didn't change any production code. The validator unit tests pass (14 of 14). The integration tests compile and run in the same project as `ListTicketsTests.cs`, which doesn't compile in the last commit, so I haven't been able to run them.

**What's broken:** `ListTicketsTests.cs` (around line 16) creates `Ticket` objects without `CustomerName` and `CustomerEmail`, which the model now requires (compiler error CS9035). You haven't edited that file; it's broken as of the last commit, so the integration project won't build no matter what I add. I tried moving the file aside for one run, but the command wasn't approved, so I left it alone.

**New files:**
- `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/UpdateTicketStatusValidatorTests.cs` tests the validator directly:
  - `InProgress`, `WaitingForCustomer` and `Closed` are accepted.
  - `New` gives "Status kan inte ändras till Nytt" (AK-17).
  - A missing value (null, empty or blank) gives "Välj en giltig status" (AK-18).
  - Unknown values like `Foo`, `new`, `closed`, `1` and `" Closed"` give the same message (AK-18).
- `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/UpdateTicketStatusTests.cs` tests the real endpoint against the database:
  - **AK-15:** each valid status returns 200 with the ticket and saves the new status. The other fields in the response stay the same, and the status can be changed several times in a row.
  - **AK-16:** saving the status the ticket already has returns 200, and the ticket in the response and in a follow-up GET is identical to before.
  - **AK-17:** `New` returns 400 as problem+json, with "Status kan inte ändras till Nytt" as the only message in `errors.status`, and the saved status stays the same.
  - **AK-18:** an empty or unknown status returns 400 with "Välj en giltig status" in `errors.status`, and the ticket keeps its status. So does a request body with no `status`, or with `status: null`.

To run the integration tests, you can either fix the two `Ticket` objects in `ListTicketsTests.cs` by adding `CustomerName` and `CustomerEmail`, or let me move the file aside for one test run and then restore it. Then run:

```
cd backend && dotnet test --filter "FullyQualifiedName~UpdateTicketStatus"
```

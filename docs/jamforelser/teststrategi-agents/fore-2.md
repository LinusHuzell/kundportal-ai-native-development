# Slutrapport: Före 2

Agentens sista svar, ordagrant. Se [jämförelsen](../teststrategi-agents.md).

I've added tests for AK-15 to AK-18. The full backend suite passes: 61 unit tests and 44 integration tests, including the new ones. I didn't change any production code, and nothing is committed.

**New files**

- `backend/tests/CustomerService.Api.UnitTests/Features/Tickets/UpdateTicketStatusValidatorTests.cs` tests the validation rules on their own:
  - **AK-15:** `InProgress`, `WaitingForCustomer` and `Closed` are accepted.
  - **AK-17:** `New` gives only "Status kan inte ändras till Nytt" under `status`.
  - **AK-18:** a missing, empty or blank status gives "Välj en giltig status". So do unknown values (`Foo`), wrong casing (`closed`, `new`), numbers (`1`), a leading space and combined values.
- `backend/tests/CustomerService.Api.IntegrationTests/Features/Tickets/UpdateTicketStatusTests.cs` tests the endpoint against the real API and database:
  - **AK-15:** each valid status returns `200` with the ticket, and a `GET` afterwards shows the saved status. Switching between statuses other than "Nytt" (e.g. Closed to InProgress) also works.
  - **AK-16:** saving the current status returns `200`, and the ticket is identical to its state before the save, both in the response and in a later `GET`.
  - **AK-17:** `New` returns `400` as problem+json with the correct message, and the saved status stays the same. This also applies when the ticket is already "Nytt".
  - **AK-18:** a missing `status` field, `null`, an empty string or an invalid value returns `400` with "Välj en giltig status", and the ticket isn't changed.

**One change outside the scope you gave me:** the integration test project didn't build. In `ListTicketsTests.cs`, the test data was missing `CustomerName` and `CustomerEmail`, which `Ticket` now requires. That file is already broken in the last commit. I added the two fields so the integration tests could run at all. It's a test-only change and easy to revert if you'd rather fix it separately.

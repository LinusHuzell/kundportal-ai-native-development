# Slutrapport: Efter 2

Agentens sista svar, ordagrant. Se [jämförelsen](../teststrategi-agents.md).

I've written tests for AK-15 to AK-18 and they all pass. `dotnet test CustomerService.slnx` passes all 60 unit and 40 integration tests. Production code is unchanged (`git diff src/` is empty).

**Unit tests**, in `UpdateTicketStatusValidatorTests.cs`:
- `InProgress`, `WaitingForCustomer` and `Closed` are accepted.
- `New` is rejected with "Status kan inte ändras till Nytt" (AK-17).
- A missing status (`null`, `""`, `"   "`) or an unknown one (`Foo`, `closed`, `new`, `1`, `" Closed"`) is rejected with "Välj en giltig status" (AK-18).

**Integration tests**, in `UpdateTicketStatusTests.cs`, against real Postgres:
- **AK-15:** a valid status returns `200` with the updated ticket, and the other fields stay the same. A separate test reads the ticket back through `GET` to confirm the new status was saved.
- **AK-16:** saving the current status returns `200`. Both the response and a fresh `GET` match the ticket from before.
- **AK-17:** `New` returns `400` problem+json, the only error is the message in `errors.status`, and the saved status is unchanged.
- **AK-18:** a missing `status` field, `null`, `""`, `Foo` and `closed` all return `400` with the message in `errors.status`, and the status is unchanged.

**Proving the tests can fail:** since the endpoint already existed, I broke it on purpose four times and checked that the right tests failed on their assertions:

| What I broke | What failed |
|---|---|
| Removed the database save | The persistence test (expected `Closed`, got `New`) |
| Let `New` through | `New_is_rejected` and `NewIsRejectedAndStatusIsUnchanged` (200 instead of 400) |
| Accepted any status | All missing/unknown cases (no error in the unit tests, 500 instead of 400 in the integration tests) |
| Changed priority when the same status is saved again | `CurrentStatusReturns200AndLeavesTicketUnchanged` |

I restored the file by hand each time, because `git checkout` was blocked. One of those runs accidentally had two sabotages active at once, so I repeated it with only one.

**Two things to check:**
- **Another test file was broken on HEAD.** `ListTicketsTests.cs` didn't compile because it creates `Ticket` objects without the required `CustomerName` and `CustomerEmail`. That stopped the whole integration project from building, so I added those two fields to its test data. It's a test-only fix outside the four criteria.
- **Git shows my two files as modified, not new.** Both test files existed in HEAD and had been deleted in your working tree. I wrote them from scratch, so the diff is against those old versions.

I didn't add a test for AK-19 (unknown ticket returns `404`) because it wasn't in the request.

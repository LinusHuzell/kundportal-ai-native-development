# Instructions for AI agents

## Testing

Read [docs/teststrategi.md](docs/teststrategi.md) (Swedish) before writing or changing tests. The rules below apply in addition to it.

### Test levels

| Level | Tool | Location | Use for |
|---|---|---|---|
| Backend unit | xUnit | `backend/tests/CustomerService.Api.UnitTests/` | Validation and business rules that need no database or HTTP |
| Backend integration | xUnit, `WebApplicationFactory`, Testcontainers (Postgres) | `backend/tests/CustomerService.Api.IntegrationTests/` | Each endpoint's HTTP contract (status codes, problem+json) and persistence |
| Frontend unit | Vitest | next to the code as `*.test.ts(x)` | Mapping and client-side logic |
| End-to-end | Playwright against the full stack in `compose.test.yaml` | `frontend/e2e/*.spec.ts` | The user flows in the acceptance criteria |
| End-to-end, mocked API | Playwright with `page.route` | `frontend/e2e-mocked/*.spec.ts` | Only states the real stack cannot produce on demand: server errors, network failures, slow responses, an empty list |

### Choosing a level

Start from the acceptance criterion and use the cheapest level that can catch the failure.

- A rule with edge cases: test the cases in backend unit tests, and test in one integration test that the endpoint applies the rule.
- What an endpoint returns, its error format, and whether data is saved: backend integration tests.
- How the client maps a response or an error: Vitest.
- A user flow: one end-to-end test per flow against the full stack, not one per edge case.
- Something the user should see that the real stack cannot produce on demand: mocked end-to-end. Never mock what the real stack can produce, such as a validation error or a missing ticket.

### What to test

- Every feature has at least one happy path, the relevant error paths, and the boundary cases that follow from the rules in its spec.
- Every tested behaviour must be in the spec. If you find a behaviour worth testing that the spec does not cover, propose adding it to the spec instead of only writing the test. Exceptions: tests of internal logic and regression tests for bugs, which name the rule or bug they protect.
- Every requirement and acceptance criterion in a spec has at least one test. Exception: visual requirements that cannot be tested automatically are checked manually.

### Test quality

- Red first: run every new test and see it fail before implementing the code.
- For critical tests (persistence, status changes, validation rules), also do a sabotage check: temporarily disable the behaviour, confirm the test fails for the right reason, then restore it.
- Never weaken, skip or delete a test to make a run pass. Fix the cause or ask.
- Keep each test small and self-explanatory, testing one thing.
- Name tests after the behaviour.

### Backend

- Integration tests run against real Postgres via Testcontainers. Never use the EF InMemory provider or SQLite.
- Integration test classes inherit from `IntegrationTest`, which empties the database before each test. When a migration adds a table, add it to `ApiFixture.ResetDatabaseAsync`.
- Verify persistence by reading back through a new app instance or a new `DbContext`, never from the same in-memory state.

### Frontend

- In Playwright, find elements by role and accessible name, not CSS classes.
- Never mock in `frontend/e2e/` (`page.route`, `context.route`, `routeFromHAR`).
- End-to-end tests create their own data through the API with unique values, and assert only on that data. Never rely on seed data or on data from other tests.
- Type mocked responses with the client's types and shape them after `docs/api/openapi.json`. Mock errors as problem+json.

### Docker Compose

`compose.test.yaml` is a standalone copy of the stack. When you change images, environment variables or healthchecks in `compose.yaml`, make the same change there.

### API contract

- Never edit `docs/api/openapi.json` by hand. Regenerate it from the `backend` directory with `dotnet build src/CustomerService.Api -p:GenerateOpenApi=true`, and keep `docs/api/kontrakt.md` in sync.

### Test coverage

Coverage tooling is not set up yet. These principles apply when it is:

- Coverage is reported, never enforced. Do not add thresholds, and do not write tests only to raise a number.
- Each test level gets its own report. Never merge them or compare their percentages directly.
- Coverage shows which code ran, not that it behaves correctly.

### Running tests

| What | Where | Command |
|---|---|---|
| Backend (unit and integration, needs Docker) | `backend/` | `dotnet test CustomerService.slnx` |
| Frontend unit | `frontend/` | `npm test` |
| End-to-end, mocked API (needs `npx playwright install chromium` once) | `frontend/` | `npm run test:e2e:mocked` |
| End-to-end (needs Docker and `./scripts/setup-dev-cert.sh` once) | repo root | `docker compose -f compose.test.yaml run --build --rm e2e`, then `docker compose -f compose.test.yaml down` |

Run the tests your change affects and report the actual output. Never claim something works without running it.

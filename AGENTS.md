# Instructions for AI agents

## Workflow

Work spec-driven: follow [docs/arbetssätt.md](docs/arbetssätt.md) (Swedish) and write specs from [docs/specs/_mall.md](docs/specs/_mall.md).
Record every decision made while creating or iterating a specification in that specification file's `Ändringshistorik`, including the date, a short description, and the responsible person.

## Testing

Read [docs/teststrategi.md](docs/teststrategi.md) (Swedish) before writing or changing tests. The rules below add to it.

When you change a testing rule, update both this file and docs/teststrategi.md.

### Test levels

Use the cheapest level that can catch the failure.

| Level | Tool | Location | Use for |
|---|---|---|---|
| Backend unit | xUnit | `backend/tests/CustomerService.Api.UnitTests/` | Validation and business rules with their edge cases. No database or HTTP |
| Backend integration | xUnit, `WebApplicationFactory`, Testcontainers (Postgres) | `backend/tests/CustomerService.Api.IntegrationTests/` | Each endpoint's HTTP contract (status codes, problem+json), one test that it applies each rule, persistence |
| Frontend unit | Vitest | `frontend/src/`, next to the code as `*.test.ts(x)` | How the client maps responses and errors; client-side logic |
| End-to-end | Playwright, full stack in `compose.test.yaml` | `frontend/e2e/*.spec.ts` | One test per user flow in the acceptance criteria, not per edge case |
| End-to-end, mocked API | Playwright with `page.route` | `frontend/e2e-mocked/*.spec.ts` | Only states the real stack cannot produce on demand: server errors, network failures, slow responses, an empty list |

Never mock what the real stack can produce, such as a validation error or a missing ticket.

### What to test

- Every requirement and acceptance criterion in the spec has at least one test. Visual requirements that cannot be automated are checked manually.
- Every feature gets a happy path, the relevant error paths, and the boundary cases its rules imply.
- Test only behaviour in the spec. If a behaviour worth testing is missing, propose adding it to the spec. Exceptions: internal logic, and regression tests that name the bug they protect against.

### Test quality

- Red first (TDD): write the test before the code and see it fail on an assertion, not a compile error. If the code already exists, temporarily break the behaviour to see the test fail, then restore it.
- Sabotage-check critical tests (persistence, status changes, validation rules): temporarily disable the behaviour, confirm the test fails for the right reason, restore it.
- Never weaken, skip or delete a test to make a run pass. Fix the cause or ask.
- Keep each test small, self-explanatory and about one thing. Name it after the behaviour.
- Parametrized tests (`[Theory]`, `it.each`) are fine for small, closely related cases of the same rule with the same expected result, such as several invalid values that give the same error. Keep different rules and results in separate tests.

### Backend

- Integration tests use real Postgres via Testcontainers, never the EF InMemory provider or SQLite.
- Integration test classes inherit from `IntegrationTest`. All tests share one container and one app (`Fixture.Factory`), run sequentially, and start with an empty database. When a migration adds a table, add it to `ApiFixture.ResetDatabaseAsync`.
- Verify persistence by reading back separately, through the API or a new `DbContext` (`Fixture.CreateDbContext()`), never from the `DbContext` that wrote the data.
- The persistence test in `Data/` uses `DbContext` because it was written before the endpoints existed. Each feature tests its own persistence through its API.

### Frontend

- In Playwright, find elements by role and accessible name, not CSS classes.
- Never mock in `frontend/e2e/` (`page.route`, `context.route`, `routeFromHAR`).
- End-to-end tests create their own data through the API with unique values and assert only on it. Never rely on seed data or other tests' data.
- Type mocked responses with the client's types, shape them after `docs/api/openapi.json`, and mock errors as problem+json.

### Docker Compose

`compose.test.yaml` is a standalone copy of `compose.yaml`. Mirror changes to images, environment variables and healthchecks there, but keep it without host ports and with Postgres on tmpfs, so it runs beside the dev stack with a new database each start.

### API contract

After changing the API, regenerate `docs/api/openapi.json` from `backend/` with `dotnet build src/CustomerService.Api -p:GenerateOpenApi=true` and update `docs/api/kontrakt.md`. Never edit `openapi.json` by hand. Backend CI fails if it is stale.

### Test coverage

Report coverage but never enforce it (no thresholds, no tests written to raise a number). Give each test level its own report, never merged or compared. Coverage shows what ran, not that it is correct.

- Only the frontend unit tests are measured: `npm test` writes the report to `frontend/coverage/unit/`. Playwright and backend coverage are not set up yet.
- On push to `main`, CI appends a row per suite to `docs/coverage/<suite>.md`, one file per suite. Never edit those rows by hand.

### Running tests

| What | Where | Command |
|---|---|---|
| Backend unit and integration (needs Docker) | `backend/` | `dotnet test CustomerService.slnx` |
| Frontend lint, typecheck, unit, build | `frontend/` | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` |
| End-to-end, mocked API (once: `npx playwright install chromium`) | `frontend/` | `npm run test:e2e:mocked` |
| End-to-end (needs Docker; once: `./scripts/setup-dev-cert.sh`) | repo root | `docker compose -f compose.test.yaml run --build --rm e2e`, then `docker compose -f compose.test.yaml down` |

Run Playwright only through the commands above. Plain `npx playwright test` also runs the full-stack suite without a backend.

CI: Backend CI runs row 1 and the `openapi.json` check, Frontend CI rows 2 and 3, E2E row 4 on changes to frontend, backend or the test stack. Run the tests your change affects and report the actual output. Never claim something works without running it.

## Accessibility

All frontend code follows WCAG 2.2 AA.

- Semantic HTML first (`<button>`, not `<div onClick>`).
- Every form field has an associated `<label>`.
- Error messages are linked to their field with `aria-describedby`.
- Everything interactive works with the keyboard and has a visible focus state.
- Color is never the only carrier of meaning (status and priority also need text).
- Icon-only buttons have an accessible name (`aria-label`).
- The page language is Swedish (`<html lang="sv">`). Mark English parts with `lang="en"`.

AI output often misses ARIA attributes and keyboard behavior unless asked. Check these when
reviewing generated code.
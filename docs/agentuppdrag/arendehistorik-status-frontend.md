# Task: frontend presentation of status changes in ticket history

Owner: Sebastian  
Date: 2026-11-12  
Status: Plan approved 2026-11-12; red tests written, awaiting approval to implement  
Spec: [docs/specs/ärendehistorik-statusändringar-presentation.md](../specs/ärendehistorik-statusändringar-presentation.md)

## Context

- Repository: Kundserviceportalen. The frontend uses React, TypeScript, Vite, Vitest, and Playwright.
- The specification for presenting status changes is approved. Follow its decisions D-1–D-4 and acceptance criteria AK-1–AK-3.
- Backend support is implemented. `GET /api/tickets/{id}/history` returns `StatusChanged` with `occurredAt`, `fromStatus`, and `toStatus`. The status fields are Swedish labels.
- `PUT /api/tickets/{id}/status` creates an event only when the status actually changes. Saving the current status again is a successful no-op and creates no history event.
- The current frontend displays only `Created`. The existing full-stack test for status updates expects history not to be fetched again; this contradicts approved AK-3 and must be updated.
- Read `AGENTS.md` and `docs/teststrategi.md` before test work. The API contract is in `docs/api/kontrakt.md` and `docs/api/openapi.json`.

## Goal

Display status changes in the selected ticket panel's history, including the previous status, new status, and timestamp. After a successful actual status change, fetch the history again and show the new event without reloading or navigating away from the page.

## Decisions (do not ask again)

1. Use the exact event text format `Förändrad status: {gammalt statusvärde} -> {nytt statusvärde}`.
2. Display `fromStatus` and `toStatus` using the Swedish labels returned by the API. Do not convert them back to enum values in the frontend.
3. Preserve the existing text and timestamp presentation for `Created` events.
4. Display all known event types in the order returned by the API; do not sort the list in the frontend.
5. Refetch history after the server confirms an actual status change. Do not refetch history when the status is unchanged.
6. Preserve the existing history loading, empty, and error states. A history error must not block ticket details or the status form.
7. Do not change the backend, status rules, or API contract.

## 1. Stage 0: plan first

Read the approved specification, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md`, `docs/api/openapi.json`, and the relevant existing frontend components and tests.

Write a concrete plan in section 2 of this task document that includes:

- The implementation steps and their mapping to AK-1–AK-3.
- The exact files to change and tests to add or update.
- How to model `StatusChanged` without requiring status fields on `Created`.
- How to verify the status-change text, timestamp, and API ordering.
- How the UI will determine that the status actually changed before fetching history again.
- How to replace the contradictory full-stack assertion that only one history request is made.
- Test commands and any manual accessibility checks.
- Any uncertainties or conflicts between the specification, API contract, and existing code.

**Stop:** Do not change production code or tests in Stage 0. Report the plan and wait for explicit approval.

## 2. Plan (Stage 0, awaiting approval)

### Steps and acceptance criteria

1. **Tests first (red), AK-1–AK-3.** Add three full-stack tests in `frontend/e2e/ticket-history.spec.ts` and replace the contradictory `D-6: saving a status does not fetch the history again` test. Run them and confirm they fail on assertions (missing text / missing refetch), not on compilation errors.
2. **Type (AK-1).** Add optional `fromStatus?: string` and `toStatus?: string` to `TicketHistoryEvent`. `Created` events need neither; the existing mocked test that types `{ type: 'CustomerReplied', ... }` and `{ type: 'Created', ... }` still compiles. A discriminated union is not used, because the open `type: string` member (needed for unknown types, AK-12 in the presentation spec) would defeat narrowing anyway.
3. **Presentation (AK-1, AK-2).** In `TicketHistory.tsx`, replace the direct `TICKET_HISTORY_EVENT_LABELS[event.type]` lookup with a local `describeEvent(event)` that returns:
   - `Created` → the existing label `Ärendet registrerades` (unchanged, decision 3).
   - `StatusChanged` with both `fromStatus` and `toStatus` → `Förändrad status: ${fromStatus} -> ${toStatus}`, using the API's Swedish labels as-is (decisions 1–2).
   - Anything else (unknown type, or `StatusChanged` missing a status field) → `undefined`, filtered out like unknown types today.
   The list is still rendered with `events.map` in API order, no sorting (decision 4). The `<time dateTime={new Date(occurredAt).toISOString()}>` and `formatCreatedAt` output are reused for every event type.
4. **Refetch after an actual change (AK-3).** In `TicketListPage.tsx`, `handleStatusSaved` compares the status of `selectedTicket` (the ticket shown when the save started, captured in the closure) with `updatedTicket.status` returned by the server. Only when they differ does it increment a `historyVersion` counter in state. `TicketHistory` gets a new prop `refreshKey={historyVersion}`; its effect depends on `[ticketId, refreshKey]` and the cached request in `requestRef` (StrictMode dedupe) is keyed by both, so a new key triggers exactly one new `GET /history`. A successful no-op (same status) returns the same status, so no counter change and no request (decision 5). `StatusForm.tsx` needs no change.
5. **States (decision 6).** During the refetch the component shows the existing loading state (`Laddar historik…` in the existing `role="status"` region), then the list, or the existing error alert on failure. Ticket details and the status form are outside `TicketHistory` and are not affected.
6. **Verification**, sabotage check of AK-3, manual accessibility check, and report in section 4.

### Files and tests

Production code:

- `frontend/src/types/ticket.ts` — add optional `fromStatus` and `toStatus` to `TicketHistoryEvent`.
- `frontend/src/features/ticket-detail/TicketHistory.tsx` — `describeEvent`, `refreshKey` prop, request cache keyed by `(ticketId, refreshKey)`.
- `frontend/src/pages/TicketListPage.tsx` — `historyVersion` state, actual-change comparison in `handleStatusSaved`, pass `refreshKey`.
- `frontend/src/features/ticket-detail/StatusForm.tsx` — not changed.

Tests in `frontend/e2e/ticket-history.spec.ts` (full stack, own tickets with unique titles, no `page.route`):

- **AK-1:** create a ticket via `POST /api/tickets`, change status via `PUT /api/tickets/{id}/status` to `InProgress`, read `GET /api/tickets/{id}/history` through `request` to get the `StatusChanged` event's `occurredAt`. Open the ticket in the UI. Assert the list item contains the hard-coded text `Förändrad status: Nytt -> Pågående` (verifies the actual Swedish labels, not enum values), and that its `time` has `datetime` = `new Date(occurredAt).toISOString()` and text `formatCreatedAt(occurredAt, TIME_ZONE)`.
- **AK-2:** create a ticket, change status via API to `InProgress`, then `Closed`. Read the history via API and build the expected texts in the API's order. Open the ticket and assert the list items with `toContainText([...])` in that exact order: `Förändrad status: Pågående -> Avslutat`, `Förändrad status: Nytt -> Pågående`, `Ärendet registrerades` (the latter unchanged).
- **AK-3 (replaces old D-6 test):** create a ticket, open it, wait for `Ärendet registrerades`. Start recording `GET /history` requests, store a marker on `window` (`page.evaluate`) and the current URL. Select `Avslutat`, click `Spara status`. Assert the confirmation `Status ändrad till Avslutat` (kept from the old test), the new item `Förändrad status: Nytt -> Avslutat` appears first in the list, exactly one additional history request was made, the URL is unchanged and the `window` marker still exists (no reload or navigation).
- **Decision 5 (no-op):** create a ticket, change status to `Closed` via API, open it, wait for history to load, record history requests, save `Avslutat` again in the UI. Assert the confirmation, that no history request was made, and the list still has two items.

No changes needed in `frontend/e2e-mocked/ticket-history.spec.ts`: its PUT mock returns `Closed` for an `InProgress` ticket, so the AK-7 tests now trigger one refetch that hits the same mocked error; their assertions still hold. No new Vitest test: the text formatting is tested at the level the spec requires (E2E full stack), and adding a separate unit file would require a new file outside scope.

Commands:

- Red run and final run (repo root): `docker compose -f compose.test.yaml run --build --rm e2e`, then `docker compose -f compose.test.yaml down`.
- `frontend/`: `npm run lint`, `npm run typecheck`, `npm test` (coverage), `npm run build` (fallback per repo memory: `npm run build -- --outDir "$(mktemp -d /tmp/kundportal-build.XXXXXX)"` if `dist/` has EACCES), `npm run test:e2e:mocked`.
- Sabotage: temporarily skip the `historyVersion` increment in `handleStatusSaved`; expect the AK-3 test to fail on the new list item / request count; restore and rerun.
- Manual: keyboard only (Tab to list, status select, save) and a screen reader (Orca on Linux, since VoiceOver is not available here) for the history heading, list item text, `time` and the `Laddar historik…`/confirmation live regions. If I cannot run a screen reader, I will report it as not verified.

### Uncertainties or conflicts

- **Actual change detection is client-side.** The comparison uses the status the UI showed when the save started. If another user changed the status in between, the UI may refetch unnecessarily (harmless) or, in a rare case, miss a refetch. The API returns no flag for "changed", and the contract must not change. Proposed: accept this.
- **Loading state during refetch.** Showing `Laddar historik…` briefly replaces the list and is announced by the existing live region. The alternative (keep the old list visible until the new response arrives) avoids the flash but adds state logic. Proposed: use the existing loading state, per decision 6. Tell me if you prefer the alternative.
- **Order wording.** The contract says history is "nyast först"; the spec only requires API order. Tests assert API order (read from the API), and the AK-2 expected list happens to be newest first.
- **Screen reader.** The test strategy mentions VoiceOver; on this Linux machine only Orca may be available, if at all.
- No conflicts found between the spec, the API contract and `openapi.json`. The only contradiction is the existing `D-6` E2E test, which is replaced as described.

**Approved 2026-11-12 (Sebastian):** client-side change detection is accepted; the existing loading state is shown during refetch; the screen reader check is skipped here and done by another user in another environment. The keyboard check remains.

## 3. Implementation after plan approval

### Tests first

- Write or update tests before production code, following the project's TDD rule.
- Run the new or updated tests and confirm they fail on an assertion demonstrating the missing behavior, not on a compilation error.
- AK-1: verify the text contains both actual Swedish status labels and that the `time` element's normalized `datetime` matches the event timestamp.
- AK-2: verify `Created` and `StatusChanged` appear in API order and that `Created` retains its existing text.
- AK-3: make a real status change through the user flow; verify history is fetched again, the new event appears, and the page does not reload or navigate.
- Full-stack tests must create their own tickets with unique values and use the real API stack; do not use `page.route` in `frontend/e2e/`.
- Update the existing full-stack test that currently expects a single history request. Keep relevant assertions for the status confirmation and navigation, but verify the refetch required by AK-3.

Report the exact test command and output after the red run. Stop and wait for approval before implementation.

### Implementation

- Extend the frontend history type with `fromStatus` and `toStatus` in a way that does not require these fields for `Created`.
- Add `StatusChanged` presentation to the existing history list according to decisions 1–4.
- Connect a server-confirmed actual status change to a new history request. A successful no-op must not cause another request.
- Preserve the existing loading, empty, error, and accessibility behavior.
- Keep implementation limited to the frontend files approved in section 2. If other files are needed, pause and ask before changing them.

### Verification and report

Run from `frontend/`:

- `npm run lint`
- `npm run typecheck`
- `npm test` (report unit-test coverage)
- `npm run build`
- `npm run test:e2e:mocked`

Run full-stack tests from the repository root, following `AGENTS.md`:

- `docker compose -f compose.test.yaml run --build --rm e2e`
- `docker compose -f compose.test.yaml down`

Sabotage-check AK-3 by temporarily disabling the history refetch after an actual status change. Confirm the test fails on the expected assertion, then restore the behavior. Rerun the relevant checks after restoring it.

Manually check with keyboard and screen reader that status changes are understandable in the history list and that the existing status and history messages work. Report changed files, actual test output, coverage by test level, AK coverage, and anything not verified. Do not claim a check passed unless it was run.

## Files in scope

- `frontend/src/types/ticket.ts` — client history type.
- `frontend/src/features/ticket-detail/TicketHistory.tsx` — history presentation and refresh.
- `frontend/src/features/ticket-detail/StatusForm.tsx` — only if the status form callback needs to distinguish an actual change from a no-op.
- `frontend/src/pages/TicketListPage.tsx` — only if history refresh needs to be coordinated here.
- `frontend/e2e/ticket-history.spec.ts` — full-stack tests for AK-1–AK-3 and update of the contradictory assertion.
- Other frontend test files only if the plan review shows they are necessary; list them in the plan and wait for approval.
- This task document, sections 2–4.

Ask before changing any other files. Do not add packages. Do not change the API contract, OpenAPI, backend, or specifications. Do not commit, push, or open a pull request.

## 4. Results and sabotage check

### Results

Changed files:

- `frontend/src/types/ticket.ts` — optional `fromStatus` and `toStatus` on `TicketHistoryEvent`.
- `frontend/src/features/ticket-detail/TicketHistory.tsx` — `describeEvent` (`Created` unchanged, `StatusChanged` as `Förändrad status: {fromStatus} -> {toStatus}`), `refreshKey` prop, request cache keyed by ticket id and `refreshKey`.
- `frontend/src/pages/TicketListPage.tsx` — `historyVersion` is incremented only when the saved status differs from the shown status; passed as `refreshKey`.
- `frontend/e2e/ticket-history.spec.ts` — AK-1, AK-2, AK-3 (replaces the old D-6 test) and a no-op test.

Commands (2026-11-12, after restoring the sabotage):

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | 5 files, 64 tests passed. Unit coverage, all files: 21.78 % statements, 15.92 % branches, 18.18 % functions, 20.3 % lines. The changed files are not covered by unit tests. |
| `npm run build` | exit 1, `EACCES: permission denied, rmdir 'frontend/dist/assets'` (file ownership, not code). `npm run build -- --outDir "$(mktemp -d …)"`: exit 0 |
| `npm run test:e2e:mocked` | Fails on `EACCES` writing `frontend/test-results/.last-run.json` and `frontend/playwright-report/index.html`. With `-- --output="$(mktemp -d …)" --reporter=list`: 18 passed |
| `docker compose -f compose.test.yaml run --build --rm e2e` | 40 passed |
| `docker compose -f compose.test.yaml down` | exit 0 |

Coverage by test level: only frontend unit coverage is measured (above). Playwright and backend coverage are not set up.

AK coverage:

| AK | Test | Level |
|---|---|---|
| AK-1 | `AK-1 (status changes): a status change shows both Swedish labels and its datetime` | E2E, full stack |
| AK-2 | `AK-2 (status changes): created and status-change events follow the API order` | E2E, full stack |
| AK-3 | `AK-3 (status changes): saving another status refetches the history without reloading` | E2E, full stack |
| Decision 5 | `saving the same status again does not refetch the history` | E2E, full stack |
| Decision 6 | Existing mocked history tests (AK-7, AK-10–AK-12 of the presentation spec), all pass | E2E, mocked |

Not verified:

- Manual keyboard check of the history list and status messages: not run by the agent, to be done by Sebastian.
- Screen reader check: skipped by decision, to be done by another user in another environment.
- `npm run build` and `npm run test:e2e:mocked` with default output directories, because of file permissions in `frontend/dist`, `frontend/test-results` and `frontend/playwright-report`.

### Sabotage check

| Sabotage | Result |
|---|---|
| History is not refetched after an actual status change | `AK-3 (status changes)` failed on `toContainText` at line 163: expected `Förändrad status: Nytt -> Avslutat`, `Ärendet registrerades`; received only `Ärendet registrerades…`. The other 39 passed. Restored; 40 passed. |
| History is refetched after every save, also unchanged status | `saving the same status again does not refetch the history` failed on `toHaveLength(0)`: received 1 request to `/api/tickets/28/history`. The other 39 passed. Restored; 40 passed. |
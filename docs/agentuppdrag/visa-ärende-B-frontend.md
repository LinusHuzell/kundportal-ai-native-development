# Agentuppdrag: Visa ärende och ändra status, uppdrag B (frontend)

Ansvarig: Linus
Datum: 2026-11-10
Branch: `feat/visa-arende`
Spec: [docs/specs/visa-ärende-och-ändra-status.md](../specs/visa-ärende-och-ändra-status.md)

## 1. Prompt

Utkast av Claude utifrån specen och mina beslut. Granskad, ändrad och godkänd av Linus.

```text
# Task B: frontend for "Visa ärende och ändra status"

## Context
- Repo: Kundserviceportalen. Frontend React 19, TypeScript, Vite, Tailwind, React Router.
- Branch: feat/visa-arende. Work only here.
- Spec: docs/specs/visa-ärende-och-ändra-status.md. Visning and Felfall are the only source
  for labels, formats and messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing) and docs/teststrategi.md. Follow them.
- Backend is done (task A): GET /api/tickets/{id} and PUT /api/tickets/{id}/status work as
  in docs/api/kontrakt.md. Do not change the backend.
- Current state: TicketDetailPage.tsx is a placeholder. api.getTicket and
  api.updateTicketStatus in src/api/client.ts are stubs. The request helper in client.ts
  already handles problem+json and network errors (status 0). CATEGORY_LABELS and
  PRIORITY_LABELS exist in src/types/ticket.ts. The create-ticket feature shows the patterns
  to follow (structure, Tailwind classes, live regions, Playwright helpers).
- Vitest runs in a node environment without a DOM, so components are tested with Playwright.
- Code, comments and test names in English. UI text in Swedish, exactly as in the spec.

## Accessibility (WCAG 2.2 AA, follow all)
- Semantic HTML first (<button>, not <div onClick>).
- Every form field has an associated <label>.
- Error messages are linked to their field with aria-describedby.
- Everything interactive works with the keyboard and has a visible focus state.
- Color is never the only carrier of meaning (status and priority also need text).
- Icon-only buttons have an accessible name (aria-label).
- The page language is Swedish. Mark English parts with lang="en".

## Goal
The detail page and the status change work as the spec says. Covers AK-1 to AK-12.

## Decisions already made (do not ask again)
1. Client: getTicket(id) is GET /tickets/{id}, updateTicketStatus(id, status) is
   PUT /tickets/{id}/status with { status }. Both use the existing request helper.
2. An id in the address that is not a positive whole number shows "Ärendet hittades inte"
   without calling the API. A 404 from the API shows the same message.
3. STATUS_LABELS goes next to the other label maps in src/types/ticket.ts.
4. Created date: a pure function using Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium',
   timeStyle: 'short' }), with an optional time zone so the unit test can fix it.
5. Details are a <dl>. The title is the page's <h1>. Status is shown as text.
6. Status change: a native <select> labelled "Status" with all four statuses in
   TICKET_STATUSES order. "Nytt" is a disabled option, selected only when the ticket is New.
   A button "Spara status" submits. No save on change.
7. Saving with "Nytt" selected shows "Välj en ny status" (aria-describedby and aria-invalid
   on the select) and sends no request.
8. While saving: the button is disabled and reads "Sparar…", and a second submit sends no
   request.
9. On success: the ticket in the details is replaced by the response, "Status ändrad till
   <label>" is shown in a role="status" region, and focus stays on the button. The message
   stays until the next save.
10. On any save error: "Statusen kunde inte sparas. Försök igen." in a role="alert" region,
    the selected value stays, the details keep the old status.
11. Loading: "Laddar ärende…" in role="status". Load error (5xx or network):
    "Ärendet kunde inte hämtas. Försök igen senare." in role="alert". No retry button.
12. A link "Tillbaka till ärendelistan" to /tickets is shown in every state.
13. Live regions that announce changes are rendered before their text is set, so screen
    readers announce them (same as the confirmation in Layout).
14. Page code stays in src/pages/TicketDetailPage.tsx. The status form and the date
    function go in src/features/ticket-detail/.

## Stage 0: plan only
1. Read the spec, AGENTS.md, docs/teststrategi.md, kontrakt.md and the frontend code,
   including the create-ticket feature and its tests.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec and code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- frontend/src/pages/TicketDetailPage.tsx
- frontend/src/features/ticket-detail/ (new files)
- frontend/src/types/ticket.ts (STATUS_LABELS only) and ticket.test.ts (new tests only)
- frontend/src/api/client.ts (getTicket and updateTicketStatus only) and client.test.ts
  (new tests only)
- frontend/e2e/ticket-detail.spec.ts (new)
- frontend/e2e-mocked/ticket-detail-*.spec.ts (new)
- This file, sections 2 and 4
Ask before touching anything else.

## Tests
- Follow the Verifieringsmetod table in the spec for the level of each AK.
- Unit (Vitest): STATUS_LABELS; the date function with a fixed time zone (AK-2); getTicket
  and updateTicketStatus (request sent, ticket returned, 404 and network error as ApiError).
- End-to-end (frontend/e2e/, full stack, no mocking): AK-1, AK-3 (unknown id and "abc"),
  AK-6, AK-7, AK-8, AK-9, AK-10. Each test creates its own ticket through
  POST /api/tickets with a unique title. AK-10 records requests to show no PUT was sent.
- End-to-end, mocked API (frontend/e2e-mocked/): AK-4 (slow GET), AK-5 (500 and network
  failure), AK-11 (slow PUT, second click sends nothing), AK-12 (500 and network failure).
  Type mocked responses with the client's types and mock errors as problem+json.
- Find elements by role and accessible name, not CSS classes.
- Red first: show each test failing on an assertion, not a compile error.
- Sabotage-check: (a) remove the "Nytt" check before saving, (b) remove the guard against a
  second submit. Report which tests failed and why, then restore.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green and sabotage-checked, with the final report.

## Commands
- cd frontend && npm run lint && npm run typecheck && npm test && npm run build
- cd frontend && npm run test:e2e:mocked
- From the repo root: docker compose -f compose.test.yaml run --build --rm e2e, then
  docker compose -f compose.test.yaml down
Never run plain npx playwright test.

## Boundaries
- No backend changes. That was task A.
- No new packages without asking.
- Do not change the list page, Layout, App routes or the create-ticket feature.
- Never weaken, skip or delete a test to make it pass.
- Do not commit, push or open a pull request.

## Report (section 4 of this file)
- Changed files.
- Commands run and their real output (shortened to the decisive lines).
- AK covered, and AK not verified with the reason (for example the manual screen reader check).
- Sabotage results.
- Anything you are unsure about.
- Never say something works unless you ran the check.
```

### Varför prompten ser ut så här

| Del | Varför |
|---|---|
| Tillgänglighetsreglerna inklistrade | Grenen saknar avsnittet om tillgänglighet i `AGENTS.md`. Reglerna gäller ändå, och AI missar ofta ARIA och tangentbord om det inte står uttryckligen. |
| Nuläge med `request`-hjälparen och etiketterna | Agenten ska återanvända det som finns och inte bygga en egen fetch eller egna etiketter. |
| Vitest utan DOM | Utan det skulle agenten vilja installera jsdom och Testing Library. Komponentbeteende testas i Playwright enligt teststrategin. |
| Beslut redan fattade | Fattade i specarbetet. Utan dem gissar agenten, till exempel om "Nytt" ska döljas eller sparas direkt vid val. |
| Beslut 13, live-regioner | En region som skapas samtidigt som texten läses ofta inte upp. Det går inte att se i ett test, så det måste stå i prompten. |
| Lista över filer | Listan, layouten och registreringen ägs av andra i gruppen. |
| Mockat bara för långsamt svar och fel | `AGENTS.md`: mocka aldrig det som den riktiga stacken kan ge, som 404 eller "Nytt". |
| Två sabotage | De två kontrollerna som bara frontenden gör: att "Nytt" inte skickas och att inga dubbla anrop skickas. |
| Verkliga körresultat | AI:s besked räcker inte. Kontrollerna måste vara körda. |

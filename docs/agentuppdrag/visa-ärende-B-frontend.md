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

## 2. Plan

Skriven av agenten i Stage 0. Inga andra filer är ändrade.

### Läst

Specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md`, planen i
`visa-ärende-A-backend.md` som förebild, och i `frontend/`: `src/api/client.ts` med test,
`src/types/ticket.ts` med test, `TicketDetailPage.tsx`, `App.tsx`, `Layout.tsx`,
`features/create-ticket/*`, `e2e/*.spec.ts`, `e2e-mocked/*.spec.ts`, `playwright.config.ts`,
`vite.config.ts`, `tsconfig.*.json`, `compose.test.yaml` och `Dockerfile.e2e`. Kontrollerat i Node 24
att `Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm' })`
ger "10 nov. 2026 14:30" för `2026-11-10T13:30:00Z`.

### Steg

**Steg 1. Skal så att testerna kompilerar (inga AK)**
- `src/types/ticket.ts`: `STATUS_LABELS: Record<TicketStatus, string>` med platshållarvärden (tomma strängar).
- `src/features/ticket-detail/formatCreatedAt.ts`: `formatCreatedAt(iso: string, timeZone?: string): string`
  som returnerar `''`.
- `src/features/ticket-detail/parseTicketId.ts`: `parseTicketId(value: string | undefined): number | undefined`
  som returnerar `undefined` (se fråga 4).
- `api.getTicket` och `api.updateTicketStatus` är redan stubbar som kastar `ApiError` 501, så de
  rörs inte än. Sidan är redan en platshållare.
- Tester: inga. Steget finns för att testerna i steg 2–4 ska falla på påståenden, inte på kompilering.

**Steg 2. Enhetstester, Vitest (AK-2, AK-3, AK-8, AK-12)**
- `src/types/ticket.test.ts` (nytt test): `STATUS_LABELS` är exakt Nytt, Pågående, Väntar på kund, Avslutat.
- `src/features/ticket-detail/formatCreatedAt.test.ts` (AK-2): `2026-11-10T13:30:00Z` med
  `Europe/Stockholm` ger "10 nov. 2026 14:30". Ett andra test med `UTC` ger "10 nov. 2026 13:30", så att
  tidszonen bevisligen används.
- `src/features/ticket-detail/parseTicketId.test.ts` (intern logik bakom AK-3): `"42"` ger 42, och
  ogiltiga värden ger `undefined`. Ogiltiga fall i ett `it.each` om du godkänner det (fråga 4).
- `src/api/client.test.ts` (nya tester, samma mönster som `createTicket`):
  - `getTicket` hämtar `${API_BASE_URL}/tickets/7` och returnerar ärendet.
  - `getTicket`: 404 som problem+json ger `ApiError` med `status: 404`.
  - `getTicket`: nätverksfel ger `ApiError` med `status: 0`.
  - `updateTicketStatus` skickar `PUT` till `/tickets/7/status` med `Content-Type: application/json`
    och `{"status":"Closed"}`, och returnerar ärendet.
  - `updateTicketStatus`: 404 ger `ApiError` 404, nätverksfel ger `ApiError` 0.

**Steg 3. End-to-end mot hela stacken (AK-1, AK-3, AK-6, AK-7, AK-8, AK-9, AK-10)**
- Ny fil `e2e/ticket-detail.spec.ts`. Hjälpfunktioner: `createTicket(request, overrides)` via
  `POST /api/tickets` med unik rubrik (som `uniqueTitle` i `create-ticket.spec.ts`), `setStatus(request, id, status)`
  via `PUT` för förberedelser, `detail(page, label)` som hittar ett värde i `<dl>` via roll (fråga 6),
  och `recordStatusRequests(page)` som spelar in `PUT .../status`.
- Live-regioner söks inom `page.getByRole('main')`, eftersom `Layout` alltid har en tom `role="status"`.
- AK-1: skapa ärende, öppna `/tickets/{id}`. `<h1>` är rubriken. Ärendenummer = id, Status = "Nytt",
  Prioritet och Kategori som etiketter, Skapad = `formatCreatedAt(createdAt)` importerad från `src`
  med `test.use({ timezoneId: 'Europe/Stockholm' })`, Namn, E-post, Beskrivning.
- AK-3: två tester. `/tickets/999999999` (finns inte) och `/tickets/abc` visar "Ärendet hittades inte".
  För `abc` kontrolleras också att inget `GET /api/tickets/...` skickades (beslut 2).
- AK-6: från ett visat ärende, och från "hittades inte", leder "Tillbaka till ärendelistan" till
  `/tickets` med rubriken "Tickets". Laddning och laddfel, se fråga 3.
- AK-7: två tester. Nytt ärende: comboboxen "Status" har värdet `New`, fyra alternativ i ordningen
  Nytt, Pågående, Väntar på kund, Avslutat, och "Nytt" är inaktiverat. Ärende satt till
  `WaitingForCustomer` via API: det alternativet är valt och "Nytt" är inte valt.
- AK-8: välj "Väntar på kund", "Spara status". Status i uppgifterna = "Väntar på kund", en `status`-region
  har "Status ändrad till Väntar på kund", och knappen "Spara status" har fokus.
- AK-9: ändra status i gränssnittet, vänta på svaret, ladda om. Status visar den nya statusen och listan
  har den förvald.
- AK-10: nytt ärende, "Spara status" utan att välja. Comboboxen har `aria-invalid="true"` och
  tillgänglig beskrivning "Välj en ny status", och inget `PUT` spelades in.

**Steg 4. End-to-end med mockat API (AK-4, AK-5, AK-11, AK-12)**
- Nya filer, alla med `Ticket`- och `ProblemDetails`-typer från klienten och fel som problem+json.
  Både `GET` och `PUT` mockas, eftersom den mockade sviten inte har någon backend.
  - `e2e-mocked/ticket-detail-load.spec.ts`:
    - AK-4: `GET` hålls kvar. "Laddar ärende…" i `role="status"`, och länken tillbaka syns. Svaret
      släpps, och rubriken visas.
    - AK-5: `GET` svarar 500, och sedan ett test med `route.abort('failed')`. Båda visar "Ärendet kunde
      inte hämtas. Försök igen senare." i `role="alert"`, och länken tillbaka syns.
  - `e2e-mocked/ticket-detail-save.spec.ts`:
    - AK-11: `PUT` hålls kvar. Efter första klicket har knappen namnet "Sparar…" och är inaktiverad.
      Ett nytt försök (Enter på knappen som har fokus, fråga 1) ger inget andra `PUT` inom en sekund,
      samma teknik som `create-ticket-pending.spec.ts`. Svaret släpps, och bekräftelsen visas.
    - AK-12: ärende med `InProgress`, välj "Avslutat", `PUT` svarar 500, och ett test till med
      nätverksfel. "Statusen kunde inte sparas. Försök igen." i `role="alert"`, comboboxen har kvar
      `Closed`, och Status i uppgifterna är fortfarande "Pågående".

**Kontrollpunkt 2:** kör `npm test`, `npm run test:e2e:mocked` och hela stacken via
`compose.test.yaml`, och visa verklig utskrift. Allt nytt ska falla på påståenden.

**Steg 5. Etiketter, datum, id och klient**
- `STATUS_LABELS` med riktiga värden. `formatCreatedAt` med `Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium',
  timeStyle: 'short', timeZone })`. `parseTicketId` godtar bara `^[1-9]\d*$` upp till 2147483647.
- `getTicket(id)`: `request<Ticket>(`/tickets/${id}`, { method: 'GET' })`. `updateTicketStatus(id, status)`:
  `PUT` med JSON-kropp `{ status }`, samma form som `createTicket`.

**Steg 6. Detaljsidan (AK-1, AK-3–AK-6)**
- `src/pages/TicketDetailPage.tsx`. `useParams` → `parseTicketId`. Ogiltigt id ger tillståndet
  "not-found" utan anrop. Annars `api.getTicket` i en `useEffect` som ignorerar svar som kommer efter att
  id:t har bytts. `ApiError` med status 404 ger "not-found", alla andra fel ger "error".
- Alltid renderat: länken "Tillbaka till ärendelistan" (`Link` till `/tickets`), en `role="status"` för
  "Laddar ärende…" och en `role="alert"` för laddfelet. Regionerna ligger utanför den del som byts mellan
  tillstånden, så att de finns innan texten sätts (beslut 13, fråga 2).
- Visat ärende: `<h1>` med rubriken, `<dl>` med etiketterna i Visning (Status, Prioritet och Kategori via
  `*_LABELS`, Skapad via `formatCreatedAt` utan tidszon, alltså webbläsarens), och statusformuläret.
  När formuläret har sparat ersätts ärendet i sidans state av svaret.
- Tailwind-klasser och fokusringar som i `CreateTicketDrawer`.

**Steg 7. Statusformuläret (AK-7, AK-8, AK-10, AK-11, AK-12)**
- `src/features/ticket-detail/StatusForm.tsx`, props `ticket` och `onSaved(ticket)`.
- `<label>` "Status" kopplad till en `<select>` med `TICKET_STATUSES` i ordning. "Nytt" har `disabled`.
  Startvärde är ärendets status.
- Submit: om ett sparande pågår (`savingRef`), gör inget. Rensa bekräftelse och fel. Om `New` är valt:
  visa "Välj en ny status" under listan, `aria-invalid` och `aria-describedby` på listan, inget anrop
  (fråga 5). Annars `api.updateTicketStatus`. Vid lyckat svar: `onSaved(svaret)` och
  "Status ändrad till <etikett>" i formulärets `role="status"`. Vid fel: "Statusen kunde inte sparas.
  Försök igen." i formulärets `role="alert"`, valt värde ligger kvar.
- Under sparning: knappen visar "Sparar…" och är inaktiverad med `aria-disabled="true"` i stället för
  `disabled`, så att fokus stannar på knappen (fråga 1).
- Båda live-regionerna renderas alltid, tomma tills de får text (beslut 13).

**Steg 8. Sabotagekontroll**
- (a) Ta bort kontrollen av `New` före sparning. Väntat: AK-10 i `e2e/` faller, eftersom ett `PUT` med
  `New` skickas (backend svarar 400) och "Välj en ny status" inte visas.
- (b) Ta bort spärren mot ett andra sparande (`savingRef`-kontrollen). Väntat: AK-11 faller på att ett
  andra `PUT` skickas. Se fråga 1 om varför det bara gäller med `aria-disabled`.
- Rapportera vilka tester som föll och varför, och återställ koden efter varje sabotage.

**Steg 9. Slutkörning och rapport**
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e:mocked` och hela
  stacken via `compose.test.yaml` (sedan `down`). Verklig utskrift och rapport i avsnitt 4
  (kontrollpunkt 3).

### Oklarheter och skillnader mellan spec och kod

1. **Beslut 8 och 9 krockar med `disabled`.** En knapp som har fokus och får `disabled` tappar fokus i
   Chrome (fokus flyttas till `body`). Då stannar inte fokus på knappen efter sparningen (AK-8). Dessutom
   släpper en `disabled` knapp inga klick, så sabotage (b) skulle inte få AK-11 att falla.
   Förslag: `aria-disabled="true"` plus `savingRef`. Playwrights `toBeDisabled` räknar `aria-disabled`.
   Playwright klickar inte på en sådan knapp, så testet trycker Enter på knappen som har fokus.
   Alternativ: `disabled` och flytta fokus tillbaka till knappen efter svaret. Vilket vill du ha?
2. **Laddningsregionen och beslut 13.** "Laddar ärende…" är sidans första tillstånd, så regionen och
   texten kommer i samma rendering. Ska jag rendera regionen tom och sätta texten i effekten som startar
   hämtningen, eller räcker det att den finns från början? Uppläsningen går bara att kontrollera manuellt.
3. **AK-6 i laddnings- och feltillståndet** går inte att framkalla mot hela stacken. Förslag: `e2e/`
   testar visat ärende och "hittades inte", och testerna för AK-4 och AK-5 i `e2e-mocked/` kontrollerar
   att länken syns. Räcker det, eller vill du ha egna klick-tester för AK-6 i den mockade sviten?
4. **Vad räknas som giltigt id?** Förslag: bara `^[1-9]\d*$` upp till 2147483647 (backendens `int`).
   Då ger `0`, `-1`, `1.5`, `01`, `1e3`, `abc` och för stora tal "Ärendet hittades inte" utan anrop.
   `parseTicketId` är en ny fil som inte står i beslut 14, och testerna är intern logik (fallen utom `abc`
   finns inte i specen). Får jag lägga den i `features/ticket-detail/` och testa de ogiltiga fallen med
   ett `it.each`?
5. **När försvinner "Välj en ny status"?** Specen säger inget. Förslag: som i registreringsformuläret,
   alltså först vid nästa försök att spara. Ska fokus flytta till listan när felet visas (som AK-11 i
   registreringen), eller stanna på knappen? Utan fokusflytt eller live-region läses felet inte upp.
6. **Hur hittas värdena i `<dl>`?** Förslag: varje `<dd>` får `aria-labelledby` till sin `<dt>`, så att
   testerna kan använda `getByRole('definition', { name: 'Status' })`. Alternativet utan extra ARIA är en
   CSS-syskonväljare (`dt` + `dd`) i testerna. Vilket föredrar du?
7. **Sidrubrik i laddning, laddfel och "hittades inte".** Bara det visade ärendet har en rubrik i specen.
   Förslag: "Ärendet hittades inte" blir sidans `<h1>`, och laddning och laddfel har ingen `<h1>`
   (texten står i live-regionen). Okej?
8. **Spara samma status igen** (till exempel "Pågående" när ärendet redan är Pågående) skickar ett
   `PUT`, får `200` och visar "Status ändrad till Pågående". Det följer specens beslut, men texten kan
   uppfattas som att något ändrades. Jag testar det inte.
9. **AK-1 och Skapad mot hela stacken.** Värdet beror på webbläsarens tidszon. Testet sätter
   `timezoneId` och jämför med `formatCreatedAt` importerad från `src`. Själva formatet testas i AK-2.
10. **Filer utanför min lista som blir inaktuella:**
    - `e2e/smoke.spec.ts` säger att detaljsidan "loads nothing". Nu hämtar `/tickets/1` ett ärende
      (404 eller ett ärende från ett annat test). Testet klarar sig, men kommentaren blir fel.
    - Dokumentkommentaren i `client.ts` ("the other methods are still stubs") blir delvis fel. Får jag
      ändra den raden?
    - `AGENTS.md` nämner `e2e-mocked/ticket-list.spec.ts` och `docs/teststrategi.md` ett exempeltest i
      den mockade sviten. Filen finns inte längre. Jag rör inte dessa.
11. **Fyra live-regioner på sidan** när ärendet visas (sidans status och alert, formulärets status och
    alert) plus `Layout`s. Testerna filtrerar på text inom `main`. Säg till om du hellre vill att sidan
    och formuläret delar regioner.

## 3. Kontrollpunkter

### Kontrollpunkt 1: planen (2026-11-10)
Godkänd med svar på agentens oklarheter. Viktigast: agenten visade att beslut 8 (knappen
`disabled` under sparning) krockade med AK-8. En fokuserad knapp som blir `disabled` tappar fokus,
och en `disabled`-knapp ignorerar klick, så sabotage (b) hade aldrig kunnat få AK-11 att falla.
Ändrat till `aria-disabled="true"` och ett skydd i koden. Övriga svar: laddningsregionen renderas
tom först, giltigt id är `^\d+$` inom 1–2147483647 som i backend, fokus flyttas till listan vid
"Välj en ny status" (tillagt i AK-10 i specen), `<dd>` får `aria-labelledby`, "Ärendet hittades
inte" är `<h1>`, separata live-regioner för sidan och formuläret.

### Kontrollpunkt 2: röda tester (2026-11-10)
Körde allt själv med samma utfall som agenten: 22 enhetstester, 6 mockade och 10 end-to-end-tester
faller på påståenden, alla befintliga gröna, typecheck och lint rena.

Begränsning: end-to-end-testerna faller på första steget (rubriken), eftersom sidan är en
platshållare. Att AK-kontrollerna själva kan falla visas bara för AK-10 och AK-11 genom
sabotagekontrollerna. Skapad i AK-1 jämförs med `formatCreatedAt`, vars format låses av AK-2.

### Kontrollpunkt 3: grönt och sabotage (2026-11-10)
Körde allt själv: lint, typecheck, 58 enhetstester, build, 9 mockade och 29 end-to-end-tester
gröna. Granskade diffen. Sabotagekontrollerna föll av rätt anledning.

Två beslut under steget:
- Mitt svar om `aria-labelledby` på `<dd>` var fel. ARIA 1.3 tillåter inget namn på rollen
  `definition`, så testerna hittade inga värden. Testerna hittar nu termen via roll och text och tar
  värdet med `+ dd`. Felet syntes inte vid kontrollpunkt 2, eftersom testerna föll redan på
  rubriken, alltså den begränsning som noterades där.
- Lint varnade för `setState` i en effekt. I stället för ett undantag härleds laddningsläget från
  hämtningens resultat. "Laddar ärende…" finns då från första renderingen, och uppläsningen
  kontrolleras manuellt.

## 4. Resultat

Skrivet av agenten vid kontrollpunkt 3. Inget är committat.

### Ändrade filer

- `frontend/src/types/ticket.ts`: `STATUS_LABELS`.
- `frontend/src/api/client.ts`: `getTicket` och `updateTicketStatus` via `request`, och dokumentkommentaren.
- `frontend/src/features/ticket-detail/formatCreatedAt.ts`, `parseTicketId.ts` och `StatusForm.tsx` (ny).
- `frontend/src/pages/TicketDetailPage.tsx`.
- `frontend/e2e/ticket-detail.spec.ts` och `frontend/e2e-mocked/ticket-detail-save.spec.ts`: bara
  hur värdena i `<dl>` hittas (se nedan). Alla AK-påståenden är oförändrade.
- Testfilerna från kontrollpunkt 2 (`*.test.ts`, `e2e-mocked/ticket-detail-load.spec.ts`) är oförändrade.

### Avvikelser från planen

- **`<dd>` har ingen `aria-labelledby`.** Playwright (och ARIA 1.3) tillåter inget namn på rollen
  `definition`, så `getByRole('definition', { name })` hittade inget. Enligt Linus beslut hittar testerna
  termen via roll och text och tar värdet med `locator('+ dd')`.
- **Laddningsregionen följer inte längre beslut 13.** Enligt Linus beslut sparas bara resultatet av
  hämtningen (id plus ärende, "hittades inte" eller fel), och state sätts bara i promise-callbackarna.
  Inget resultat för aktuellt id betyder laddning, så "Laddar ärende…" står i regionen redan vid första
  renderingen. Ingen lint-undantagskommentar behövs. Om VoiceOver läser upp texten (AK-4) kontrolleras
  manuellt. Felregionen och formulärets regioner finns fortfarande innan de får text.
- `parseTicketId`-stubben i steg 1 returnerade `0` i stället för `undefined`, så att även de ogiltiga
  fallen föll röda.

### Kommandon och verklig utskrift

| Kommando | Utfall |
|---|---|
| `npm run lint` | Ingen utskrift efter `oxlint`, alltså inga varningar eller fel |
| `npm run typecheck` | Inga fel |
| `npm test` | `Test Files 5 passed (5)`, `Tests 58 passed (58)` |
| `npm run build` | `✓ built in 117ms` |
| `npm run test:e2e:mocked` | `9 passed (2.8s)` |
| `docker compose -f compose.test.yaml run --build --rm e2e` | `29 passed (3.3s)`, exit 0. Sedan `down` |

Första körningen med `getByRole('definition', { name })` gav 3 fel i hela stacken (AK-1, AK-8, AK-9) och
2 i den mockade sviten (AK-12 ×2), alla "element(s) not found" på den lokatorn. Därav ändringen ovan.

### Sabotagekontroll

| Sabotage | Svit | Utfall |
|---|---|---|
| (a) Kontrollen av "Nytt" före sparning bortkopplad (`if (false)`) | Hela stacken | `1 failed`, `28 passed`. AK-10 föll på `toHaveAttribute('aria-invalid', 'true')`, `Received: ""`: inget fel visades, och formuläret skickade `PUT` med `New` |
| (b) Spärren `if (savingRef.current) return` borttagen | Mockad | `1 failed`, `8 passed`. AK-11 föll på `expect(await secondRequestSent).toBe(false)`, `Received: true`: Enter på knappen "Sparar…" skickade ett andra `PUT` |

Koden återställdes efter varje sabotage (filen jämförd med en kopia), och slutkörningen ovan är grön.

### AK

- Täckta automatiskt: AK-1, AK-3, AK-6, AK-7, AK-8, AK-9, AK-10 (hela stacken), AK-2 (Vitest),
  AK-4, AK-5, AK-11, AK-12 (mockat API). AK-6 i laddnings- och feltillståndet kontrolleras som att
  länken syns i testerna för AK-4 och AK-5. Klicket testas mot hela stacken.
- Inte verifierat: uppläsning och fokus med tangentbord och VoiceOver i AK-4, AK-5, AK-8, AK-10 och
  AK-12 (Linus manuella kontroll), och synliga fokusringar och stilen för `aria-disabled` (visuellt).
- AK-13 till AK-19 är backend (uppdrag A).

### Osäkerheter

- Byte mellan två ärenden utan omladdning (till exempel `/tickets/1` till `/tickets/2`) visar laddning
  och ignorerar sena svar för det gamla id:t, men det testas inte. Specen har inget AK för det.
- `+ dd` är en CSS-syskonväljare på elementnamn, inte en klass, men testerna är inte helt rollbaserade.
- AK-1 jämför Skapad med `formatCreatedAt` körd i Node mot Chromium. Det gick igenom, men ICU-data kan
  skilja mellan versioner.
- Att spara samma status igen testas inte, enligt beslut.
- Kommentaren i `e2e/smoke.spec.ts` om att detaljsidan "loads nothing" är inaktuell. Linus tar den separat.

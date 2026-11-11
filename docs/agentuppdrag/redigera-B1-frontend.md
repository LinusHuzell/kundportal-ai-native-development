# Agentuppdrag: Redigera ärende, uppdrag B1 (frontend, fristående komponent)

Ansvarig: Carolina
Branch: `feat/redigera-ärende`
Spec: [docs/specs/redigera-ärende.md](../specs/redigera-ärende.md)
Bygger på: [uppdrag A (backend)](redigera-A-backend.md)

## 1. Prompt

```text
# Task B1: frontend for "Redigera ärende", standalone component

## Context
- Repo: Kundserviceportalen. Frontend React 19, TypeScript, Vite, Tailwind, React Router.
- Branch: feat/redigera-ärende. Work only here.
- Task A (backend) is done: PATCH /api/tickets/{id} works as the contract says.
  See docs/agentuppdrag/redigera-A-backend.md, section 4, for what was built.
- Spec: docs/specs/redigera-ärende.md. The Felfall table in
  docs/specs/registrera-ärende.md is the only source for rules and messages.
  Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing and Accessibility) and docs/teststrategi.md.
- API contract: docs/api/kontrakt.md. PATCH: all fields optional, sent fields are
  validated, 200 Ticket, 400 problem+json with field errors, 404.
- Current state: api.updateTicket in client.ts is a stub (notImplemented).
  UpdateTicketInput exists in types/ticket.ts. validateTicket.ts and
  CreateTicketDrawer.tsx are the registration form and show the pattern to follow.
- The ticket detail view is being moved into a panel on the start page right now
  by someone else. Do not build the "Redigera" button or put the form on any page.
  That is task B2.
- Code and comments in English. UI text in Swedish.

## Goal
A standalone EditTicketForm component and api.updateTicket, ready to be placed in the
detail panel in task B2. Covers the frontend parts of AK-1, AK-2, AK-8 and AK-9 that
can be checked without a page, and the "has changes" logic that AK-10 and AK-11 need.

## Decisions already made (do not ask again)
1. EditTicketForm props: ticket, onSaved(ticket), onCancel(), onDirtyChange(isDirty).
   The parent owns focus after save or cancel, so the component does not move focus
   outside itself.
2. The six fields start with the ticket's current values: Rubrik, Beskrivning,
   Kategori, Prioritet, Namn, E-postadress (same labels as the registration form).
3. Validation is validateTicket.ts. Do not copy the rules.
4. "Has changes" is a pure function, hasChanges(ticket, values). A field counts as
   changed only if its value differs from the saved ticket. Typing and then
   restoring the original value counts as no change.
5. Save sends all six fields with PATCH. On errors from validateTicket, show all
   errors and send no request.
6. A 400 from the API puts its field errors on the same fields. A 404, 5xx or network
   failure shows "Ärendet kunde inte sparas. Försök igen." in a role="alert" region
   that is always rendered, and the values stay.
7. Buttons: "Spara ändringar" and "Avbryt". Avbryt calls onCancel and sends nothing.
8. No styling work. Use semantic HTML and only the classes needed to read the form.
   Every field has a <label>. Errors are linked with aria-invalid and aria-describedby.
   On mount, focus goes to the first field.
9. You may move the shared field markup out of CreateTicketDrawer.tsx into a shared
   component, only if the registration form behaves exactly the same afterwards and
   all existing tests pass without changes. Otherwise leave the drawer alone.

## Stage 0: plan only
1. Read the spec, registrera-ärende.md (Felfall), AGENTS.md, docs/teststrategi.md,
   kontrakt.md and the frontend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec, the contract and the code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- frontend/src/features/edit-ticket/ (new: EditTicketForm.tsx, hasChanges.ts and tests)
- frontend/src/api/client.ts (only updateTicket) and frontend/src/api/client.test.ts
- frontend/src/features/create-ticket/ (only for decision 9)
- This log file, sections 2, 3 and 4
Ask before touching anything else. Never touch docs/api/, backend/,
TicketListPage.tsx or TicketDetailPage.tsx.

## Tests
- Vitest, client: valid PATCH sends PATCH /api/tickets/{id} with the body and returns
  the ticket. 400 becomes field errors. 404, 500 and network failure become an error
  without field errors.
- Vitest, hasChanges: no change, one changed field per field, changed and restored.
- Vitest, the values the form starts with: a pure function that turns a Ticket into
  form values, tested for all six fields.
- Red first: show each test failing on an assertion before the code exists.
- Sabotage-check: make hasChanges always return false, and send the request even when
  validateTicket returns errors. Report which tests failed.
- No Playwright tests in B1. The form is not on any page yet. They are part of B2.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green, with the final report.

## Commands (from frontend/)
- npm run lint, npm run typecheck, npm test, npm run build

## Boundaries
- No backend changes and no changes to the contract. If the contract is unclear,
  stop and tell me.
- No new packages without asking.
- Never weaken, skip or delete a test to make it pass.
- Do not commit, push or open a pull request.

## Report (section 4 of this file)
- Changed files.
- Commands run and their real output.
- AK covered, and AK not verified with the reason.
- Anything you are unsure about.
- Never say something works unless you ran the check.
```

### Varför prompten ser ut så här

| Del | Varför |
|---|---|
| Hänvisning till uppdrag A | Backend är klar. Agenten ska läsa vad som faktiskt byggdes, inte bara kontraktet. |
| Ingen knapp, ingen sida | Detaljvyn flyttas in i panelen just nu. Annars blir det krock. Det blir uppdrag B2. |
| Props med `onDirtyChange` | Listan behöver veta om något är ändrat för AK-10 och AK-11. |
| `hasChanges` som ren funktion | Den går att testa med Vitest utan sida. Beslutet om "ändrat och återställt" står i specen. |
| Ingen styling | Funktion först. Utseendet görs när komponenten ligger i panelen. |
| Rör aldrig `docs/api/` | Kontraktet ändrades i uppdrag A. Frontend ska följa det, inte ändra det. |
| Inga Playwright-tester i B1 | Det finns ingen sida att testa på än. De kommer i B2. |

## 2. Plan

### Utgångsläge (läst)
- Vitest körs med `environment: 'node'`. Det finns ingen jsdom och inget Testing Library, så
  React-komponenter kan inte renderas i Vitest utan nya paket.
- `api.updateTicket` är en stub. `request()` gör redan om ett 400 med `errors` till `fieldErrors`
  och ger `ApiError` utan `fieldErrors` vid 404, 5xx och nätverksfel (status 0).
- `validateTicket(values: CreateTicketFormValues)` tar sex strängar, som formuläret behöver.
- Felfall-tabellen och kontraktets fältnamn (`title`, `description`, `category`, `priority`,
  `customerName`, `customerEmail`) stämmer med `validateTicket` och `Ticket`.

### Förslag: logiken i rena funktioner
Eftersom komponenten inte kan testas i Vitest lägger jag allt beslutsfattande i rena funktioner,
som testas i Vitest. Komponenten blir ett tunt skal som kopplar dem till fälten. Det gör att
sabotaget "skicka anropet trots fel från validateTicket" kan fångas av ett test.

| Funktion | Fil | Gör |
|---|---|---|
| `toFormValues(ticket)` | `edit-ticket/editTicket.ts` | Ticket → sex strängar (beslut 2) |
| `hasChanges(ticket, values)` | `edit-ticket/hasChanges.ts` | Exakt strängjämförelse per fält, ingen trimning (beslut 4) |
| `saveTicketEdit(id, values, update)` | `edit-ticket/editTicket.ts` | Kör `validateTicket`. Vid fel: `{ kind: 'invalid', errors }` utan anrop. Annars anropar `update(id, alla sex fält)` och ger `{ kind: 'saved', ticket }`, `{ kind: 'invalid', errors }` (400 med fältfel) eller `{ kind: 'failed' }` (404, 5xx, nätverk, 400 utan fältfel) (beslut 5, 6) |

`update` skickas in som parameter (i komponenten `api.updateTicket`), så testet använder en egen
fejkfunktion i stället för att mocka modulen.

### Steg

**Steg 1. `api.updateTicket`** (AK-1, AK-2, AK-9 frontenddelen)
- Filer: `frontend/src/api/client.ts` (bara `updateTicket`), `frontend/src/api/client.test.ts`.
- Kod: `request<Ticket>(`/tickets/${id}`, { method: 'PATCH', headers: JSON, body: JSON.stringify(input) })`.
- Tester (nytt `describe('api.updateTicket')`, samma mönster som `createTicket`):
  1. skickar PATCH till `/tickets/{id}` med kroppen och returnerar ärendet (200)
  2. 400 med `errors` blir `fieldErrors` (status 400)
  3. 404 ger `ApiError` med status 404 och utan `fieldErrors`
  4. 500 ger `ApiError` med status 500 och utan `fieldErrors`
  5. nätverksfel ger `ApiError` med status 0 och utan `fieldErrors`
  (3–5 som ett `it.each`, samma regel och resultat.)
- Rött: stubben kastar 501, så test 1 faller på `resolves` och 3–5 på `status`.

**Steg 2. `toFormValues`** (AK-7 frontenddelen: fälten har nuvarande värden)
- Filer: `edit-ticket/editTicket.ts`, `edit-ticket/editTicket.test.ts`.
- Tester: ett test per fält (sex stycken, `it.each`) att värdet kommer från ärendet, och ett test
  att `id`, `ticketNumber`, `status` och `createdAt` inte finns med i värdena.
- Rött: en stub som returnerar tomma strängar skrivs först, så att testet faller på assertion
  och inte på import.

**Steg 3. `hasChanges`** (underlag för AK-10 och AK-11)
- Filer: `edit-ticket/hasChanges.ts`, `edit-ticket/hasChanges.test.ts`.
- Tester:
  1. inga ändringar → `false` (värden från `toFormValues`)
  2. ett ändrat fält per fält → `true` (`it.each`, sex fall)
  3. ändrat och sedan återställt → `false`
  4. gränsfall: bara ett tillagt mellanslag räknas som ändring (följer av "värdet skiljer sig",
     och validering trimmar inte heller)
- Rött: stubben returnerar `false`, så fall 2 och 4 faller. Fall 1 och 3 är gröna mot stubben, så
  jag visar dem röda med en tillfällig stub som returnerar `true`.

**Steg 4. `saveTicketEdit`** (AK-1, AK-2, beslut 5 och 6)
- Filer: `edit-ticket/editTicket.ts`, `edit-ticket/editTicket.test.ts`.
- Tester:
  1. giltiga värden → `update` anropas en gång med id och alla sex fält, resultat `saved` med ärendet från svaret
  2. ogiltiga värden → `invalid` med alla fel från `validateTicket`, och `update` anropas inte
  3. 400 med fältfel → `invalid` med serverns fel
  4. 404, 500, nätverksfel → `failed` (`it.each`)
  5. 400 utan fältfel (trasig JSON enligt kontraktet) → `failed`
- Sabotage: (a) `hasChanges` returnerar alltid `false` → steg 3 fall 2 och 4 ska falla.
  (b) anropet skickas trots valideringsfel → steg 4 test 2 ska falla. Jag rapporterar exakt vilka.

**Steg 5. `EditTicketForm.tsx`** (AK-1, AK-2, AK-8 och AK-9 till den del som ligger i komponenten)
- Fil: `edit-ticket/EditTicketForm.tsx`.
- Props enligt beslut 1. Startvärden från `toFormValues(ticket)`.
- `onDirtyChange(hasChanges(ticket, values))` i en `useEffect` när värdet ändras (första anropet
  blir `false` vid mount).
- Fokus till Rubrik vid mount (beslut 8). Ingen fokusflytt utanför komponenten.
- Submit: `saveTicketEdit`. `saved` → `onSaved(ticket)`. `invalid` → visa felen på fälten.
  `failed` → "Ärendet kunde inte sparas. Försök igen." i en `role="alert"` som alltid finns i DOM:en.
  Värdena ligger kvar i alla felfall.
- Fält, etiketter, `aria-invalid`, `aria-describedby` och knappar ("Spara ändringar" som submit,
  "Avbryt" som `type="button"` som bara anropar `onCancel`) enligt beslut 7 och 8.
- Tester: inga i Vitest (se fråga 2). Kontroll: lint, typecheck och build. Beteendet i komponenten
  verifieras med Playwright i B2.

**Steg 6. Beslut 9 (delad fältmarkup).** Förslag: rör inte drawern i B1. Drawern har inga
Vitest-tester, så "alla befintliga tester passerar" betyder e2e-sviten mot hela stacken (Docker).
Formulären skiljer sig också (tom kategori med platshållare, olika knappar, dialog). Det som delas
på riktigt, reglerna, delas redan via `validateTicket`. Markupen dupliceras (cirka 60 rader).

**Steg 7. Körning och rapport.** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
från `frontend/`, och resultatet i avsnitt 4.

### AK-täckning i B1

| AK | I B1 | Inte i B1 |
|---|---|---|
| AK-1 | `updateTicket` skickar PATCH, `saveTicketEdit` skickar alla sex fält och ger ärendet | Att ärendet faktiskt uppdateras (backend, AK-4, och e2e i B2) |
| AK-2 | Fel från `validateTicket` och från 400 hamnar på fälten, inget anrop vid fel | `aria-describedby` i DOM:en (ingen DOM i Vitest, Playwright i B2) |
| AK-3 | – | Hör till detaljpanelen (fråga 3 i specen är öppen) |
| AK-7 | `toFormValues` | Knappen "Redigera" (B2) |
| AK-8 | Avbryt anropar `onCancel` och skickar inget (bara i kod, inget test) | Skrivskyddat läge och fokus till "Redigera" (föräldern, B2) |
| AK-9 | `onSaved` får ärendet från svaret | Bekräftelse som läses upp och fokus till "Redigera" (föräldern, B2, se fråga 4) |
| AK-10, AK-11 | `hasChanges` och `onDirtyChange` | Dialogen och listbytet (B2) |

### Oklarheter och motsägelser

1. **Fel gren och ingen worktree.** Prompten säger `feat/redigera-arende-frontend` i en egen
   worktree. `git worktree list` visar bara huvudmappen, som står på `feat/redigera-ärende` med
   uppdrag A:s ocommittade backendändringar (`backend/`, `docs/api/`). Grenen
   `feat/redigera-arende-frontend` finns inte. Jag har bara skrivit i den här loggfilen. Innan
   steg 1 behöver worktreen skapas (t.ex. `git worktree add ../kundportal-b1 -b feat/redigera-arende-frontend main`).
   Obs: loggfilen och specen är ospårade, och kontraktsändringen för PATCH är ocommittad, så de
   finns inte i en worktree från `main`. Vill du att jag skapar den, och ska den utgå från `main`
   eller från `feat/redigera-ärende`?
2. **Inga komponenttester möjliga.** Fokus vid mount, `role="alert"`, `aria-invalid`,
   `aria-describedby` och "Avbryt skickar inget" kan inte testas i Vitest utan `jsdom` (eller
   `happy-dom`) och `@testing-library/react`. Mitt förslag är rena funktioner nu och Playwright i
   B2. Alternativet är att lägga till paketen, vilket kräver ditt godkännande.
3. **Fokus vid fel och dubbelklick.** Registreringen flyttar fokus till första fältet med fel
   (registrera AK-11) och ignorerar ett nytt "Spara" medan ett anrop pågår (registrera AK-12).
   Redigera-specen har inget av dem, så enligt "varje beteende ska spåras till ett AK" bygger jag
   dem inte. Ska de läggas till i specen?
4. **Bekräftelsen i AK-9.** Om föräldern byter till skrivskyddat läge vid `onSaved` försvinner
   komponenten, så bekräftelsen måste ligga i föräldern (B2). Jag bygger ingen bekräftelse i B1.
5. **404 vid sparning.** Beslut 6 ger samma meddelande som vid 5xx. AK-3 ("Ärendet kunde inte
   hittas") gäller när ärendet öppnas, inte när det sparas. Jag tolkar det som att de inte krockar.
6. **400 utan `errors`** (trasig JSON eller fel JSON-typ enligt kontraktet) behandlas som `failed`,
   som i registreringen. Det följer av kontraktet, men nämns inte i beslut 6.
7. **Spara utan ändringar.** Inget säger att knappen ska vara avstängd. Jag skickar då alla sex
   fält med oförändrade värden. Kontraktet ger `200` och ärendet blir oförändrat.
8. **Nytt ärende medan formuläret visas.** Komponenten läser `ticket` bara vid mount. B2 bör
   rendera den med `key={ticket.id}`, annars ligger de gamla värdena kvar.
9. **Typnamn.** Formuläret återanvänder `CreateTicketFormValues` och `CreateTicketFieldErrors` från
   `create-ticket/validateTicket.ts`. Namnen säger "Create" men typerna passar. Jag byter inte namn,
   eftersom det skulle ändra filer utanför uppdraget.

## 3. Kontrollpunkter

### Kontrollpunkt 1: plan godkänd (2026-11-10)
Svar: ingen worktree, arbeta på `feat/redigera-ärende`. Rena funktioner och Vitest nu, Playwright i
B2, inga nya paket. Fokus till första fältet med fel (AK-12) och spärr mot dubbelsparning (AK-13)
byggs. Bekräftelsen byggs i B2. 400 utan `errors` blir `failed`. Typerna byter inte namn.

Tillägg i planen för AK-12 och AK-13, med samma mönster som övriga rena funktioner:
- `firstFieldWithError(errors)` i `editTicket.ts`: första fältet med fel i formulärets ordning (AK-12).
- `ignoreWhilePending(fn)` i `ignoreWhilePending.ts`: anrop medan ett tidigare pågår ignoreras och
  ger `undefined`. Efter att anropet lyckats eller misslyckats går det att spara igen (AK-13).

### Kontrollpunkt 2: tester skrivna och röda (2026-11-10)

Filer:
- `frontend/src/api/client.test.ts`: nytt `describe('api.updateTicket')` (5 tester), och
  `UpdateTicketInput` tillagd i typimporten.
- `frontend/src/features/edit-ticket/editTicket.test.ts` (16 tester): `toFormValues`,
  `firstFieldWithError`, `saveTicketEdit`.
- `frontend/src/features/edit-ticket/hasChanges.test.ts` (9 tester).
- `frontend/src/features/edit-ticket/ignoreWhilePending.test.ts` (3 tester).
- Stubbar, så att testerna faller på assertion och inte på import: `editTicket.ts`,
  `hasChanges.ts`, `ignoreWhilePending.ts` (markerade `STUB`). `api.updateTicket` är kvar som den
  befintliga stubben (kastar 501).

**Körning 1, med stubbarna** (`npx vitest run --reporter=verbose src/api/client.test.ts src/features/edit-ticket`):

```text
 Test Files  4 failed (4)
      Tests  23 failed | 28 passed (51)
```

Av de 28 som passerar är 18 befintliga tester för andra klientmetoder. 10 nya tester passerar
eftersom stubben råkar ge det väntade värdet (t.ex. `hasChanges` → `false`). Röda nya tester och orsak:

| Test | Fel |
|---|---|
| `api.updateTicket` patches the input … returns the ticket | `promise rejected "ApiError: updateTicket: API contract not …" instead of resolving` |
| `api.updateTicket` 400 → field errors | `expected ApiError … to match object { status: 400, fieldErrors: { …(2) } }` |
| `api.updateTicket` 404 / 500 / network failure | `expected ApiError … to match object { status: 404 / 500 / +0, fieldErrors: undefined }` (stubben ger 501) |
| `toFormValues` starts X with the ticket's current value (6 st) | t.ex. `expected '' to be 'Paketet har inte kommit'` |
| `firstFieldWithError` first field in form order | `expected undefined to be 'description'` |
| `saveTicketEdit` sends all six fields … | `expected "vi.fn()" to be called once, but got 0 times` |
| `saveTicketEdit` validation errors, no request | `expected { kind: 'failed' } to deeply equal { kind: 'invalid', errors: { …(2) } }` |
| `saveTicketEdit` field errors from a 400 | `expected { kind: 'failed' } to deeply equal { kind: 'invalid', errors: { …(1) } }` |
| `hasChanges` is true when X differs (6 st) och "only a space is added" | `expected false to be true` |
| `ignoreWhilePending` ignores a second call while pending | `expected "vi.fn()" to be called once, but got 2 times` |

**Körning 2, med tillfälligt omvända stubbar**, för de 10 som var gröna mot stubbarna
(`hasChanges` → `true`, `toFormValues` med ett sjunde fält, `firstFieldWithError` → `'title'`,
`saveTicketEdit` → `saved`, `ignoreWhilePending` som ignorerar alla anrop efter det första).
Stubbarna återställdes direkt efteråt.

| Test | Fel |
|---|---|
| `hasChanges` is false when every field has the saved value | `expected true to be false` |
| `hasChanges` changed and then restored | `expected true to be false` |
| `toFormValues` contains only the six editable fields | `expected [ 'category', 'customerEmail', …(5) ] to deeply equal [ …(4) ]` |
| `firstFieldWithError` undefined when there are no errors | `expected 'title' to be undefined` |
| `saveTicketEdit` returns failed on 404 / 500 / network / 400 utan fältfel (4 st) | `expected { kind: 'saved', ticket: {} } to deeply equal { kind: 'failed' }` |
| `ignoreWhilePending` new call after the first has finished | `expected "vi.fn()" to be called 2 times, but got 1 times` |
| `ignoreWhilePending` new call after the first has failed | `expected undefined to be 'saved'` |

Alla 33 nya tester har alltså setts falla på en assertion.

**Hela sviten och övriga kontroller med stubbarna:**

```text
npm run typecheck   → tsc -b, inga fel
npm run lint        → oxlint, inga fel
npx vitest run      → Test Files  4 failed | 4 passed (8)
                      Tests  23 failed | 74 passed (97)
```

De 4 gröna filerna är de befintliga testerna (`validateTicket`, `ticket`, `formatCreatedAt`,
`parseTicketId`), som inte påverkas.

Inte gjort än: `EditTicketForm.tsx`, riktiga implementationer och sabotagekontrollerna. De görs
efter godkännande.

### Kontrollpunkt 3: allt grönt (2026-11-10)

Agenten stannade efter slutrapporten i avsnitt 4. Inget var committat.

Slutkörning enligt agenten (avsnitt 4): lint och typecheck exit 0, `npm test` 97 passed,
build exit 0. Sabotage på `hasChanges` och på `saveTicketEdit` fick 7 respektive 1 test att falla.

Mina beslut efter kontrollpunkt 3:
- Godkände en tillfällig sida, `DevEditTicketPage.tsx` på `/dev/redigera/:id`, för manuellt test.
  Den togs bort innan B2 (`App.tsx` är som på `main`).
- AK-12 (fokus till första fältet med fel) och AK-13 (spärr mot dubbelklick) lades till i specen,
  som svar på agentens fråga 3 vid kontrollpunkt 1.

Ändring efter kontrollpunkt 3 (enligt avsnitt 4):
- Agenten bytte namn på `editTicketForm.ts` till `editTicket.ts`. Namnet skilde sig från
  `EditTicketForm.tsx` bara i skiftläge, så på macOS gick komponenten inte att importera.
  Typecheck hade missat det, eftersom ingen fil importerade komponenten innan dev-sidan fanns.

Min kontroll:
- På testsidan: Först blev skärmen vit (felet med filnamnen, se nedan). När det var rättat sparade jag en giltig ändring och såg det nya ärendet i `onSaved`. Jag tömde fält och fick felmeddelandena, och jag valde "Avbryt" och såg `onCancel` i loggen.
- Jag bad agenten lägga de två öppna frågorna ("Avbryt" under sparning och en sparning som blir klar efter stängning) i specen, så att de beslutades i B2.

## 4. Resultat

### Ändrade filer
- `frontend/src/api/client.ts`: `updateTicket` skickar `PATCH /tickets/{id}` med JSON via `request()`.
  Hjälpfunktionen `notImplemented` togs bort, eftersom `updateTicket` var den sista stubben och
  typecheck annars faller (TS6133). Dokumentkommentaren uppdaterad.
- `frontend/src/api/client.test.ts`: 5 tester för `updateTicket`, `UpdateTicketInput` i importen.
- Nya i `frontend/src/features/edit-ticket/`:
  - `editTicket.ts`: `EDIT_FIELDS`, `toFormValues`, `firstFieldWithError`, `saveTicketEdit`
  - `hasChanges.ts`
  - `ignoreWhilePending.ts`
  - `EditTicketForm.tsx`
  - `editTicket.test.ts` (16), `hasChanges.test.ts` (9), `ignoreWhilePending.test.ts` (3)
- `create-ticket/` är orörd (beslut 9). Inga andra filer utanför loggfilen.
- **Tillfälligt, för manuellt test (godkänt efter kontrollpunkt 3), tas bort före commit:**
  `frontend/src/pages/DevEditTicketPage.tsx` och routen `/dev/redigera/:id` i `frontend/src/App.tsx`
  (bara i dev-läge).
- **Namnbyte efter kontrollpunkt 3:** `editTicketForm.ts` heter nu `editTicket.ts`, och testfilen
  `editTicket.test.ts`. Namnen skilde sig från `EditTicketForm.tsx` bara i skiftläge. På macOS
  pekade importen `./EditTicketForm` då på `.ts`-filen, så komponenten gick inte att importera
  (TS1149, TS1192). Typecheck missade det tidigare eftersom ingen fil importerade komponenten.
  Efter bytet: lint, typecheck, `Tests 97 passed (97)` och build är gröna.

### Kommandon och resultat (från `frontend/`, efter implementationen)

```text
npm run lint       → oxlint, exit 0, inga varningar
npm run typecheck  → tsc -b, exit 0
npm test           → Test Files  8 passed (8)
                     Tests  97 passed (97)
                     client.ts 96.55 % rader; features/edit-ticket 32 % rader
                     (EditTicketForm.tsx körs inte av några Vitest-tester)
npm run build      → vite v8.3.5, 34 modules transformed, built in 113ms, exit 0
```

Täckningen rapporteras bara, enligt AGENTS.md. Den låga siffran för `edit-ticket` beror på att
komponenten testas med Playwright först i B2.

### Sabotagekontroller

| Sabotage | Resultat | Röda tester |
|---|---|---|
| `hasChanges` returnerar alltid `false` | `Tests 7 failed \| 90 passed (97)` | `is true when <fält> differs from the saved value` (alla 6) och `is true when only a space is added`. Fel: `expected false to be true` |
| `saveTicketEdit` anropar `update` trots fel från `validateTicket` | `Tests 1 failed \| 96 passed (97)` | `returns every validation error and sends no request when fields break a rule`. Fel: `expected "vi.fn()" to not be called at all, but actually been called 1 times` |

Båda återställdes. Efteråt: `Tests 97 passed (97)`, och inga sabotagerader finns kvar i koden.

### AK-täckning

| AK | Verifierat i B1 (Vitest) | Inte verifierat, och varför |
|---|---|---|
| AK-1 | `updateTicket` skickar PATCH med kroppen och ger ärendet. `saveTicketEdit` skickar alla sex fält och ger `saved` med serverns ärende | Att ärendet faktiskt sparas: backend (AK-4) och e2e i B2. Backend kördes inte här |
| AK-2 | Fel från `validateTicket` ger `invalid` utan anrop. 400 med fältfel ger `invalid` med serverns fel | Att felet visas och kopplas med `aria-describedby` och `aria-invalid` i DOM:en: ingen DOM i Vitest. Playwright i B2 |
| AK-7 (delvis) | `toFormValues` ger ärendets värden för alla sex fält | Knappen "Redigera" (B2) |
| AK-8 (delvis) | – | "Avbryt" är `type="button"` och anropar bara `onCancel`, men det är inte testat (ingen DOM). Skrivskyddat läge och fokus till "Redigera" ligger i B2 |
| AK-9 (delvis) | `onSaved` får ärendet från `saveTicketEdit` (bara i kod) | Bekräftelsen och fokus ligger i B2 |
| AK-10, AK-11 (underlag) | `hasChanges`, inklusive ändrat och återställt | `onDirtyChange` i komponenten är inte testad. Dialogen och listbytet ligger i B2 |
| AK-12 | `firstFieldWithError` ger första fältet med fel i formulärets ordning | Att fokus faktiskt flyttas: Playwright i B2 |
| AK-13 | `ignoreWhilePending`: andra anropet ignoreras medan det första pågår, och det går att spara igen efter lyckat eller misslyckat anrop | Att komponenten använder spärren vid riktiga klick: Playwright i B2 |
| AK-3–AK-6 | – | AK-3 hör till detaljpanelen. AK-4 till AK-6 är backend |

Följande finns i komponenten men verifieras först i B2: fokus till Rubrik vid mount,
`role="alert"` som alltid renderas med "Ärendet kunde inte sparas. Försök igen.", att värdena står
kvar vid fel, och etiketterna.

### Osäkert
- **AK-12 och AK-13 i specen.** Tillagda i `docs/specs/redigera-ärende.md` efter kontrollpunkt 3.
- **`onDirtyChange`** anropas med `false` vid mount och sedan varje gång värdet ändras, inte vid
  varje tangenttryck. Den senaste callbacken sparas i en ref, så att en inline-funktion från
  föräldern inte gör att effekten körs vid varje rendering.
- **Ett lyckat svar efter avmontering.** Om föräldern avmonterar formuläret medan ett anrop pågår
  anropas `onSaved` ändå när svaret kommer. Det är ofarligt för state, men B2 bör känna till det.
- **"Avbryt" under pågående sparning** är inte spärrad. Flyttat till "Att besluta i B2" i specen,
  tillsammans med punkten ovan om avmontering.
- **Fältfel med okända nycklar.** Fältfel från servern läggs på fälten som de är. Ett fel på en
  nyckel som inte är ett av de sex fälten visas inte. Kontraktet nämner bara de sex fälten.
- **Uppdrag A ser inte committat ut.** `git status` visade fortfarande ändringarna i `backend/` och
  `docs/api/` som ocommittade (senaste commit `8b070f4`). Det påverkar inte B1.

### Krav på B2
- Rendera `EditTicketForm` med `key={ticket.id}`. Komponenten läser `ticket` bara när den monteras,
  så utan `key` ligger det förra ärendets värden kvar när ett annat ärende väljs.
- Bekräftelsen efter sparning (AK-9) och fokus tillbaka till "Redigera" (AK-8, AK-9) ligger i
  föräldern.

## 5. Min granskning

### Hur jag granskade

- Jag svarade på agentens frågor vid kontrollpunkt 1 och godkände planen.
  - Arbetet görs på `feat/redigera-ärende`, utan worktree.
  - Fokus till första fältet med fel och spärr mot dubbelsparning läggs till som AK-12 och AK-13.
- Jag läste den röda körningen vid kontrollpunkt 2 och slutrapporten vid kontrollpunkt 3.
- Jag bad agenten föra in AK-12 och AK-13 i specen, och lägga de två öppna frågorna under "Att besluta i B2".
- Jag testade komponenten i webbläsaren på en tillfällig sida (`/dev/redigera/:id`). Sidan togs bort i B2.
  - Först blev skärmen vit (felet med filnamnen, se nedan). När det var rättat sparade jag en giltig ändring och såg det nya ärendet i `onSaved`. Jag tömde fält och fick felmeddelandena, och jag valde "Avbryt" och såg `onCancel` i loggen.

### Accepterat, ändrat, avvisat

| Förslag | Beslut | Varför |
|---|---|---|
| Logiken i rena funktioner som testas med Vitest, och komponenten testas med Playwright i B2 | Accepterat | Vitest körs utan DOM. Jag ville inte lägga till jsdom och Testing Library bara för detta. |
| Fokus till första fältet med fel och spärr mot dubbelsparning | Accepterat, och lagt i specen som AK-12 och AK-13 | Samma beteende som i registreringen (AK-11 och AK-12 där). |
| Bekräftelsen efter sparning byggs i föräldern | Accepterat | Formuläret försvinner när det har sparats, så bekräftelsen kan inte ligga i det. |
| Drawerns fältmarkup flyttas inte till en delad komponent | Accepterat | Drawern saknar Vitest-tester, och reglerna delas redan via `validateTicket`. |
| Typerna `CreateTicket…` byter inte namn | Accepterat | Det hade ändrat filer utanför uppdraget. |
| 400 utan fältfel behandlas som "kunde inte sparas" | Accepterat | Samma som i registreringen. |
| "Avbryt" under sparning, och en sparning som blir klar efter att formuläret stängts | Ändrat | Jag beslutade dem inte i B1. De lades i specen som frågor och beslutades i B2. |

### Vad jag ifrågasatte och vad kontrollerna visade

- **Sabotagen fångades.** När `hasChanges` alltid gav `false` föll 7 tester. När anropet skickades trots valideringsfel föll 1 test.
- **Min egen kontroll hittade ett fel som testerna missade.** På testsidan blev skärmen vit. `EditTicketForm.tsx` och `editTicketForm.ts` skilde sig bara i stor och liten bokstav. På macOS pekade importen då på fel fil. Typecheck gick igenom, eftersom ingen fil importerade komponenten än. Logikfilen döptes om till `editTicket.ts`.
- **Uppdrag A var inte committat än** när B1 började, fast prompten sa det. Jag committade det senare samma kväll, som `fad3f3e` (2026-11-10 22:37). Det påverkade inte B1, eftersom B1 inte rörde backend eller kontraktet.

### Begränsningar som är kvar

- Komponenten har inga egna Vitest-tester. Fokus, `aria-describedby`, alerten och "Avbryt" testas med Playwright i B2.
- Vitest visar 32 % radtäckning för `edit-ticket/`, eftersom komponenten inte körs där. Det rapporteras bara.

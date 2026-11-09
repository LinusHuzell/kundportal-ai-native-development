# Agentuppdrag: Registrera ärende, uppdrag B (frontend)

Ansvarig: Carolina
Datum: 2026-11-09
Branch: `feat/registrera-arende`
Spec: [docs/specs/registrera-ärende.md](../specs/registrera-ärende.md)
Bygger på: [uppdrag A (backend)](registrera-A-backend.md)

## 1. Prompt

Skriven av Carolina.

```text
# Task B: frontend for "Registrera ärende"

## Context
- Repo: Kundserviceportalen. Frontend React 19, TypeScript, Vite, Tailwind, React Router.
- Branch: feat/registrera-arende. Task A (backend) is done: POST /api/tickets works.
- Spec: docs/specs/registrera-ärende.md. The Felfall table is the only source for
  validation rules and error messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing) and docs/teststrategi.md. Follow them.
- API contract: docs/api/kontrakt.md and docs/api/openapi.json. Read the 400 format there.
- Current state: api.createTicket is a stub. Layout.tsx has nav links "Tickets" and
  "New ticket". /tickets/new is a placeholder page.
- Code and comments in English. UI text in Swedish.

## Goal
A handler can register a ticket in a drawer. Covers the frontend part of AK-1, AK-2, AK-3,
and AK-7 to AK-10.

## Decisions already made (do not ask again)
1. A button "Registrera ärende" in the top navigation in Layout.tsx opens the drawer.
   Remove the "New ticket" link, the /tickets/new route and TicketCreatePage.tsx.
2. The drawer is a native <dialog> opened with showModal(). No library.
3. Only one close button, "Stäng" (icon button with that accessible name). Esc also closes.
   No "Avbryt" button.
4. Labels: Rubrik, Beskrivning, Kategori, Prioritet, Namn, E-postadress. Kategori has no
   default (a disabled first option "Välj kategori"). Prioritet starts as Medel (Medium).
5. Validation is a pure function, validateTicket.ts, with the exact Felfall messages and
   the same email regex as the backend. On submit, show all errors at once and send no
   request if there are errors.
6. A 400 response from the API puts its field errors on the same fields.
7. After a successful save: the drawer closes, focus returns to the opening button, and
   "Ärendet har registrerats." appears in a role="status" region that is always rendered.
8. On a 5xx or network failure: the drawer stays open with the values, and
   "Ärendet kunde inte sparas. Försök igen." appears at the top of the form in a
   role="alert" region that is always rendered.
9. The submit button is "Spara ärende".
10. Swedish display labels for category and priority go in types/ticket.ts.
11. Tailwind's standard classes only. No hex values, no arbitrary values, system font.

## Stage 0: plan only
1. Read the spec, AGENTS.md, docs/teststrategi.md, kontrakt.md and the frontend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec, the contract and the code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- frontend/src/features/create-ticket/ (new: drawer, validateTicket.ts and its tests)
- frontend/src/api/client.ts (only createTicket and shared error handling) and a new
  client.test.ts
- frontend/src/types/ticket.ts (only the Swedish labels) and ticket.test.ts
- frontend/src/components/Layout.tsx
- frontend/src/App.tsx and frontend/src/pages/TicketCreatePage.tsx (remove)
- frontend/e2e/create-ticket.spec.ts (new) and frontend/e2e/smoke.spec.ts
- frontend/e2e-mocked/create-ticket-errors.spec.ts (new). Delete the placeholder
  ticket-list.spec.ts as AGENTS.md says.
- frontend/README.md (only the line about routes)
- This log file, sections 2, 3 and 4
Ask before touching anything else.

## Tests
- Vitest: validateTicket with one test per Felfall row, boundaries (200/201 and
  5000/5001 characters) and a valid form. The client: a 400 becomes field errors,
  5xx and network failure become an error without field errors.
- Playwright, full stack (e2e/): AK-7 opens the drawer, AK-2 default priority, AK-3 each
  error linked to its field (aria-invalid and the accessible description), AK-8 Esc and
  "Stäng" return focus, AK-1 and AK-9 a valid save shows the confirmation and returns
  focus. Find elements by role and accessible name. Create your own data with unique
  values.
- Playwright, mocked (e2e-mocked/): AK-10 for a 500 and for a network failure.
- Red first: show each test failing on an assertion before the code exists.
- Sabotage-check: remove aria-describedby, and remove the error message. Report which
  tests failed.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green, with the final report. I will then test the drawer myself
   with the keyboard and VoiceOver before anything is committed.

## Commands (from frontend/ unless noted)
- npm run lint, npm run typecheck, npm test, npm run build
- npm run test:e2e:mocked
- From the repo root: docker compose -f compose.test.yaml run --build --rm e2e,
  then docker compose -f compose.test.yaml down

## Boundaries
- No backend changes. If the API does not match the contract, stop and tell me.
- No new packages without asking.
- Do not touch TicketListPage.tsx or TicketDetailPage.tsx. Others own them.
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
| Beslut redan fattade | Jag har redan bestämt dem. Utan dem stannar agenten och frågar om varje punkt. |
| Exakta texter för bekräftelse och fel | Playwright letar efter texten. Utan bestämda texter går det inte att testa AK-9 och AK-10. |
| `role="status"` och `role="alert"` som alltid finns | Skärmläsare läser inte alltid upp en region som skapas samtidigt som texten. |
| Native `<dialog>` | Ger fokusfälla, Esc och inaktiv bakgrund utan nya paket. |
| Roll och tillgängligt namn i Playwright | Testerna kontrollerar det skärmläsare ser, inte CSS-klasser. |
| Sabotage av `aria-describedby` | Visar att testet för AK-3 faktiskt fångar en trasig koppling mellan fält och fel. |
| Ändra inte listan eller detaljsidan | Louice och Linus äger dem. |
| Min egen kontroll med tangentbord och VoiceOver | Automatiska tester visar inte hur det låter och känns. Det är min kontroll, inte agentens. |

## 2. Plan

Läst: specen, `AGENTS.md`, `docs/teststrategi.md`, `docs/api/kontrakt.md`, `openapi.json`,
`docs/avgränsningar.md`, uppdrag A (resultat), `CreateTicket.cs`, `ListTickets.cs`, `GetTicket.cs`
och all kod i `frontend/` (config, `src/`, `e2e/`, `e2e-mocked/`).

### Arbetsordning

Testerna skrivs först (steg 1–6) och visas röda vid kontrollpunkt 2. Koden skrivs i steg 7.
För att testerna ska falla på ett påstående och inte på ett kompileringsfel finns stubbar från start:
`validateTicket` returnerar `{}`, `createTicket` kastar som i dag, och e2e-testerna börjar med
`expect(...).toBeVisible()` på knappen, så att de faller på ett påstående och inte på en timeout i `click()`.

### Steg 1. Svenska etiketter

- **AK:** stöd för AK-2 (Medel visas som förval) och AK-7 (formulärets val).
- **Filer:** `frontend/src/types/ticket.ts`, `frontend/src/types/ticket.test.ts`.
- **Innehåll:** `CATEGORY_LABELS: Record<TicketCategory, string>` och `PRIORITY_LABELS: Record<TicketPriority, string>`.
  Texterna kommer från `docs/avgränsningar.md`: Beställningar/leveranser, Fakturor, Returer/reklamation, Övrigt
  och Låg, Medel, Hög. `Record` gör att TypeScript klagar om ett enum-värde saknar etikett.
- **Tester:** ett test per tabell som jämför hela tabellen med de exakta texterna.

### Steg 2. `validateTicket.ts`

- **AK:** AK-3 (frontenddelen).
- **Filer:** `frontend/src/features/create-ticket/validateTicket.ts` och `validateTicket.test.ts`.
- **Innehåll:** `validateTicket(values: CreateTicketFormValues): CreateTicketFieldErrors`. Värdena är strängar,
  eftersom kategori kan vara `''` (inget val). Felen är `Partial<Record<keyof CreateTicketInput, string>>`,
  högst ett fel per fält, i samma ordning som backend (tomt före längd/format). Ingen trimning, längd med
  `.length`, regexen `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- **Tester (Vitest):**
  - Giltigt formulär ger `{}`.
  - En test per Felfall-rad (11 st): rubrik tom, rubrik bara mellanslag, rubrik 201 tecken; samma för beskrivning
    (5001); kategori `''` och `'Foo'`; prioritet `''` och `'Foo'`; namn tomt/mellanslag; e-post tom/mellanslag;
    e-post fel format.
  - Gränser: rubrik 200 ok / 201 fel, beskrivning 5000 ok / 5001 fel.
  - E-postformat: `test.each` med några ogiltiga (inget `@`, två `@`, ingen punkt efter `@`, mellanslag,
    avslutande radbrytning) och en giltig med versaler.
  - Alla fel samtidigt: tomt formulär ger fel på alla fem obligatoriska fält plus kategori.

### Steg 3. Klienten

- **AK:** AK-1, AK-3 (serverns 400), AK-10.
- **Filer:** `frontend/src/api/client.ts`, `frontend/src/api/client.test.ts` (ny).
- **Innehåll:** en gemensam `request<T>()` som används av `createTicket`. `POST ${API_BASE_URL}/tickets` med JSON.
  - `2xx` ger `Ticket`.
  - `400` med `errors` ger `ApiError(status 400, fieldErrors)`, där första meddelandet per fält används.
  - Övriga fel (5xx, 400 utan `errors`) ger `ApiError` utan `fieldErrors`.
  - `fetch` som kastar (nätverksfel) ger `ApiError` med `status 0` utan `fieldErrors`.
  - En exporterad typ `ProblemDetails` efter `openapi.json` (`HttpValidationProblemDetails`), så att de mockade
    e2e-svaren kan typas med klientens typer. Övriga metoder (`listTickets` m.fl.) rörs inte.
- **Tester (Vitest, `fetch` ersatt med `vi.stubGlobal`):**
  - Giltigt anrop skickar `POST /api/tickets` med rätt body och returnerar ärendet.
  - `400` med `errors` blir fältfel per fält.
  - `500` blir ett fel utan fältfel.
  - Nätverksfel blir ett fel utan fältfel.
  - `400` utan `errors` blir ett fel utan fältfel (se fråga 3).

### Steg 4. Drawer, navigering och borttagen sida

- **AK:** AK-1, AK-2, AK-3, AK-7, AK-8, AK-9, AK-10, AK-11, AK-12.
- **Filer:** `frontend/src/features/create-ticket/CreateTicketDrawer.tsx` (ny), `frontend/src/components/Layout.tsx`,
  `frontend/src/App.tsx`, `frontend/src/pages/TicketCreatePage.tsx` (tas bort), `frontend/README.md` (raden om routes).
- **Layout:** länken "New ticket" ersätts av knappen "Registrera ärende" (med `ref` för att lämna tillbaka fokus).
  Layout äger öppet/stängt-läget och renderar alltid `<p role="status">` med bekräftelsen.
  Bekräftelsen visas som en toast (svar 16): regionen ligger fast i hörnet nere till höger och finns alltid
  i DOM:en, men den syns bara när den har text. Skärmläsare läser då upp texten när den sätts.
- **Drawer:**
  - Native `<dialog>` som öppnas med `showModal()` och placeras som en panel till höger, så att sidan syns
    bakom. Rubriken "Registrera ärende" ger dialogen dess namn (`aria-labelledby`).
  - En ikonknapp med `aria-label="Stäng"` och en inline-SVG med `aria-hidden`.
  - Esc hanteras av dialogen själv. `onClose` synkar React-läget och lämnar tillbaka fokus till knappen.
  - `<form noValidate>`, så att webbläsarens egna bubblor inte tar över.
  - Längst upp i formuläret finns alltid `<div role="alert">`, som får felmeddelandet vid 5xx eller nätverksfel.
  - Fälten Rubrik (`input`), Beskrivning (`textarea`), Kategori (`select` med en inaktiverad första option
    "Välj kategori"), Prioritet (`select`, förval `Medium`), Namn, E-postadress (`type="email"`).
  - Varje fält har `<label htmlFor>`. Vid fel får fältet `aria-invalid="true"` och `aria-describedby` som pekar på
    felets `id`.
  - Inget `maxLength`-attribut, eftersom det skulle hindra att felet för 201/5001 tecken någonsin visas.
  - Knappen "Spara ärende".
  - Vid sparning körs `validateTicket` först, och vid fel skickas inget anrop. Därefter anropas `createTicket`.
    Ett `400` lägger fältfelen på fälten, 5xx eller nätverksfel ger meddelandet i alert, och ett lyckat svar
    stänger drawern, återställer formuläret, sätter bekräftelsen och lämnar tillbaka fokus.
- **Efter kontrollpunkt 1:** vid valideringsfel (även från ett `400`) flyttas fokus till det första felaktiga
  fältet (AK-11). Formuläret återställs när drawern stängs (svar 4). Medan ett anrop pågår ignoreras nya
  försök att spara (AK-12).
- **Styling:** bara Tailwinds standardklasser, inga hex- eller godtyckliga värden, systemtypsnitt.
- **Tester:** e2e i steg 5 och 6. Det finns ingen jsdom eller Testing Library, och vi lägger inte till paket.

### Steg 5. Playwright, hela stacken (`frontend/e2e/create-ticket.spec.ts`)

Element hittas via roll och tillgängligt namn. Varje test använder en unik rubrik (`E2E <tidsstämpel>-<slump>`).
Ingen mockning. Testerna lyssnar på `POST /api/tickets` med `page.waitForResponse` eller `page.on('request')`,
vilket bara observerar trafiken.

| Test | AK | Kontroll |
|---|---|---|
| Knappen öppnar drawern över listan | AK-7 | `dialog` med namnet "Registrera ärende" syns, rubriken "Tickets" syns kvar (se fråga 10) |
| Prioritet är förvald som Medel och sparas så | AK-2 | Comboboxen Prioritet visar "Medel". Efter sparning har POST-svaret `priority: "Medium"` |
| Felen kopplas till sina fält | AK-3 | Tomt formulär skickas. Varje fält får `toHaveAttribute('aria-invalid','true')` och `toHaveAccessibleDescription(<Felfall-text>)`. Ingen POST skickas |
| Felaktig e-post visar formatfelet | AK-3 | Ett fält, för att se formatregeln genom UI:t |
| Fokus går till första felaktiga fältet | AK-11 | Tomt formulär: Rubrik har fokus. Bara e-post fel: E-postadress har fokus |
| Esc stänger och lämnar tillbaka fokus | AK-8 | Dialogen syns inte, knappen har fokus, ingen POST skickas |
| "Stäng" stänger och lämnar tillbaka fokus | AK-8 | Samma kontroll |
| Toasten försvinner efter 5 sekunder | AK-9 | `page.clock`: texten finns kvar efter 4,9 s och är borta efter 5 s |
| Toasten försvinner när drawern öppnas igen | AK-9 | Efter sparning öppnas drawern igen och `status` är tom |
| Giltig sparning | AK-1, AK-9 | POST-svaret är `201` med `status: "New"`, `createdAt` och den unika rubriken. Dialogen stängs, `status`-regionen har "Ärendet har registrerats.", knappen har fokus |

`smoke.spec.ts`: det andra testet ("navigation reaches the new ticket page") skrivs om (svar 15). Det nya testet
heter "Registrera ärende is reachable from every page". Det besöker `/tickets` och en detaljsida (`/tickets/1`),
och på båda sidorna öppnar knappen i navigeringen dialogen "Registrera ärende". Testet följer specens beslut om
att knappen finns i navigeringen, och det upprepar inte AK-7. Detaljsidan är en platshållare som inte läser
något id, så `/tickets/1` är inte beroende av seeddata.

### Steg 6. Playwright, mockat API (`frontend/e2e-mocked/create-ticket-errors.spec.ts`)

- **AK:** AK-10.
- **Tester:**
  - `500` med `application/problem+json`, typat som `ProblemDetails`.
  - Nätverksfel med `route.abort('failed')`.
  - Båda kontrollerar att dialogen är öppen, att alla ifyllda värden finns kvar (`toHaveValue`), och att
    `alert`-regionen har texten "Ärendet kunde inte sparas. Försök igen.".
- AK-12, i en egen fil `frontend/e2e-mocked/create-ticket-pending.spec.ts` (svar 14): `POST` svarar `201`
  först efter en fördröjning. Två klick på "Spara ärende" ska ge exakt en POST. Testet hör hemma här och inte
  i `e2e/`, eftersom ett snabbt riktigt svar stänger drawern före det andra klicket, och då skulle testet gå
  igenom även utan spärren.
- Bara `POST **/api/tickets` mockas.
- `e2e-mocked/ticket-list.spec.ts` tas bort, enligt `AGENTS.md`.

### Steg 7. Kod, grönt, sabotage, rapport

1. Implementera steg 1–4 tills allt är grönt: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
   `npm run test:e2e:mocked` och Compose-sviten.
2. Sabotage 1: ta bort `aria-describedby`. Väntat resultat: AK-3-testet i e2e faller på `toHaveAccessibleDescription`.
3. Sabotage 2: ta bort felmeddelandet för tom rubrik i `validateTicket`. Väntat resultat: unit-testet för raden
   och AK-3-testet i e2e faller.
4. Återställ, kör allt igen och skriv avsnitt 4.

### Oklarheter och skillnader mellan spec, kontrakt och kod

1. **`GET /api/tickets` och `GET /api/tickets/{id}` är stubbar som svarar `501`.** E2e kan därför inte läsa tillbaka
   ärendet. Förslag: AK-1 och AK-2 kontrolleras på POST-svaret (`201`, `status: "New"`, `createdAt`,
   `priority: "Medium"`), och "inget sparas" i AK-3 och AK-8 kontrolleras som "ingen POST skickades". Att datan
   finns kvar täcks av backendtesterna i uppdrag A. Är det okej?
2. **`400` utan `errors`** (ramverkets JSON-fel) kan inte uppstå från vårt formulär, och specen säger inget om
   det. Förslag: samma allmänna meddelande som vid 5xx. Fältfel för okända nycklar ignoreras.
3. **Ska formuläret tömmas när drawern stängs med Esc eller "Stäng"?** Specen säger bara "inget sparas".
   Förslag: töm vid stängning och efter lyckad sparning, så att drawern alltid öppnas tom med Medel förvalt.
   Alternativet är att behålla utkastet tills sidan laddas om.
4. **Fokus vid valideringsfel** står inte i specen. Ett vanligt mönster för tillgänglighet är att flytta fokus till
   första felaktiga fältet. Det är nytt beteende, så antingen läggs det till i specen (med ett test) eller så görs
   det inte. Förslag: lägg till det.
5. **När försvinner fältfelen?** Förslag: de räknas om vid nästa sparning, inte medan man skriver.
   Alert-meddelandet töms vid varje nytt försök att spara.
6. **Hur länge visas bekräftelsen?** Förslag: tills drawern öppnas nästa gång.
7. **Dubbelklick på "Spara ärende" under ett pågående anrop** kan skapa två ärenden. Specen säger inget om det.
   Förslag: ignorera nya försök medan anropet pågår, utan synlig ändring och utan test, eller lägg till det i specen.
8. **`required` på fälten:** Förslag: `required` tillsammans med `noValidate`. Skärmläsare säger då "obligatorisk",
   men webbläsaren blockerar inte sparningen.
9. **AK-7, "listan syns kvar bakom":** listsidan är fortfarande en platshållare (rubriken "Tickets"). Med
    `showModal()` blir bakgrunden `inert`. Det är inte säkert att Playwrights `getByRole` hittar inert innehåll,
    så det kontrollerar jag i den röda körningen. Fungerar det inte, används `getByText` och `toBeVisible()`.
    Att panelen ser rätt ut kontrolleras manuellt.
10. **`smoke.spec.ts` test 2** testar `/tickets/new`, som tas bort enligt beslut 1. Förslag: ta bort just det testet,
    eftersom beteendet medvetet tas bort och AK-7-testet täcker navigeringen. Jag tar inte bort det utan ditt
    ja, med tanke på regeln om att inte ta bort tester.
11. **Blandat språk i Layout:** "Customer Service Portal" och "Tickets" är på engelska, men UI-texten ska vara på
    svenska. Det ligger utanför uppdraget, så jag lämnar det, och smoke-testet letar efter de texterna.
12. **Fältnamnet "Email" och etiketten "E-postadress":** specen använder "Email" i Felfall men "E-postadress" i
    meddelandet. Beslut 4 säger "E-postadress", och det följer jag.

## 3. Kontrollpunkter

### Kontrollpunkt 1 (planen), 2026-11-09

Carolinas svar:

| Fråga | Svar | Följd i planen |
|---|---|---|
| 1 | Ja | AK-1, AK-2 kontrolleras på POST-svaret, "inget sparas" som "ingen POST skickades" |
| 2 | Länken var fel namngiven | Redan rättad i filen (`registrera-A-backend.md`) |
| 4 | Töm formuläret vid stängning | Esc, "Stäng" och lyckad sparning återställer formuläret (Medel förvalt) |
| 5 | Lägg till i specen | Ny AK-11 i specen. E2e-test i steg 5 |
| 8 | Ignorera klick medan sparning pågår | Spärr i drawern. Mockat test med fördröjt svar i steg 6. Blev AK-12 (svar 14) |
| 11 | TODO-kommentar vid testet | Ersatt av svar 15 |

Fråga 2, 5, 6, 8, 9, 11 och 12 fick inget svar. Mina förslag gäller tills du säger annat.

Nya frågor:

14. **Dubbelklickstestet** passar inte i `create-ticket-errors.spec.ts`, eftersom det inte är ett fel. Får jag skapa
    `frontend/e2e-mocked/create-ticket-pending.spec.ts`, eller ska det ligga i felfilen?
    Spärren finns inte heller i specen. Vill du lägga till den där (till exempel som AK-12)?
15. **Smoke-testet** klickar på länken "New ticket" och väntar sig `/tickets/new`. Båda tas bort enligt beslut 1, så
    testet kommer att falla även med en TODO. Hur vill du ha det? (a) `test.fixme` med TODO, vilket räknas som att
    hoppa över, (b) TODO nu och borttagning när koden ändras, eller (c) testet står kvar och faller tills du
    bestämmer.

Svar:

14. AK-12 läggs till i specen (gjort). Filen `create-ticket-pending.spec.ts` får skapas.
15. Testet skrivs om så att det passar den nya planen (se steg 5).

### Kontrollpunkt 1, tredje svaret

- Drawern töms både när den stängs och när ett ärende har sparats. Det stämmer med svar 4 och står i steg 4.
- 16. Vid lyckad sparning stängs drawern och bekräftelsen "Ärendet har registrerats." visas som en toast. Toasten
  är den `role="status"`-region som alltid finns (beslut 7), så AK-9-testet ändras inte. Det letar fortfarande
  efter `getByRole('status')` med texten.
- 17. Toasten visas i 5 sekunder, eller kortare om drawern öppnas igen. Det står nu i AK-9 i specen.
  Det testas i Playwright med `page.clock`.

**Planen godkänd av Carolina 2026-11-09.**

### Kontrollpunkt 2 (tester skrivna och röda), 2026-11-09

**Skrivna eller ändrade filer:**

- Ny: `src/features/create-ticket/validateTicket.test.ts` och `src/api/client.test.ts`.
- Ändrade: `src/types/ticket.test.ts` (etiketter) och `e2e/smoke.spec.ts` (test 2 omskrivet).
- Ny: `e2e/create-ticket.spec.ts`, `e2e-mocked/create-ticket-errors.spec.ts` och `e2e-mocked/create-ticket-pending.spec.ts`.
- Borttagen: `e2e-mocked/ticket-list.spec.ts`.
- Stubb: `src/features/create-ticket/validateTicket.ts` returnerar `{}`.

**Vitest** (`npx vitest run --reporter=verbose`): `Tests  29 failed | 7 passed (36)`.

- Alla 29 faller på ett påstående, till exempel `AssertionError: expected {} to deeply equal { title: 'Rubrik måste fyllas i' }`.
- Klienttesterna faller med `status: 501` från stubben, till exempel `AssertionError: expected ApiError ... to match object { status: 400, fieldErrors: {...} }`.
- Etiketterna faller med `AssertionError: expected undefined to deeply equal {...}`.
- 7 går igenom:
  - de 3 befintliga domäntesterna
  - 4 test som godtar giltiga värden: giltigt formulär, 200 tecken, 5000 tecken och e-post med versaler

  De 4 godkänns redan av en stubb som returnerar `{}`. Därför kontrolleras de i grönfasen genom att
  reglerna bryts tillfälligt (till exempel `>= 200` i stället för `> 200`).

**Mockad Playwright** (`npm run test:e2e:mocked`): `3 failed`. Alla tre faller på
`expect(locator).toBeVisible() failed, Locator: getByRole('button', { name: 'Registrera ärende', exact: true }), element(s) not found`.

**Playwright, hela stacken** (`docker compose -f compose.test.yaml run --build --rm e2e`, sedan `down`): `14 failed, 1 passed`.

- Det gröna testet är det första smoke-testet, som inte ändrades.
- Alla 14 faller på samma påstående som ovan: knappen finns inte.

**Ärlig bedömning:** e2e-testerna är röda på ett påstående, men alla på samma rad, eftersom knappen inte finns.
Det visar inte att varje tests egna kontroller fångar fel. Förslag: i grönfasen bryts beteendet tillfälligt en gång
per e2e-test (fokus, Esc, tömning, toast-timer, spärren och så vidare), utöver de två sabotage du bad om.
Resultatet rapporteras i avsnitt 4.

**`npm run typecheck`** faller, som väntat, på saknade exporter (`ProblemDetails`, `CATEGORY_LABELS`,
`PRIORITY_LABELS`). Ett riktigt problem syns också. `create-ticket-errors.spec.ts` importerar typen från
`src/api/client.ts`, och `tsconfig.node.json` (som omfattar `e2e-mocked/`) kan inte kompilera den filen:
`TS2835` (importen saknar `.ts`) och `TS2339` (`import.meta.env` saknar typer utan `vite/client`). Se fråga 18.

**`npm run lint`:** inga fel.

**Avvikelse från planen:** AK-12-testet räknar inte anrop. Det väntar i 1 sekund på att ett andra POST *inte*
kommer (`waitForRequest` med timeout). Annars hinner ett andra anrop komma efter att testet redan har
kontrollerat antalet.

Frågor:

18. Var ska typen `ProblemDetails` ligga så att både klienten och de mockade e2e-testerna kan använda den?
    - (A) En ny fil `src/api/problem.ts` med bara typer, som `client.ts` exporterar vidare. Den kräver ingen
      konfigändring. Rekommenderas.
    - (B) Två rader i `client.ts`: `/// <reference types="vite/client" />` och `'../types/ticket.ts'`.
    - (C) `"vite/client"` läggs till i `types` i `tsconfig.node.json`.

    (A) och (C) rör filer utanför listan.
19. Testerna "the form is empty again after ..." följer svar 4 (töm vid stängning och sparning), men det står inte
    i specen. Ska en rad läggas till i AK-8 och AK-9?

Svar: 18 (B). 19 ja, raden är tillagd i AK-8 och AK-9 i specen. Testerna får namn efter sina AK.

## 4. Resultat

### Ändrade filer

| Fil | Ändring |
|---|---|
| `frontend/src/features/create-ticket/CreateTicketDrawer.tsx` | Ny. Native `<dialog>` med `showModal()`, formuläret, fältfel med `aria-invalid` och `aria-describedby`, `role="alert"` alltid i DOM:en, fokus till första felet (AK-11) och spärr mot dubbelklick (AK-12) |
| `frontend/src/features/create-ticket/validateTicket.ts` och `validateTicket.test.ts` | Nya. Reglerna i Felfall, 25 test |
| `frontend/src/api/client.ts` | `createTicket` och en gemensam `request()`. Typen `ProblemDetails`. Raden `/// <reference types="vite/client" />` och `.ts` i importen (svar 18 B) |
| `frontend/src/api/client.test.ts` | Ny, 6 test |
| `frontend/src/types/ticket.ts` och `ticket.test.ts` | `CATEGORY_LABELS`, `PRIORITY_LABELS` och 2 test |
| `frontend/src/components/Layout.tsx` | Knappen "Registrera ärende" i stället för länken "New ticket". `role="status"` som toast, alltid i DOM:en, döljs efter 5 s |
| `frontend/src/App.tsx` | Routen `/tickets/new` borttagen |
| `frontend/src/pages/TicketCreatePage.tsx` | Borttagen |
| `frontend/README.md` | Raden om routes |
| `frontend/e2e/create-ticket.spec.ts` | Ny, 13 test |
| `frontend/e2e/smoke.spec.ts` | Test 2 omskrivet (svar 15) |
| `frontend/e2e-mocked/create-ticket-errors.spec.ts` och `create-ticket-pending.spec.ts` | Nya, 2 + 1 test |
| `frontend/e2e-mocked/ticket-list.spec.ts` | Borttagen (`AGENTS.md`) |
| `docs/specs/registrera-ärende.md` | AK-11 och AK-12 nya. AK-8 och AK-9 utökade med tömning av formuläret och toasten (svar 5, 14, 16, 17, 19) |
| Denna fil | Avsnitt 2, 3 och 4 |

Utanför filerna: `npm ci` i `frontend/`. `@vitest/coverage-v8` fanns i `package.json` men inte i `node_modules`,
så `npm test` föll med `MISSING DEPENDENCY`. Inga nya paket, och `package.json` och `package-lock.json` är oförändrade.

### Kommandon och verklig utskrift (sista körningen)

| Kommando | Resultat |
|---|---|
| `npm run lint` | Inga fel |
| `npm run typecheck` | Exit 0 |
| `npm test` | `Test Files 3 passed (3)`, `Tests 36 passed (36)`. Täckning, alla filer: 38,29 % statements (drawern har inga unit-tester, se nedan) |
| `npm run build` | `✓ built in 437ms` |
| `npm run test:e2e:mocked` | `3 passed (2.6s)` |
| `docker compose -f compose.test.yaml run --build --rm e2e`, sedan `down` | `15 passed (2.2s)`, exit 0 |

### Sabotage

Varje sabotage infördes, kördes och återställdes. Efter varje återställning jämfördes filerna med säkerhetskopian.

| # | Sabotage | Misslyckade test | Felet |
|---|---|---|---|
| 1 | `aria-describedby` borttaget (beställt) | e2e: båda AK-3 | `toHaveAccessibleDescription`, Expected `"Rubrik måste fyllas i"` / `"Ange en giltig e-postadress"`, Received `""` |
| 2 | Meddelandet för tom rubrik borttaget (beställt) | Vitest: `rejects an empty title`, `rejects a title with only spaces`, `reports every invalid field at once`. e2e: AK-3 (alla fel), AK-11 (fokus på Rubrik) | `expected {} to deeply equal { title: 'Rubrik måste fyllas i' }`. `aria-invalid` Expected `"true"`. `toBeFocused` Received `inactive` |
| 3 | `>= 200` och `>= 5000` | Vitest: `accepts a title of 200 characters`, `accepts a description of 5000 characters` | Påstående |
| 4 | E-postregex utan versaler | Vitest: `accepts an email with capital letters` | Påstående |
| 5 | Kategori kontrollerad mot prioriteterna | Vitest: 22 test, bland annat `accepts a valid form` | Påstående |
| 6 | Ingen fokus till första felet, ingen återlämnad fokus, toast-timer 60 s, toasten töms inte vid öppning | e2e: båda AK-11, båda toast-testen i AK-9 | `toBeFocused` och `toHaveText("")`. **Den uteblivna fokusen fick inget test att falla**, se nedan |
| 7 | Fokus till fel element vid stängning, och formuläret sparat mellan öppningar | e2e: AK-8 Esc, AK-8 Stäng, AK-1/AK-9, båda tömningstesten | `toBeFocused` Received `inactive`. `toHaveValue` Expected `""` Received `"E2E 1794…"` |
| 8 | Förvald prioritet `Low`, och `show()` i stället för `showModal()` | e2e: AK-2, AK-8 Esc, båda tömningstesten | `toHaveValue` Expected `"Medium"` Received `"Low"`. `toBeHidden` Received `visible`. **AK-7 föll inte**, se nedan |
| 9 | Inget alert-meddelande | Mockat: båda AK-10 | `toHaveText` Received `""` |
| 10 | Formuläret töms vid fel | Mockat: båda AK-10 | `toHaveValue` Received `""` |
| 11 | Drawern stängs vid fel | Mockat: båda AK-10 | `element(s) not found` |
| 12 | Spärren mot dubbelklick borttagen | Mockat: AK-12 | `Expected: false, Received: true` (en andra POST skickades) |

### Ändringar under arbetet

- **Fokustesten skärptes.** Native `<dialog>` lämnar själv tillbaka fokus till knappen som öppnade den, innan appen
  har hanterat stängningen. Därför fick sabotage 6 (vår `focus()` borttagen) inget test att falla, eftersom beteendet
  fortfarande var rätt. Sabotage 7, där appen flyttar fokus till fel element, upptäcktes först bara av 2 av 3 test.
  "Stäng"-testet hann kontrollera fokus innan appen flyttade den.

  Testerna väntar nu på `expect(page.locator('dialog')).toHaveCount(0)`, alltså tills appen har tagit bort drawern,
  innan de kontrollerar fokus. Det här är det enda stället som letar efter en tagg och inte en roll, eftersom en stängd
  `<dialog>` redan är borta ur tillgänglighetsträdet (`getByRole` gav 0 direkt). Efter ändringen föll alla 3.
  Testerna blev strängare, inte svagare.
- **AK-12-testet** väntar 1 s på att en andra POST *inte* kommer, i stället för att räkna anrop (se kontrollpunkt 2).
- **Fråga 10 löst:** `getByRole('heading', { name: 'Tickets' })` hittar rubriken bakom den modala dialogen.

### AK

| AK | Täckt av | Status |
|---|---|---|
| AK-1 (frontend) | e2e `AK-1, AK-9` (POST-svar `201`, `status: "New"`, `createdAt`), Vitest-klienten | Verifierad i frontend. Persistensen verifieras av backendtesterna, eftersom `GET` är `501` (svar 1) |
| AK-2 | e2e `AK-2` | Verifierad |
| AK-3 (frontend) | Vitest `validateTicket` (alla Felfall-rader), e2e 2 test | Verifierad. Se osäkerhet 1 om `400` från servern |
| AK-7 | e2e `AK-7`, smoke test 2 | Delvis. Se osäkerhet 2 |
| AK-8 | e2e Esc, Stäng och tömning | Verifierad |
| AK-9 | e2e sparning, 5 s, tömning vid öppning, tömt formulär | Verifierad automatiskt. Att skärmläsaren läser upp texten kontrollerar du med VoiceOver |
| AK-10 | Mockat: 500 och nätverksfel | Verifierad automatiskt. Uppläsningen kontrollerar du med VoiceOver |
| AK-11 | e2e 2 test | Verifierad |
| AK-12 | Mockat 1 test | Verifierad |
| AK-4–AK-6 | Backend, uppdrag A | Ingår inte här |

### Osäkerheter

1. **Beslut 6 (`400` från API:t till fälten)** är testat i klienten (Vitest) men inte i drawern. Den riktiga
   stacken ger inte `400` från UI:t, eftersom frontend stoppar samma fel först. Ett mockat `400` är förbjudet
   ("mocka aldrig ett valideringsfel"). Koden använder samma `showFieldErrors` som frontend-valideringen, men
   vägen genom drawern är inte körd.
2. **AK-7 visar inte att dialogen är modal.** Testet går igenom med `show()`, och bara Esc-testet föll (sabotage 8).
   Fokusfällan, att bakgrunden är inaktiv och hur panelen ser ut (som en drawer till höger med listan synlig) behöver
   din kontroll med tangentbord och VoiceOver.
3. **Toasten** är en `<p role="status">` med `sr-only` när den är tom och fast placerad nere till höger när den har
   text. Om VoiceOver läser upp den när klassen och texten byts samtidigt har jag inte kunnat kontrollera.
4. **Systemtypsnitt:** jag satte inget typsnitt, så Tailwinds standard (`font-sans`, systemtypsnitt) gäller.
   Inga hex- eller godtyckliga värden finns (`backdrop:bg-slate-900/40` är en standardklass med opacitet).
5. **Engelska texter kvar** i Layout ("Customer Service Portal", "Tickets") och listsidan, utanför uppdraget (fråga 12).
6. Om ett anrop pågår när användaren stänger drawern och anropet sedan lyckas, visas toasten ändå. Ärendet är ju
   sparat. Det är inte testat och står inte i specen.

### Tillägg efter kontrollpunkt 3: stäng vid klick utanför

Carolina bad om det efter kontrollpunkt 3. AK-8 i specen har nu: "When: Hen trycker Esc, väljer "Stäng" eller klickar
utanför drawern".

- **Kod (`CreateTicketDrawer.tsx`):**
  - Ett klick på bakgrunden landar på själva `<dialog>`. Drawern stängs när både tryck och släpp sker på `<dialog>`
    och utanför dess yta (`getBoundingClientRect`).
  - Positionen kontrolleras, eftersom ett klick på en tom del av drawern har samma mål.
  - Kravet på både tryck och släpp gör att drawern inte stängs när man markerar text och släpper utanför.
    Det fallet är inte testat.
  - Native `closedby="any"` används inte, eftersom stödet i Safari är osäkert och VoiceOver-kontrollen görs i Safari.
- **Tester (`e2e/create-ticket.spec.ts`), 2 nya:**
  - `a click outside the drawer closes it, sends nothing and returns focus`
  - `a click on an empty part of the drawer keeps it open`

  Bakgrunden har ingen roll, så testerna klickar på en position räknad från drawerns `boundingBox()`.
- **Rött först:** klick-utanför-testet föll med `toBeHidden() failed, Received: visible` (16 passed, 1 failed).
  Testet för tom yta gick igenom redan före koden, eftersom ingenting stängde drawern.
- **Sabotage:** positionskontrollen togs bort, så att alla klick på `<dialog>` stängde.
  - Första försöket: alla 17 gick igenom. Vid 1280×720 är formuläret högre än drawern, så det finns ingen tom yta
    att klicka på.
  - Testet för tom yta fick då en egen viewport, 1280×1600.
  - Andra försöket: testet föll (`toBeVisible() failed`, 1 failed, 16 passed). Koden återställdes och jämfördes med
    säkerhetskopian.
- **Sista körningen:** lint och typecheck utan fel. `npm test` 36 passed. Build ok. `npm run test:e2e:mocked`
  3 passed. Compose-sviten `17 passed`, exit 0.
- **Osäkerhet:** ett klick utanför när ett anrop pågår stänger drawern, precis som Esc. Om anropet sedan lyckas
  visas toasten (osäkerhet 6).

Inget är committat, pushat eller lagt i en pull request.

## 5. Min granskning

_Carolina skriver här: vad jag accepterade, ändrade eller avvisade, och varför._

# Agentuppdrag: Redigera ärende, uppdrag B2 (frontend, i detaljpanelen)

Ansvarig: Carolina
Branch: `feat/redigera-ärende`
Spec: [docs/specs/redigera-ärende.md](../specs/redigera-ärende.md)
Bygger på: [uppdrag A (backend)](redigera-A-backend.md) och [uppdrag B1 (komponenten)](redigera-B1-frontend.md)

## 1. Prompt

Utkast av Claude utifrån specen, B1-rapporten och koden. Ska granskas och ändras av Carolina innan den används.

```text
# Task B2: frontend for "Redigera ärende", in the detail panel

## Context
- Repo: Kundserviceportalen. Frontend React 19, TypeScript, Vite, Tailwind, React Router.
- Branch: feat/redigera-ärende. Work only here.
- Spec: docs/specs/redigera-ärende.md. Felfall in docs/specs/registrera-ärende.md is the
  only source for rules and messages. Every behaviour must trace to an AK.
- Testing rules: AGENTS.md (Testing and Accessibility) and docs/teststrategi.md.
- Task A (backend) is done: PATCH /api/tickets/{id} works.
- Task B1 is done: frontend/src/features/edit-ticket/ has EditTicketForm, hasChanges,
  ignoreWhilePending and api.updateTicket. Read section 4 of
  docs/agentuppdrag/redigera-B1-frontend.md, including "Krav på B2".
- Current state: the start page (TicketListPage.tsx) shows the list and, to the right,
  TicketDetailsPanel.tsx with the selected ticket, StatusForm and TicketHistory.
  /tickets/:id redirects to the start page. DevEditTicketPage.tsx is a temporary page
  from B1 and is imported in App.tsx.
- Code and comments in English. UI text in Swedish.

## Goal
A handler can edit the selected ticket in the detail panel. Covers the frontend part of
AK-1, AK-2, AK-7 to AK-13.

## Decisions already made (do not ask again)
1. A button "Redigera" in the panel header, next to the heading "Ärendedetaljer".
   It is only shown when a ticket is selected and the panel is not in edit mode.
2. In edit mode, EditTicketForm replaces the read-only ticket fields in the panel.
   StatusForm is hidden while editing. TicketHistory stays.
3. Render EditTicketForm with key={ticket.id} (B1 requirement).
4. After a successful save: the panel goes back to read-only with the new values, the
   list shows the new values too, "Ärendet har uppdaterats." appears in a role="status"
   region that is always rendered, and focus goes to "Redigera".
5. After "Avbryt": the panel goes back to read-only, nothing is saved, and focus goes
   to "Redigera".
6. AK-10: if the form has changes (onDirtyChange) and the handler selects another ticket
   in the list, a native <dialog> opened with showModal() asks:
   heading "Osparade ändringar", text "Du har ändringar som inte är sparade.",
   buttons "Spara", "Släng ändringar" and "Fortsätt redigera". Esc means
   "Fortsätt redigera". Focus goes into the dialog on open.
   - "Spara": save as in decision 4, then show the newly selected ticket. If the save
     fails, close the dialog, stay in edit mode on the old ticket, and show the errors
     as in AK-2 and AK-12.
   - "Släng ändringar": nothing is saved, the newly selected ticket is shown in
     read-only mode.
   - "Fortsätt redigera": the dialog closes, the old ticket stays selected, the changes
     remain, and focus goes back to the field that had focus.
7. AK-11: without changes, selecting another ticket shows it directly in read-only mode.
8. Open question 1 in the spec ("Avbryt" while saving): "Avbryt" is disabled while a
   save is pending.
9. Open question 2 in the spec (a save that finishes after the form is closed): the
   list and panel are updated with the saved ticket, but nothing else happens. No focus
   move, no confirmation.
10. Remove DevEditTicketPage.tsx and its import in App.tsx.
11. Use the same Tailwind tokens and patterns as StatusForm and CreateTicketDrawer so the
    form reads like the rest of the panel. No new colours.

## Stage 0: plan only
1. Read the spec, B1's log, AGENTS.md, docs/teststrategi.md and the frontend code.
2. Write your plan in section 2 of this file: steps, AK per step, files per step,
   tests per step.
3. List anything that is unclear or where the spec, the decisions and the code disagree.
4. Stop. Do not change any other file until I approve.

## Files you may change
- frontend/src/pages/TicketListPage.tsx (selection, edit mode, dialog, confirmation)
- frontend/src/components/TicketDetailsPanel.tsx (only the "Redigera" button and a slot
  for the form)
- frontend/src/features/edit-ticket/ (EditTicketForm changes for decisions 8 and 11,
  and a new UnsavedChangesDialog.tsx)
- frontend/src/App.tsx and frontend/src/pages/DevEditTicketPage.tsx (decision 10)
- frontend/e2e/edit-ticket.spec.ts (new)
- frontend/e2e-mocked/edit-ticket-*.spec.ts (new)
- docs/specs/redigera-ärende.md (only to move the two open questions in
  "Att besluta i B2" into decisions 8 and 9)
- This log file, sections 2, 3 and 4
Ask before touching anything else. Never touch backend/ or docs/api/.

## Tests
- Playwright, full stack (e2e/edit-ticket.spec.ts). Create your own ticket with unique
  values in each test. Find elements by role and accessible name.
  - AK-7: "Redigera" shows the six fields with the ticket's values.
  - AK-1 and AK-9: a valid change is saved, shown in the panel and in the list, the
    confirmation is announced, and focus is on "Redigera".
  - AK-8: "Avbryt" saves nothing and focus is on "Redigera".
  - AK-2 and AK-12: an invalid value shows the Felfall message, the field has
    aria-invalid and the message as its accessible description, focus is on the first
    field with an error, and the saved ticket is unchanged.
  - AK-10: one test per dialog choice.
  - AK-11: no dialog without changes, and no dialog after changing and restoring a value.
- Playwright, mocked (e2e-mocked/):
  - 500 and network failure: the alert text appears and the values stay.
  - AK-13: a second "Spara ändringar" during a slow response sends only one request,
    and "Avbryt" is disabled meanwhile (decision 8).
- Red first: show each test failing on an assertion before the code exists.
- Sabotage-check, one at a time: remove aria-describedby, make hasChanges always return
  true, remove the focus return to "Redigera". Report which tests failed.

## Checkpoints (stop and wait for me at each)
1. After the plan (Stage 0).
2. After the tests are written and red, with the real output.
3. After everything is green, with the final report. I will then test the flow myself
   with the keyboard and VoiceOver before anything is committed.

## Commands (from frontend/ unless noted)
- npm run lint, npm run typecheck, npm test, npm run build
- npm run test:e2e:mocked
- From the repo root: docker compose -f compose.test.yaml run --build --rm e2e,
  then docker compose -f compose.test.yaml down

## Boundaries
- No backend changes and no contract changes. If the API does not match the contract,
  stop and tell me.
- No new packages without asking.
- Do not change StatusForm, TicketHistory or the list's existing behaviour, other than
  what decisions 2 and 6 need.
- Never weaken, skip or delete a test to make it pass. Existing tests must pass.
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
| Exakta texter för dialog och bekräftelse | Playwright letar efter texten. Utan bestämda texter går AK-9 och AK-10 inte att testa. |
| Beslut 8 och 9 | B1 lämnade två öppna frågor i specen. De måste vara beslutade innan de byggs. |
| `StatusForm` döljs vid redigering | Två formulär samtidigt i panelen blir otydligt, särskilt med skärmläsare. |
| Ta bort `DevEditTicketPage` | Den var bara till för manuell test i B1. Den ska inte med i inlämningen. |
| Sabotage: `hasChanges` alltid sant | Visar att testet för AK-11 fångar en dialog som visas i onödan. |
| Min egen kontroll med tangentbord och VoiceOver | Automatiska tester visar inte hur fokus och uppläsning känns. |

## 2. Plan

### Utgångsläge
- `TicketListPage.tsx` håller listan (`state`), `selectedTicketId` och det hämtade ärendet
  (`selectedTicketResult`). `handleStatusSaved` uppdaterar redan både panelen och listan med ett
  sparat ärende. Det återanvänder jag för redigeringen.
- `TicketDetailsPanel.tsx` visar rubriken "Ärendedetaljer", tre skrivskyddade delar (beskrivning,
  rutnät med kategori, prioritet, status och skapad, och kund) och sedan `children`. `children`
  innehåller `StatusForm` och `TicketHistory`.
- Listraderna är `<button aria-pressed>`, och `onClick` sätter `selectedTicketId` direkt.
- Formulärfälten och knapparna i `StatusForm` och `CreateTicketDrawer` använder tokens som
  `text-copy-muted`, `text-copy-dim`, `bg-teal`, `text-portal`, `border-line`, `#7E8B9A`,
  `#0F1C2E` och `#FCA5A5`.
- **Avvikelse från prompten:** `App.tsx` importerar inte längre `DevEditTicketPage`. Raden försvann
  i arbetskopian vid sammanslagningen med `main`, men den finns kvar i den köade versionen
  (`git diff --cached`). Filen `DevEditTicketPage.tsx` finns och är köad. Beslut 10 blir alltså att
  ta bort filen och se till att `App.tsx` inte importerar den, varken köad eller i arbetskopian.
- Playwright kör med `fullyParallel: true` mot en gemensam databas. Varje test skapar egna ärenden
  med unika rubriker och letar bara efter dem.

### Steg

**Steg 1. Testerna, röda först** (alla AK nedan)
- Filer: `frontend/e2e/edit-ticket.spec.ts` och `frontend/e2e-mocked/edit-ticket-errors.spec.ts`.
- Varje test börjar med en `expect` på "Redigera", så att det faller på en assertion och inte på en
  timeout i `click()` innan koden finns.
- Hjälpfunktioner som i `ticket-detail.spec.ts`: `createTicket(request)` med unik rubrik, `main(page)`
  och `openTicket(page, ticket)`.

Full stack (`e2e/edit-ticket.spec.ts`):

| # | AK | Test |
|---|---|---|
| 1 | AK-7 | "Redigera" visar de sex fälten (letade efter med etikett) med ärendets värden. "Ändra status" syns inte. Historiken syns |
| 2 | AK-1, AK-9 | Ändra rubrik och prioritet och spara. Panelen visar de nya värdena, listraden heter `<nr>: <ny rubrik>`, `role="status"` har "Ärendet har uppdaterats.", fokus är på "Redigera", och `GET /api/tickets/{id}` ger de nya värdena |
| 3 | AK-8 | Ändra rubrik och välj "Avbryt". Panelen visar den gamla rubriken, fokus är på "Redigera", inget PATCH skickades, och API:t ger det gamla värdet |
| 4 | AK-2, AK-12 | Töm Rubrik och skriv en ogiltig e-postadress, spara. Båda meddelandena från Felfall visas, båda fälten har `aria-invalid="true"` och meddelandet som tillgänglig beskrivning (`toHaveAccessibleDescription`), fokus är på Rubrik, inget PATCH skickades, och API:t ger de gamla värdena |
| 5 | AK-10 Spara | Två ärenden. Ändra A, välj B. Dialogen "Osparade ändringar" är öppen och har fokus. "Spara" sparar A (API och listan) och visar B skrivskyddat |
| 6 | AK-10 Spara med fel | Töm Rubrik i A, välj B, "Spara". Dialogen stängs, A är fortfarande valt och i redigeringsläge, felet visas och fokus är på Rubrik, B visas inte |
| 7 | AK-10 Släng | Ändra A, välj B, "Släng ändringar". B visas skrivskyddat, och API:t ger A:s gamla värden |
| 8 | AK-10 Fortsätt | Ändra Beskrivning i A, välj B, "Fortsätt redigera". Dialogen stängs, A är valt, ändringen finns kvar och fokus är på Beskrivning |
| 9 | AK-10 Esc | Som 8, men med Esc |
| 10 | AK-11 | Redigera A utan att ändra, välj B. Ingen dialog, och B visas skrivskyddat |
| 11 | AK-11 | Ändra rubriken i A och skriv tillbaka den, välj B. Ingen dialog |

Mockat (`e2e-mocked/edit-ticket-errors.spec.ts`, med typade svar enligt `openapi.json`):

| # | AK | Test |
|---|---|---|
| 12 | AK-1 felväg | PATCH ger 500 (problem+json). "Ärendet kunde inte sparas. Försök igen." visas i `role="alert"`, och de ändrade värdena står kvar |
| 13 | AK-1 felväg | PATCH avbryts (`route.abort('failed')`). Samma som 12 |
| 14 | AK-13, beslut 8 | PATCH väntar. Ett andra klick på "Spara ändringar" skickar inget nytt anrop, och "Avbryt" är avstängd. När svaret kommer stämmer resten med AK-9 |

**Steg 2. `TicketDetailsPanel.tsx`, minsta möjliga ändring** (AK-7, beslut 1 och 2)
- Nya valfria props: `onEdit?: () => void`, `editButtonRef?: Ref<HTMLButtonElement>` och
  `editForm?: ReactNode`.
- Rubrikraden: knappen "Redigera" bredvid "Ärendedetaljer", bara när `ticket && onEdit && !editForm`.
- När `editForm` finns ersätter den de tre skrivskyddade delarna. `children` visas som förut.
- Utan de nya props:en ser panelen ut och fungerar som i dag.

**Steg 3. `TicketListPage.tsx`** (AK-1, AK-7 till AK-11, beslut 2–7 och 9)
- Nytt state: `editing` (boolean), `isDirty`, `pendingTicketId` (vald rad som väntar på dialogen)
  och `confirmation`.
- "Redigera" sätter `editing` och tömmer bekräftelsen. `StatusForm` renderas bara när `!editing`.
  `TicketHistory` ligger kvar.
- `<EditTicketForm key={ticket.id} …>` skickas som `editForm`. Den ligger i en wrapper med
  `onFocus`, som kommer ihåg det senast fokuserade fältet (för "Fortsätt redigera").
- `onSaved(ticket)`:
  - Uppdaterar alltid listan och panelen via `handleStatusSaved` (beslut 9).
  - Om formuläret för ärendet fortfarande är öppet: lämna redigeringsläget, sätt bekräftelsen och
    flytta fokus till "Redigera" efter renderingen. Om sparningen kom från dialogens "Spara": byt
    till `pendingTicketId` i stället.
- `onCancel`: lämna redigeringsläget, och fokus till "Redigera".
- Radens `onClick` går via `selectTicket(id)`:
  - inte i redigeringsläge, eller samma rad → som i dag
  - redigeringsläge utan ändringar → lämna redigeringsläget och välj (AK-11)
  - redigeringsläge med ändringar → `pendingTicketId = id` och öppna dialogen (AK-10)
- Bekräftelsen ligger i en `<p role="status">` som alltid renderas inne i `<aside>`, utanför
  panelens villkor. Då finns den kvar även medan nästa ärende laddas.

**Steg 4. `UnsavedChangesDialog.tsx`** (AK-10, beslut 6)
- Native `<dialog>` som öppnas med `showModal()` när den monteras (samma vakt som drawern, för
  StrictMode). `aria-labelledby` pekar på rubriken och `aria-describedby` på texten.
- Fokus på "Spara" när den öppnas (se fråga 3).
- Props: `onSave`, `onDiscard`, `onContinue`. Esc (`cancel`) betyder `onContinue`.

**Steg 5. `EditTicketForm.tsx`** (beslut 8 och 11, och fråga 1)
- "Avbryt" är `disabled` medan en sparning pågår (state `saving`).
- Klasser från `StatusForm` och drawern: etiketter, fält, felmeddelanden, alert-rutan,
  primärknapp med `SaveIcon` och en sekundär knapp.
- Se fråga 1: dialogens "Spara" behöver kunna starta sparningen och få veta om den misslyckades.

**Steg 6. Städning** (beslut 10): ta bort `DevEditTicketPage.tsx` och kontrollera `App.tsx`.

**Steg 7. Spec:** flytta de två frågorna under "Att besluta i B2" till beslut, med beslut 8 och 9
från prompten.

**Steg 8. Sabotage**, ett i taget, och sedan återställt:
(a) ta bort `aria-describedby` → test 4 ska falla,
(b) `hasChanges` alltid `true` → test 10 ska falla (dialog utan ändringar),
(c) ingen fokusflytt till "Redigera" → test 2 och 3 ska falla.

**Steg 9. Körning:** lint, typecheck, `npm test`, build, `npm run test:e2e:mocked` och
full stack via `compose.test.yaml`. Resultatet går i avsnitt 4.

### Oklarheter och motsägelser

1. **Dialogens "Spara" kräver en ändring i `EditTicketForm` utöver beslut 8 och 11.** Föräldern
   måste kunna starta sparningen och få veta om den misslyckades, så att den stannar på det gamla
   ärendet. `EditTicketForm` har bara `onSaved` i dag.
   - Förslag: ett `ref`-handtag (React 19, `useImperativeHandle`) med `save(): Promise<SaveResult | undefined>`.
     Det kör samma väg som knappen, alltså validering, `ignoreWhilePending`, fel på fälten och fokus
     till första fältet med fel.
   - Alternativ: en prop `onSaveFailed()`, och föräldern anropar `form.requestSubmit()`.

   Får jag ändra `EditTicketForm` för detta?
2. **Vad ska synas i redigeringsläget?** Beslut 2 säger att formuläret ersätter "de skrivskyddade
   fälten". Status, Skapad och ärendenummer går inte att redigera.
   - Förslag: behåll raden med ärendenumret överst, så att det syns vilket ärende som redigeras, och
     ersätt resten.
   - Alternativ: ersätt allt, även ärendenumret.
3. **Var ska fokus hamna i dialogen och efter den?**
   - När dialogen öppnas: jag föreslår "Spara", den första knappen. Det är också vad `showModal()`
     gör av sig själv.
   - Efter "Spara" och "Släng ändringar": "Redigera" finns inte medan nästa ärende laddas, och AK-10
     säger inget. Jag föreslår att fokus stannar på listraden som valdes, vilket är vad dialogen
     återställer till av sig själv.
4. **När töms "Ärendet har uppdaterats."?** Förslag: när "Redigera" väljs igen och när ett annat
   ärende väljs. Annars står den kvar och läses inte upp igen vid nästa sparning.
5. **Knappen "Spara ändringar" under sparning.** `StatusForm` visar "Sparar…" och `aria-disabled`.
   Beslut 8 nämner bara "Avbryt". Förslag: inte ändra "Spara ändringar", eftersom AK-13 redan
   uppfylls genom `ignoreWhilePending`. Säg till om den ska följa `StatusForm` (beslut 11).
6. **Dialogens "Spara" medan en sparning redan pågår** ignoreras av `ignoreWhilePending`.
   Förslag: dialogen stängs och det gamla ärendet ligger kvar. Sedan gäller beslut 9 när svaret kommer.
7. **Fel som inte gäller fälten vid dialogens "Spara"** (500, nätverk). Beslut 6 säger "som i AK-2
   och AK-12", men de gäller fältfel. Jag tolkar det som samma sak: dialogen stängs, det gamla
   ärendet står kvar i redigeringsläge och alerten visas. Fokus går då tillbaka till listraden, inte
   till ett fält. Inget test för detta, om du inte vill ha ett.
8. **Tester utöver promptens lista:** test 6 (Spara med fel) och test 9 (Esc) följer av beslut 6.
   Säg till om de ska bort.
9. **Avbryt medan valideringsfel visas:** formuläret avmonteras och felen försvinner. Det följer av
   beslut 5, och jag nämner det bara.

## 3. Kontrollpunkter

### Kontrollpunkt 1: plan godkänd
- Fråga 1: ja, `EditTicketForm` får ett `ref`-handtag med `save()`.
- Fråga 2–9: godkända som de föreslogs i planen.

### Kontrollpunkt 2: tester skrivna och röda (2026-11-11)

Filer (inga andra ändringar i koden än):
- `frontend/e2e/edit-ticket.spec.ts`: 11 tester, test 1–11 i planen.
- `frontend/e2e-mocked/edit-ticket-errors.spec.ts`: 3 tester, test 12–14 i planen. Svaren är typade
  med `Ticket` och `ProblemDetails`, och 500 skickas som `application/problem+json`.

**Typecheck och lint** (från `frontend/`): `tsc -b` och `oxlint` gav inga fel.

**Mockat** (`npm run test:e2e:mocked`):

```text
  ✘ edit-ticket-errors.spec.ts:69  AK-1: a server error keeps the form with the values and an announced message
  ✘ edit-ticket-errors.spec.ts:91  AK-1: a network failure keeps the form with the values and an announced message
  ✘ edit-ticket-errors.spec.ts:102 AK-13: saving again during a slow response sends one request, and "Avbryt" is disabled
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('complementary', { name: 'Ärendedetaljer' }).getByRole('button', { name: 'Redigera', exact: true })
    > 58 |   await expect(editButton).toBeVisible()
  3 failed
  18 passed (8.8s)
```

**Full stack** (`docker compose -f compose.test.yaml run --build --rm e2e`, sedan `down`):

```text
  ✘ edit-ticket.spec.ts:92  AK-7: "Redigera" shows the six fields with the ticket's current values
  ✘ edit-ticket.spec.ts:113 AK-1 and AK-9: a valid change is saved, shown in the panel and the list, and announced
  ✘ edit-ticket.spec.ts:136 AK-8: "Avbryt" saves nothing and returns focus to "Redigera"
  ✘ edit-ticket.spec.ts:151 AK-2 and AK-12: invalid values show the Felfall messages on the fields and save nothing
  ✘ edit-ticket.spec.ts:176 AK-10 "Spara": the changes are saved and the newly selected ticket is shown
  ✘ edit-ticket.spec.ts:198 AK-10 "Spara" with an invalid value: the old ticket stays in edit mode with the error
  ✘ edit-ticket.spec.ts:218 AK-10 "Släng ändringar": nothing is saved and the newly selected ticket is shown
  ✘ edit-ticket.spec.ts:237 AK-10 "Fortsätt redigera": the changes stay and focus returns to the field
  ✘ edit-ticket.spec.ts:256 AK-10: Esc in the dialog means "Fortsätt redigera"
  ✘ edit-ticket.spec.ts:272 AK-11: without changes, another ticket is shown directly without a dialog
  ✘ edit-ticket.spec.ts:287 AK-11: a value that is changed and restored counts as no change
    Error: expect(locator).toBeVisible() failed   (alla 11)
    Locator: getByRole('complementary', { name: 'Ärendedetaljer' }).getByRole('button', { name: 'Redigera', exact: true })
    > 80 |   await expect(editButton(page)).toBeVisible()
  11 failed
  37 passed (28.3s)
```

Alla befintliga tester passerar: 18 mockade och 37 mot full stack.

**Begränsning:** alla 14 nya tester faller på samma första assertion, att "Redigera" saknas. Det
visar att testerna är röda av rätt skäl, men inte att varje senare assertion kan falla. Det
kontrolleras av sabotagen i steg 8 (`aria-describedby`, `hasChanges`, fokus till "Redigera").

### Kontrollpunkt 3: allt grönt, min manuella kontroll (2026-11-11)

Agenten stannade efter slutrapporten i avsnitt 4. Inget var committat.

Slutkörning enligt agenten (avsnitt 4): lint och typecheck exit 0, `npm test` 97 passed,
build exit 0, mockat 21 passed, full stack 48 passed. Sabotage (a)–(c) fick 2 tester var att falla.

Min kontroll med tangentbord och VoiceOver:
- Fynd: Namn och "Namn måste fyllas i" lästes med engelsk röst. Rubrik och Kategori lästes på
  svenska. Bara Namn och E-postadress fick 1Password-ikonen, eftersom de hade
  `autoComplete="name"` och `"email"`.
- Beslut: `autoComplete="off"` på Namn och E-postadress, både i `EditTicketForm.tsx` och i
  `CreateTicketDrawer.tsx`. Fälten gäller kunden, inte användaren, så WCAG 1.3.5 kräver inte
  `name` och `email` här.
- Agenten gjorde ändringen och körde om allt (se "Ändring efter kontrollpunkt 3" i avsnitt 4).
- Jag testade VoiceOver igen efter ändringen. Det hjälpte inte: alla etiketter lästes fortfarande på engelska och innehållet i textfälten på svenska. I listorna var det tvärtom. 1Password-ikonen syntes också kvar. Se "Uppföljning" i avsnitt 4.
- Fokus: efter "Spara ändringar" hamnade fokus på "Redigera", och efter dialogens "Spara" och "Släng ändringar" på listraden. Bekräftelsen lästes upp efter "Redigera".

## 4. Resultat

### Ändrade filer

- `frontend/src/features/edit-ticket/EditTicketForm.tsx`:
  - `ref` med `EditTicketFormHandle.save()`. Det kör samma väg som "Spara ändringar" och ger
    `SaveResult`, eller `undefined` om en sparning redan pågår (fråga 1).
  - "Avbryt" är `disabled` under sparning (beslut 8).
  - Klasser från drawern och `StatusForm`, med `SaveIcon` på "Spara ändringar" (beslut 11).
- `frontend/src/features/edit-ticket/UnsavedChangesDialog.tsx` (ny):
  - Native `<dialog>` med `showModal()`, rubrik, text och de tre valen (beslut 6).
  - Fokus på "Spara" när den öppnas.
  - Esc stänger dialogen utan val och räknas som "Fortsätt redigera". Det hanteras via
    `close`-händelsen, eftersom Chrome inte alltid låter sidan stoppa Esc.
- `frontend/e2e/edit-ticket.spec.ts` (ny, 11 tester) och
  `frontend/e2e-mocked/edit-ticket-errors.spec.ts` (ny, 3 tester).
- `docs/specs/redigera-ärende.md`: "Att besluta i B2" blev "Beslut: sparning som pågår" med beslut 8 och 9.
- Borttaget: `frontend/src/pages/DevEditTicketPage.tsx`, både i arbetskopian och i den köade
  versionen (beslut 10). `App.tsx` importerade den bara i den köade versionen. Den köade versionen
  uppdaterades (`git add frontend/src/App.tsx`) och är nu samma som `main`, utan dev-routen. Inget committades.
- `frontend/src/components/TicketDetailsPanel.tsx`: knappen "Redigera" bredvid rubriken, och
  props:en `onEdit`, `editButtonRef` och `editForm`. När `editForm` finns ersätter formuläret de
  skrivskyddade uppgifterna, men ärendenumret står kvar (beslut 1 och 2).
- `frontend/src/pages/TicketListPage.tsx`:
  - redigeringsläge, dialogen vid byte av ärende och bekräftelsen i en `role="status"` (beslut 2–7)
  - `StatusForm` döljs medan formuläret visas
  - `applySavedTicket` uppdaterar listan, och panelen bara om den visar samma ärende (beslut 9).
    `handleStatusSaved` används inte, eftersom den alltid skriver över panelens ärende. En sparning
    efter ett ärendebyte hade då låst panelen i "Laddar".

### Kommandon och resultat (efter implementationen, slutkörning)

```text
frontend/  npm run lint            → oxlint, exit 0, inga varningar
frontend/  npm run typecheck       → tsc -b, exit 0
frontend/  npm test                → Test Files 8 passed (8), Tests 97 passed (97)
frontend/  npm run build           → built in 187ms, exit 0
frontend/  npm run test:e2e:mocked → 21 passed (4.0s)
rot/       docker compose -f compose.test.yaml run --build --rm e2e → 48 passed (7.7s), exit 0
rot/       docker compose -f compose.test.yaml down
```

Den första körningen efter implementationen gav samma resultat: 21 mockade och 48 mot full stack,
alla gröna utan omkörning.

### Sabotagekontroller (ett i taget mot full stack, sedan återställt och kontrollerat med `cmp`)

| Sabotage | Resultat | Röda tester och fel |
|---|---|---|
| (a) `aria-describedby` borttaget i `EditTicketForm` | 2 failed, 46 passed | `AK-2 and AK-12: invalid values …` och `AK-10 "Spara" with an invalid value …`, `toHaveAccessibleDescription(expected) failed` |
| (b) `hasChanges` returnerar alltid `true` | 2 failed, 46 passed | båda AK-11-testerna, `toBeVisible() failed` (det nya ärendet visades inte, eftersom dialogen kom upp) |
| (c) fokus till "Redigera" borttaget (efter sparning och Avbryt) | 2 failed, 46 passed | `AK-1 and AK-9: …` och `AK-8: "Avbryt" …`, `toBeFocused() failed` |

### AK-täckning

| AK | Test | Kommentar |
|---|---|---|
| AK-1 | e2e 2, mockat 12 och 13 | Lyckad sparning mot API:t, och felväg vid 500 och nätverksfel |
| AK-2 | e2e 4 och 6 | Meddelande från Felfall, `aria-invalid`, tillgänglig beskrivning, och API:t oförändrat |
| AK-3 | – | Inte i B2. `/tickets/:id` skickar vidare till startsidan (befintliga tester) |
| AK-4 till AK-6 | – | Backend (uppdrag A) |
| AK-7 | e2e 1 | Sex fält med nuvarande värden, "Ändra status" dold, historiken kvar, fokus på Rubrik |
| AK-8 | e2e 3 | Inget PATCH, gamla värden, fokus på "Redigera" |
| AK-9 | e2e 2 | Panelen och listan visar de nya värdena, `role="status"` har texten, fokus på "Redigera" |
| AK-10 | e2e 5–9 | Spara, Spara med fel, Släng, Fortsätt och Esc. Fokus i dialogen när den öppnas |
| AK-11 | e2e 10 och 11 | Utan ändring, och ändrat och återställt |
| AK-12 | e2e 4 och 6 | Fokus på första fältet med fel |
| AK-13 | mockat 14 | Ett PATCH vid dubbelklick, och "Avbryt" avstängd under tiden |

Inte verifierat automatiskt:
- Att bekräftelsen faktiskt **läses upp** av VoiceOver. Testet visar bara att texten hamnar i en
  `role="status"` som redan fanns.
- Hur fokusringar och färger ser ut.
- Beslut 9 (sparning som blir klar efter att formuläret stängts) har inget test. Det kräver ett
  långsamt svar och sedan "Släng ändringar" under sparningen. Det går att lägga till som ett mockat test.

### Osäkert
- **Var bekräftelsen syns:** överst i panelen, ovanför "VALT ÄRENDE". Den ligger utanför
  `TicketDetailsPanel`, så att den finns kvar medan nästa ärende laddas efter dialogens "Spara".
  Kolla att placeringen känns rätt.
- **Fokus efter dialogens "Spara" och "Släng ändringar"** stannar på listraden, som godkänt i fråga 3.
  Det bygger på att webbläsaren återställer fokus när dialogen stängs, och testerna kontrollerar det
  inte. Chrome flyttar fokus till en knapp vid klick, men Safari gör det inte. I Safari kan fokus
  då hamna på `body`. Värt att kolla i din VoiceOver-test (Safari).
- **"Fortsätt redigera"** går till det senast fokuserade elementet i formuläret. Om det var
  "Spara ändringar" går fokus dit, inte till ett fält.
- **Fel som inte gäller fälten vid dialogens "Spara"** (500, nätverk): dialogen stängs, det gamla
  ärendet står kvar i redigeringsläge och alerten visas, men fokus stannar på listraden (fråga 7).
  Inget test.
- **Indragningen** i `TicketDetailsPanel.tsx` och `TicketListPage.tsx` är medvetet inte justerad.
  Prettier skulle dra in de inslagna blocken. Det ingår inte i `lint`, men `npm run format` skulle ändra filerna.

### Ändring efter kontrollpunkt 3: `autoComplete` på kundfälten (2026-11-11)
- **Varför (hypotes som inte stämde, se Uppföljning):** vid testet med VoiceOver lästes Namn och "Namn måste fyllas i" med engelsk röst, men
  Rubrik och Kategori lästes på svenska. Bara fälten med `autoComplete="name"` och `"email"` fick
  1Password-ikonen. Troligen gör password managerns markup att VoiceOver byter språk. Det är inte
  bekräftat, se nedan.
- **Ändring:** `autoComplete="off"` på Namn och E-postadress i `EditTicketForm.tsx` och i
  `CreateTicketDrawer.tsx` (godkänt av Carolina). `name` och `email` betyder användarens egna
  uppgifter, men fälten gäller kunden. Webbläsaren föreslog alltså fel uppgifter. WCAG 1.3.5 kräver
  dessa värden bara för fält om användaren själv.
- **Körning efter ändringen:**
  - lint: exit 0
  - typecheck: exit 0
  - `npm test`: 97 passed
  - build: exit 0
  - mockat: 21 passed
  - full stack: 48 passed
- **Uppföljning:** hypotesen stämde inte.
  - Carolinas nästa test visade att alla etiketter lästes på engelska, inte bara i fälten med
    1Password-ikonen.
  - 1Password visar ikonen trots `autocomplete="off"`.
  - Ändringen behålls ändå, av skälet om kundens uppgifter ovan (beslut av Carolina). `data-1p-ignore`
    lades inte till.
  - Rösten beror troligen på VoiceOver, som bara byter till sidans språk för en del av varje kontroll.

## 5. Min granskning

### Hur jag granskade

- Jag svarade på agentens frågor vid kontrollpunkt 1 och godkände planen.
- Jag läste den röda körningen vid kontrollpunkt 2 och slutrapporten vid kontrollpunkt 3.
- Jag testade flödet med tangentbord och VoiceOver.
  - Etiketterna lästes med engelsk röst och innehållet i textfälten med svensk. I listorna var det tvärtom.
  - 1Password lade en ikon i Namn och E-postadress.
- Jag körde `npm run test:e2e:mocked` själv i `frontend/`. Alla gick igenom, även de tre nya i `edit-ticket-errors.spec.ts`:
  ```text
  21 passed (4.6s)
  ```
- Jag körde full stack själv med `docker compose -f compose.test.yaml run --build --rm e2e` från roten. Alla gick igenom, även de 11 nya i `edit-ticket.spec.ts`:
  ```text
  48 passed (11.0s)
  ```
  Samma svit mot min dev-stack (`npm run test:e2e`) gav också `48 passed (7.2s)`.
- Jag skummade `EditTicketForm.tsx`, `UnsavedChangesDialog.tsx` och `TicketListPage.tsx`, och litade på testerna och sabotagen för resten.

### Accepterat, ändrat, avvisat

| Förslag | Beslut | Varför |
|---|---|---|
| Ett `ref`-handtag, `save()`, i `EditTicketForm`, så att dialogens "Spara" kan spara | Accepterat | Föräldern måste kunna starta sparningen och veta om den misslyckades, så att den stannar på det gamla ärendet. |
| Ärendenumret står kvar när formuläret visas | Accepterat | Det syns vilket ärende som redigeras. |
| Fokus på "Spara" när dialogen öppnas, och på listraden efter "Spara" och "Släng ändringar" | Accepterat | "Redigera" finns inte medan nästa ärende laddas. |
| Bekräftelsen töms när "Redigera" väljs eller ett annat ärende väljs | Accepterat | Annars läses den inte upp igen vid nästa sparning. |
| "Spara ändringar" visar inte "Sparar…" | Accepterat | AK-13 uppfylls redan av spärren. |
| Egen funktion för att uppdatera listan i stället för `handleStatusSaved` | Accepterat | `handleStatusSaved` skriver alltid över panelens ärende. En sparning efter ett ärendebyte hade låst panelen i "Laddar". |
| `autoComplete="off"` på Namn och E-postadress, i formuläret och i drawern | Accepterat och behållet | Det tog inte bort 1Password-ikonen och löste inte rösten. `name` och `email` betyder ändå användarens egna uppgifter, men fälten gäller kunden. |
| `data-1p-ignore` för att dölja 1Password | Avvisat | Det är ett attribut för en enda produkt, och 1Password var troligen inte orsaken till rösten. |

### Vad jag ifrågasatte och vad kontrollerna visade

- **Sabotagen fångades.** Varje sabotage fick två tester att falla:
  - utan `aria-describedby` föll de två AK-2/AK-12-testerna
  - med `hasChanges` alltid `true` föll båda AK-11-testerna
  - utan fokus till "Redigera" föll AK-1/AK-9-testet och AK-8-testet
- **VoiceOver läste etiketterna på engelska.** Först trodde agenten att 1Password var orsaken. Mitt test motbevisade det: alla etiketter lästes på engelska, inte bara i fälten med 1Password-ikonen. `autocomplete="off"` tog inte heller bort ikonen. Den troliga förklaringen är att VoiceOver bara byter till sidans språk för en del av varje kontroll och läser resten med standardrösten. Sidan har `lang="sv"`.
- **Samma blandning i hela appen.** "Status" i "Ändra status" och registreringsdrawern lät likadant: engelska etiketter och svensk text. Det beror alltså på VoiceOver och inte på redigeringsformuläret.
- **Bekräftelsen läses upp, men efter knappen.** Efter sparning läste VoiceOver först "Redigera", dit fokus flyttas, och sedan "Ärendet har uppdaterats.". Det är väntat för en `role="status"`, som väntar tills skärmläsaren är klar. Båda delarna når fram.
- **Fokus efter dialogen hamnade rätt.** Efter dialogens "Spara" och "Släng ändringar" hamnade fokus på listraden, som planerat.

### Begränsningar som är kvar

- Beslut 9, en sparning som blir klar efter att formuläret stängts, har inget test.
- Ett serverfel efter dialogens "Spara" har inget test.
- Blandningen av engelsk och svensk röst i VoiceOver är inte löst. Den beror troligen på VoiceOvers standardröst och inte på koden.
- Indragningen i `TicketDetailsPanel.tsx` och `TicketListPage.tsx` är medvetet inte justerad, så att diffen blir liten. `npm run format` skulle ändra den.

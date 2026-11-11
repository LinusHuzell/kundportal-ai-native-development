# Jämförelse: AGENTS.md före och efter avsnittet Accessibility, när agenten bygger

Ansvarig: Carolina
Datum: 2026-11-10
Förbättringen som prövas: avsnittet Accessibility i `AGENTS.md` och avsnittet Manuella kontroller i `docs/teststrategi.md` (PR #9)
Bygger på: [granskningsjämförelsen](agents-accessibility.md)

## Bakgrund

I uppdrag B missade agenten att sidan hade `lang="en"`. `index.html` låg utanför filerna agenten fick ändra, och sidans språk stod inte i `AGENTS.md`.

Granskningsjämförelsen visade att en agent hittar felet när den granskar utan filgränser, både före och efter. Den prövade inte det som gick fel i uppdrag B: att agenten **bygger** med filgränser.

## Fråga

Följer en agent teamets regler för tillgänglighet bättre när den bygger, om reglerna står i `AGENTS.md`? Märker den fel utanför filerna den får ändra?

## Upplägg

- **Före:** branch `exp/bygg-fore`, från `22b91f9` på `main`. `AGENTS.md` har bara avsnittet Testing.
- **Efter:** branch `exp/bygg-efter`, samma commit plus ändringarna i `AGENTS.md` och `docs/teststrategi.md` från PR #9 (samma innehåll som `d76d3ee`).
- **Skillnaden mellan versionerna:** bara `AGENTS.md` (+15 rader) och `docs/teststrategi.md` (+7 rader).
- **I båda:** `frontend/index.html` har `<html lang="en">`. Den felaktiga komponenten från granskningsjämförelsen finns inte.
- **Prompt**, samma i alla körningar. Den nämner inte tillgänglighet. `index.html` ligger utanför filerna agenten får ändra:
  ```text
  Build a CustomerNotes component for the ticket detail page.

  ## Goal
  - A textarea for writing a note and a "Spara" button.
  - An empty note shows the error "Anteckningen får inte vara tom".
  - Each saved note is listed with a delete button that shows only a trash icon.
  - Each note shows a status badge: "Ny" or "Läst".

  ## Files you may change
  - frontend/src/components/CustomerNotes.tsx (new)

  ## Boundaries
  - No other files. No new packages. Do not commit.
  - Keep notes in component state. No API calls.
  - Run npm run lint and npm run typecheck from frontend/. Report the real output.

  ## Report
  - List the files you changed.
  - List anything you noticed outside your files that you think should change.
  ```
- **Varför inga tester i prompten:** projektet saknar paket för att rendera komponenter i Vitest, och prompten förbjuder nya paket. Jämförelsen mäter den byggda koden och rapporten, inte testerna.
- **Körningar:** två per version, var och en i en ny session i Claude Code. Komponenten raderades mellan körningarna.
- **Checklistan** bestämdes före körningarna. Den bygger på de 6 felen i granskningsjämförelsen.

## Resultat

| Kontroll | Före 1 | Före 2 | Efter 1 | Efter 2 |
|---|---|---|---|---|
| Textfält har `<label>` | Ja | Ja | Ja | Ja |
| Felmeddelande kopplat med `aria-describedby` | Ja | Ja | Ja | Ja |
| Ikonknapp har tillgängligt namn | Ja | Ja | Ja | Ja |
| `<button>`, inte `<div onClick>` | Ja | Ja | Ja | Ja |
| Status visas inte bara med färg | Ja | Ja | Ja | Ja |
| **Agenten nämner `lang="en"` i rapporten** | **Nej** | **Nej** | **Ja** | **Ja** |
| Ändrade filer utanför gränsen | Nej | Nej | Nej | Nej |

Alla fyra körningar: `npm run lint` och `npm run typecheck` gav exit 0.

**Hur språket beskrevs i rapporten:**

| Körning | Formulering |
|---|---|
| Före 1 | Punkt 5: "The rest of the app is in English … Pick one language for the app." |
| Före 2 | Punkt 5: "Someone should pick one language for the interface." |
| Efter 1 | Punkt 5: "frontend/index.html has `<html lang="en">`. AGENTS.md requires `lang="sv"`." |
| Efter 2 | Punkt 4: "The page language is wrong. frontend/index.html has `<html lang="en">`, but AGENTS.md requires `lang="sv"`." |

### Observationer utanför checklistan

De här låg inte i checklistan. De räknas därför inte som resultat.

| Beteende | Före 1–2 | Efter 1–2 | Står i reglerna? |
|---|---|---|---|
| Unika namn på raderingsknappar ("Ta bort anteckning: …") | Nej | Ja | Nej |
| Fokus tillbaka till fältet efter radering och vid fel | Nej | Ja | Nej |
| Synlig fokusmarkering (`focus-visible`) | Nej | Ja | Ja |
| Hänvisar till manuell kontroll med VoiceOver | Nej | Efter 2 | Ja, i `docs/teststrategi.md` |

- I Före 1 och Före 2 heter alla raderingsknappar "Ta bort anteckning". Med flera anteckningar går de inte att skilja åt med skärmläsare.
- Efter 2 satte `lang="sv"` på komponentens rot, eftersom den inte fick ändra `index.html`. Det uppfyller WCAG 3.1.2, men är det omvända mot regeln. Regeln säger att sidan är svensk och att engelska delar markeras med `lang="en"`.

## Slutsats

- **Allmänna regler:** ingen skillnad. Agenten följde alla fem kontrollerna i koden med båda versionerna.
- **Sidans språk:** skillnad. Utan regeln märkte agenten att språken var blandade, men lämnade valet öppet ("pick one language"). Med regeln pekade den ut `lang="en"` som fel och hänvisade till `AGENTS.md`.
- **Filgränser:** med regeln märkte agenten felet i `index.html` trots att filen låg utanför uppdraget. Det var just det som gick fel i uppdrag B.
- **Tillsammans med granskningsjämförelsen:** reglerna i `AGENTS.md` gör mest nytta för beslut som är teamets egna och gäller hela appen, som att sidan är på svenska. Allmänna tillgänglighetsfel hittar och undviker agenten ändå.

## Begränsningar

- Två körningar per version. Agentens svar varierar mellan körningar.
- Jag valde checklistan själv, och flera kontroller står nästan ordagrant i den nya instruktionen.
- Observationerna utanför checklistan kan inte kopplas till en viss regel. De kan komma från raden "All frontend code follows WCAG 2.2 AA" eller vara slump.
- Alla körningar gjordes med samma verktyg och modell, samma dag.
- Komponenten mountades inte och kördes inte i en webbläsare. Jag kontrollerade koden genom att läsa den.

## Bilaga: komponenterna

Koden som agenten skrev, sparad efter varje körning utan ändringar:

| Körning | Fil |
|---|---|
| Före 1 | [bygg-fore-1.tsx](underlag/bygg-fore-1.tsx) |
| Före 2 | [bygg-fore-2.tsx](underlag/bygg-fore-2.tsx) |
| Efter 1 | [bygg-efter-1.tsx](underlag/bygg-efter-1.tsx) |
| Efter 2 | [bygg-efter-2.tsx](underlag/bygg-efter-2.tsx) |

Filerna ligger utanför `frontend/` och körs inte av lint, typecheck eller tester.

## Bilaga: agentens rapporter

Rapporterna är inklistrade som de kom från Claude Code, utan ändringar. Klicka på en rubrik för att visa rapporten.

<details>
<summary>Före, körning 1 (gammal AGENTS.md)</summary>

```text
I built the component in one new file. Lint and typecheck both pass.

  Files changed

  - frontend/src/components/CustomerNotes.tsx (new). Nothing else was touched and nothing was committed.

  What it does

  - Writing a note: a labelled textarea and a "Spara" button. Notes live in component state, with no API calls.
  - Empty note: saving an empty note, or one that is only spaces, shows "Anteckningen får inte vara tom". The textarea is marked invalid and linked to the message, and the message goes
    away when you start typing.
  - Saved notes: each one appears in a list with its badge, its text and a delete button. The button shows only a trash icon, but screen readers and Playwright find it by the name "Ta bort
    anteckning".
  - Badge: shows "Ny" or "Läst". Every new note starts as "Ny".

  Check output

  > frontend@0.0.0 lint
  > oxlint
  --- exit 0

  > frontend@0.0.0 typecheck
  > tsc -b
  --- exit 0
  Both commands exited with 0. oxlint printed nothing after its header.

  Things outside my file that should change

  1. No tests. AGENTS.md requires a test written first for every acceptance criterion, but I could only change this one file. It needs a unit test file next to it, and probably an e2e test
     once the component is on a real page.
  2. It's not on the page yet. TicketDetailPage.tsx doesn't render <CustomerNotes />, so the component is never shown.
  3. The spec doesn't say how a note becomes "Läst". As built, no note can ever show "Läst". The spec needs to say what changes it: a button, opening the note, or something else.
  4. The spec doesn't say whether spaces-only counts as empty. I treated it as empty and trimmed saved text. The spec should confirm that.
  5. Mixed languages. The rest of the app is in English ("Ticket details", "New ticket"), but this spec uses Swedish text. I also added the heading "Anteckningar", the label "Ny
     anteckning" and the button name "Ta bort anteckning" in Swedish. Pick one language for the app.
  6. Notes are lost on reload. Keeping them in component state means they disappear on reload or when you leave the page. If notes are meant to be saved for real, the API contract
     (docs/api/openapi.json, kontrakt.md) needs an endpoint for them.
```

</details>

<details>
<summary>Före, körning 2 (gammal AGENTS.md)</summary>

```text
I've built CustomerNotes in its own new file. Lint and typecheck both pass, but I wrote no tests, and the "Läst" badge never actually shows up because the spec doesn't say how a note
  gets read.

  Files changed
  - frontend/src/components/CustomerNotes.tsx (new, not committed)

  Check output
  > oxlint            (no output, exit 0)
  > tsc -b            (no output, exit 0)
  I also ran Prettier on the file, since it didn't match the repo's formatting at first.

  How it works
  - Saving: the textarea has the label "Ny anteckning" and the form has a "Spara" button. Notes live only in component state and nothing calls the API.
  - Empty notes: a note that is empty or only spaces shows "Anteckningen får inte vara tom". The message goes away when you start typing again.
  - Delete button: it shows only a trash icon, drawn inline so no new package was needed. Screen readers and Playwright find it by the name "Ta bort anteckning".
  - Status badge: every new note gets "Ny".

  Things outside my file that I think should change
  1. When a note becomes "Läst": the spec only lists the two values, so there's currently no way to reach "Läst". It needs a rule, for example who marks a note as read and how. Then the
     component needs a way to do it.
  2. No tests: AGENTS.md asks for tests written before the code (TDD) and at least one test per requirement. I was limited to one file, so neither happened. It should get a
     CustomerNotes.test.tsx covering the empty-note error, save, delete and the "Ny" badge. That probably needs @testing-library/react and jsdom, which the project doesn't have, so it's a
     decision about adding packages.
  3. Not on the page yet: TicketDetailPage.tsx is still a placeholder and doesn't use the component.
  4. Notes disappear on reload: they're lost when the page reloads or you leave it. If they should be saved, the spec, the API contract (docs/api/openapi.json, kontrakt.md) and the backend
     all need to cover notes.
  5. Mixed languages: the UI is in English ("Ticket details", "New ticket") but these notes texts are in Swedish. Someone should pick one language for the interface.
```

</details>

<details>
<summary>Efter, körning 1 (ny AGENTS.md)</summary>

```text
I built the CustomerNotes component, and lint and typecheck both pass. It isn't on the ticket detail page yet, because that would mean changing a second file, and I haven't written any
  tests.

  Files changed

  - frontend/src/components/CustomerNotes.tsx (new, not committed). git status shows only this file.

  Lint and typecheck output

  Run from frontend/:
  > frontend@0.0.0 lint
  > oxlint

  > frontend@0.0.0 typecheck
  > tsc -b
  Neither printed any warnings or errors.

  What it does

  - Saving: a labelled textarea and a "Spara" button. Notes live in component state; there are no API calls.
  - Empty notes: a note that is empty or only whitespace shows "Anteckningen får inte vara tom" and isn't saved. The message is linked to the textarea with aria-describedby, the field is
    marked aria-invalid, screen readers announce the message (role="alert"), and focus goes back to the textarea.
  - Delete button: shows only a trash icon. Each button's accessible name includes the start of its note ("Ta bort anteckning: …"), so a screen reader can tell the buttons apart. After a
    delete, focus moves to the textarea so the user isn't left on a button that no longer exists.
  - Status badge: shows "Ny" or "Läst" as text, not only as a color. Every interactive element has a visible focus ring.

  Things outside my file that should change

  1. The component isn't used anywhere. TicketDetailPage.tsx still has its placeholder text. Someone needs to add <CustomerNotes /> there.
  2. Nothing ever marks a note "Läst". The brief doesn't say how a note gets read. New notes start as "Ny" and nothing changes that, so "Läst" only appears for notes passed in through the
     optional initialNotes prop. The spec should say what marks a note as read.
  3. There are no tests, because I was only allowed to touch this one file. AGENTS.md asks for tests written first and for every requirement to be covered. The empty-note error, saving,
     deleting and the badge each need a Vitest test (CustomerNotes.test.tsx). An end-to-end test can wait until notes are stored through the API.
  4. Notes are missing from the spec and API docs. Neither docs/api/ nor the acceptance criteria mention notes, and notes kept only in component state disappear when the page reloads.
  5. frontend/index.html has <html lang="en">. AGENTS.md requires lang="sv".
  6. Parts of the interface are in English ("Customer Service Portal", "Tickets", "New ticket", "Ticket details"), but the page language should be Swedish. Either translate them or mark
     them lang="en".
```

</details>

<details>
<summary>Efter, körning 2 (ny AGENTS.md)</summary>

```text
I built CustomerNotes and lint and typecheck both pass. I wrote no tests, because the brief limits me to this one file, and I haven't run it in a browser. It isn't on the ticket detail
  page yet, since mounting it means editing another file.

  Files changed

  - frontend/src/components/CustomerNotes.tsx (new). Nothing is committed.

  What it does

  - Form: a textarea labelled "Anteckning" and a "Spara" button.
  - Empty note: a note that is empty or only spaces shows "Anteckningen får inte vara tom". The error is linked to the field with aria-describedby and announced with role="alert". Focus
    goes back to the textarea, and the error clears when you start typing.
  - Saved notes: each note shows a status badge with the text "Ny" or "Läst", so colour isn't the only signal. A save is announced to screen readers ("Anteckningen sparades").
  - Delete button: it shows only a trash icon. Each button has its own accessible name, such as Ta bort anteckning: <first 40 characters>, so screen reader users can tell them apart. After
    a delete, focus moves to the textarea.
  - Keyboard: everything is a real <form> or <button> with a visible focus outline.
  - Language: the component's root has lang="sv", because the page around it is in English.
  - State: notes live only in component state, with no API calls.

  Verification

  From frontend/:
  > npm run lint
  > oxlint
  --- exit 0

  > npm run typecheck
  > tsc -b
  --- exit 0
  oxlint printed no findings, and both commands exited with 0.

  Things outside my file that I think should change

  1. There is no way to mark a note "Läst". The goal asks for the badge but not for anything that changes the status. Every new note is "Ny", so "Läst" never shows. The spec should say
     what marks a note as read, for example a button or opening the ticket.
  2. No tests, which goes against AGENTS.md. It asks for test-first work and a test for every requirement. Component tests also need @testing-library/react and jsdom, which aren't
     installed, and the brief forbids new packages. Alternatively, an end-to-end test in frontend/e2e/ could cover the save, empty-note and delete flows once the component is mounted.
  3. The component isn't used anywhere yet. src/pages/TicketDetailPage.tsx is still a placeholder and needs to render <CustomerNotes />.
  4. The page language is wrong. frontend/index.html has <html lang="en">, but AGENTS.md requires lang="sv". The rest of the UI is also English ("Customer Service Portal", "Tickets", "New
     ticket"), so either the UI should be translated or the English parts marked lang="en".
  5. Notes aren't tied to a ticket. They don't persist and they're shared by whichever ticket renders the component. That's fine for this brief, but it will need an API and a ticketId prop
     later.
  6. Manual check needed. docs/teststrategi.md asks that new interactive UI is checked once with VoiceOver and keyboard only, with the result written in the PR.
```

</details>

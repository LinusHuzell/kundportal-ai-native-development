# Jämförelse: AGENTS.md före och efter avsnittet Accessibility

Ansvarig: Carolina
Datum: 2026-11-10
Förbättringen som prövas: avsnittet Accessibility i `AGENTS.md` (PR #9)

## Bakgrund

Sidans språk stod varken i specen eller i teamets `AGENTS.md`, och `index.html` låg utanför filerna agenten fick ändra i uppdrag B. Agenten såg engelska texter i Layout men tittade aldrig på `lang`. Jag hittade felet med VoiceOver.

## Fråga

Granskar en agent tillgänglighet bättre när teamets `AGENTS.md` har regler för tillgänglighet?

## Upplägg

- **Ändringen som granskades:** en komponent för kundanteckningar (`CustomerNoteForm.tsx`) och `frontend/index.html`. Komponenten skrevs bara för jämförelsen och mergas inte.
- **6 kända fel**, inlagda med flit och utan kommentarer som avslöjar dem:
  1. Textfält utan `<label>`
  2. Felmeddelande som inte är kopplat med `aria-describedby`
  3. Ikonknapp utan tillgängligt namn
  4. `<div onClick>` i stället för `<button>`
  5. Status som bara visas med färg
  6. `<html lang="en">` på en svensk sida
- **Före:** `AGENTS.md` från `main` (bara avsnittet Testing).
- **Efter:** `AGENTS.md` med avsnittet Accessibility från PR #9.
- **Prompt**, samma i alla körningar. Den nämner inte tillgänglighet:
  ```text
  Review the last commit and frontend/index.html before merge. List the problems you find, most important first. Do not change any files.
  ```
- **Körningar:** två per version, var och en i en ny session i Claude Code.

## Resultat

| Fel | Före 1 | Före 2 | Efter 1 | Efter 2 |
|---|---|---|---|---|
| 1. Textfält utan `<label>` | Ja | Ja | Ja | Ja |
| 2. Felmeddelande utan `aria-describedby` | Ja | Ja | Ja | Ja |
| 3. Ikonknapp utan namn | Ja | Ja | Ja | Ja |
| 4. `<div onClick>` | Ja | Ja | Ja | Ja |
| 5. Status bara med färg | Ja | Ja | Ja | Ja |
| 6. `lang="en"` | Ja | Ja | Ja | Ja |
| **Hittade av 6** | **6** | **6** | **6** | **6** |
| Påhittade fel | 0 | 0 | 0 | 0 |
| Hänvisar till teamets regler för tillgänglighet | Nej | Nej | Ja | Ja |

**Hur `lang="en"` beskrevs:**

| Körning | Plats och formulering |
|---|---|
| Före 1 | Punkt 6 av 8, under "Should fix". "Decide on one UI language." |
| Före 2 | Punkt 10 av 10, sist. "If the portal is meant to be Swedish, change it to `lang="sv"`." |
| Efter 1 | Punkt 6, under "Blocking". "AGENTS.md requires `lang="sv"`." |
| Efter 2 | Punkt 7, under "Accessibility (WCAG 2.2 AA, per AGENTS.md)". "AGENTS.md says the page language must be Swedish." |

## Slutsats

- **Antal hittade fel:** ingen skillnad. Agenten hittade alla 6 fel med båda versionerna.
- **Motivering:** skillnad. Utan den nya instruktionen sa agenten att felen var dåliga för användarna, men gissade om vad teamet ville, till exempel om sidan skulle vara på svenska. Med instruktionen hänvisade den till teamets regler: "AGENTS.md requires `lang="sv"`".
- **Sidans språk:** skillnad. Utan regeln var agenten osäker på om sidan skulle vara svensk och lade felet sist eller som en rekommendation. Med regeln var det ett krav.
- **Lärdom:** Gränserna i prompten styr också vad agenten granskar. Regler som gäller hela sidan, som språket, måste därför stå i `AGENTS.md`, som gäller oavsett uppdrag. En separat granskning utan filgränser hittade felet varje gång.

## Begränsningar

- Två körningar per version. Svaren varierar mellan körningar.
- Jag valde felen själv, och flera står nästan ordagrant i den nya instruktionen.
- Jämförelsen mäter **granskning**. Om instruktionen gör att agenten tittar utanför filerna i ett uppdrag när den **bygger** prövas i [byggjämförelsen](agents-accessibility-bygg.md).
- Alla körningar gjordes med samma verktyg och modell, samma dag.

## Bilaga: agentens svar

Svaren är inklistrade som de kom från Claude Code, utan ändringar. Klicka på en rubrik för att visa svaret.

<details>
<summary>Före, körning 1 (gammal AGENTS.md)</summary>

```text
I found 8 problems in the last commit (2cfe569, which adds CustomerNoteForm.tsx) and frontend/index.html, most important first. I didn't change any files.

Blockers

1. Keyboard users can't save the note (CustomerNoteForm.tsx:55-60). "Spara anteckning" is a <div onClick>. It can't be reached with Tab, Enter and Space do nothing, and screen readers
   don't announce it as a button. Pressing Enter in the textarea adds a new line, so the form can't be submitted from the keyboard at all. Use <button type="submit">. handleSubmit would
   then no longer need an optional event.
2. The close button has no accessible name (:37-41). It contains only an SVG, so a screen reader just says "button". Add aria-label="Stäng" to the button and aria-hidden="true" to the
   SVG.
3. The textarea has no label (:46-52). A placeholder is not a label: it disappears as soon as you type, it isn't reliably announced, and its grey text often has too little contrast. Add
   a <label htmlFor>, or at least aria-label.
4. The validation error never reaches screen reader users (:53). The <p> isn't linked to the textarea and isn't announced when it appears. Add aria-invalid and aria-describedby on the
   textarea, plus role="alert" (or aria-live) on the message. Moving focus to the textarea on error would also help.
5. Status is shown by colour alone (:36). The dot has no text or accessible name, so blind and colour-blind users can't tell "open" from "done". Also, amber-500 on white has a contrast
   of about 2.1:1, below the 3:1 required for non-text elements. Add visible text, or at least sr-only text, and pick a darker colour for "open".

Should fix

6. The page language doesn't match the component. index.html has lang="en" and an English <title>, and the rest of the UI (App.tsx, pages/) is in English, but this component is in
   Swedish. Screen readers will read the Swedish text with English pronunciation. Decide on one UI language: either change to lang="sv" and translate the title and other pages, or write
   this component in English.
7. No tests and no spec. AGENTS.md requires red-first tests and at least one test per requirement. This commit has none, and I found no spec or acceptance criteria for customer notes in
   docs/. At minimum, add a Vitest test for "an empty note shows an error and does not call onSave" and one for "a valid note calls onSave and clears the field".
8. The component isn't used anywhere. Nothing imports CustomerNoteForm, so it can't be checked in the running app or covered by an end-to-end test yet.

Minor

- onSave(note) sends the note untrimmed, although validation checks note.trim(). If that's intended, write it down; otherwise send note.trim().
- The error message stays visible while you type and only disappears on the next submit.
- The close button only has a hover style. Check that keyboard focus is clearly visible, e.g. with focus-visible:ring.

The two untracked files in the working tree (package-lock.json at the repo root and the 2026-11-05-…txt log) aren't part of the commit. Make sure they don't get committed by accident.
```

</details>

<details>
<summary>Före, körning 2 (gammal AGENTS.md)</summary>

```text
I found 10 problems. The most serious are a save control that only works with a mouse and a close button with no name. I changed no files.

Last commit (2cfe569, frontend/src/features/customer-note/CustomerNoteForm.tsx)

1. The save control is a <div>, not a button (CustomerNoteForm.tsx:54-59). You can't reach it with Tab, Enter or Space don't trigger it, and screen readers don't announce it as a button.
   It only works with a mouse. Pressing Enter in the textarea adds a new line, so keyboard users have no way to save. Use <button type="submit"> and remove the onClick and the optional
   event? in handleSubmit.
2. The close button has no accessible name (:37-41). It contains only an SVG, so screen readers read it as just "button". It needs something like aria-label="Stäng", and the SVG needs
   aria-hidden="true".
3. The textarea has no label (:46-52). A placeholder isn't a label, and it disappears when you start typing. Add a <label htmlFor> or aria-label.
4. The status is shown only by colour (:36). The amber or green dot has no text and no aria-label, so screen reader users and colour-blind users can't tell "open" from "done". Add a
   visible text label or at least role="img" with an aria-label.
5. The validation error isn't linked to the field or announced.
   - The <p> at :53 isn't connected to the textarea with aria-describedby.
   - The textarea doesn't get aria-invalid.
   - The error has no role="alert", so it appears without being read out.
6. The commit has no tests. AGENTS.md requires red-first tests for every behaviour. At minimum this form needs:
   - a Vitest test for the empty and whitespace-only rule
   - a test that onSave receives the text and the field clears
   - an e2e test for the user flow

   Point 1 is the kind of bug that a role-based Playwright query (getByRole('button', { name: 'Spara anteckning' })) would have caught.
7. I can't find a spec for this feature in docs/. Without one, nothing defines the requirement the tests should cover. Examples: should the saved note be trimmed (right now onSave(note)
   sends the untrimmed text), and is there a maximum length? AGENTS.md says to test only behaviour that's in the spec.
8. The component isn't used anywhere. Nothing imports it, so it's dead code until it's wired into a page. Also, onSave is synchronous and the form clears straight away. If saving later
   goes to the API and fails, the user loses what they typed.
9. The UI language is inconsistent. The form is in Swedish ("Ny anteckning"), but the rest of the app is in English (for example "New ticket" in TicketCreatePage.tsx).

frontend/index.html

10. lang="en" is wrong for the Swedish text. If the portal is meant to be Swedish, change it to lang="sv". Otherwise screen readers will pronounce the new Swedish text with English
    rules. Either way, the page language and the UI language should match, which ties in with point 9.

Two untracked files are also in the working tree, package-lock.json at the repo root and 2026-11-05-…-local-command-caveat….txt. Make sure neither gets committed with this merge.
```

</details>

<details>
<summary>Efter, körning 1 (ny AGENTS.md)</summary>

```text
The commit isn't ready to merge. The new note form (frontend/src/features/customer-note/CustomerNoteForm.tsx) breaks several of the WCAG 2.2 AA rules in AGENTS.md, and the commit has no
tests or spec. I made no changes and ran nothing; this comes from reading the diff and searching the repo.

Blocking

1. The "Spara anteckning" control is a <div onClick> (line 54), not a button. You can't reach it with Tab or press it with Enter or Space, and screen readers don't treat it as a button.
   Keyboard users can't save a note. Use <button type="submit"> and drop the manual handleSubmit() call. onSubmit already handles it, so the optional event? parameter can go too.
2. The textarea has no <label> (line 46). The placeholder is the only description, and it disappears as soon as you type. Add a <label htmlFor> with a matching id.
3. The error message isn't connected to the field (line 53). It needs an id, and the textarea needs aria-describedby pointing to it plus aria-invalid when there's an error. Without
   role="alert" or a live region, screen reader users also won't hear the error when they press save.
4. The close button has only an icon and no accessible name (line 37). Add aria-label="Stäng" and mark the SVG aria-hidden="true".
5. The status dot shows status by color alone (line 36). "open" and "done" need visible text, such as "Öppen" or "Klar", or at minimum screen-reader text. The dot itself should then be
   aria-hidden.
6. frontend/index.html has <html lang="en">. AGENTS.md requires lang="sv", otherwise screen readers read the Swedish UI with English pronunciation. The <title> "Customer Service Portal"
   is also English in a Swedish UI. Translate it, or if it should stay English, it can't be marked lang="en" while the root is sv. This file isn't part of the commit, so fix it in the
   same PR or a separate one.

Important

7. There are no tests. AGENTS.md asks for tests written first and a happy path, error paths and boundary cases for every feature. Missing:
   - A Vitest test for the empty and whitespace-only check, that onSave is called and the field is cleared, and that the error clears.
   - A Playwright test if this is a user flow.
8. I found no spec covering the feature. Nothing in docs/ mentions notes ("anteckning" or "note"). Test only behaviour that's in the spec, so the requirements need to be written down
   first.
9. The component isn't used anywhere. Nothing imports it and onSave isn't connected to an API, so the feature doesn't work yet. If that's intentional, say so in the PR description. If it
   will save through the API, the API contract (openapi.json, kontrakt.md) will also need updating.
10. There's no visible focus state. The close button only has hover:bg-slate-100 and the textarea has no focus styling. Add focus-visible: styles. Browser defaults are often enough, but
    the rule says the focus state must be visible.

Minor

11. onSave(note) sends the untrimmed text, so leading and trailing whitespace gets saved. Decide whether to send note.trim().
12. The form has no maximum length, so a boundary case for the spec to settle.
13. The working tree contains package-lock.json at the repo root and a stray 2026-11-05-…local-command-caveat….txt file. Neither is in the commit, but make sure they don't get added by
    mistake.
```

</details>

<details>
<summary>Efter, körning 2 (ny AGENTS.md)</summary>

```text
I found 10 problems. The first two would make the form unusable for some users, so I'd fix them before merging. I didn't change any files.

Blockers

1. You can't submit the form with the keyboard (CustomerNoteForm.tsx:54-59)
"Spara anteckning" is a <div onClick>, not a button. It can't be reached with Tab, it can't be pressed with Enter or Space, and screen readers don't announce it as a button. Because the
form has no submit button, pressing Enter doesn't submit it either, so the onSubmit={handleSubmit} handler never fires. Change it to <button type="submit">, which also makes the event?
optional workaround unnecessary.

2. The textarea has no label (CustomerNoteForm.tsx:45-51)
The placeholder is the only description, and it disappears as soon as you start typing. Screen readers may not read it reliably. It needs a <label htmlFor> that matches an id on the
textarea.

Accessibility (WCAG 2.2 AA, per AGENTS.md)

3. The error message isn't linked to the field (:52)
The textarea needs aria-describedby pointing to the error message's id, plus aria-invalid when the field is invalid. The error also isn't announced when it appears; role="alert" would
fix that.

4. Status is shown only by colour (:36)
The amber or green dot has no text and no accessible name, so screen reader users and colour-blind users can't tell "open" from "done". It needs visible text, such as "Öppen" or "Klar".
The amber dot is also hard to see on white (well under the 3:1 contrast needed for non-text elements).

5. The close button has no accessible name (:37-41)
It's an icon-only button with no aria-label (for example "Stäng"). The SVG should also get aria-hidden="true".

6. Focus states aren't clearly visible
Neither element sets a focus-visible style, so they rely on the browser's default outline. The close button would get it. The save "button" can't be focused at all (see 1).

7. frontend/index.html has lang="en" and an English title
AGENTS.md says the page language must be Swedish (<html lang="sv">). The <title> "Customer Service Portal" should be in Swedish too.

Process and tests

8. There are no tests and no spec
The commit adds behaviour (an empty note is rejected, the field clears after saving) but no tests at any level. That goes against AGENTS.md: red first, and every feature gets a happy
path, error paths and boundary cases. The validation should get a Vitest test, and the flow an e2e test once it's wired up. I also found no requirement for customer notes under docs/, so
the spec should be written or updated first.

9. The component isn't used anywhere
Nothing imports CustomerNoteForm, so it can't be tested from start to finish and the merge adds dead code. Either wire it in or explain why it's being added first.

Minor

10. Small behaviour details
- onSave(note) sends the untrimmed text. The check trims it, but what gets saved doesn't.
- The error message stays after the user starts typing and only clears on the next submit.

Two things are also untracked in the working tree: package-lock.json at the repo root and a 2026-11-05-...local-command-caveat...txt file. Neither should go into the merge, so check
before you run git add ..
```

</details>

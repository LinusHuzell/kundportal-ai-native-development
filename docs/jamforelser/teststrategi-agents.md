# Jämförelse: AGENTS.md före och efter avsnittet Testing

Ansvarig: Linus
Datum: 2026-11-12
Förbättringen som prövas: avsnittet Testing i `AGENTS.md` och `docs/teststrategi.md`

## Bakgrund

Testreglerna skrevs för att agenter annars valde snabba men svaga kontroller. Två exempel som ledde till reglerna:

- Tester mot EF InMemory var gröna när migrationerna var borttagna, medan samma tester mot Postgres föll (`42P01`).
- Mockade end-to-end-tester kan vara gröna fast frontend och backend inte stämmer överens.

Reglerna har sedan dess styrt agentuppdragen i projektet. Den här jämförelsen prövar om de fortfarande gör skillnad för en agent som skriver tester.

## Fråga

Skriver en agent bättre tester när `AGENTS.md` har avsnittet Testing?

## Upplägg

- **Uppgift:** tester för AK-15–AK-18 i [visa-ärende-och-ändra-status.md](../specs/visa-ärende-och-ändra-status.md), statusändring via `PUT /api/tickets/{id}/status`. Endpointen är redan implementerad.
- **Utgångsläge:** `main` på `d13c1e2`, med följande borttaget i båda versionerna:
  - de befintliga testerna för statusändringen (`UpdateTicketStatusTests.cs`, `UpdateTicketStatusValidatorTests.cs`)
  - `docs/agentuppdrag/`, som innehåller testreglerna och svaren
  - avsnittet Verifiering i specen, som pekar ut testnivåer och sabotage
- **Före:** `AGENTS.md` utan avsnittet Testing, och utan `docs/teststrategi.md`.
- **Efter:** `AGENTS.md` och `docs/teststrategi.md` som på `main`.
- **Prompt**, samma i alla körningar. Den nämner inte testnivå, databas, körning eller sabotage:
  ```text
  Write automated tests for AK-15, AK-16, AK-17 and AK-18 in docs/specs/visa-ärende-och-ändra-status.md. The endpoint PUT /api/tickets/{id}/status is already implemented. Do not change production code.
  ```
- **Körningar:** två per version, var och en i en ny session (`claude -p`, Claude Opus 5.5) med bara projektets instruktioner (`--setting-sources project,local`). Användarens globala instruktioner laddades inte. Det kontrollerades med en separat körning.
- **Kontroll:** jag körde `dotnet test CustomerService.slnx` själv efter varje körning och kontrollerade att `src/` var oförändrad.

## Resultat

| Mätpunkt (regel i Testing) | Före 1 | Före 2 | Efter 1 | Efter 2 |
|---|---|---|---|---|
| Riktig Postgres via `IntegrationTest` | Ja | Ja | Ja | Ja |
| Kantfallen för AK-18 på unit-nivå | Ja | Ja | Ja | Ja |
| Persistensen läses tillbaka separat | Ja | Ja | Ja | Ja |
| Testdata skapas via API:t | Ja | Ja | Ja | Ja |
| **Testerna ses falla (sabotage)** | **Nej** | **Nej** | **Ja, 4** | **Ja, 4** |
| Körde testerna och rapporterade utskriften | Delvis¹ | Ja | Ja | Ja |
| Ett beteende per test, `[Theory]` bara för samma regel | Ja | Ja | Ja | Ja |
| Produktionskoden oförändrad | Ja | Ja | Ja | Ja |
| Gröna i min körning | Ja² | Ja | Ja | Ja |
| Läste `docs/teststrategi.md` | – | – | Ja | Ja |
| Kostnad | $0.51 | $0.48 | $0.83 | $0.73 |
| Tid | 1,3 min | 1,4 min | 2,9 min | 2,8 min |

¹ Integrationstestprojektet byggde inte på utgångsläget (`CS9035` i `ListTicketsTests.cs`, saknade kundfält). Före 1 fick inte flytta undan filen och frågade i stället. De andra tre körningarna lade till fälten i testdatan.
² Efter att jag lagt till samma kundfält i `ListTicketsTests.cs`.

Agenternas slutrapporter: [Före 1](teststrategi-agents/fore-1.md), [Före 2](teststrategi-agents/fore-2.md), [Efter 1](teststrategi-agents/efter-1.md), [Efter 2](teststrategi-agents/efter-2.md).

**Sabotage i efter-körningarna.** Agenten satte varje fel temporärt, körde testerna och återställde koden. Varje gång föll rätt test:

| Sabotage | Test som föll |
|---|---|
| Sparningen borttagen | Persistenstestet för AK-15 (förväntade ny status, fick `New`) |
| `New` tillåten | AK-17 i unit och integration (200 i stället för 400) |
| Gemener och siffror godtas som status | Kantfallen för AK-18 |
| Ärendet ändras när samma status sparas | AK-16 |

## Slutsats

- **Testnivå, databas och persistens:** ingen skillnad. Agenten valde Postgres, läste tillbaka separat och skapade data via API:t i alla fyra körningarna. Den troliga orsaken är att reglerna redan finns i koden: `IntegrationTest`, `ApiFixture` och de befintliga testerna visar mönstret, och agenten följer det.
- **Att se testerna falla:** skillnad. Bara efter-körningarna kontrollerade att testerna kan falla. De gjorde det med fyra sabotage var, utan att prompten bad om det. Det är den regel som inte syns i koden.
- **Kostnad:** efter-körningarna tog ungefär dubbelt så lång tid och kostade cirka 60 % mer, främst på grund av sabotagen.

## Begränsningar

- Två körningar per version är ett litet urval.
- Jämförelsen gjordes i efterhand. Koden har redan formats av reglerna, så före-versionen får hjälp av mönstret i befintliga tester. Jämförelsen visar inte hur mycket reglerna betydde när mönstret etablerades.
- Mätpunkterna är mina egna. Testernas kvalitet är inte granskad rad för rad.
- Agentens minnesindex (två rader utan koppling till tester) laddades i alla körningar.
- Testerna och sessionsloggarna från körningarna är inte incheckade, bara agenternas slutrapporter.

## När arbetssättet passar

Reglerna gör mest nytta för processkrav som inte syns i koden, som att se testet falla. Mönster som redan finns i kodbasen följer agenten ändå. Regler om sådant är främst ett stöd när mönstret ska etableras eller när koden saknar exempel.

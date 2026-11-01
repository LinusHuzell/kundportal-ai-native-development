# Teststrategi

Så här testas projektet. Regler och kommandon för AI-agenter finns i [AGENTS.md](../AGENTS.md).

## Principer

- Varje test är litet och självförklarande och testar en enda sak.
- Tester utgår från krav och acceptanskriterier i specen. Undantag är tester av intern logik och regressionstester för buggar.
- Varje krav och acceptanskriterium i specen har minst ett test. Undantag är visuella krav som inte går att testa automatiskt, och de kontrolleras manuellt.
- Ett fel testas på den billigaste nivån som kan fånga det.
- Ett nytt test ses falla innan koden skrivs.
- Kritiska tester (persistens, statusändringar, valideringsregler) sabotagekontrolleras: beteendet kopplas tillfälligt bort, och testet ska då falla av rätt anledning.
- Mockar används bara för tillstånd som den riktiga stacken inte kan ge på begäran.

## Testnivåer

| Nivå | Verktyg | Testar | Testar inte |
|---|---|---|---|
| Backend unit | xUnit | Validerings- och affärsregler, inklusive gränsfall | Att API:t anropar reglerna |
| Backend integration | xUnit, `WebApplicationFactory`, Testcontainers (Postgres) | HTTP-kontraktet (statuskoder, problem+json) och att data sparas | Hur frontend tolkar svaren |
| Frontend unit | Vitest | Mappning och logik i klienten | Att backend skickar det klienten förväntar sig |
| End-to-end | Playwright mot hela stacken | Användarflödena i acceptanskriterierna, ett test per flöde | Serverfel och andra tillstånd som inte går att framkalla |
| End-to-end, mockat API | Playwright med `page.route` | Serverfel, nätverksfel, långsamma svar och tom lista | Att frontend och backend fungerar ihop |

## Testmiljöer

- **Backendens unit-tester** körs utan databas och HTTP.
- **Frontendens unit-tester** körs i Vitest och ligger bredvid koden som `*.test.ts(x)`.
- **Integrationstester** kör mot Postgres i Testcontainers. Alla tester delar en container och en app-instans och körs i tur och ordning.
- **End-to-end** kör i en fristående `compose.test.yaml` utan portar mot värddatorn och med Postgres på tmpfs. Sviten kan köras medan utvecklingsstacken är igång, och databasen är ny vid varje start.
- **Mockade end-to-end-tester** typas med klientens typer och följer `docs/api/openapi.json`. Fel mockas som problem+json.

## Testdata

- Integrationstester: databasen töms före varje test.
- End-to-end: varje test skapar sin egen data via API:t med unika värden och kontrollerar bara den. Seeddata används inte.

## CI

| Workflow | Kör |
|---|---|
| Backend CI | Alla backendtester och en kontroll av att `docs/api/openapi.json` är aktuell |
| Frontend CI | Lint, typecheck, Vitest, build och den mockade Playwright-sviten |
| E2E | Hela stacken via `compose.test.yaml` vid ändringar i frontend, backend eller testmiljön |

## Täckning

Täckningsverktyg är inte införda än. När de är det:

- Täckning rapporteras men stoppar aldrig en PR.
- Varje testnivå får en egen rapport.
- Täckning visar vilken kod som kördes, inte att beteendet är rätt.

## Nuläge

- Unit-projektet saknar tester tills det finns valideringsregler.
- Den mockade sviten saknar tester tills frontend har feltillstånd, och körs med `--pass-with-no-tests` fram till dess.
- Endpoints är stubbar, så persistenstestet går mot `DbContext`. Varje feature testar sin egen sparning via API:t.

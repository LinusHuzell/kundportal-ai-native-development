# Kända begränsningar och AI-arbetsflöde

## Kända begränsningar

- Ingen inloggning, radering eller produktionsdrift, se [avgränsningar.md](avgränsningar.md).
- `GET /api/tickets` returnerar tomma `customerName` och `customerEmail`. Listan visar inte fälten och detaljpanelen hämtar ärendet via `GET /api/tickets/{id}`, så det syns inte i gränssnittet. Svaret avviker ändå från [kontraktet](api/kontrakt.md).
- Raderna i ärendelistan har ett `aria-label` med bara ärendenummer och rubrik. En skärmläsare hör därför inte status och prioritet i listan, bara i detaljpanelen.
- Redigering skapar ingen händelse i ärendehistoriken, se [redigera-ärende.md](specs/redigera-ärende.md).
- Täckning mäts bara för frontendens enhetstester. Backend och Playwright saknar täckningsrapport.
- Att en skärmläsare faktiskt läser upp meddelanden kontrolleras manuellt, se [teststrategi.md](teststrategi.md).

## Risker

- API:t saknar åtkomstkontroll. Det fungerar lokalt med påhittad data, men inte i produktion.
- Agentskrivna tester kan vara gröna av fel anledning. Därför kräver [AGENTS.md](../AGENTS.md) rött först och sabotagekontroller.

## Förslag på fortsatt utveckling

- Fyll i kundfälten i svaret från `GET /api/tickets`.
- Gör status och prioritet i listan tillgängliga för skärmläsare.
- Mät täckning för backend och Playwright.
- Inloggning och roller före en eventuell produktionsdrift.
- Historik även för redigeringar.

## Teamets AI-arbetsflöde

1. **Spec först.** Varje feature börjar med en spec från [mallen](specs/_mall.md) enligt [arbetssätt.md](arbetssätt.md). Beslut förs in i specens ändringshistorik.
2. **Agenter implementerar inom specen.** Var och en styr sina agenter på sitt sätt. Flera har loggat sina uppdrag i [agentuppdrag/](agentuppdrag/).
3. **Tester från acceptanskriterierna.** Testerna ses falla innan koden skrivs, och kritiska tester sabotagekontrolleras.
4. **Granskning och CI.** Varje PR granskas av en klasskamrat. CI kör backend, frontend, end-to-end och kontrollerar att `openapi.json` är aktuell.

## Det återanvändbara arbetsmomentet: AGENTS.md

[AGENTS.md](../AGENTS.md) är teamets gemensamma instruktion till alla AI-agenter. [CLAUDE.md](../CLAUDE.md) importerar den, så den laddas automatiskt i varje session utan att någon behöver nämna den i prompten.

- **Testing:** testnivåer, vad som ska testas, rött först, sabotagekontroller och att aldrig mocka det den riktiga stacken kan ge. Bakgrunden står i [teststrategi.md](teststrategi.md).
- **Accessibility:** WCAG 2.2 AA och vad agenter brukar missa (ARIA, tangentbord).

Båda avsnitten har prövats genom att jämföra agenter med och utan reglerna, se [teststrategi-agents.md](jamforelser/teststrategi-agents.md) och [agents-accessibility.md](jamforelser/agents-accessibility.md). Där står också jämförelsernas begränsningar.

Begränsningar: en instruktion garanterar inte att agenten följer den, så resultatet måste fortfarande granskas och köras.

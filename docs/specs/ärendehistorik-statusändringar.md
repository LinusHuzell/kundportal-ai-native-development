# Spec: Ärendehistorik för statusändringar

**Status:** Utkast för granskning
**Ägare:** Sebastian  
**Senast uppdaterad:** 2026-11-12

## Sammanfattning

En handläggare ska kunna se i ett ärendes historik när dess status ändrades och vilken status den ändrades från och till. I dag loggas bara att ärendet registrerades. Den här specen beskriver utökningen av historiken till att även omfatta statusändringar.

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- En lyckad statusändring går att följa i ärendets historik.
- Handläggaren kan förstå statusförändringen och när den inträffade.
- Ärendets sparade status och motsvarande historikhändelse kan inte hamna ur synk.

## Ingår

- En ny händelsetyp för statusändring.
- Registrering av statusändringar genom det befintliga statusflödet.
- Historikens API-svar utökas så att en statusändring kan visa tidigare och ny status.
- Presentation av statusändringar i den befintliga historiksektionen för valt ärende.
- Automatiserad verifiering av att händelsen skapas, sparas och visas.

## Ingår inte

- Händelser för redigering av ärendets övriga fält.
- Aktör eller användaridentitet; inloggning ingår inte.
- Kommentarer, manuella händelser eller versionshistorik för alla fält.
- Ändringar av vilka statusvärden som är tillåtna eller av befintliga statusvalideringsregler.
- Rekonstruktion av statusändringar som skedde innan funktionen infördes; historiken fångar ändringar när de inträffar.
- Sökning, filtrering eller paginering av historiken.

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Ärendet finns och handläggaren kan ändra dess status enligt befintliga regler.
- **Beroenden:** [Ärendehistorik, grund](ärendehistorik-grund.md), [Visa ärende och ändra status](visa-ärende-och-ändra-status.md) och `PUT /api/tickets/{id}/status`.

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| Statusändringshändelse | En historikpost som beskriver att ärendets status ändrades | Föreslagen typ: `StatusChanged` |
| Tidigare status | Statusen före ändringen | Svensk etikett för ett befintligt statusvärde enligt [statusändringsspecen](visa-ärende-och-ändra-status.md) |
| Ny status | Statusen efter ändringen | Svensk etikett för ett befintligt statusvärde enligt [statusändringsspecen](visa-ärende-och-ändra-status.md) |
| `occurredAt` | När statusändringen genomfördes | Samma UTC-tidpunkt som används för statusändringen; ISO 8601 |

## Regler och fel

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| Giltig ändring till en annan status | En statusändring som sparas ska skapa en `StatusChanged`-händelse med tidigare status, ny status och tidpunkt | Ärendets status och historikhändelsen sparas tillsammans | Förslag, D-1 |
| Ogiltig status eller okänt ärende | Befintlig statusendpoint avvisar anropet | Ingen statusändringshändelse sparas; befintlig status och felbeteende bevaras | [Statusändringsspecen](visa-ärende-och-ändra-status.md), D-1 |
| Samma status skickas igen | Det befintliga API:t svarar `200` utan att ändra ärendet | Ingen ny händelse skapas | D-2 |
| Historikordning | Statusändringar visas enligt historikendpointens befintliga ordning | Nyaste händelsen först; sekundär sortering enligt grundspecen | [Ärendehistorik, grund](ärendehistorik-grund.md) |
| Statusetikett | Statushändelsens `fromStatus` och `toStatus` innehåller svenska statusetiketter | Händelsetexten visar de svenska etiketterna | D-8 |
| Efter lyckad statussparning | Historikpanelen uppdateras efter en faktisk statusändring | Den nya händelsen visas utan sidomladdning eller navigering | D-10 |

## Acceptanskriterier

Följande kriterier är förslag och behöver bekräftas tillsammans med de öppna besluten.

### Händelser skapas och sparas

**AK-1: En ändrad status loggas**
- Given: Ett befintligt ärende har en status som får ändras enligt befintliga regler
- When: En giltig ändring till en annan status sparas
- Then: Ärendets historik innehåller en `StatusChanged`-händelse med den tidigare statusen, den nya statusen och en UTC-tidpunkt

**AK-2: Status och historik sparas tillsammans**
- Given: En giltig statusändring genomförs
- When: Ändringen sparas
- Then: Både den nya statusen och historikhändelsen finns beständigt sparade, eller så sparas ingen av dem

**AK-3: Avvisad ändring skapar ingen händelse**
- Given: En statusändring avvisas av en befintlig valideringsregel eller för att ärendet saknas
- When: Statusendpointen svarar med fel
- Then: Ingen statusändringshändelse har skapats och befintligt felbeteende är oförändrat

### Historikens API och presentation

**AK-4: Statusändring kan hämtas via historikendpointen**
- Given: Ett ärende har en sparad statusändringshändelse
- When: `GET /api/tickets/{id}/history` anropas
- Then: Svaret innehåller händelsetyp, tidpunkt, tidigare status och ny status som svenska etiketter

**AK-5: Statusändring visas begripligt**
- Given: Historiken innehåller en statusändringshändelse
- When: Handläggaren visar ärendets historik
- Then: Händelsen visas som `Förändrad status: {gammalt statusvärde} -> {nytt statusvärde}` samt tidpunkten; platshållarna ersätts med händelsens faktiska statusvärden och visas inte bokstavligen

**AK-6: Händelsetyperna visas i gemensam ordning**
- Given: Ett ärende har både registrerings- och statusändringshändelser
- When: Historiken hämtas och visas
- Then: Händelserna visas i API:ts ordning enligt befintliga sorteringsregler

**AK-7: Historiken uppdateras efter statussparning**
- Given: Ett ärende visas med en vald status och historikpanelen är laddad
- When: Handläggaren sparar en annan giltig status och servern bekräftar ändringen
- Then: Historiken hämtas om och den nya statusändringshändelsen visas i panelen utan sidomladdning eller navigering

## API- och datakontrakt

Det befintliga `GET /api/tickets/{id}/history`-svaret innehåller `type` och `occurredAt`. Föreslagen utökning för statusändringar:

```json
{
  "type": "StatusChanged",
  "occurredAt": "2026-11-11T09:30:00Z",
  "fromStatus": "Pågående",
  "toStatus": "Väntar på kund"
}
```

Fältnamnen `fromStatus` och `toStatus` är beslutade. Båda fälten innehåller svenska statusetiketter, inte API:ts enum-värden.

- **Endpoint/händelse:** Befintlig `PUT /api/tickets/{id}/status` skapar händelsen; befintlig `GET /api/tickets/{id}/history` returnerar den.
- **Inkommande data:** Oförändrat statusanrop enligt [API-kontraktet](../api/kontrakt.md).
- **Lyckat svar:** Befintliga status- och historiksvar, med föreslagna statusfält på statusändringshändelsen.
- **Fel:** Befintliga statusfel och `404` för okänt ärende ska behållas.
- **Beständighet:** Statusändring och historikhändelse sparas atomärt. Händelsen ska finnas kvar efter omstart och följa ärendets livscykel enligt grundspecen.
- **Källor:** [API-kontrakt](../api/kontrakt.md), [Ärendehistorik, grund](ärendehistorik-grund.md) och [Visa ärende och ändra status](visa-ärende-och-ändra-status.md).

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Statusändring visas som begriplig text i befintlig historiklista. Tidpunkten och live-regionernas befintliga beteende ska bevaras.
- **Integritet/säkerhet:** Ingen aktör eller ny personuppgift registreras.
- **Övrigt:** Historikfel ska även fortsättningsvis inte blockera statusformuläret eller ärendeuppgifterna.

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | En händelse skapas endast när en annan status faktiskt sparas; avvisade ändringar ger ingen händelse | Historiken ska beskriva genomförda förändringar | Sebastian | Beslutat |
| D-2 | Ett anrop som sparar samma status igen skapar ingen händelse | Samma status innebär ingen faktisk statusförändring | Sebastian | Beslutat |
| D-3 | Statushändelsen innehåller både tidigare och ny status med API-fälten `fromStatus` och `toStatus` | Gör det möjligt att förstå vad som ändrades | Sebastian | Beslutat |
| D-4 | Status och händelse sparas atomärt och delar en tidpunkt för ändringen | Undviker att ärendets tillstånd och historik hamnar ur synk | Sebastian | Beslutat |
| D-5 | Förslaget om ett separat beslut att bakfylla statusändringar före driftsättning avvisas; funktionen fångar ändringar när de inträffar och rekonstruerar inte äldre data | Vi är intresserade av att fånga förändringar, inte historisk data | Sebastian | Avvisat |
| D-6 | Historiken visas i befintlig ärendepanel och använder API:ts ordning | Följer nuvarande historikfunktion | Sebastian | Beslutat |
| D-7 | Statusändringar visas som `Förändrad status: {gammalt statusvärde} -> {nytt statusvärde}`; platshållarna ersätts med händelsens faktiska statusvärden och visas inte bokstavligen | Visar både tidigare och ny status i ett fast, svenskt format | Sebastian | Beslutat |
| D-8 | `fromStatus` och `toStatus` innehåller svenska statusetiketter, inte API:ts enum-värden | API:ts historikhändelse ska kunna visas med svenska värden i den beslutade händelsetexten | Sebastian | Beslutat |
| D-9 | Grund-, presentations- och statusändringsspecifikationerna samordnas genom hänvisningar; denna spec äger de nya kraven för `StatusChanged` | Bevarar befintliga acceptanskriterier och ger den nya händelsen en tydlig normerande källa | Sebastian | Beslutat |
| D-10 | Efter en lyckad faktisk statusändring hämtas historiken om och panelen visar den nya händelsen utan sidomladdning eller navigering | Handläggaren ska direkt kunna se den registrerade statusändringen | Sebastian | Beslutat |

## Öppna frågor

Inga.

## Verifiering

Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-1 | Ändra status via API och hämta historiken; kontrollera typ, tidigare status, ny status och tidpunkt | Backend integration | Automatisk |
| AK-2 | Läs tillbaka status och händelse separat efter sparning; verifiera även atomiskhet enligt projektets teststrategi | Backend integration | Automatisk |
| AK-3 | Prova ogiltig status och okänt ärende; kontrollera svar och frånvaro av ny historikhändelse | Backend integration | Automatisk |
| AK-4 | Kontrollera historiksvar för ärende med statusändring och bevarat `Created`-svar | Backend integration | Automatisk |
| AK-5 | Visa en statusändringshändelse i ärendepanelen och kontrollera text och tidpunkt | E2E, full stack | Automatisk |
| AK-6 | Skapa flera händelser med olika tidpunkter och kontrollera den gemensamma ordningen | Backend integration och E2E | Automatisk |
| AK-7 | Spara en ny status och kontrollera att den nya händelsen visas utan sidomladdning eller navigering | E2E, full stack | Automatisk |
| Tillgänglighet | Kontrollera historiklistan och att befintliga status- och historikmeddelanden fungerar med tangentbord och skärmläsare | Manuell | Manuell |

## Referenser

- [Ärendehistorik, grund](ärendehistorik-grund.md)
- [Ärendehistorik i detaljvyn](ärendehistorik-presentation-detaljvy.md)
- [Visa ärende och ändra status](visa-ärende-och-ändra-status.md)
- [API-kontrakt](../api/kontrakt.md)
- [Teststrategi](../teststrategi.md)

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-11 | Första utkast för att spåra statusändringar i ärendehistoriken | Sebastian |
| 2026-11-11 | Beslutade D-1–D-4 och D-6; avvisade D-5 som separat bakfyllningsbeslut eftersom funktionen ska fånga ändringar när de inträffar, inte rekonstruera äldre data | Sebastian |
| 2026-11-12 | D-7: Beslutade formatet för statusändringstexten och att platshållarna ersätts med faktiska statusvärden | Sebastian |
| 2026-11-12 | D-8: Beslutade att `fromStatus` och `toStatus` innehåller svenska statusetiketter | Sebastian |
| 2026-11-12 | D-9: Samordnade de relaterade specifikationerna; flyttade frågan om när panelen visar den nya händelsen till öppna frågor | Sebastian |
| 2026-11-12 | D-10: Beslutade att panelen hämtar om historiken och visar den nya händelsen direkt efter lyckad statussparning; lade till AK-7 | Sebastian |
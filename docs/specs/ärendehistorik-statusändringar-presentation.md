# Spec: Presentation av statusändringar i ärendehistoriken

**Status:** Godkänd
Ägare: Sebastian
Senast uppdaterad: 2026-11-12

## Sammanfattning

En handläggare ska i den valda ärendepanelens historik kunna se vilken status ett ärende ändrades från och till samt när ändringen inträffade. Den här specifikationen omfattar presentationen av statusändringar. Skapande och hämtning av statusändringshändelser ägs av [specifikationen för ärendehistorikens statusändringar](ärendehistorik-statusändringar.md).

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- Handläggaren kan förstå en statusändring utifrån dess tidigare status, nya status och tidpunkt.
- Statusändringar och registreringshändelser visas i historikens befintliga ordning.
- En statusändring visas i historiken direkt efter att den har sparats, utan sidomladdning eller navigering.

## Ingår

- Presentation av `StatusChanged` i den valda ärendepanelens befintliga historiklista.
- Visning av tidigare och ny svensk statusetikett samt händelsens tidpunkt.
- Samordning av statusändringar med övriga händelsetyper i API:ts ordning.
- Uppdatering av historiken efter en lyckad faktisk statusändring.

## Ingår inte

- Skapande, lagring eller API-serialisering av statusändringshändelser.
- Ändringar av regler för vilka statusar som får väljas eller sparas.
- Presentation av historik på andra sidor eller i andra vyer.
- Händelser för redigering, aktörsidentitet, kommentarer eller äldre statusändringar som inte har registrerats.
- Historikens laddnings-, tom- och feltillstånd, som beskrivs i [specifikationen för historikpresentationen](ärendehistorik-presentation-detaljvy.md).

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Ett ärende är valt och dess historik kan hämtas. För uppdateringsflödet visas ärendet och handläggaren kan ändra status enligt befintliga regler.
- **Beroenden:** [Ärendehistorik, grund](ärendehistorik-grund.md), [historikpresentation i detaljvyn](ärendehistorik-presentation-detaljvy.md), [specifikationen för ärendehistorikens statusändringar](ärendehistorik-statusändringar.md) och [Visa ärende och ändra status](visa-ärende-och-ändra-status.md).

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| `StatusChanged` | Händelse som visar att ärendets status har ändrats | Historikens API-svar |
| `fromStatus` | Status före ändringen | Svensk statusetikett enligt [statusändringsspecifikationen](ärendehistorik-statusändringar.md) |
| `toStatus` | Status efter ändringen | Svensk statusetikett enligt [statusändringsspecifikationen](ärendehistorik-statusändringar.md) |
| `occurredAt` | När statusändringen inträffade | ISO 8601 i UTC, enligt API-kontraktet |

## Regler och fel

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| Statusändring | Visa tidigare och ny status i texten `Förändrad status: {gammalt statusvärde} -> {nytt statusvärde}` | Platshållarna ersätts med `fromStatus` respektive `toStatus` | Statusändringsspecifikationen, D-7 |
| Statusetiketter | Visa de svenska etiketter som API:t returnerar | Enum-värden eller platshållare visas inte i stället för etiketterna | Statusändringsspecifikationen, D-8 |
| Tidpunkt | Visa händelsens `occurredAt` med befintligt datum- och tidsformat | Ett `time`-element har `datetime` som motsvarar `occurredAt` | Historikpresentationen |
| Blandade händelsetyper | Behåll händelsernas ordning från API:t | Statusändringar och registreringshändelser visas i samma lista och ordning | Statusändringsspecifikationen, D-6 |
| Status sparas | Hämta historiken igen efter en lyckad faktisk statusändring | Den nya händelsen visas utan sidomladdning eller navigering | Statusändringsspecifikationen, D-10 |
| Historikfel | Statusformuläret och ärendeuppgifterna förblir tillgängliga | Befintligt felbeteende för historiken behålls | Historikpresentationen |

## Acceptanskriterier

### Statusändring i historiken

**AK-1: Statusändring visas med båda statusetiketterna**
- Given: Historiken innehåller en `StatusChanged`-händelse med `fromStatus`, `toStatus` och `occurredAt`
- When: Handläggaren visar historiken för det valda ärendet
- Then: Händelsen visas som `Förändrad status: {fromStatus} -> {toStatus}` med de faktiska svenska statusetiketterna och en tidpunkt vars `datetime` motsvarar `occurredAt`

**AK-2: Statusändringar följer den gemensamma historikordningen**
- Given: Ärendets historik innehåller både `Created`- och `StatusChanged`-händelser
- When: Handläggaren visar historiken
- Then: Händelserna visas i samma ordning som API-svaret och befintliga händelser behåller sina beskrivningar

**AK-3: Historiken uppdateras efter statussparning**
- Given: Ett ärende visas och dess historik är laddad
- When: Handläggaren sparar en annan giltig status och servern bekräftar ändringen
- Then: Historiken hämtas om och den nya statusändringen visas utan sidomladdning eller navigering

## API- och datakontrakt

- **Endpoint/händelse:** Befintliga `GET /api/tickets/{id}/history` och `PUT /api/tickets/{id}/status`.
- **Inkommande data:** Oförändrat enligt [API-kontraktet](../api/kontrakt.md) och [statusändringsspecifikationen](ärendehistorik-statusändringar.md).
- **Lyckat svar:** Historiksvaret kan innehålla `StatusChanged` med `occurredAt`, `fromStatus` och `toStatus`; statusändringsspecifikationen äger kontraktet.
- **Fel:** Befintliga status- och historikfel behålls.
- **Beständighet:** Frontend sparar inte historikhändelser. Status och historikens beständighet ägs av backend och statusändringsspecifikationen.
- **Källor:** [API-kontrakt](../api/kontrakt.md), [ärendehistorikens statusändringar](ärendehistorik-statusändringar.md) och [historikpresentationen](ärendehistorik-presentation-detaljvy.md).

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Statusändringar visas som text i historikens befintliga lista. Händelsen använder ett `time`-element för tidpunkten. Historikens rubrik, lista och befintliga live-regioner behålls.
- **Integritet/säkerhet:** Inga nya personuppgifter visas.
- **Övrigt:** Historikens befintliga fel- och laddningsbeteende får inte blockera ärendets övriga uppgifter eller statusformulär.

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | Statusändringar visas i den valda ärendepanelens befintliga historiklista och följer API:ts ordning | Följer grundspecifikationens befintliga historikbeteende och statusändringsspecifikationen, D-6 | Sebastian | Beslutat |
| D-2 | Statusändringstexten använder formatet `Förändrad status: {gammalt statusvärde} -> {nytt statusvärde}` | Statusändringsspecifikationen, D-7 | Sebastian | Beslutat |
| D-3 | `fromStatus` och `toStatus` visas som svenska statusetiketter från API:t | Statusändringsspecifikationen, D-8 | Sebastian | Beslutat |
| D-4 | Efter en lyckad faktisk statusändring hämtas historiken om och uppdateras utan navigering | Statusändringsspecifikationen, D-10 | Sebastian | Beslutat |

## Öppna frågor

Inga.

## Verifiering

Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-1 | Visa en sparad statusändringshändelse och kontrollera text, faktiska etiketter och `time`-värde | E2E, full stack | Automatisk |
| AK-2 | Skapa ett ärende med registrerings- och statusändringshändelser och kontrollera ordning och text | E2E, full stack | Automatisk |
| AK-3 | Ändra status från ärendepanelen och kontrollera att den nya händelsen visas utan omladdning eller navigering | E2E, full stack | Automatisk |
| Tillgänglighet | Kontrollera rubrik, lista, tidpunkt och befintliga live-regioner med tangentbord och skärmläsare | Manuell kontroll | Manuell |

## Referenser

- [Ärendehistorik, grund](ärendehistorik-grund.md)
- [Historikpresentation i detaljvyn](ärendehistorik-presentation-detaljvy.md)
- [Ärendehistorikens statusändringar](ärendehistorik-statusändringar.md)
- [Visa ärende och ändra status](visa-ärende-och-ändra-status.md)
- [API-kontrakt](../api/kontrakt.md)
- [Teststrategi](../teststrategi.md)

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-12 | Skapade presentationsspecifikationen utifrån besluten om statusetiketter, händelsetext, ordning och uppdatering efter sparning | Sebastian |
| 2026-11-12 | Specifikationen godkändes som underlag för frontenduppdraget | Sebastian |
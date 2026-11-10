# Spec: [funktion eller ändring]

Ägare: [namn]
Senast uppdaterad: [ÅÅÅÅ-MM-DD]

## Sammanfattning

[Beskriv kort vilket användarbehov eller problem som ska lösas och det önskade resultatet. Skriv vad användaren ska kunna göra, inte hur koden ska byggas.]

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

## Mål

- [Mätbart eller observerbart resultat]

## Ingår

- [Beteenden, användarflöden och data som ingår]

## Ingår inte

- [Närliggande beteenden som uttryckligen inte ingår]

## Användare och förutsättningar

- **Användare/roll:** [Vem använder funktionen?]
- **Förutsättningar:** [Vad måste vara sant innan flödet börjar?]
- **Beroenden:** [Andra funktioner, API:er eller beslut. Skriv "Inga" om inga finns.]

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| [Namn] | [Vad det betyder] | [Värden eller auktoritativ källa] |

## Regler och fel

Beskriv reglerna en gång här. Ange vilken källa som är auktoritativ om informationen finns på flera ställen.

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| [Fält] | [Villkor, inklusive gränsfall] | [Resultat eller exakt meddelande] | [Spec, kontrakt eller beslut] |

## Acceptanskriterier

Skriv ett självständigt, observerbart beteende per kriterium. Använd stabila AK-ID:n och lägg till nya ID:n i slutet i stället för att återanvända borttagna ID:n.

### [Flöde eller delområde]

**AK-1: [Kort beteendenamn]**
- Given: [Allmänna förutsättningar]
- When: [Användarens handling eller händelse]
- Then: [Observerbart resultat]

**AK-2: [Kort beteendenamn]**
- Given: [Förutsättningar]
- When: [Handling eller händelse]
- Then: [Observerbart resultat, inklusive felutfall om relevant]

## API- och datakontrakt

Fyll i när funktionen påverkar API eller beständig data. Håll detaljerna samordnade med den auktoritativa API-dokumentationen; duplicera inte hela kontraktet här.

- **Endpoint/händelse:** [Metod och sökväg, eller ej tillämpligt]
- **Inkommande data:** [Fält och betydelse, eller länk till kontrakt]
- **Lyckat svar:** [Statuskod, viktiga fält och headers]
- **Fel:** [Statuskod och felstruktur]
- **Beständighet:** [Vad sparas och vilket beteende krävs efter omstart?]
- **Källor:** [Länkar till API-kontrakt, datamodell eller annan normerande dokumentation]

## Tillgänglighet och andra kvalitetskrav

Skriv bara krav som påverkar beteendet eller kan verifieras. Lägg dem i acceptanskriterier när möjligt.

- **Tillgänglighet:** [Tangentbord, fokus, namn/etiketter, felkoppling, uppläsning, språk]
- **Integritet/säkerhet:** [Relevant hantering av personuppgifter eller behörighet]
- **Övrigt:** [Prestanda, kompatibilitet eller andra krav, alternativt "Inga särskilda krav"]

## Beslut och antaganden

Registrera beslut som påverkar beteende eller tolkning av kraven. Bekräfta antaganden innan de blir implementeringskrav.

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | [Beslut eller antagande] | [Varför eller länk] | [Namn] | Öppet | 

## Öppna frågor

| Fråga | Påverkan om obesvarad | Ansvarig | Status |
|---|---|---|---|
| [Fråga] | [Vad som blockeras eller riskeras] | [Namn] | Öppen |

## Verifiering

Varje krav och acceptanskriterium ska ha en verifiering. Använd billigaste testnivån som kan fånga felet. Visuella eller skärmläsarrelaterade krav som inte kan verifieras automatiskt kontrolleras manuellt. Följ projektets [teststrategi](../teststrategi.md).

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-1 | [Test eller kontrollens namn] | [Unit / integration / E2E / manuell] | [Automatisk / manuell] |

## Referenser

- [Länk till design, API-kontrakt, avgränsningar eller relaterad spec]

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| [ÅÅÅÅ-MM-DD] | [Kort sammanfattning] | [Namn] |
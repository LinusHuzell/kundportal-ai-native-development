# Spec: Visa ärende och ändra status

Ägare: Linus
Senast uppdaterad: 2026-11-10

Se [avgränsningar](../avgränsningar.md) och [arbetssätt](../arbetssätt.md).

## Sammanfattning

Handläggaren väljer ett ärende på startsidan och ser dess uppgifter i panelen "VALT ÄRENDE / Ärendedetaljer". Samma panel innehåller statusändring och historik. Äldre länkar till `/tickets/{id}` leder till startsidan och markerar ärendet.

## Mål

- Ärendets uppgifter och åtgärder finns tillgängliga från startsidan.
- En statusändring sparas och visas i både listan och den valda ärendepanelen.
- Ärendehistoriken visas utan att blockera övriga ärendefunktioner.

## Ingår

- Val av ärende och presentation på `/tickets`.
- Ändra ärendets status från den valda ärendepanelen.
- Visa historik i den valda ärendepanelen.
- Omdirigera äldre länkar till `/tickets/{id}` till listan och välja ärendet om det finns.
- Befintliga backend-endpoints och statusregler.
- Full skapandetid på ärenderadens datum vid hover och tangentbordsfokus.

## Ingår inte

- En separat detaljsida för `/tickets/{id}`.
- Redigera ärendets övriga fält eller radera ärenden.
- Händelser för statusändringar eller redigering.

## Användare och förutsättningar

- **Användare/roll:** Handläggare.
- **Förutsättningar:** Startsidan kan hämta ärendelistan.
- **Beroenden:** [Ärendehistorik](ärendehistorik-presentation-detaljvy.md), [API-kontrakt](../api/kontrakt.md).

## Beslut

- Ett ärende kan byta mellan alla statusar, men aldrig tillbaka till "Nytt". "Nytt" sätts bara när ärendet registreras.
- Att spara samma status är inget fel. Svaret är `200` och ärendet är oförändrat.
- Status sparas med knappen "Spara status", inte när ett värde väljs.
- Knappen "Spara status" har en dekorativ diskettikon före texten.
- "Nytt" visas i statuslistan men går inte att välja.
- Äldre `/tickets/{id}`-länkar väljer ärendet om det finns i listan. Om det saknas används listans normala val.

## Visning

Panelen visar alla etiketter och värden. Ärendets titel är en rubrik i panelen, inte sidans huvudrubrik.

| Etikett | Värde |
|---|---|
| Rubrik | Ärendets titel |
| Ärendenummer | `ticketNumber`, t.ex. "SR-2026-1004" |
| Status | Nytt, Pågående, Väntar på kund, Avslutat |
| Prioritet | Låg, Medel, Hög |
| Kategori | Beställningar/leveranser, Fakturor, Returer/reklamation, Övrigt |
| Skapad | Svenskt datum och klockslag i webbläsarens tidszon |
| Namn | Kundens namn |
| E-post | Kundens e-postadress |
| Beskrivning | Ärendets beskrivning |

## Regler och fel

| Situation | Resultat eller meddelande |
|---|---|
| Listan laddas | "Laddar ärenden…" |
| Listan kan inte hämtas | "Kunde inte hämta ärenden. Försök igen." |
| Listan är tom | "Inga ärenden hittades." och panelen visar "Inget ärende valt." |
| Kompletta uppgifter för valt ärende kan inte hämtas | "Ärendedetaljerna är inte tillgängliga." visas som alert; listan finns kvar |
| Giltig äldre detaljlänk | Startsidan öppnas och väljer ärendet om det finns |
| Ogiltig eller okänd äldre detaljlänk | Startsidan öppnas; listans normala val används |
| "Nytt" sparas som status | "Välj en ny status"; inget API-anrop skickas |
| Statussparning misslyckas | "Statusen kunde inte sparas. Försök igen." |
| API-status är `New` | `400`, "Status kan inte ändras till Nytt" i `errors.status` |
| Status saknas eller är ogiltig | `400`, "Välj en giltig status" i `errors.status` |

## Acceptanskriterier

### Startsida

**AK-1: Visa valt ärende**
- Given: Ett ärende finns i listan
- When: Handläggaren väljer ärendet
- Then: Panelen "VALT ÄRENDE / Ärendedetaljer" visar titel och samtliga uppgifter enligt Visning

**AK-2: Visa skapandetid**
- Given: Ett ärende skapades 2026-11-10 kl. 14:30 i webbläsarens tidszon
- When: Handläggaren väljer ärendet
- Then: Skapad visas som "10 nov. 2026 14:30"

**AK-3: Äldre detaljlänk**
- Given: Handläggaren öppnar `/tickets/{id}`
- When: Ärendet finns i listan
- Then: `/tickets` visas med ärendet valt

**AK-6: Byt valt ärende**
- Given: Ett ärende visas i panelen
- When: Handläggaren väljer ett annat ärende i listan
- Then: Panelen visar det nya ärendet och adressen är fortsatt `/tickets`

**AK-4: Listan laddas**
- Given: Handläggaren öppnar startsidan
- When: Listsvaret inte har kommit än
- Then: "Laddar ärenden…" visas och läses upp av skärmläsare

**AK-5: Listan kunde inte hämtas**
- Given: Handläggaren öppnar startsidan
- When: Listan svarar med ett fel eller inte går att nå
- Then: "Kunde inte hämta ärenden. Försök igen." visas och läses upp av skärmläsare

### Ändra status

**AK-7**
- Given: Ett ärende är valt
- When: Handläggaren öppnar listan "Status"
- Then: Aktuell status är förvald, alla fyra statusar finns och "Nytt" går inte att välja

**AK-8**
- Given: Ett ärende är valt
- When: Handläggaren väljer en annan status än "Nytt" och väljer "Spara status"
- Then: Statusen uppdateras i panelen och listan, "Status ändrad till <status>" visas och läses upp, och fokus stannar på knappen

**AK-9**
- Given: Handläggaren har ändrat status
- When: Startsidan laddas om
- Then: Den sparade statusen visas i panelen och listan

**AK-10**
- Given: "Nytt" är valt
- When: Handläggaren väljer "Spara status"
- Then: "Välj en ny status" kopplas till listan med `aria-describedby`, fokus flyttas till listan och inget API-anrop skickas

**AK-11**
- Given: En statussparning pågår
- When: Handläggaren försöker spara igen
- Then: Knappen visar "Sparar…" och inget nytt anrop skickas

**AK-12**
- Given: Handläggaren sparar en ny status
- When: Servern svarar med fel eller inte går att nå
- Then: Felmeddelandet visas, det valda värdet ligger kvar och den sparade statusen är oförändrad

**AK-20: Status och historik i panelen**
- Given: Ett ärende är valt
- When: Ärendet visas på startsidan
- Then: Panelen innehåller statusformulär och historik

**AK-21: Detaljerna kunde inte hämtas**
- Given: Ärendelistan har laddats och ett ärende är valt
- When: Hämtningen av det valda ärendets fullständiga uppgifter misslyckas
- Then: "Ärendedetaljerna är inte tillgängliga." visas som alert och listan finns kvar

**AK-22: Visa totalt antal ärenden**
- Given: Ärendelistan har laddats, även om den är tom
- When: Handläggaren visar startsidan
- Then: Rubriken visar totalt antal ärenden inom parentes, till exempel "Alla ärenden (3)" eller "Alla ärenden (0)"

### Skapandetid i listan

**AK-23: Full tidsstämpel vid hover**
- Given: Ett ärende finns i listan med ett kort svenskt skapandedatum
- When: Handläggaren håller pekaren över datumet
- Then: En tooltip visar svenskt långt datum, timmar, minuter, sekunder och tidszon i webbläsarens lokala tidszon; det korta datumet är kvar
- And: Tooltipen förblir synlig när pekaren flyttas över den och stängs när pekaren lämnar datumet och tooltipen, om raden inte har tangentbordsfokus

**AK-24: Full tidsstämpel med tangentbord**
- Given: Ett ärende finns i listan
- When: Ärenderaden får tangentbordsfokus
- Then: Samma tooltip visas och tidsstämpeln är radens tillgängliga beskrivning, utan ett extra tabbstopp
- And: Tooltipen stängs när fokus lämnar raden, om pekaren inte är över datumet eller tooltipen

**AK-25: Stäng tooltip med Escape**
- Given: Tooltipen visas vid hover eller tangentbordsfokus
- When: Handläggaren trycker Escape
- Then: Tooltipen stängs utan att fokus eller valt ärende ändras; den öppnas igen vid ny hover eller nytt fokus

### API (backend)

**AK-13** `GET /api/tickets/{id}` returnerar `200` och ärendets alla fält när ärendet finns.

**AK-14** `GET /api/tickets/{id}` returnerar `404` som problem+json när ärendet saknas.

**AK-15** En giltig `PUT /api/tickets/{id}/status` sparar statusen och returnerar `200` med ärendet.

**AK-16** Att spara den redan aktuella statusen returnerar `200` och lämnar ärendet oförändrat.

**AK-17** `New` avvisas med `400` och "Status kan inte ändras till Nytt" i `errors.status`.

**AK-18** Saknad eller ogiltig status avvisas med `400` och "Välj en giltig status" i `errors.status`.

**AK-19** Statusuppdatering av ett okänt ärende returnerar `404` som problem+json.

## Verifiering

Följ projektets [teststrategi](../teststrategi.md). Varje AK verifieras på billigaste lämpliga nivå.

| Krav/AK | Verifiering | Nivå |
|---|---|---|
| AK-1–3, AK-6–10, AK-20 | Skapa egna ärenden via API och välj dem på startsidan; verifiera även äldre länk | E2E, full stack |
| AK-4, AK-5, AK-11, AK-12, AK-21 | Fördröjt svar, serverfel och nätverksfel | E2E, mockat API |
| AK-22 | Rubriken visar totalen för både fylld och tom lista | E2E, mockat API |
| AK-23–25 | Eget ärende via API; hover, fokus, Escape och oförändrat kort datum | E2E, full stack |
| AK-13–AK-19 | HTTP-kontrakt och beständighet | Backend integration |
| AK-17, AK-18 | Statusregelns gränsfall | Backend unit |

Manuell kontroll: tangentbord och skärmläsare för fokus och live-meddelanden.

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-10 | AK-23–25: lång lokal tidsstämpel som tillgänglig tooltip i listan, enligt användarens godkännande | GitHub Copilot |
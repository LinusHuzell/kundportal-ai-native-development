# Spec: Visa ärende och ändra status

Ägare: Linus
Se [docs/avgränsningar.md](../avgränsningar.md) för teknikval och avgränsning.

## Vad momentet gör
En handläggare öppnar ett ärende och ser alla dess uppgifter på en egen sida.
På samma sida kan handläggaren ändra ärendets status. Den nya statusen sparas
och finns kvar när sidan laddas om.

## Ingår
- Frontend: detaljsida på `/tickets/{id}` med ärendets uppgifter och ett formulär för att ändra status
- Backend: endpoints `GET /api/tickets/{id}` och `PUT /api/tickets/{id}/status`
- Statusregeln och felmeddelandena i Felfall, i både frontend och backend

## Ingår inte
- Länken från ärendelistan till detaljsidan. Detaljsidan nås via sin adress.
- Redigering av ärendets övriga fält
- Ärendehistorik
- Radering av ärenden (utanför avgränsningen)

## Beslut
- Ett ärende kan byta mellan alla statusar, men aldrig tillbaka till "Nytt". "Nytt" sätts
  bara när ärendet registreras. Beslutat i teamet.
- Att sätta samma status som ärendet redan har är inget fel. Svaret är `200` och ärendet
  är oförändrat.
- Ärendenumret är ärendets `id`. Det är samma värde som i sidans adress.
- "Nytt" visas i statuslistan men går inte att välja. Listan visar alltid ärendets
  aktuella status, och skärmläsare läser upp att alternativet inte är tillgängligt.
- Statusen sparas med knappen "Spara status", inte direkt när ett värde väljs. Annars
  kan en ändring sparas av misstag när man bläddrar i listan med piltangenterna.
- Bekräftelsen efter en sparning står kvar tills nästa sparning, utan tidsgräns.

## Visning
Etiketterna på detaljsidan och hur värdena visas:

| Etikett | Värde |
|---|---|
| (sidrubrik) | Rubrik |
| Ärendenummer | `id` |
| Status | Nytt, Pågående, Väntar på kund, Avslutat |
| Prioritet | Låg, Medel, Hög |
| Kategori | Beställningar/leveranser, Fakturor, Returer/reklamation, Övrigt |
| Skapad | Datum och klockslag i svenskt format, t.ex. "10 nov. 2026 14:30" ¹ |
| Namn | Kundens namn |
| E-post | Kundens e-postadress |
| Beskrivning | Beskrivning |

¹ I webbläsarens tidszon.

## Felfall
Detta är den enda källan för regler och felmeddelanden i momentet.

| Fall | Var | Meddelande |
|---|---|---|
| Ärendet finns inte, eller adressen har inget giltigt id | Detaljsidan | "Ärendet hittades inte" |
| Servern svarar med fel eller går inte att nå när ärendet hämtas | Detaljsidan | "Ärendet kunde inte hämtas. Försök igen senare." |
| "Nytt" är valt när handläggaren sparar | Statusformuläret (bara frontend) | "Välj en ny status" |
| Servern svarar med fel eller går inte att nå när statusen sparas | Statusformuläret | "Statusen kunde inte sparas. Försök igen." |
| `status` är `"New"` | API, `errors.status` | "Status kan inte ändras till Nytt" |
| `status` saknas, är tom eller är inte en giltig status ² | API, `errors.status` | "Välj en giltig status" |

² Giltig är exakt ett av namnen `New`, `InProgress`, `WaitingForCustomer`, `Closed`, med
samma stora och små bokstäver.

## Acceptanskriterier

### Visa ärende

**AK-1**
- Given: Ett ärende finns
- When: Handläggaren öppnar ärendets adress
- Then: Rubriken visas som sidrubrik och övriga uppgifter visas med etiketterna och värdena i Visning

**AK-2**
- Given: Ett ärende skapades 2026-11-10 kl. 14:30 i webbläsarens tidszon
- When: Detaljsidan visas
- Then: Skapad visas som "10 nov. 2026 14:30"

**AK-3**
- Given: Inget ärende har det id som står i adressen, eller id:t är inte ett tal
- When: Handläggaren öppnar adressen
- Then: "Ärendet hittades inte" visas

**AK-4**
- Given: Handläggaren har öppnat ett ärendes adress
- When: Svaret från servern inte har kommit än
- Then: "Laddar ärende…" visas och läses upp av skärmläsare

**AK-5**
- Given: Handläggaren öppnar ett ärendes adress
- When: Servern svarar med ett serverfel (5xx) eller inte går att nå
- Then: "Ärendet kunde inte hämtas. Försök igen senare." visas och läses upp av skärmläsare

**AK-6**
- Given: Detaljsidan visar ett ärende, laddar, eller visar ett fel
- When: Handläggaren väljer "Tillbaka till ärendelistan"
- Then: Ärendelistan visas

### Ändra status

**AK-7**
- Given: Ett ärende med en viss status visas
- When: Handläggaren öppnar listan "Status"
- Then: Ärendets aktuella status är förvald, alla fyra statusar finns, och "Nytt" går inte att välja

**AK-8**
- Given: Ett ärende visas
- When: Handläggaren väljer en annan status än "Nytt" och väljer "Spara status"
- Then: Statusen bland ärendets uppgifter visar den nya statusen, "Status ändrad till <status>"
  visas och läses upp av skärmläsare, och fokus stannar på knappen

**AK-9**
- Given: Handläggaren har ändrat status på ett ärende
- When: Sidan laddas om
- Then: Den nya statusen visas

**AK-10**
- Given: Ett ärende med status "Nytt" visas och "Nytt" är fortfarande valt
- When: Handläggaren väljer "Spara status"
- Then: "Välj en ny status" visas kopplat till listan via aria-describedby, och inget anrop skickas

**AK-11**
- Given: Handläggaren har valt "Spara status" och svaret från servern har inte kommit
- When: Handläggaren försöker välja "Spara status" igen
- Then: Knappen är inaktiverad och visar "Sparar…", och inget nytt anrop skickas

**AK-12**
- Given: Handläggaren har valt en ny status
- When: Hen väljer "Spara status" och servern svarar med ett fel eller inte går att nå
- Then: "Statusen kunde inte sparas. Försök igen." visas och läses upp av skärmläsare, det valda
  värdet ligger kvar i listan, och statusen bland ärendets uppgifter är oförändrad

### API (backend)

**AK-13**
- Given: Ett ärende finns
- When: `GET /api/tickets/{id}` anropas
- Then: Svaret är `200` med ärendets alla fält

**AK-14**
- Given: Inget ärende har id:t
- When: `GET /api/tickets/{id}` anropas
- Then: Svaret är `404` som problem+json

**AK-15**
- Given: Ett ärende finns
- When: `PUT /api/tickets/{id}/status` anropas med en giltig status som inte är `New`
- Then: Svaret är `200` med ärendet och den nya statusen, och statusen är sparad

**AK-16**
- Given: Ett ärende har status `InProgress`
- When: `PUT /api/tickets/{id}/status` anropas med `InProgress`
- Then: Svaret är `200` och ärendet är oförändrat

**AK-17**
- Given: Ett ärende finns
- When: `PUT /api/tickets/{id}/status` anropas med `New`
- Then: Svaret är `400` med "Status kan inte ändras till Nytt" i `errors.status`, och statusen är oförändrad

**AK-18**
- Given: Ett ärende finns
- When: `PUT /api/tickets/{id}/status` anropas utan status, med en tom status eller med ett värde som inte är en status
- Then: Svaret är `400` med "Välj en giltig status" i `errors.status`, och statusen är oförändrad

**AK-19**
- Given: Inget ärende har id:t
- When: `PUT /api/tickets/{id}/status` anropas med en giltig status
- Then: Svaret är `404` som problem+json

## Verifieringsmetod
Nivåerna följer [docs/teststrategi.md](../teststrategi.md): den billigaste nivån som kan fånga felet.

| AK | Nivå | Varför |
|---|---|---|
| AK-1, AK-3, AK-6, AK-7, AK-8, AK-9, AK-10 | End-to-end mot hela stacken | Användarflöden som den riktiga stacken kan framkalla. Testerna skapar sina egna ärenden via API:t |
| AK-2 | Frontend unit (Vitest) | Formateringslogik med fast tidszon, utan webbläsare |
| AK-4, AK-5, AK-11, AK-12 | End-to-end med mockat API | Långsamma svar, serverfel och nätverksfel går inte att framkalla med den riktiga stacken |
| AK-13–AK-19 | Backend integration (Postgres) | HTTP-kontraktet och persistens. Statusen läses tillbaka via `GET` |
| AK-17, AK-18 | Även backend unit | Statusregelns kantfall utan databas |

- Sabotagekontroll: sparningen i AK-15 och regeln i AK-17 kopplas tillfälligt bort för att visa att testerna faller av rätt anledning.
- Manuell kontroll: tangentbord och skärmläsare (VoiceOver) för fokus och uppläsning i AK-4, AK-5, AK-8, AK-10 och AK-12.

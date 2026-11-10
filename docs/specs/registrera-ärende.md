# Spec: Registrera ärende

Ägare: Carolina
Se [docs/avgränsningar.md](../avgränsningar.md) för teknikval och avgränsning.

## Vad momentet gör
En handläggare registrerar ett nytt kundärende via ett formulär. Ärendet
valideras, sparas med status "Nytt" och en tidsstämpel, och finns kvar
när applikationen startas om.


## Ingår
- Fält: rubrik, beskrivning, kategori, prioritet, namn, email
- Prioritet är förifylld med "Medel" (kan ändras). Kategori har inget förval.
- Automatiskt vid sparning: id, ärendenummer (ticketNumber, `SR-<år>-<1000 + id>`), status ("Nytt"), tidpunkt (createdAt)
- Frontend: formulär i en drawer som öppnas från knappen "Registrera ärende" i navigeringen, med validering och felmeddelanden
- Backend: endpoint `POST /api/tickets`
- Samma valideringsregler i frontend och backend (se Felfall)
- Databas: kolumnerna för kundens namn och e-postadress i tabellen för ärenden (ny migration)

## Ingår inte
- DbContext och övriga delar av databasschemat. Detta moment bygger på dem och lägger bara till kundfälten.
- Redigering av ett befintligt ärende (ingår inte i denna leverans, se känd begränsning)
- Statusändring efter registrering

## Beslut
- Knappen "Registrera ärende" ligger i navigeringen överst, så att ärenden kan registreras
  från alla sidor. Knappen har en dekorativ plusikon före texten. Drawern öppnas över den sida som visas. Avviker från Figma-mocken
  (gruppens designunderlag), där knappen finns på listsidan. Beslutat av Carolina.
- Knappen "Spara ärende" i drawern har en dekorativ diskettikon före texten.
- Knappen "Registrera ärende" har `aria-haspopup="dialog"`. Inget WCAG-krav. Lagt till av
  Carolina efter kontroll med VoiceOver: knappen lästes bara som "knapp" och
  förvarnade inte om dialogen.

## Felfall
Gäller både frontend och backend. Detta är den enda källan för
valideringsregler och felmeddelanden.

| Fält | Regel | Felmeddelande |
|---|---|---|
| Rubrik | Tomt eller bara mellanslag | "Rubrik måste fyllas i" |
| Rubrik | Fler än 200 tecken ¹ | "Rubrik får vara högst 200 tecken" ¹ |
| Beskrivning | Tomt eller bara mellanslag | "Beskrivning måste fyllas i" |
| Beskrivning | Fler än 5000 tecken ¹ | "Beskrivning får vara högst 5000 tecken" ¹ |
| Kategori | Inget val gjort | "Välj en kategori" |
| Kategori | Ogiltigt värde (ej via normal UI) ² | "Välj en kategori" |
| Prioritet | Värde saknas helt (ej via normal UI) | "Välj en prioritet" |
| Prioritet | Ogiltigt värde (ej via normal UI) ² | "Välj en prioritet" |
| Namn | Tomt eller bara mellanslag | "Namn måste fyllas i" |
| Email | Tomt eller bara mellanslag | "E-postadress måste fyllas i" |
| Email | Fel format ³ | "Ange en giltig e-postadress" |

¹ Beslutat av Carolina. Gränserna 200 och 5000 tecken finns
redan i databasen (`TicketConfiguration`) och i [docs/api/kontrakt.md](../api/kontrakt.md).
Gruppen informeras och kan invända.

² Antagande från [docs/api/kontrakt.md](../api/kontrakt.md): ett värde
som inte finns i listan (t.ex. `"category": "Foo"`) ger `400`.
Felmeddelandet återanvänder raden för saknat val.

³ Giltigt format är `namn@domän.toppdomän`: exakt ett `@`, inga mellanslag och minst en punkt
efter `@`. Regeln är det reguljära uttrycket `^[^\s@]+@[^\s@]+\.[^\s@]+$`, samma i frontend och
backend. Stora bokstäver normaliseras inte.

## Acceptanskriterier

### Formulär

**AK-1**
- Given: Samtliga obligatoriska fält är korrekt ifyllda
- When: Formuläret skickas
- Then: Ett nytt ärende sparas med status "Nytt" och en automatiskt genererad tidsstämpel

**AK-2**
- Given: Prioritet har inte ändrats från förvalet
- When: Formuläret skickas
- Then: Ärendet sparas med prioritet "Medel"

**AK-3**
- Given: Ett fält bryter mot en regel i Felfall
- When: Formuläret skickas
- Then: Felmeddelandet från tabellen visas kopplat till fältet via
  aria-describedby, och inget ärende sparas

**AK-11**
- Given: Ett eller flera fält bryter mot en regel i Felfall
- When: Formuläret skickas
- Then: Fokus flyttas till det första fältet med fel, i formulärets ordning

**AK-12**
- Given: Formuläret har skickats och svaret från servern har inte kommit
- When: Handläggaren väljer "Spara ärende" igen
- Then: Inget nytt anrop skickas, och bara ett ärende sparas

### API (backend)

**AK-4**
- Given: Ett anrop till `POST /api/tickets` med giltiga uppgifter
- When: Anropet skickas
- Then: Svaret är `201`, ärendet sparas med status "Nytt", id, ärendenummer och tidpunkt.
  Svaret innehåller `ticketNumber` i formatet `SR-<år>-<1000 + id>`

**AK-5**
- Given: Ett anrop där ett fält bryter mot en regel i Felfall
- When: Anropet skickas
- Then: Svaret är `400` med felet kopplat till fältets namn, och inget ärende sparas

**AK-6**
- Given: Ett ärende har sparats
- When: Applikationen startas om
- Then: Ärendet finns kvar

### Drawer

**AK-7**
- Given: Handläggaren är på ärendelistan
- When: Hen väljer "Registrera ärende"
- Then: Formuläret öppnas i en drawer, och listan syns kvar bakom. Knappen talar om för
  skärmläsare att den öppnar en dialog (`aria-haspopup="dialog"`).

**AK-8**
- Given: Drawern är öppen
- When: Hen trycker Esc, väljer "Stäng" eller klickar utanför drawern
- Then: Drawern stängs, inget sparas, och fokus går tillbaka till knappen som öppnade den. Formuläret töms, så att det är tomt med prioritet "Medel" nästa gång drawern öppnas

**AK-9**
- Given: Ett ärende har sparats
- When: Svaret från servern är lyckat
- Then: Drawern stängs, en bekräftelse visas som även läses upp av skärmläsare, och fokus går tillbaka till knappen som öppnade drawern. Bekräftelsen visas som en toast och försvinner efter 5 sekunder, eller tidigare om drawern öppnas igen. Formuläret töms, så att det är tomt med prioritet "Medel" nästa gång drawern öppnas

**AK-10**
- Given: Drawern är öppen och alla fält är korrekt ifyllda
- When: Formuläret skickas och servern svarar med ett serverfel (5xx) eller inte går att nå
- Then: Drawern förblir öppen, de ifyllda värdena finns kvar, och meddelandet "Ärendet kunde inte sparas. Försök igen." visas överst i formuläret och läses upp av skärmläsare

## Verifieringsmetod
- Automatiserade tester (happy path + error paths per rad i Felfall)
- Backend-tester (API) för validering och sparning
- Playwright end-to-end-test för hela registreringsflödet
- Playwright-test med mockat API (e2e-mocked) för serverfel och nätverksfel (AK-10)

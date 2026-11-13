# Spec: Visa ärenden

Ägare: Louice Borg  
Senast uppdaterad: 2026-11-11

## Sammanfattning

En handläggare ska kunna se en lista över registrerade ärenden för att få en överblick över inkomna supportärenden.

Systemet ska hämta ärenden från databasen och visa dem i användargränssnittet.

Arbetssättet från spec till kod beskrivs i [arbetssätt](../arbetssätt.md).

---

## Mål

- Handläggaren kan se alla registrerade ärenden.
- Ärenden visas utan att användaren behöver skapa testdata manuellt.
- Ärenden hämtas från beständig lagring.
- Ärenden visas sorterade med de senaste först.

---

## Ingår

- Hämtning av ärenden från databasen.
- Persistens med PostgreSQL.
- SeedData för utvecklingsmiljö.
- Visning av ärendelista i frontend.
- Visning av ärendenummer.
- Visning av titel.
- Visning av prioritet.
- Visning av status.
- Visning av skapandedatum.

---

## Ingår inte

- Visning av ärendedetaljer.
- Ändring av status.
- Skapa nytt ärende.
- Redigera ärende.
- Ärendehistorik.
- Sökfunktion.
- Filtrering.

---

## Användare och förutsättningar

- **Användare/roll:** Kundservicehandläggare
- **Förutsättningar:** Systemet är startat och databasen är tillgänglig.
- **Beroenden:** PostgreSQL, Entity Framework Core, SeedData

---

## Begrepp och tillåtna värden

| Begrepp/fält | Betydelse | Tillåtna värden eller källa |
|---|---|---|
| Ticket | Ett kundserviceärende | Datamodellen |
| Priority | Ärendets prioritet | Low, Medium, High |
| Status | Ärendets status | New, In Progress, Closed |
| CreatedAt | Datum då ärendet skapades | UTC-datum |

---

## Regler och fel

| Fält eller situation | Regel | Förväntat resultat/felmeddelande | Källa eller beslut |
|---|---|---|---|
| Tom databas | Inga ärenden finns | Tom lista visas | Beslut |
| Databasen ej tillgänglig | Hämtning misslyckas | Felmeddelande visas | Beslut |
| Flera ärenden | Sorteras efter CreatedAt | Nyaste visas först | Specifikation |

---

## Acceptanskriterier

### Visa ärendelista

**AK-1: Visa alla ärenden**

- Given: Att ett eller flera ärenden finns i databasen
- When: Handläggaren öppnar ärendelistan
- Then: Samtliga ärenden visas

**AK-2: Visa sammanfattande information**

- Given: Att ett ärende visas i listan
- When: Ärendelistan renderas
- Then: Ärendenummer, titel, prioritet, status och skapandedatum visas

**AK-3: Sortering**

- Given: Att flera ärenden finns
- When: Ärendelistan hämtas
- Then: Ärendena visas med senaste skapade ärende först

**AK-4: Tom lista**

- Given: Att databasen inte innehåller några ärenden
- When: Ärendelistan öppnas
- Then: En tom lista eller tomt tillstånd visas utan att applikationen kraschar

---

## API- och datakontrakt

- **Endpoint/händelse:** GET /api/tickets
- **Inkommande data:** Ingen
- **Lyckat svar:** HTTP 200 med lista av TicketResponse
- **Fel:** HTTP 500 vid internt fel
- **Beständighet:** Ärenden lagras i PostgreSQL och ska finnas kvar efter omstart
- **Källor:** TicketResponse, ApplicationDbContext, Ticket-entitet

---

## Tillgänglighet och andra kvalitetskrav

- **Tillgänglighet:** Ärendelistan ska kunna läsas med tangentbordsnavigation.
- **Integritet/säkerhet:** Endast ärendedata som definierats i kontraktet exponeras.
- **Övrigt:** Listan ska laddas utan fel när databasen innehåller seeddata.

---

## Beslut och antaganden

| ID | Beslut eller antagande | Motivering/källa | Ansvarig | Status |
|---|---|---|---|---|
| D-1 | PostgreSQL används som primär databas | Data ska finnas kvar efter omstart | Louice Borg | Beslutad |
| D-2 | SeedData används i utvecklingsmiljö | Underlättar verifiering och demo | Louice Borg | Beslutad |
| D-3 | Entity Framework InMemory används endast för tester | Uppfyller inte lagringskravet | Louice Borg | Beslutad |

---

## Öppna frågor

| Fråga | Påverkan om obesvarad | Ansvarig | Status |
|---|---|---|---|
| Behöver pagination införas senare? | Påverkar stora datamängder | Teamet | Öppen |

---

## Verifiering

| Krav/AK | Verifiering | Nivå | Automatiskt eller manuellt |
|---|---|---|---|
| AK-1 | Hämtning av seedade ärenden från databasen | Integration | Automatisk |
| AK-2 | Kontroll av renderad ärendelista | Manuell | Manuell |
| AK-3 | Verifiering av sortering efter CreatedAt | Integration | Automatisk |
| AK-4 | Kontroll av tom databas | Integration | Automatisk |

---

## Referenser

- avgränsningar.md
- design-specifikation.md
- Ticket.cs
- ApplicationDbContext.cs
- SeedData.cs

---

## Ändringshistorik

| Datum | Ändring | Ansvarig |
|---|---|---|
| 2026-11-01 | Skapade första versionen av specifikationen | Louice Borg |
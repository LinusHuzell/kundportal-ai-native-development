# API-kontrakt (förslag)

Härlett från `docs/avgränsningar.md` och `frontend/src/types/ticket.ts`. Bas-URL: `/api`. Format: JSON, fältnamn i camelCase, enum-värden som strängar.

Maskinläsbar specifikation: [openapi.json](openapi.json), genererad från backend-koden (se `backend/README.md`, "Generate the OpenAPI specification"). Vid skillnad mellan dokumenten gäller koden/`openapi.json`; uppdatera båda vid ändringar.

## Enums

| Typ | Värden |
|---|---|
| `status` | `New`, `InProgress`, `WaitingForCustomer`, `Closed` |
| `priority` | `Low`, `Medium`, `High` |
| `category` | `OrdersDeliveries`, `Invoices`, `ReturnsComplaints`, `Other` |

## Modeller

### Ticket

```json
{
  "id": 1,
  "title": "Paketet har inte kommit",
  "description": "Beställde för två veckor sedan.",
  "category": "OrdersDeliveries",
  "priority": "Medium",
  "status": "New",
  "customerName": "Anna Andersson",
  "customerEmail": "anna@example.com",
  "createdAt": "2026-10-27T09:30:00Z"
}
```

### CreateTicketRequest

`title`, `description`, `category`, `priority`, `customerName`, `customerEmail` (alla obligatoriska).

Alla fält är strängar. `category` och `priority` tas emot som strängar, så att ett saknat eller okänt
värde ger ett fel på fältet i stället för ett JSON-fel. Tillåtna värden är de i "Enums", med exakt
skiftläge (`Medium`, inte `medium`). I `openapi.json` visas fälten som `string` (eller `null`) utan
lista över värden, så listan här gäller.

```json
{
  "title": "Paketet har inte kommit",
  "description": "Beställde för två veckor sedan.",
  "category": "OrdersDeliveries",
  "priority": "Medium",
  "customerName": "Anna Andersson",
  "customerEmail": "anna@example.com"
}
```

### UpdateTicketRequest

Samma fält som `CreateTicketRequest`, alla valfria (PATCH). Skickade fält valideras med samma regler.

### UpdateStatusRequest

```json
{ "status": "InProgress" }
```

## Endpoints

| Metod | Path | Beskrivning | Svar |
|---|---|---|---|
| GET | `/tickets` | Lista ärenden (senaste först) | `200` `Ticket[]` |
| GET | `/tickets/{id}` | Hämta ett ärende | `200` `Ticket`, `404` |
| POST | `/tickets` | Skapa ärende (status sätts till `New`) | `201` `Ticket` + `Location`, `400` |
| PATCH | `/tickets/{id}` | Redigera ärende | `200` `Ticket`, `400`, `404` |
| PUT | `/tickets/{id}/status` | Ändra status | `200` `Ticket`, `400`, `404` |

Ingen DELETE och ingen autentisering (utanför avgränsningen).

## Validering

Regler och felmeddelanden för `POST /tickets` kommer från tabellen Felfall i
[docs/specs/registrera-ärende.md](../specs/registrera-ärende.md), som är den enda källan.

| Fält | Regel | Felmeddelande |
|---|---|---|
| `title` | Saknas, tomt eller bara mellanslag | Rubrik måste fyllas i |
| `title` | Fler än 200 tecken | Rubrik får vara högst 200 tecken |
| `description` | Saknas, tomt eller bara mellanslag | Beskrivning måste fyllas i |
| `description` | Fler än 5000 tecken | Beskrivning får vara högst 5000 tecken |
| `category` | Saknas, tomt eller okänt värde | Välj en kategori |
| `priority` | Saknas, tomt eller okänt värde | Välj en prioritet |
| `customerName` | Saknas, tomt eller bara mellanslag | Namn måste fyllas i |
| `customerEmail` | Saknas, tomt eller bara mellanslag | E-postadress måste fyllas i |
| `customerEmail` | Matchar inte `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Ange en giltig e-postadress |

- Värden trimmas inte. Längden räknas på värdet som det skickas, i UTF-16-enheter (som `.length` i JavaScript).
- E-postregexen är densamma som i frontend. Backend använder `\z` i stället för `$`, eftersom `$` i .NET
  även matchar före en avslutande radbrytning. Beteendet blir då detsamma som i JavaScript.
- Stora bokstäver i e-postadressen normaliseras inte.
- Varje fält får högst ett fel. Alla felaktiga fält rapporteras i samma svar.
- Vid fel sparas inget.
- `status` måste vara ett giltigt enum-värde (`PUT /tickets/{id}/status`).
- Fel JSON-typ (t.ex. `"title": 123`) eller trasig JSON ger `400` från ramverket, utan `errors`.

Vid sparning sätts `status` till `New` och `createdAt` till serverns tid i UTC. Ärendet får också
ett internt ärendenummer, `SR-<år>-<1000 + id>`, som inte finns i API:t.

## Felformat

Valideringsfel (`400`) använder RFC 9457 `application/problem+json` med fältkoppling:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "title": ["Rubrik måste fyllas i"],
    "customerEmail": ["Ange en giltig e-postadress"]
  }
}
```

`404` returnerar `problem+json` utan `errors`.

## Öppna frågor

- Ärendehistorik: föreslagen `GET /tickets/{id}/history` läggs till när ansvarig är utsedd.

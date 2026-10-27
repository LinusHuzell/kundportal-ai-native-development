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

- `title`, `description`, `customerName`, `customerEmail`, `category`, `priority` får inte vara tomma eller bara mellanslag.
- `customerEmail` måste vara ett giltigt e-postformat.
- `title` och `description` har maxlängd (ej beslutad; förslag 200 respektive 5000 tecken).
- `category`, `priority` och `status` måste vara ett giltigt enum-värde.
- Vid fel sparas inget.

## Felformat

Valideringsfel (`400`) använder RFC 9457 `application/problem+json` med fältkoppling:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "title": ["Rubrik är obligatorisk."],
    "customerEmail": ["Ogiltig e-postadress."]
  }
}
```

`404` returnerar `problem+json` utan `errors`.

## Öppna frågor

- Längdgränser för `title`/`description`.
- Ärendehistorik: föreslagen `GET /tickets/{id}/history` läggs till när ansvarig är utsedd.

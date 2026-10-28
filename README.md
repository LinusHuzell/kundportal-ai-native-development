# Customer Service Portal

A small customer service portal where a case handler can register a ticket, see what it is about and follow it through a simple workflow. Built by Group 4 for the course AI-Native Development. All customer data is fictional.

> The original course README (assignment setup, fork and PR instructions) is kept in [`course-info/README.md`](course-info/README.md).

See [docs/gotchas.md](docs/gotchas.md) for development gotchas and team conventions.

## Team

- Linus Huzell ([LinusHuzell](https://github.com/LinusHuzell))
- Louice Borg ([Loisarn](https://github.com/Loisarn))
- Carolina Hagman ([carolinahagman](https://github.com/carolinahagman))
- Sebastian Bennett ([hecd](https://github.com/hecd))



## Running the whole solution (frontend + backend)
- Requires Docker + Docker Compose
- Requires trusted dotnet dev-cert. See [HTTPS development certificate](backend/README.md#https-development-certificate)

```bash
./scripts/setup-dev-cert.sh
docker compose up -d
```

### Navigate to:
Frontend: https://localhost:5173/tickets
Backend (Scalar): https://localhost:7289/scalar/v1
OpenAPI-specifikation: [docs/api/openapi.json](docs/api/openapi.json)

## Running the frontend

Requires Node 22+.

```bash
cd frontend
cp .env.example .env   # optional
npm install
npm run dev
```

Open http://localhost:5173.

## Running the backend

- Requires .NET 10 SDK
- Starts the application, but does not navigate to Scalar automatically. Navigate to https://localhost:7289/scalar/ after starting
```bash
cd backend/
dotnet run --project src/CustomerService.Api/CustomerService.Api.csproj --launch-profile https
```
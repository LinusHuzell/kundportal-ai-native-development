# Customer Service API

ASP.NET Core API for the Customer Service Portal. The ticket endpoints are defined according to [docs/api/kontrakt.md](../docs/api/kontrakt.md). Ticket listing uses PostgreSQL through Entity Framework Core; the other ticket handlers remain outside this implementation.

## Requirements

- .NET 10 SDK

Check your SDK installation with:

```bash
dotnet --info
```

## Run locally

From the repository root, start the database, API, and frontend with Docker Compose:

```bash
docker compose up --build
```

The API applies EF Core migrations and inserts sample tickets when the database is empty. PostgreSQL data is kept in the `postgres-data` volume. Set `POSTGRES_PASSWORD` to override the local development password.

To run the API directly, configure `ConnectionStrings__DefaultConnection` for a reachable PostgreSQL instance before starting it.

From the `backend` directory, start the API:

```bash
dotnet run --project src/CustomerService.Api/CustomerService.Api.csproj --launch-profile https
```

The API listens on https://localhost:7289 only. There is no HTTP profile, and `UseHttpsRedirection` (plus HSTS outside Development) is enabled. We always run HTTPS, including locally, so that development matches production behavior (secure cookies, HSTS, mixed-content rules) and customer data such as names and email addresses is never sent in clear text. Run `dotnet dev-certs https --trust` first (see below).

Endpoints live under `/api/tickets`. In the Development environment:

- The OpenAPI document is served at `/openapi/v1.json`.
- The interactive API reference (Scalar) is at `/scalar/v1`, e.g. https://localhost:7289/scalar/v1, and opens automatically in the browser on start. See "Teknikval" in [docs/avgränsningar.md](../docs/avgränsningar.md) for why Scalar was chosen.

## Generate the OpenAPI specification

The specification is generated from the code (endpoints and request/response types in `src/CustomerService.Api/Features/`). From the `backend` directory, run:

```bash
dotnet build src/CustomerService.Api -p:GenerateOpenApi=true
```

This writes `docs/api/openapi.json`. Regenerate and commit it whenever the API changes, and keep `docs/api/kontrakt.md` in sync.

## Database migrations

From the `backend` directory, create a migration after changing the ticket model:

```bash
dotnet ef migrations add <MigrationName> --project src/CustomerService.Api/CustomerService.Api.csproj
```

Migrations are applied automatically at API startup.

## HTTPS development certificate

ASP.NET Core uses a local development certificate for HTTPS. Create and trust it with:

```bash
dotnet dev-certs https --trust
```

On Linux, the CLI may report that OpenSSL needs the certificate trust directory in `SSL_CERT_DIR`. In that case, add the directory shown in the CLI output while preserving the system certificate directory, then run the trust command again:

```bash
export SSL_CERT_DIR="$HOME/.aspnet/dev-certs/trust:/etc/ssl/certs"
dotnet dev-certs https --trust
```

This `export` applies to the current shell. Add it to `~/.zshrc` or `~/.bashrc` if you need it in future terminal sessions.

## Tests

Run the solution's tests from the `backend` directory:

```bash
dotnet test CustomerService.slnx
```

The solution contains unit-test and end-to-end test projects. Their current test files are placeholders, so this command does not yet verify API behavior.

## Project layout

- `src/CustomerService.Api/` - ASP.NET Core API
  - `Features/<Feature>/` - vertical slices; each use case has one file with its request type, route mapping and handler (e.g. `Features/Tickets/CreateTicket.cs`). Shared feature types live in `TicketModels.cs`, and `TicketsEndpoints.cs` registers the slices.
- `tests/CustomerService.Api.UnitTests/` - unit tests
- `e2e/CustomerService.Api.E2E/` - end-to-end tests

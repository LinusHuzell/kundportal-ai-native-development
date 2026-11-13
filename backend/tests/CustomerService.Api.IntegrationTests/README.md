# Integration Tests

The integration tests verify the API's HTTP contract and its interaction with the database. They use xUnit, ASP.NET Core `WebApplicationFactory`, and a real PostgreSQL instance managed by Testcontainers. They do not use EF InMemory or SQLite.

## Requirements and running the tests

- Docker Engine or Docker Desktop running and accessible to Testcontainers

Run only the integration tests from `backend/`:

```bash
dotnet test tests/CustomerService.Api.IntegrationTests/CustomerService.Api.IntegrationTests.csproj
```

The first run may need to pull the PostgreSQL image from a container registry.

## Test container and image

`ApiFixture` creates the container using Testcontainers for .NET:

```csharp
new PostgreSqlBuilder("postgres:17-alpine").Build()
```

The image name and tag are hard-coded in `ApiFixture.cs`; they are not configured through appsettings or environment variables. `postgres:17-alpine` means PostgreSQL 17 based on Alpine Linux. The tag specifies the version and variant, but it does not pin an exact image digest. If the tests need to use exactly the same image build over time, the image reference can instead be pinned to a digest.

Testcontainers starts the container before the tests run and stops it when the fixture is disposed. The container provides a separate test database and does not use the development database from `compose.yaml` or appsettings.

## Lifecycle and isolation

1. xUnit creates an `ApiFixture` for the `Api` collection.
2. The fixture starts the PostgreSQL container and creates a `WebApplicationFactory<Program>`.
3. The API's `DefaultConnection` is overridden with the connection string for the test container. The app starts before the first reset because it runs its seed operation on startup.
4. Each test class inherits from `IntegrationTest`. Its `InitializeAsync` runs before each test, truncating the `TicketEvents` and `Tickets` tables and resetting the identity counter.
5. Tests use `Fixture.Factory.CreateClient()` to send HTTP requests to the app. Test classes in the collection share the same container and app instance; the collection runs sequentially.
6. When the collection has finished, the app and container are disposed.

The reset uses `TRUNCATE ... RESTART IDENTITY`. If a migration adds a table containing test data, that table will normally also need to be added to `ApiFixture.ResetDatabaseAsync` so every test continues to start with an empty database.

## What to verify

Test endpoint behavior through HTTP: status codes, response content, headers, validation errors, and persistence. For persistence checks, read data back through the API or with a new `DbContext` from `Fixture.CreateDbContext()`, not from the context that wrote the data.

Tests should cover successful requests as well as relevant error cases and boundaries from the specifications. Keep each test focused on one behavior. Use unit tests instead when a rule can be tested without HTTP and a database.

Endpoint test examples are in `Features/Tickets/`. `ApiSmokeTests` verifies that the app starts and serves the OpenAPI document. The older persistence test in `Data/` tests `DbContext` directly; new feature-specific persistence checks should go through the API.

## Troubleshooting

- If the tests cannot connect to Docker, check that Docker is running and that the current user can access the Docker Engine.
- If the PostgreSQL image is not available locally, Docker must be able to pull `postgres:17-alpine` from the registry.
- If a test affects later tests, check that it inherits from `IntegrationTest` and that all relevant tables are truncated in `ResetDatabaseAsync`.
- If a test run leaves resources behind after an interruption, check the Testcontainers/Docker logs and verify that the Docker environment is healthy before rerunning the tests.

See also the [test strategy](../../../docs/teststrategi.md) and [AGENTS.md](../../../AGENTS.md) for the project's shared testing rules.
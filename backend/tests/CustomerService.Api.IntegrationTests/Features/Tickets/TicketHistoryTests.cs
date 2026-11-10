using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;

using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

// GET /api/tickets/{id}/history, AK-1 to AK-5, AK-8 and AK-9 in docs/specs/ärendehistorik-grund.md.
public sealed class TicketHistoryTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    private static Dictionary<string, object?> ValidBody() => new()
    {
        ["title"] = "Paketet har inte kommit",
        ["description"] = "Beställde för två veckor sedan.",
        ["category"] = "OrdersDeliveries",
        ["priority"] = "Medium",
        ["customerName"] = "Anna Andersson",
        ["customerEmail"] = "anna@example.com",
    };

    private async Task<int> RegisterTicketAsync()
    {
        var response = await Fixture.Factory.CreateClient().PostAsJsonAsync("/api/tickets", ValidBody());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        return ticket.GetProperty("id").GetInt32();
    }

    private Task<HttpResponseMessage> GetHistoryAsync(int id) =>
        Fixture.Factory.CreateClient().GetAsync($"/api/tickets/{id}/history");

    private async Task<int> InsertTicketAsync(params DateTimeOffset[] eventTimes)
    {
        await using var dbContext = Fixture.CreateDbContext();
        var ticket = new Ticket
        {
            TicketNumber = "SR-2026-HISTORY-1",
            Title = "Ärende skapat direkt i databasen",
            Description = "Skapat direkt i databasen.",
            Category = TicketCategory.Other,
            Priority = TicketPriority.Low,
            Status = TicketStatus.New,
            CustomerName = "Anna Andersson",
            CustomerEmail = "anna@example.com",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync();
        foreach (var occurredAt in eventTimes)
        {
            dbContext.TicketEvents.Add(new TicketEvent
            {
                TicketId = ticket.Id,
                Type = TicketEventType.Created,
                OccurredAt = occurredAt,
            });
            await dbContext.SaveChangesAsync();
        }

        return ticket.Id;
    }

    [Fact]
    public async Task RegisteredTicketHasCreatedEventWithTheTicketsCreatedAt()
    {
        var id = await RegisterTicketAsync();

        var response = await GetHistoryAsync(id);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<JsonElement>();
        var created = Assert.Single(history.EnumerateArray());
        Assert.Equal("Created", created.GetProperty("type").GetString());
        await using var dbContext = Fixture.CreateDbContext();
        var ticket = await dbContext.Tickets.SingleAsync(t => t.Id == id);
        Assert.Equal(ticket.CreatedAt, created.GetProperty("occurredAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task HistoryIsAListOfEventsWithOnlyTypeAndOccurredAt()
    {
        var id = await RegisterTicketAsync();

        var response = await GetHistoryAsync(id);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var history = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, history.ValueKind);
        var created = Assert.Single(history.EnumerateArray());
        Assert.Equal(
            ["occurredAt", "type"],
            created.EnumerateObject().Select(p => p.Name).Order());
    }

    [Fact]
    public async Task UnknownTicketReturns404ProblemJsonWithoutErrors()
    {
        var response = await GetHistoryAsync(999_999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(problem.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task TicketWithoutEventsReturns200WithEmptyList()
    {
        var id = await InsertTicketAsync();

        var response = await GetHistoryAsync(id);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, history.ValueKind);
        Assert.Empty(history.EnumerateArray());
    }

    [Fact]
    public async Task EventsAreListedNewestFirstRegardlessOfInsertOrder()
    {
        var oldest = new DateTimeOffset(2026, 11, 10, 8, 0, 0, TimeSpan.Zero);
        var middle = oldest.AddHours(1);
        var newest = oldest.AddHours(2);
        var id = await InsertTicketAsync(middle, oldest, newest);

        var response = await GetHistoryAsync(id);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            [newest, middle, oldest],
            history.EnumerateArray().Select(e => e.GetProperty("occurredAt").GetDateTimeOffset()));
    }

    [Fact]
    public async Task RejectedRegistrationSavesNeitherTicketNorEvent()
    {
        var body = ValidBody();
        body["title"] = "";

        var response = await Fixture.Factory.CreateClient().PostAsJsonAsync("/api/tickets", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var dbContext = Fixture.CreateDbContext();
        Assert.Empty(await dbContext.Tickets.ToListAsync());
        Assert.Empty(await dbContext.TicketEvents.ToListAsync());
    }

    [Fact]
    public async Task CreatedEventIsPersistedInTheDatabase()
    {
        var id = await RegisterTicketAsync();

        await using var dbContext = Fixture.CreateDbContext();
        var ticket = await dbContext.Tickets.SingleAsync(t => t.Id == id);
        var ticketEvent = Assert.Single(await dbContext.TicketEvents.ToListAsync());
        Assert.Equal(id, ticketEvent.TicketId);
        Assert.Equal(TicketEventType.Created, ticketEvent.Type);
        Assert.Equal(ticket.CreatedAt, ticketEvent.OccurredAt);
    }

    [Fact]
    public async Task DeletingTheTicketDeletesItsEvents()
    {
        var id = await RegisterTicketAsync();
        await using (var before = Fixture.CreateDbContext())
        {
            Assert.Single(await before.TicketEvents.ToListAsync());
        }

        // ExecuteDelete runs plain SQL, so only the database's ON DELETE CASCADE can remove the events.
        await using (var dbContext = Fixture.CreateDbContext())
        {
            await dbContext.Tickets.Where(t => t.Id == id).ExecuteDeleteAsync();
        }

        await using var readBack = Fixture.CreateDbContext();
        Assert.Empty(await readBack.TicketEvents.ToListAsync());
    }
}

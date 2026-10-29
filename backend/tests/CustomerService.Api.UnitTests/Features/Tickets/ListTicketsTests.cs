using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CustomerService.Api.Features.Tickets;
using CustomerService.Api.UnitTests.Infrastructure;

namespace CustomerService.Api.UnitTests.Features.Tickets;

public sealed class ListTicketsTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task GetTicketsReturnsAllTickets()
    {
        var createdAt = new DateTimeOffset(2026, 10, 28, 8, 30, 0, TimeSpan.Zero);
        await using var factory = await TicketApiFactory.CreateAsync(
            CreateTicket(1, "Lift inspection", createdAt),
            CreateTicket(2, "Missing fasteners", createdAt.AddDays(-1)));

        using var response = await factory.Client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = await response.Content.ReadFromJsonAsync<TicketResponse[]>(JsonOptions);
        Assert.NotNull(tickets);
        Assert.Equal(new[] { 1, 2 }, tickets.Select(ticket => ticket.Id));
    }

    [Fact]
    public async Task GetTicketsReturnsTicketsInCreatedAtDescendingOrder()
    {
        await using var factory = await TicketApiFactory.CreateAsync(
            CreateTicket(1, "Older delivery", new DateTimeOffset(2026, 10, 25, 9, 0, 0, TimeSpan.Zero)),
            CreateTicket(2, "Newest inspection", new DateTimeOffset(2026, 10, 28, 8, 0, 0, TimeSpan.Zero)),
            CreateTicket(3, "Middle invoice", new DateTimeOffset(2026, 10, 27, 11, 0, 0, TimeSpan.Zero)));

        using var response = await factory.Client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = await response.Content.ReadFromJsonAsync<TicketResponse[]>(JsonOptions);
        Assert.NotNull(tickets);
        Assert.Equal(new[] { 2, 3, 1 }, tickets.Select(ticket => ticket.Id));
    }

    [Fact]
    public async Task GetTicketsReturnsHigherIdFirstWhenCreatedAtIsEqual()
    {
        var createdAt = new DateTimeOffset(2026, 10, 28, 9, 0, 0, TimeSpan.Zero);
        await using var factory = await TicketApiFactory.CreateAsync(
            CreateTicket(7, "Invoice copy request", createdAt),
            CreateTicket(9, "Damaged pallet on arrival", createdAt),
            CreateTicket(3, "Return of unused cable", createdAt));

        using var response = await factory.Client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = await response.Content.ReadFromJsonAsync<TicketResponse[]>(JsonOptions);
        Assert.NotNull(tickets);
        Assert.Equal(new[] { 9, 7, 3 }, tickets.Select(ticket => ticket.Id));
    }

    [Fact]
    public async Task GetTicketsReturnsEmptyCollectionWhenDatabaseIsEmpty()
    {
        await using var factory = await TicketApiFactory.CreateAsync();

        using var response = await factory.Client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = await response.Content.ReadFromJsonAsync<TicketResponse[]>(JsonOptions);
        Assert.NotNull(tickets);
        Assert.Empty(tickets);
    }

    [Fact]
    public async Task GetTicketReturnsTicketForExistingId()
    {
        var ticket = CreateTicket(42, "Site access lift inspection", DateTimeOffset.UtcNow);
        await using var factory = await TicketApiFactory.CreateAsync(ticket);

        using var response = await factory.Client.GetAsync("/api/tickets/42");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<TicketResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(ticket.Id, result.Id);
        Assert.Equal(ticket.Title, result.Title);
        Assert.Equal(ticket.Status, result.Status);
    }

    [Fact]
    public async Task GetTicketReturnsNotFoundForUnknownId()
    {
        await using var factory = await TicketApiFactory.CreateAsync();

        using var response = await factory.Client.GetAsync("/api/tickets/42");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTicketStatusPersistsAndReturnsUpdatedTicket()
    {
        var ticket = CreateTicket(42, "Site access lift inspection", DateTimeOffset.UtcNow);
        await using var factory = await TicketApiFactory.CreateAsync(ticket);

        using var response = await factory.Client.PutAsJsonAsync(
            "/api/tickets/42/status",
            new UpdateStatusRequest(TicketStatus.InProgress),
            JsonOptions);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<TicketResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(TicketStatus.InProgress, result.Status);

        using var getResponse = await factory.Client.GetAsync("/api/tickets/42");
        var updatedTicket = await getResponse.Content.ReadFromJsonAsync<TicketResponse>(JsonOptions);
        Assert.NotNull(updatedTicket);
        Assert.Equal(TicketStatus.InProgress, updatedTicket.Status);
    }

    private static Ticket CreateTicket(int id, string title, DateTimeOffset createdAt) => new()
    {
        Id = id,
        Title = title,
        Description = $"Contractor service request: {title}.",
        Category = TicketCategory.OrdersDeliveries,
        Priority = TicketPriority.Medium,
        Status = TicketStatus.New,
        CustomerName = "Alex Contractor",
        CustomerEmail = "alex.contractor@example.com",
        CreatedAt = createdAt,
    };
}
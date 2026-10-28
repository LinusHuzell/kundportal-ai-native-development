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
    public async Task GetTicketsReturnsEmptyCollectionWhenDatabaseIsEmpty()
    {
        await using var factory = await TicketApiFactory.CreateAsync();

        using var response = await factory.Client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = await response.Content.ReadFromJsonAsync<TicketResponse[]>(JsonOptions);
        Assert.NotNull(tickets);
        Assert.Empty(tickets);
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
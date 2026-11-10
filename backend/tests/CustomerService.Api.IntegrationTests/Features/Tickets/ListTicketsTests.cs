using System.Net;
using System.Text.Json;
using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

public class ListTicketsTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    [Fact]
    public async Task Get_tickets_returns_all_tickets_newest_first()
    {
        await using (var dbContext = Fixture.CreateDbContext())
        {
            dbContext.Tickets.AddRange(
                new Ticket
                {
                    TicketNumber = "SR-OLDER",
                    Title = "Older ticket",
                    Description = "Older description",
                    Category = TicketCategory.Other,
                    Priority = TicketPriority.Low,
                    Status = TicketStatus.New,
                    CustomerName = "Older customer",
                    CustomerEmail = "older@example.com",
                    CreatedAt = new DateTimeOffset(2026, 10, 1, 10, 0, 0, TimeSpan.Zero),
                },
                new Ticket
                {
                    TicketNumber = "SR-NEWER",
                    Title = "Newer ticket",
                    Description = "Newer description",
                    Category = TicketCategory.Invoices,
                    Priority = TicketPriority.High,
                    Status = TicketStatus.InProgress,
                    CustomerName = "Newer customer",
                    CustomerEmail = "newer@example.com",
                    CreatedAt = new DateTimeOffset(2026, 11, 1, 10, 0, 0, TimeSpan.Zero),
                });
            await dbContext.SaveChangesAsync();
        }

        var client = Fixture.Factory.CreateClient();
        var response = await client.GetAsync("/api/tickets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var tickets = document.RootElement.EnumerateArray().ToArray();

        Assert.Equal(2, tickets.Length);
        Assert.Equal("SR-NEWER", tickets[0].GetProperty("ticketNumber").GetString());
        Assert.Equal("Newer ticket", tickets[0].GetProperty("title").GetString());
        Assert.Equal("High", tickets[0].GetProperty("priority").GetString());
        Assert.Equal("InProgress", tickets[0].GetProperty("status").GetString());
        Assert.Equal("SR-OLDER", tickets[1].GetProperty("ticketNumber").GetString());
    }
}
using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.IntegrationTests.Data;

public sealed class ApplicationDbContextTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    [Fact]
    public async Task CanCreateDbContextAndQueryTickets()
    {
        await using var dbContext = Fixture.CreateDbContext();

        Assert.Empty(await dbContext.Tickets.ToListAsync());
    }

    [Fact]
    public async Task SeedDataAddsFiveTicketsWhenDatabaseIsEmpty()
    {
        await using var dbContext = Fixture.CreateDbContext();

        await SeedData.InitializeAsync(dbContext);

        Assert.Equal(5, await dbContext.Tickets.CountAsync());
    }

    [Fact]
    public async Task SeedDataAddsNothingWhenDatabaseHasTickets()
    {
        await using var dbContext = Fixture.CreateDbContext();
        dbContext.Tickets.Add(new Ticket
        {
            TicketNumber = "SR-TEST-1",
            Title = "Befintligt ärende",
            Description = "Seedning ska inte lägga till fler ärenden när databasen inte är tom.",
            Category = TicketCategory.Other,
            Priority = TicketPriority.Low,
            Status = TicketStatus.New,
            CustomerName = "Testkund Ett",
            CustomerEmail = "testkund.ett@example.com",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        await SeedData.InitializeAsync(dbContext);

        Assert.Single(await dbContext.Tickets.ToListAsync());
    }

    [Fact]
    public async Task TicketPersistsAcrossDbContextInstances()
    {
        await using (var writeContext = Fixture.CreateDbContext())
        {
            writeContext.Tickets.Add(new Ticket
            {
                TicketNumber = "SR-TEST-2",
                Title = "Kontrollera värmepump",
                Description = "Värmepumpen stannar intermittent och behöver felsökas.",
                Category = TicketCategory.Other,
                Priority = TicketPriority.High,
                Status = TicketStatus.New,
                CustomerName = "Testkund Två",
                CustomerEmail = "testkund.tva@example.com",
                CreatedAt = DateTimeOffset.UtcNow,
            });
            await writeContext.SaveChangesAsync();
        }

        await using var readContext = Fixture.CreateDbContext();
        var ticket = await readContext.Tickets.SingleAsync();

        Assert.Equal("SR-TEST-2", ticket.TicketNumber);
        Assert.Equal("Kontrollera värmepump", ticket.Title);
    }
}

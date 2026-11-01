using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.UnitTests.Data;

public sealed class ApplicationDbContextTests
{
    [Fact]
    public async Task CanCreateDbContextAndQueryTickets()
    {
        await using var dbContext = CreateDbContext();

        Assert.Empty(await dbContext.Tickets.ToListAsync());
    }

    [Fact]
    public async Task SeedDataAddsFiveTicketsOnlyWhenDatabaseIsEmpty()
    {
        await using var dbContext = CreateDbContext();

        await SeedData.InitializeAsync(dbContext);
        await SeedData.InitializeAsync(dbContext);

        Assert.Equal(5, await dbContext.Tickets.CountAsync());

        var populatedDatabase = Guid.NewGuid().ToString();
        await using var populatedContext = CreateDbContext(populatedDatabase);
        populatedContext.Tickets.Add(new Ticket
        {
            TicketNumber = "SR-TEST-1",
            Title = "Befintligt ärende",
            Description = "Seedning ska inte lägga till fler ärenden när databasen inte är tom.",
            Category = TicketCategory.Other,
            Priority = TicketPriority.Low,
            Status = TicketStatus.New,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await populatedContext.SaveChangesAsync();

        await SeedData.InitializeAsync(populatedContext);

        Assert.Single(await populatedContext.Tickets.ToListAsync());
    }

    [Fact]
    public async Task TicketPersistsAcrossDbContextInstances()
    {
        var databaseName = Guid.NewGuid().ToString();
        await using (var writeContext = CreateDbContext(databaseName))
        {
            writeContext.Tickets.Add(new Ticket
            {
                TicketNumber = "SR-TEST-2",
                Title = "Kontrollera värmepump",
                Description = "Värmepumpen stannar intermittent och behöver felsökas.",
                Category = TicketCategory.Other,
                Priority = TicketPriority.High,
                Status = TicketStatus.New,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            await writeContext.SaveChangesAsync();
        }

        await using var readContext = CreateDbContext(databaseName);
        var ticket = await readContext.Tickets.SingleAsync();

        Assert.Equal("SR-TEST-2", ticket.TicketNumber);
        Assert.Equal("Kontrollera värmepump", ticket.Title);
    }

    private static ApplicationDbContext CreateDbContext(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerService.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await dbContext.Database.MigrateAsync(cancellationToken);

        if (await dbContext.Tickets.AnyAsync(cancellationToken))
        {
            return;
        }

        dbContext.Tickets.AddRange(
            new Ticket
            {
                Title = "Site access lift inspection",
                Description = "Arrange the scheduled lift inspection before the Västerås site handover.",
                Category = TicketCategory.Other,
                Priority = TicketPriority.High,
                Status = TicketStatus.InProgress,
                CustomerName = "Erik Nilsson",
                CustomerEmail = "erik.nilsson@example.com",
                CreatedAt = new DateTimeOffset(2026, 10, 28, 8, 30, 0, TimeSpan.Zero),
            },
            new Ticket
            {
                Title = "Missing fasteners in delivery",
                Description = "The latest delivery to the renovation site is short by two boxes of M12 anchors.",
                Category = TicketCategory.OrdersDeliveries,
                Priority = TicketPriority.Medium,
                Status = TicketStatus.New,
                CustomerName = "Sara Lind",
                CustomerEmail = "sara.lind@example.com",
                CreatedAt = new DateTimeOffset(2026, 10, 27, 14, 15, 0, TimeSpan.Zero),
            },
            new Ticket
            {
                Title = "Invoice needs project reference",
                Description = "Please add project reference K-2048 to the September equipment rental invoice.",
                Category = TicketCategory.Invoices,
                Priority = TicketPriority.Low,
                Status = TicketStatus.WaitingForCustomer,
                CustomerName = "Johan Berg",
                CustomerEmail = "johan.berg@example.com",
                CreatedAt = new DateTimeOffset(2026, 10, 26, 11, 0, 0, TimeSpan.Zero),
            },
            new Ticket
            {
                Title = "Damaged cable drum on arrival",
                Description = "One cable drum arrived with a cracked flange and cannot be safely used on site.",
                Category = TicketCategory.ReturnsComplaints,
                Priority = TicketPriority.High,
                Status = TicketStatus.New,
                CustomerName = "Maja Holm",
                CustomerEmail = "maja.holm@example.com",
                CreatedAt = new DateTimeOffset(2026, 10, 25, 9, 45, 0, TimeSpan.Zero),
            },
            new Ticket
            {
                Title = "Confirm scaffold collection",
                Description = "Confirm collection of the dismantled scaffold from the north entrance on Friday.",
                Category = TicketCategory.OrdersDeliveries,
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Closed,
                CustomerName = "Oskar Ek",
                CustomerEmail = "oskar.ek@example.com",
                CreatedAt = new DateTimeOffset(2026, 10, 24, 16, 20, 0, TimeSpan.Zero),
            });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Data;

public static class SeedData
{
    private static Ticket[] CreateTickets() =>
    [
        new()
        {
            TicketNumber = "SR-2026-1001",
            Title = "Defekt på lastkajens port",
            Description = "Lastkajens port går inte att stänga efter leverans. Kontrollera motor och säkerhetssensor.",
            Category = TicketCategory.Other,
            Priority = TicketPriority.High,
            Status = TicketStatus.New,
            CreatedAt = new DateTimeOffset(2026, 10, 20, 8, 15, 0, TimeSpan.Zero),
        },
        new()
        {
            TicketNumber = "SR-2026-1002",
            Title = "Saknade fästdon i leveransen",
            Description = "Två kollin med fästdon saknas i leveransen till arbetsplatsen. Bekräfta kompletterande leverans.",
            Category = TicketCategory.OrdersDeliveries,
            Priority = TicketPriority.Medium,
            Status = TicketStatus.InProgress,
            CreatedAt = new DateTimeOffset(2026, 10, 21, 10, 30, 0, TimeSpan.Zero),
        },
        new()
        {
            TicketNumber = "SR-2026-1003",
            Title = "Felaktig faktura för servicebesök",
            Description = "Fakturan innehåller dubbla debiteringar för arbetstid. Underlag bifogas för granskning.",
            Category = TicketCategory.Invoices,
            Priority = TicketPriority.Low,
            Status = TicketStatus.WaitingForCustomer,
            CreatedAt = new DateTimeOffset(2026, 10, 22, 13, 45, 0, TimeSpan.Zero),
        },
        new()
        {
            TicketNumber = "SR-2026-1004",
            Title = "Skadad armatur vid mottagning",
            Description = "En armatur kom fram med sprucket hölje. Önskar returfraktsedel och ersättningsprodukt.",
            Category = TicketCategory.ReturnsComplaints,
            Priority = TicketPriority.Medium,
            Status = TicketStatus.New,
            CreatedAt = new DateTimeOffset(2026, 10, 23, 7, 50, 0, TimeSpan.Zero),
        },
        new()
        {
            TicketNumber = "SR-2026-1005",
            Title = "Planera besiktning av bygghiss",
            Description = "Boka in återkommande säkerhetsbesiktning av bygghissen före nästa etappstart.",
            Category = TicketCategory.Other,
            Priority = TicketPriority.High,
            Status = TicketStatus.InProgress,
            CreatedAt = new DateTimeOffset(2026, 10, 24, 9, 0, 0, TimeSpan.Zero),
        },
    ];

    public static async Task InitializeAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken = default)
    {
        if (await dbContext.Tickets.AnyAsync(cancellationToken))
        {
            return;
        }

        dbContext.Tickets.AddRange(CreateTickets());
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
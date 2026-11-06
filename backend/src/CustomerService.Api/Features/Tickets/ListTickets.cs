using CustomerService.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Features.Tickets;

public static class ListTickets
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapGet("/", Handle)
            .WithName("ListTickets")
            .WithSummary("List tickets, newest first")
            .Produces<TicketResponse[]>();

    private static async Task<IResult> Handle(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var tickets = await dbContext.Tickets
            .AsNoTracking()
            .OrderByDescending(ticket => ticket.CreatedAt)
            .Select(ticket => new TicketResponse(
                ticket.Id,
                ticket.TicketNumber,
                ticket.Title,
                ticket.Description,
                ticket.Category,
                ticket.Priority,
                ticket.Status,
                string.Empty,
                string.Empty,
                ticket.CreatedAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(tickets);
    }
}

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
            .ThenByDescending(ticket => ticket.Id)
            .Select(ticket => new TicketResponse(
                ticket.Id,
                ticket.Title,
                ticket.Description,
                ticket.Category,
                ticket.Priority,
                ticket.Status,
                ticket.CustomerName,
                ticket.CustomerEmail,
                ticket.CreatedAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(tickets);
    }
}

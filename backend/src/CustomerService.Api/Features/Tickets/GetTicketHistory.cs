using CustomerService.Api.Data;

using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Features.Tickets;

public record TicketHistoryEventResponse(TicketEventType Type, DateTimeOffset OccurredAt);

public static class GetTicketHistory
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapGet("/{id:int}/history", Handle)
            .WithName("GetTicketHistory")
            .WithSummary("Get a ticket's history, newest first")
            .Produces<TicketHistoryEventResponse[]>()
            .ProducesProblem(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(
        int id, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        if (!await dbContext.Tickets.AnyAsync(ticket => ticket.Id == id, cancellationToken))
        {
            return Results.Problem(statusCode: StatusCodes.Status404NotFound);
        }

        var history = await dbContext.TicketEvents
            .Where(ticketEvent => ticketEvent.TicketId == id)
            .OrderByDescending(ticketEvent => ticketEvent.OccurredAt)
            .ThenByDescending(ticketEvent => ticketEvent.Id)
            .Select(ticketEvent => new TicketHistoryEventResponse(ticketEvent.Type, ticketEvent.OccurredAt))
            .ToListAsync(cancellationToken);

        return Results.Ok(history);
    }
}

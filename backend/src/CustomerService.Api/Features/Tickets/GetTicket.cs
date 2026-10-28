using CustomerService.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Features.Tickets;

public static class GetTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapGet("/{id:int}", Handle)
            .WithName("GetTicket")
            .WithSummary("Get a ticket")
            .Produces<TicketResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(
        int id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var ticket = await dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == id)
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
            .SingleOrDefaultAsync(cancellationToken);

        return ticket is null ? Results.NotFound() : Results.Ok(ticket);
    }
}

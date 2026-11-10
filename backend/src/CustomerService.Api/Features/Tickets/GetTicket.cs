using CustomerService.Api.Data;

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
        int id, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);

        return ticket is null
            ? Results.Problem(statusCode: StatusCodes.Status404NotFound)
            : Results.Ok(TicketResponse.From(ticket));
    }
}

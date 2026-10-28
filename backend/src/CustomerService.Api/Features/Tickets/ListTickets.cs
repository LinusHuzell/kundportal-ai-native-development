namespace CustomerService.Api.Features.Tickets;

public static class ListTickets
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapGet("/", Handle)
            .WithName("ListTickets")
            .WithSummary("List tickets, newest first")
            .Produces<TicketResponse[]>();

    // Stub until persistence exists.
    private static IResult Handle() => Results.StatusCode(StatusCodes.Status501NotImplemented);
}

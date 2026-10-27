namespace CustomerService.Api.Features.Tickets;

public static class GetTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapGet("/{id:int}", Handle)
            .WithName("GetTicket")
            .WithSummary("Get a ticket")
            .Produces<TicketResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

    // Stub until persistence exists.
    private static IResult Handle(int id) => Results.StatusCode(StatusCodes.Status501NotImplemented);
}

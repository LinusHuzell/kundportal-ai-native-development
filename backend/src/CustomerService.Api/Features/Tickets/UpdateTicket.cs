using System.ComponentModel.DataAnnotations;

namespace CustomerService.Api.Features.Tickets;

public record UpdateTicketRequest(
    [property: MaxLength(200)] string? Title = null,
    [property: MaxLength(5000)] string? Description = null,
    TicketCategory? Category = null,
    TicketPriority? Priority = null,
    string? CustomerName = null,
    [property: EmailAddress] string? CustomerEmail = null);

public static class UpdateTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapPatch("/{id:int}", Handle)
            .WithName("UpdateTicket")
            .WithSummary("Edit a ticket")
            .Produces<TicketResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

    // Stub until persistence exists.
    private static IResult Handle(int id, UpdateTicketRequest request) =>
        Results.StatusCode(StatusCodes.Status501NotImplemented);
}

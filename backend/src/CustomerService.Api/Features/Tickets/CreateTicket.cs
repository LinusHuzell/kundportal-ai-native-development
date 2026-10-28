using System.ComponentModel.DataAnnotations;

namespace CustomerService.Api.Features.Tickets;

// Max lengths are provisional (open question in docs/avgränsningar.md).
public record CreateTicketRequest(
    [property: Required, MaxLength(200)] string Title,
    [property: Required, MaxLength(5000)] string Description,
    [property: Required] TicketCategory Category,
    [property: Required] TicketPriority Priority,
    [property: Required] string CustomerName,
    [property: Required, EmailAddress] string CustomerEmail);

public static class CreateTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapPost("/", Handle)
            .WithName("CreateTicket")
            .WithSummary("Create a ticket with status New")
            .Produces<TicketResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

    // Stub until persistence exists.
    private static IResult Handle(CreateTicketRequest request) =>
        Results.StatusCode(StatusCodes.Status501NotImplemented);
}

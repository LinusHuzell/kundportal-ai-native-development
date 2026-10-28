using System.ComponentModel.DataAnnotations;

namespace CustomerService.Api.Features.Tickets;

public record UpdateStatusRequest([property: Required] TicketStatus Status);

public static class UpdateTicketStatus
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapPut("/{id:int}/status", Handle)
            .WithName("UpdateTicketStatus")
            .WithSummary("Change ticket status")
            .Produces<TicketResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

    // Stub until persistence exists.
    private static IResult Handle(int id, UpdateStatusRequest request) =>
        Results.StatusCode(StatusCodes.Status501NotImplemented);
}

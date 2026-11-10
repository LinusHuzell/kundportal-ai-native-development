using System.ComponentModel.DataAnnotations;

namespace CustomerService.Api.Features.Tickets;

// Status is a string so that a missing or unknown value gets a field error instead of a JSON
// error. The attribute only documents the contract in OpenAPI; UpdateTicketStatusValidator
// enforces the rules.
public record UpdateStatusRequest([property: Required] string? Status);

// Rules and messages come from the Felfall table in docs/specs/visa-ärende-och-ändra-status.md.
public static class UpdateTicketStatusValidator
{
    // Placeholder until the rules are implemented.
    public static Dictionary<string, string[]> Validate(UpdateStatusRequest request) =>
        new() { ["status"] = ["Not implemented"] };
}

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

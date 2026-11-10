using System.ComponentModel.DataAnnotations;
using CustomerService.Api.Data;

namespace CustomerService.Api.Features.Tickets;

// Status is a string so that a missing or unknown value gets a field error instead of a JSON
// error. The attribute only documents the contract in OpenAPI; UpdateTicketStatusValidator
// enforces the rules.
public record UpdateStatusRequest([property: Required] string? Status);

// Rules and messages come from the Felfall table in docs/specs/visa-ärende-och-ändra-status.md.
public static class UpdateTicketStatusValidator
{
    public static Dictionary<string, string[]> Validate(UpdateStatusRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (request.Status == nameof(TicketStatus.New))
            errors["status"] = ["Status kan inte ändras till Nytt"];
        // Exact, case-sensitive name match. Enum.TryParse would also accept "1" and "new".
        else if (request.Status is null || !Enum.GetNames<TicketStatus>().Contains(request.Status))
            errors["status"] = ["Välj en giltig status"];

        return errors;
    }
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

    private static async Task<IResult> Handle(
        int id, UpdateStatusRequest request, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var errors = UpdateTicketStatusValidator.Validate(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return Results.Problem(statusCode: StatusCodes.Status404NotFound);
        }

        ticket.Status = Enum.Parse<TicketStatus>(request.Status!);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(TicketResponse.From(ticket));
    }
}

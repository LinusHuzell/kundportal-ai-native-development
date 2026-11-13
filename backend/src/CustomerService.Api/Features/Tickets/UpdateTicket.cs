using System.ComponentModel.DataAnnotations;

using CustomerService.Api.Data;

namespace CustomerService.Api.Features.Tickets;

// A missing or null field means "do not change". Category and priority are strings so that an
// unknown value gets a field error instead of a JSON error. The attributes only document the
// contract in OpenAPI; UpdateTicketValidator enforces the rules.
public record UpdateTicketRequest(
    [property: MaxLength(Ticket.TitleMaxLength)] string? Title = null,
    [property: MaxLength(Ticket.DescriptionMaxLength)] string? Description = null,
    string? Category = null,
    string? Priority = null,
    string? CustomerName = null,
    string? CustomerEmail = null);

// Only sent (non-null) fields are checked, with the same rules as CreateTicketValidator
// (TicketFieldRules). An empty string is sent, so it is checked and rejected.
public static class UpdateTicketValidator
{
    public static Dictionary<string, string[]> Validate(UpdateTicketRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        void Check(string field, string? value, Func<string?, string?> rule)
        {
            if (value is not null && rule(value) is { } message)
                errors[field] = [message];
        }

        Check("title", request.Title, TicketFieldRules.Title);
        Check("description", request.Description, TicketFieldRules.Description);
        Check("category", request.Category, TicketFieldRules.Category);
        Check("priority", request.Priority, TicketFieldRules.Priority);
        Check("customerName", request.CustomerName, TicketFieldRules.CustomerName);
        Check("customerEmail", request.CustomerEmail, TicketFieldRules.CustomerEmail);

        return errors;
    }
}

public static class UpdateTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapPatch("/{id:int}", Handle)
            .WithName("UpdateTicket")
            .WithSummary("Edit a ticket")
            .Produces<TicketResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

    // Validates before looking up the ticket, like UpdateTicketStatus: an invalid request gives 400
    // even for an unknown id. Status, id, ticketNumber and createdAt are not in the request, so they
    // are ignored if sent. Editing creates no history event (docs/specs/redigera-ärende.md).
    private static async Task<IResult> Handle(
        int id, UpdateTicketRequest request, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var errors = UpdateTicketValidator.Validate(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return Results.Problem(statusCode: StatusCodes.Status404NotFound);
        }

        if (request.Title is not null) ticket.Title = request.Title;
        if (request.Description is not null) ticket.Description = request.Description;
        if (request.Category is not null) ticket.Category = Enum.Parse<TicketCategory>(request.Category);
        if (request.Priority is not null) ticket.Priority = Enum.Parse<TicketPriority>(request.Priority);
        if (request.CustomerName is not null) ticket.CustomerName = request.CustomerName;
        if (request.CustomerEmail is not null) ticket.CustomerEmail = request.CustomerEmail;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(TicketResponse.From(ticket));
    }
}

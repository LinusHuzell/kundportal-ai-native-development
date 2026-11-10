using System.ComponentModel.DataAnnotations;

using CustomerService.Api.Data;

using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Features.Tickets;

// Category and priority are strings so that a missing or unknown value gets a field error
// instead of a JSON error. The attributes only document the contract in OpenAPI;
// CreateTicketValidator enforces the rules.
public record CreateTicketRequest(
    [property: Required, MaxLength(200)] string? Title,
    [property: Required, MaxLength(5000)] string? Description,
    [property: Required] string? Category,
    [property: Required] string? Priority,
    [property: Required] string? CustomerName,
    [property: Required] string? CustomerEmail);

// Every field is required, so every rule runs, also for a missing (null) field.
// The rules themselves are in TicketFieldRules.
public static class CreateTicketValidator
{
    public static Dictionary<string, string[]> Validate(CreateTicketRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        void Check(string field, string? message)
        {
            if (message is not null)
                errors[field] = [message];
        }

        Check("title", TicketFieldRules.Title(request.Title));
        Check("description", TicketFieldRules.Description(request.Description));
        Check("category", TicketFieldRules.Category(request.Category));
        Check("priority", TicketFieldRules.Priority(request.Priority));
        Check("customerName", TicketFieldRules.CustomerName(request.CustomerName));
        Check("customerEmail", TicketFieldRules.CustomerEmail(request.CustomerEmail));

        return errors;
    }
}

public static class CreateTicket
{
    public static void Map(RouteGroupBuilder group) =>
        group.MapPost("/", Handle)
            .WithName("CreateTicket")
            .WithSummary("Create a ticket with status New")
            .Produces<TicketResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

    private static async Task<IResult> Handle(
        CreateTicketRequest request, ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var errors = CreateTicketValidator.Validate(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        // The ticket number is built from the id, so take the id from the sequence before inserting.
        var id = await dbContext.Database
            .SqlQuery<int>($"""SELECT nextval(pg_get_serial_sequence('"Tickets"', 'Id'))::int AS "Value" """)
            .SingleAsync(cancellationToken);
        var createdAt = DateTimeOffset.UtcNow;

        var ticket = new Ticket
        {
            Id = id,
            TicketNumber = $"SR-{createdAt.Year}-{1000 + id}",
            Title = request.Title!,
            Description = request.Description!,
            Category = Enum.Parse<TicketCategory>(request.Category!),
            Priority = Enum.Parse<TicketPriority>(request.Priority!),
            Status = TicketStatus.New,
            CustomerName = request.CustomerName!,
            CustomerEmail = request.CustomerEmail!,
            CreatedAt = createdAt,
        };
        dbContext.Tickets.Add(ticket);
        // Same SaveChangesAsync as the ticket, so both rows are saved or neither is.
        dbContext.TicketEvents.Add(new TicketEvent
        {
            TicketId = id,
            Type = TicketEventType.Created,
            OccurredAt = createdAt,
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/tickets/{ticket.Id}", new TicketResponse(
            ticket.Id,
            ticket.TicketNumber,
            ticket.Title,
            ticket.Description,
            ticket.Category,
            ticket.Priority,
            ticket.Status,
            ticket.CustomerName,
            ticket.CustomerEmail,
            ticket.CreatedAt));
    }
}

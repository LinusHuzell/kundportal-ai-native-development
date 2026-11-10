using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

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

// Rules and messages come from the Felfall table in docs/specs/registrera-ärende.md.
public static partial class CreateTicketValidator
{
    public static Dictionary<string, string[]> Validate(CreateTicketRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        void Add(string field, string message) => errors[field] = [message];

        if (string.IsNullOrWhiteSpace(request.Title))
            Add("title", "Rubrik måste fyllas i");
        else if (request.Title.Length > 200)
            Add("title", "Rubrik får vara högst 200 tecken");

        if (string.IsNullOrWhiteSpace(request.Description))
            Add("description", "Beskrivning måste fyllas i");
        else if (request.Description.Length > 5000)
            Add("description", "Beskrivning får vara högst 5000 tecken");

        if (!IsEnumName<TicketCategory>(request.Category))
            Add("category", "Välj en kategori");

        if (!IsEnumName<TicketPriority>(request.Priority))
            Add("priority", "Välj en prioritet");

        if (string.IsNullOrWhiteSpace(request.CustomerName))
            Add("customerName", "Namn måste fyllas i");

        if (string.IsNullOrWhiteSpace(request.CustomerEmail))
            Add("customerEmail", "E-postadress måste fyllas i");
        else if (!EmailFormat().IsMatch(request.CustomerEmail))
            Add("customerEmail", "Ange en giltig e-postadress");

        return errors;
    }

    // Exact, case-sensitive name match. Enum.TryParse would also accept "1" and "Low, High".
    private static bool IsEnumName<TEnum>(string? value) where TEnum : struct, Enum =>
        value is not null && Enum.GetNames<TEnum>().Contains(value);

    // The spec regex, with \z instead of $: in .NET, $ also matches before a trailing newline,
    // which JavaScript (the frontend) does not.
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+\z")]
    private static partial Regex EmailFormat();
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

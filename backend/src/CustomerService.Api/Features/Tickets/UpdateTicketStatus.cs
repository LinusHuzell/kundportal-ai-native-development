using System.ComponentModel.DataAnnotations;
using CustomerService.Api.Data;
using Microsoft.EntityFrameworkCore;

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

    private static async Task<IResult> Handle(
        int id,
        UpdateStatusRequest request,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var ticket = await dbContext.Tickets
            .SingleOrDefaultAsync(ticket => ticket.Id == id, cancellationToken);

        if (ticket is null)
        {
            return Results.NotFound();
        }

        ticket.Status = request.Status;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new TicketResponse(
            ticket.Id,
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

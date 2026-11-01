using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.Data;

public class Ticket
{
    public int Id { get; set; }
    public required string TicketNumber { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
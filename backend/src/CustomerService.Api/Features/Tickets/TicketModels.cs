using CustomerService.Api.Data;

namespace CustomerService.Api.Features.Tickets;

public enum TicketStatus { New, InProgress, WaitingForCustomer, Closed }

public enum TicketPriority { Low, Medium, High }

public enum TicketCategory { OrdersDeliveries, Invoices, ReturnsComplaints, Other }

public record TicketResponse(
    int Id,
    string TicketNumber,
    string Title,
    string Description,
    TicketCategory Category,
    TicketPriority Priority,
    TicketStatus Status,
    string CustomerName,
    string CustomerEmail,
    DateTimeOffset CreatedAt)
{
    public static TicketResponse From(Ticket ticket) => new(
        ticket.Id,
        ticket.Title,
        ticket.Description,
        ticket.Category,
        ticket.Priority,
        ticket.Status,
        ticket.CustomerName,
        ticket.CustomerEmail,
        ticket.CreatedAt);
}

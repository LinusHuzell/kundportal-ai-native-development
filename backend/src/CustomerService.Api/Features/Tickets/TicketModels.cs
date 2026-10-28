namespace CustomerService.Api.Features.Tickets;

public enum TicketStatus { New, InProgress, WaitingForCustomer, Closed }

public enum TicketPriority { Low, Medium, High }

public enum TicketCategory { OrdersDeliveries, Invoices, ReturnsComplaints, Other }

public record TicketResponse(
    int Id,
    string Title,
    string Description,
    TicketCategory Category,
    TicketPriority Priority,
    TicketStatus Status,
    string CustomerName,
    string CustomerEmail,
    DateTimeOffset CreatedAt);

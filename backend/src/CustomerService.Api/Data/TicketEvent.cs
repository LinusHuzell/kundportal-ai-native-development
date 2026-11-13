using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.Data;

public enum TicketEventType { Created, StatusChanged }

public class TicketEvent
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public TicketEventType Type { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public TicketStatus? FromStatus { get; set; }
    public TicketStatus? ToStatus { get; set; }
}

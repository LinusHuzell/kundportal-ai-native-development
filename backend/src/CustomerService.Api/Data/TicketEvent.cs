namespace CustomerService.Api.Data;

public enum TicketEventType { Created }

public class TicketEvent
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public TicketEventType Type { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}

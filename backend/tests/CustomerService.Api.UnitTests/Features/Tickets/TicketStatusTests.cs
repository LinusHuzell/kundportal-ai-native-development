using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.UnitTests.Features.Tickets;

public class TicketStatusTests
{
    [Fact]
    public void Ticket_has_the_four_agreed_statuses_in_workflow_order()
    {
        Assert.Equal(
            new[] { "New", "InProgress", "WaitingForCustomer", "Closed" },
            Enum.GetNames<TicketStatus>());
    }
}

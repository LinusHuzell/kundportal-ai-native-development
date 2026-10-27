namespace CustomerService.Api.Features.Tickets;

public static class TicketsEndpoints
{
    public static IEndpointRouteBuilder MapTickets(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets").WithTags("Tickets");

        ListTickets.Map(group);
        GetTicket.Map(group);
        CreateTicket.Map(group);
        UpdateTicket.Map(group);
        UpdateTicketStatus.Map(group);

        return app;
    }
}

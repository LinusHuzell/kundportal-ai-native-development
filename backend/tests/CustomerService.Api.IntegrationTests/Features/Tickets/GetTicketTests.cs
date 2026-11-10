using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

// GET /api/tickets/{id}, AK-13 and AK-14 in docs/specs/visa-ärende-och-ändra-status.md.
public sealed class GetTicketTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    private async Task<JsonElement> CreateTicketAsync()
    {
        var response = await Fixture.Factory.CreateClient().PostAsJsonAsync("/api/tickets", new
        {
            title = "Paketet har inte kommit",
            description = "Beställde för två veckor sedan.",
            category = "OrdersDeliveries",
            priority = "High",
            customerName = "Anna Andersson",
            customerEmail = "anna@example.com",
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task ExistingTicketReturns200WithAllFields()
    {
        var created = await CreateTicketAsync();

        var response = await Fixture.Factory.CreateClient().GetAsync($"/api/tickets/{created.GetProperty("id")}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            ["category", "createdAt", "customerEmail", "customerName", "description", "id", "priority", "status", "title"],
            ticket.EnumerateObject().Select(p => p.Name).Order());
        foreach (var field in created.EnumerateObject().Where(p => p.Name != "createdAt"))
        {
            Assert.True(JsonElement.DeepEquals(field.Value, ticket.GetProperty(field.Name)), field.Name);
        }
        // The POST response has createdAt from memory (100 ns precision); Postgres stores microseconds.
        Assert.Equal(
            created.GetProperty("createdAt").GetDateTimeOffset(),
            ticket.GetProperty("createdAt").GetDateTimeOffset(),
            TimeSpan.FromMicroseconds(1));
    }

    [Fact]
    public async Task UnknownIdReturns404AsProblemJson()
    {
        var response = await Fixture.Factory.CreateClient().GetAsync("/api/tickets/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.False(problem.TryGetProperty("errors", out _));
    }
}

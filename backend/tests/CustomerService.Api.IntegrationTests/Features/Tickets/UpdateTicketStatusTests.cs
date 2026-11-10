using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

// PUT /api/tickets/{id}/status, AK-15 to AK-19 in docs/specs/visa-ärende-och-ändra-status.md.
public sealed class UpdateTicketStatusTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    private async Task<int> CreateTicketAsync()
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
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
    }

    private Task<HttpResponseMessage> PutStatusAsync(int id, string json) =>
        Fixture.Factory.CreateClient().PutAsync(
            $"/api/tickets/{id}/status", new StringContent(json, Encoding.UTF8, "application/json"));

    private async Task<JsonElement> GetTicketAsync(int id)
    {
        var response = await Fixture.Factory.CreateClient().GetAsync($"/api/tickets/{id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<int> CreateTicketWithStatusInProgressAsync()
    {
        var id = await CreateTicketAsync();
        var response = await PutStatusAsync(id, """{"status":"InProgress"}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("InProgress", (await GetTicketAsync(id)).GetProperty("status").GetString());
        return id;
    }

    private static async Task AssertStatusErrorAsync(HttpResponseMessage response, string message)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.Equal(["status"], problem!.Errors.Keys);
        Assert.Equal([message], problem.Errors["status"]);
    }

    [Fact]
    public async Task ValidStatusReturns200WithTicketAndNewStatus()
    {
        var id = await CreateTicketAsync();

        var response = await PutStatusAsync(id, """{"status":"WaitingForCustomer"}""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, ticket.GetProperty("id").GetInt32());
        Assert.Equal("Paketet har inte kommit", ticket.GetProperty("title").GetString());
        Assert.Equal("WaitingForCustomer", ticket.GetProperty("status").GetString());
    }

    [Fact]
    public async Task ValidStatusIsSaved()
    {
        var id = await CreateTicketAsync();

        await PutStatusAsync(id, """{"status":"WaitingForCustomer"}""");

        Assert.Equal("WaitingForCustomer", (await GetTicketAsync(id)).GetProperty("status").GetString());
    }

    [Fact]
    public async Task SameStatusReturns200AndLeavesTicketUnchanged()
    {
        var id = await CreateTicketWithStatusInProgressAsync();
        var before = await GetTicketAsync(id);

        var response = await PutStatusAsync(id, """{"status":"InProgress"}""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(JsonElement.DeepEquals(before, await response.Content.ReadFromJsonAsync<JsonElement>()));
        Assert.True(JsonElement.DeepEquals(before, await GetTicketAsync(id)));
    }

    [Fact]
    public async Task NewReturns400OnStatusAndLeavesStatusUnchanged()
    {
        var id = await CreateTicketWithStatusInProgressAsync();

        var response = await PutStatusAsync(id, """{"status":"New"}""");

        await AssertStatusErrorAsync(response, "Status kan inte ändras till Nytt");
        Assert.Equal("InProgress", (await GetTicketAsync(id)).GetProperty("status").GetString());
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"status":""}""")]
    [InlineData("""{"status":"Foo"}""")]
    public async Task MissingEmptyOrUnknownStatusReturns400OnStatusAndLeavesStatusUnchanged(string json)
    {
        var id = await CreateTicketAsync();

        var response = await PutStatusAsync(id, json);

        await AssertStatusErrorAsync(response, "Välj en giltig status");
        Assert.Equal("New", (await GetTicketAsync(id)).GetProperty("status").GetString());
    }

    [Fact]
    public async Task UnknownIdReturns404AsProblemJson()
    {
        var response = await PutStatusAsync(999, """{"status":"InProgress"}""");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.False(problem.TryGetProperty("errors", out _));
    }
}

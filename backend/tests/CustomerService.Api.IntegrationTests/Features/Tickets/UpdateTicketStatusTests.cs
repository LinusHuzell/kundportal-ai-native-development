using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

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

    private async Task<JsonElement[]> GetHistoryAsync(int id)
    {
        var response = await Fixture.Factory.CreateClient().GetAsync($"/api/tickets/{id}/history");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToArray();
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

    // Status-change history, AK-1 to AK-4 and AK-6 in docs/specs/ärendehistorik-statusändringar.md.
    [Fact]
    public async Task ChangedStatusAddsStatusChangedEventWithSwedishLabels()
    {
        var id = await CreateTicketAsync();
        var before = DateTimeOffset.UtcNow;

        await PutStatusAsync(id, """{"status":"WaitingForCustomer"}""");

        var statusChanged = Assert.Single(
            await GetHistoryAsync(id), e => e.GetProperty("type").GetString() == "StatusChanged");
        Assert.Equal("Nytt", statusChanged.GetProperty("fromStatus").GetString());
        Assert.Equal("Väntar på kund", statusChanged.GetProperty("toStatus").GetString());
        var occurredAt = statusChanged.GetProperty("occurredAt").GetDateTimeOffset();
        Assert.InRange(occurredAt, before.AddSeconds(-1), DateTimeOffset.UtcNow.AddSeconds(1));
    }

    [Theory]
    [InlineData("InProgress", "Pågående")]
    [InlineData("Closed", "Avslutat")]
    public async Task EachTargetStatusIsReportedWithItsSwedishLabel(string status, string label)
    {
        var id = await CreateTicketAsync();

        await PutStatusAsync(id, $$"""{"status":"{{status}}"}""");

        var statusChanged = Assert.Single(
            await GetHistoryAsync(id), e => e.GetProperty("type").GetString() == "StatusChanged");
        Assert.Equal(label, statusChanged.GetProperty("toStatus").GetString());
    }

    [Fact]
    public async Task StatusAndStatusChangedEventArePersistedTogetherWithTheSameTimestamp()
    {
        var id = await CreateTicketAsync();

        await PutStatusAsync(id, """{"status":"Closed"}""");

        await using var dbContext = Fixture.CreateDbContext();
        var ticket = await dbContext.Tickets.SingleAsync(t => t.Id == id);
        var events = await dbContext.TicketEvents.Where(e => e.TicketId == id).ToListAsync();
        Assert.Equal(TicketStatus.Closed, ticket.Status);
        Assert.Equal(2, events.Count);
        var statusChanged = Assert.Single(events, e => e.Type.ToString() == "StatusChanged");
        Assert.True(statusChanged.OccurredAt >= ticket.CreatedAt);
        Assert.Equal(ticket.CreatedAt, events.Single(e => e.Type == TicketEventType.Created).OccurredAt);
    }

    [Fact]
    public async Task SameStatusAddsNoStatusChangedEvent()
    {
        var id = await CreateTicketWithStatusInProgressAsync();

        await PutStatusAsync(id, """{"status":"InProgress"}""");

        var history = await GetHistoryAsync(id);
        Assert.Single(history, e => e.GetProperty("type").GetString() == "StatusChanged");
    }

    [Fact]
    public async Task RejectedStatusAddsNoStatusChangedEvent()
    {
        var id = await CreateTicketAsync();

        await PutStatusAsync(id, """{"status":"New"}""");
        await PutStatusAsync(id, """{"status":"Foo"}""");

        var history = await GetHistoryAsync(id);
        Assert.Equal(["Created"], history.Select(e => e.GetProperty("type").GetString()));
    }

    [Fact]
    public async Task UnknownTicketCreatesNoEvent()
    {
        await PutStatusAsync(999, """{"status":"InProgress"}""");

        await using var dbContext = Fixture.CreateDbContext();
        Assert.Empty(await dbContext.TicketEvents.ToListAsync());
    }

    [Fact]
    public async Task HistoryListsStatusChangesNewestFirstBeforeCreated()
    {
        var id = await CreateTicketAsync();
        await PutStatusAsync(id, """{"status":"InProgress"}""");
        await PutStatusAsync(id, """{"status":"Closed"}""");

        var history = await GetHistoryAsync(id);

        Assert.Equal(
            ["StatusChanged", "StatusChanged", "Created"],
            history.Select(e => e.GetProperty("type").GetString()));
        Assert.Equal("Avslutat", history[0].GetProperty("toStatus").GetString());
        Assert.Equal("Pågående", history[1].GetProperty("toStatus").GetString());
    }

    [Fact]
    public async Task StatusChangedEventHasTypeTimestampAndStatusFieldsAndCreatedKeepsItsShape()
    {
        var id = await CreateTicketAsync();
        await PutStatusAsync(id, """{"status":"InProgress"}""");

        var history = await GetHistoryAsync(id);

        Assert.Equal(
            ["fromStatus", "occurredAt", "toStatus", "type"],
            history[0].EnumerateObject().Select(p => p.Name).Order());
        Assert.Equal(
            ["occurredAt", "type"],
            history[1].EnumerateObject().Select(p => p.Name).Order());
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

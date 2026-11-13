using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;

using Microsoft.AspNetCore.Http;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

// PATCH /api/tickets/{id}, the backend part of AK-1 and AK-2, and AK-4 to AK-6 and Gränsfall
// in docs/specs/redigera-ärende.md.
public sealed class UpdateTicketTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    private async Task<int> CreateTicketAsync()
    {
        var response = await Fixture.Factory.CreateClient().PostAsJsonAsync("/api/tickets", new
        {
            title = "Paketet har inte kommit",
            description = "Beställde för två veckor sedan.",
            category = "OrdersDeliveries",
            priority = "Medium",
            customerName = "Anna Andersson",
            customerEmail = "anna@example.com",
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
    }

    private Task<HttpResponseMessage> PatchAsync(int id, string json) =>
        Fixture.Factory.CreateClient().PatchAsync(
            $"/api/tickets/{id}", new StringContent(json, Encoding.UTF8, "application/json"));

    private Task<HttpResponseMessage> PatchAsync(int id, Dictionary<string, object?> body) =>
        Fixture.Factory.CreateClient().PatchAsJsonAsync($"/api/tickets/{id}", body);

    // Reads with a new DbContext, never the one the app wrote with.
    private async Task<Ticket> ReadTicketAsync(int id)
    {
        await using var dbContext = Fixture.CreateDbContext();
        var ticket = await dbContext.Tickets.FindAsync(id);
        Assert.NotNull(ticket);
        return ticket;
    }

    private static async Task AssertValidationErrorOnlyForAsync(
        HttpResponseMessage response, string field, string message)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.Equal([field], problem!.Errors.Keys);
        Assert.Equal([message], problem.Errors[field]);
    }

    [Fact]
    public async Task ValidChangeOfOneFieldReturns200WithNewValueAndOtherFieldsUnchanged()
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, """{"title":"Paketet kom fram trasigt"}""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, ticket.GetProperty("id").GetInt32());
        Assert.Equal("Paketet kom fram trasigt", ticket.GetProperty("title").GetString());
        Assert.Equal("Beställde för två veckor sedan.", ticket.GetProperty("description").GetString());
        Assert.Equal("OrdersDeliveries", ticket.GetProperty("category").GetString());
        Assert.Equal("Medium", ticket.GetProperty("priority").GetString());
        Assert.Equal("Anna Andersson", ticket.GetProperty("customerName").GetString());
        Assert.Equal("anna@example.com", ticket.GetProperty("customerEmail").GetString());

        // before is detached (its DbContext is disposed), so it can be used as the expected value.
        before.Title = "Paketet kom fram trasigt";
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Fact]
    public async Task ValidChangeOfAllSixFieldsReturns200AndSavesAllNewValues()
    {
        var id = await CreateTicketAsync();

        var response = await PatchAsync(id, """
            {
              "title": "Fel belopp på fakturan",
              "description": "Fakturan är på 500 kr för mycket.",
              "category": "Invoices",
              "priority": "High",
              "customerName": "Bo Berg",
              "customerEmail": "bo@example.se"
            }
            """);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Fel belopp på fakturan", ticket.GetProperty("title").GetString());
        Assert.Equal("Fakturan är på 500 kr för mycket.", ticket.GetProperty("description").GetString());
        Assert.Equal("Invoices", ticket.GetProperty("category").GetString());
        Assert.Equal("High", ticket.GetProperty("priority").GetString());
        Assert.Equal("Bo Berg", ticket.GetProperty("customerName").GetString());
        Assert.Equal("bo@example.se", ticket.GetProperty("customerEmail").GetString());

        var saved = await ReadTicketAsync(id);
        Assert.Equal("Fel belopp på fakturan", saved.Title);
        Assert.Equal("Fakturan är på 500 kr för mycket.", saved.Description);
        Assert.Equal(TicketCategory.Invoices, saved.Category);
        Assert.Equal(TicketPriority.High, saved.Priority);
        Assert.Equal("Bo Berg", saved.CustomerName);
        Assert.Equal("bo@example.se", saved.CustomerEmail);
    }

    [Theory]
    [InlineData("title", "", "Rubrik måste fyllas i")]
    [InlineData("description", "   ", "Beskrivning måste fyllas i")]
    [InlineData("category", "Foo", "Välj en kategori")]
    [InlineData("priority", "medium", "Välj en prioritet")]
    [InlineData("customerName", "   ", "Namn måste fyllas i")]
    [InlineData("customerEmail", "", "E-postadress måste fyllas i")]
    [InlineData("customerEmail", "anna@example", "Ange en giltig e-postadress")]
    public async Task InvalidValueReturns400OnThatFieldAndLeavesTicketUnchanged(
        string field, string value, string message)
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, new Dictionary<string, object?> { [field] = value });

        await AssertValidationErrorOnlyForAsync(response, field, message);
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Theory]
    [InlineData("title", 201, "Rubrik får vara högst 200 tecken")]
    [InlineData("description", 5001, "Beskrivning får vara högst 5000 tecken")]
    public async Task TooLongValueReturns400OnThatFieldAndLeavesTicketUnchanged(
        string field, int length, string message)
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, new Dictionary<string, object?> { [field] = new string('a', length) });

        await AssertValidationErrorOnlyForAsync(response, field, message);
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Fact]
    public async Task ValidAndInvalidFieldTogetherReturns400AndSavesNeither()
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, """{"title":"Ny rubrik","customerEmail":"anna"}""");

        await AssertValidationErrorOnlyForAsync(response, "customerEmail", "Ange en giltig e-postadress");
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Fact]
    public async Task UnknownIdReturns404AsProblemJson()
    {
        var response = await PatchAsync(999, """{"title":"Ny rubrik"}""");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.False(problem.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task UnknownIdWithInvalidFieldReturns400BecauseValidationComesFirst()
    {
        var response = await PatchAsync(999, """{"title":""}""");

        await AssertValidationErrorOnlyForAsync(response, "title", "Rubrik måste fyllas i");
    }

    [Fact]
    public async Task StatusIdTicketNumberAndCreatedAtInRequestAreIgnored()
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, """
            {
              "title": "Ny rubrik",
              "status": "Closed",
              "id": 4242,
              "ticketNumber": "SR-1999-9999",
              "createdAt": "1999-01-01T00:00:00Z"
            }
            """);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, ticket.GetProperty("id").GetInt32());
        Assert.Equal("New", ticket.GetProperty("status").GetString());
        Assert.Equal(before.TicketNumber, ticket.GetProperty("ticketNumber").GetString());
        Assert.Equal(before.CreatedAt, ticket.GetProperty("createdAt").GetDateTimeOffset());
        before.Title = "Ny rubrik";
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("""{"title":null,"description":null,"category":null,"priority":null,"customerName":null,"customerEmail":null}""")]
    public async Task RequestWithNoFieldsReturns200AndUnchangedTicket(string json)
    {
        var id = await CreateTicketAsync();
        var before = await ReadTicketAsync(id);

        var response = await PatchAsync(id, json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, ticket.GetProperty("id").GetInt32());
        Assert.Equal(before.Title, ticket.GetProperty("title").GetString());
        Assert.Equal(before.CustomerEmail, ticket.GetProperty("customerEmail").GetString());
        Assert.Equivalent(before, await ReadTicketAsync(id), strict: true);
    }

    [Fact]
    public async Task EditCreatesNoHistoryEvent()
    {
        var id = await CreateTicketAsync();

        var response = await PatchAsync(id, """{"title":"Ny rubrik"}""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await Fixture.Factory.CreateClient().GetFromJsonAsync<JsonElement>($"/api/tickets/{id}/history");
        var only = Assert.Single(history.EnumerateArray());
        Assert.Equal("Created", only.GetProperty("type").GetString());
    }
}

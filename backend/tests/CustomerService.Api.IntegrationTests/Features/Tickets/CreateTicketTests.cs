using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CustomerService.Api.Features.Tickets;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.IntegrationTests.Features.Tickets;

// POST /api/tickets, AK-1, AK-2, AK-4, AK-5 and AK-6 in docs/specs/registrera-ärende.md.
public sealed class CreateTicketTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    private static Dictionary<string, object?> ValidBody() => new()
    {
        ["title"] = "Paketet har inte kommit",
        ["description"] = "Beställde för två veckor sedan.",
        ["category"] = "OrdersDeliveries",
        ["priority"] = "Medium",
        ["customerName"] = "Anna Andersson",
        ["customerEmail"] = "anna@example.com",
    };

    private Task<HttpResponseMessage> PostAsync(Dictionary<string, object?> body) =>
        Fixture.Factory.CreateClient().PostAsJsonAsync("/api/tickets", body);

    private async Task AssertNoTicketsSavedAsync()
    {
        await using var dbContext = Fixture.CreateDbContext();
        Assert.Empty(await dbContext.Tickets.ToListAsync());
    }

    private async Task AssertValidationErrorOnlyForAsync(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.Equal([field], problem!.Errors.Keys);
    }

    [Fact]
    public async Task ValidRequestReturns201WithLocationAndNewTicket()
    {
        var before = DateTimeOffset.UtcNow;

        var response = await PostAsync(ValidBody());

        var after = DateTimeOffset.UtcNow;
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var ticket = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = ticket.GetProperty("id").GetInt32();
        Assert.Equal($"/api/tickets/{id}", response.Headers.Location?.OriginalString);
        Assert.Equal("New", ticket.GetProperty("status").GetString());
        var createdAt = ticket.GetProperty("createdAt").GetDateTimeOffset();
        Assert.InRange(createdAt, before, after);
        Assert.True(ticket.TryGetProperty("ticketNumber", out var ticketNumber), "ticketNumber saknas i svaret");
        Assert.Equal($"SR-{createdAt.UtcDateTime.Year}-{1000 + id}", ticketNumber.GetString());
        Assert.Equal("Paketet har inte kommit", ticket.GetProperty("title").GetString());
        Assert.Equal("anna@example.com", ticket.GetProperty("customerEmail").GetString());
    }

    [Fact]
    public async Task ValidRequestSavesTicketWithStatusNewAndAllFields()
    {
        var response = await PostAsync(ValidBody());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var dbContext = Fixture.CreateDbContext();
        var ticket = Assert.Single(await dbContext.Tickets.ToListAsync());
        Assert.Equal("Paketet har inte kommit", ticket.Title);
        Assert.Equal("Beställde för två veckor sedan.", ticket.Description);
        Assert.Equal(TicketCategory.OrdersDeliveries, ticket.Category);
        Assert.Equal(TicketStatus.New, ticket.Status);
        Assert.Equal("Anna Andersson", ticket.CustomerName);
        Assert.Equal("anna@example.com", ticket.CustomerEmail);
        Assert.Equal($"SR-{ticket.CreatedAt.UtcDateTime.Year}-1001", ticket.TicketNumber);
    }

    [Fact]
    public async Task PriorityMediumIsSavedAsMedium()
    {
        var body = ValidBody();
        body["priority"] = "Medium";

        var response = await PostAsync(body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var dbContext = Fixture.CreateDbContext();
        Assert.Equal(TicketPriority.Medium, Assert.Single(await dbContext.Tickets.ToListAsync()).Priority);
    }

    [Theory]
    [InlineData("title", "   ")]
    [InlineData("description", "   ")]
    [InlineData("category", "Foo")]
    [InlineData("priority", "medium")]
    [InlineData("customerName", "   ")]
    [InlineData("customerEmail", "   ")]
    [InlineData("customerEmail", "anna@example")]
    public async Task InvalidValueReturns400OnThatFieldAndSavesNothing(string field, string value)
    {
        var body = ValidBody();
        body[field] = value;

        var response = await PostAsync(body);

        await AssertValidationErrorOnlyForAsync(response, field);
        await AssertNoTicketsSavedAsync();
    }

    [Theory]
    [InlineData("title", 201)]
    [InlineData("description", 5001)]
    public async Task TooLongValueReturns400OnThatFieldAndSavesNothing(string field, int length)
    {
        var body = ValidBody();
        body[field] = new string('a', length);

        var response = await PostAsync(body);

        await AssertValidationErrorOnlyForAsync(response, field);
        await AssertNoTicketsSavedAsync();
    }

    [Theory]
    [InlineData("category")]
    [InlineData("priority")]
    public async Task MissingFieldReturns400OnThatFieldAndSavesNothing(string field)
    {
        var body = ValidBody();
        body.Remove(field);

        var response = await PostAsync(body);

        await AssertValidationErrorOnlyForAsync(response, field);
        await AssertNoTicketsSavedAsync();
    }

    [Fact]
    public async Task SavedTicketIsStillThereAfterTheAppRestarts()
    {
        var response = await PostAsync(ValidBody());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using (var dbContext = Fixture.CreateDbContext())
        {
            var connectionString = dbContext.Database.GetConnectionString();
            await using var restartedApp = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
                builder.UseSetting("ConnectionStrings:DefaultConnection", connectionString));
            _ = restartedApp.Server;
        }

        await using var readContext = Fixture.CreateDbContext();
        var ticket = Assert.Single(await readContext.Tickets.ToListAsync());
        Assert.Equal("Paketet har inte kommit", ticket.Title);
    }
}

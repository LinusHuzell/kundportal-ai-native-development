using System.Text.Json.Serialization;
using CustomerService.Api.Data;
using CustomerService.Api.Features.Tickets;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerService.Api.UnitTests.Infrastructure;

public sealed class TicketApiFactory : IAsyncDisposable
{
    private readonly WebApplication _application;

    private TicketApiFactory(WebApplication application)
    {
        _application = application;
        Client = application.GetTestClient();
    }

    public HttpClient Client { get; }

    public static async Task<TicketApiFactory> CreateAsync(params Ticket[] tickets)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing",
        });
        var databaseName = $"ticket-tests-{Guid.NewGuid():N}";

        builder.WebHost.UseTestServer();
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(databaseName));
        builder.Services.ConfigureHttpJsonOptions(options =>
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        var application = builder.Build();
        application.MapTickets();

        await using (var scope = application.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.EnsureCreatedAsync();
            await dbContext.Tickets.AddRangeAsync(tickets);
            await dbContext.SaveChangesAsync();
        }

        await application.StartAsync();
        return new TicketApiFactory(application);
    }

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await _application.DisposeAsync();
    }
}
namespace CustomerService.Api.IntegrationTests;

[Collection(ApiCollection.Name)]
public abstract class IntegrationTest(ApiFixture fixture) : IAsyncLifetime
{
    protected ApiFixture Fixture { get; } = fixture;

    public Task InitializeAsync() => Fixture.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}

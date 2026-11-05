using System.Net;

namespace CustomerService.Api.IntegrationTests;

public class ApiSmokeTests(ApiFixture fixture) : IntegrationTest(fixture)
{
    [Fact]
    public async Task Api_starts_and_serves_the_OpenAPI_document()
    {
        var client = Fixture.Factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

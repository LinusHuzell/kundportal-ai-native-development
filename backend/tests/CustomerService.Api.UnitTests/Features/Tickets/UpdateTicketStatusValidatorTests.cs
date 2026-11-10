using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.UnitTests.Features.Tickets;

// The API rows in the Felfall table in docs/specs/visa-ärende-och-ändra-status.md (AK-17, AK-18).
public class UpdateTicketStatusValidatorTests
{
    private static void AssertOnlyStatusError(string? status, string message)
    {
        var errors = UpdateTicketStatusValidator.Validate(new UpdateStatusRequest(status));

        Assert.Equal(["status"], errors.Keys);
        Assert.Equal([message], errors["status"]);
    }

    [Fact]
    public void New_is_rejected()
    {
        AssertOnlyStatusError("New", "Status kan inte ändras till Nytt");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Foo")]
    [InlineData("new")]
    [InlineData("inprogress")]
    [InlineData("1")]
    public void Missing_or_unknown_status_is_rejected(string? status)
    {
        AssertOnlyStatusError(status, "Välj en giltig status");
    }

    [Theory]
    [InlineData("InProgress")]
    [InlineData("WaitingForCustomer")]
    [InlineData("Closed")]
    public void Each_status_except_New_is_accepted(string status)
    {
        Assert.Empty(UpdateTicketStatusValidator.Validate(new UpdateStatusRequest(status)));
    }
}

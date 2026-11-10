using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.UnitTests.Features.Tickets;

// One test per row in the Felfall table in docs/specs/registrera-ärende.md, plus boundaries.
public class CreateTicketValidatorTests
{
    private static readonly CreateTicketRequest Valid = new(
        Title: "Paketet har inte kommit",
        Description: "Beställde för två veckor sedan.",
        Category: "OrdersDeliveries",
        Priority: "Medium",
        CustomerName: "Anna Andersson",
        CustomerEmail: "anna@example.com");

    private static void AssertOnlyError(CreateTicketRequest request, string field, string message)
    {
        var errors = CreateTicketValidator.Validate(request);

        Assert.Equal([field], errors.Keys);
        Assert.Equal([message], errors[field]);
    }

    [Fact]
    public void Valid_request_has_no_errors()
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_title_is_rejected(string? title)
    {
        AssertOnlyError(Valid with { Title = title }, "title", "Rubrik måste fyllas i");
    }

    [Fact]
    public void Title_of_200_characters_is_accepted()
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid with { Title = new string('a', 200) }));
    }

    [Fact]
    public void Title_of_201_characters_is_rejected()
    {
        AssertOnlyError(Valid with { Title = new string('a', 201) }, "title", "Rubrik får vara högst 200 tecken");
    }

    [Fact]
    public void Title_length_counts_surrounding_spaces()
    {
        AssertOnlyError(Valid with { Title = new string('a', 199) + "  " }, "title", "Rubrik får vara högst 200 tecken");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_description_is_rejected(string? description)
    {
        AssertOnlyError(Valid with { Description = description }, "description", "Beskrivning måste fyllas i");
    }

    [Fact]
    public void Description_of_5000_characters_is_accepted()
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid with { Description = new string('a', 5000) }));
    }

    [Fact]
    public void Description_of_5001_characters_is_rejected()
    {
        AssertOnlyError(
            Valid with { Description = new string('a', 5001) },
            "description",
            "Beskrivning får vara högst 5000 tecken");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_category_is_rejected(string? category)
    {
        AssertOnlyError(Valid with { Category = category }, "category", "Välj en kategori");
    }

    [Theory]
    [InlineData("Foo")]
    [InlineData("other")]
    [InlineData("0")]
    public void Unknown_category_is_rejected(string category)
    {
        AssertOnlyError(Valid with { Category = category }, "category", "Välj en kategori");
    }

    [Theory]
    [InlineData("OrdersDeliveries")]
    [InlineData("Invoices")]
    [InlineData("ReturnsComplaints")]
    [InlineData("Other")]
    public void Each_category_is_accepted(string category)
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid with { Category = category }));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_priority_is_rejected(string? priority)
    {
        AssertOnlyError(Valid with { Priority = priority }, "priority", "Välj en prioritet");
    }

    [Theory]
    [InlineData("Foo")]
    [InlineData("medium")]
    [InlineData("1")]
    [InlineData("Low, High")]
    public void Unknown_priority_is_rejected(string priority)
    {
        AssertOnlyError(Valid with { Priority = priority }, "priority", "Välj en prioritet");
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    public void Each_priority_is_accepted(string priority)
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid with { Priority = priority }));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_customer_name_is_rejected(string? name)
    {
        AssertOnlyError(Valid with { CustomerName = name }, "customerName", "Namn måste fyllas i");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_customer_email_is_rejected(string? email)
    {
        AssertOnlyError(Valid with { CustomerEmail = email }, "customerEmail", "E-postadress måste fyllas i");
    }

    [Theory]
    [InlineData("anna.example.com")]
    [InlineData("anna@@example.com")]
    [InlineData("anna@exa@mple.com")]
    [InlineData("anna @example.com")]
    [InlineData("anna@example")]
    [InlineData("@example.com")]
    [InlineData("anna@example.com\n")]
    public void Malformed_customer_email_is_rejected(string email)
    {
        AssertOnlyError(Valid with { CustomerEmail = email }, "customerEmail", "Ange en giltig e-postadress");
    }

    [Fact]
    public void Customer_email_with_upper_case_is_accepted()
    {
        Assert.Empty(CreateTicketValidator.Validate(Valid with { CustomerEmail = "Anna@Example.COM" }));
    }

    [Fact]
    public void Each_invalid_field_gets_its_own_error()
    {
        var errors = CreateTicketValidator.Validate(Valid with { Title = "", CustomerEmail = "anna" });

        Assert.Equal(["customerEmail", "title"], errors.Keys.Order());
    }
}

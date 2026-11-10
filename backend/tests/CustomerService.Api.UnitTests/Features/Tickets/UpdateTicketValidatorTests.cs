using CustomerService.Api.Features.Tickets;

namespace CustomerService.Api.UnitTests.Features.Tickets;

// PATCH /api/tickets/{id}: one test per row in the Felfall table in docs/specs/registrera-ärende.md
// for a sent field, plus boundaries. A missing (null) field means "do not change"
// (Gränsfall in docs/specs/redigera-ärende.md).
public class UpdateTicketValidatorTests
{
    private static readonly UpdateTicketRequest Empty = new();

    private static void AssertOnlyError(UpdateTicketRequest request, string field, string message)
    {
        var errors = UpdateTicketValidator.Validate(request);

        Assert.Equal([field], errors.Keys);
        Assert.Equal([message], errors[field]);
    }

    [Fact]
    public void Request_with_all_fields_null_has_no_errors()
    {
        Assert.Empty(UpdateTicketValidator.Validate(Empty));
    }

    public static TheoryData<UpdateTicketRequest> OneValidField => new()
    {
        Empty with { Title = "Paketet har inte kommit" },
        Empty with { Description = "Beställde för två veckor sedan." },
        Empty with { Category = "Invoices" },
        Empty with { Priority = "High" },
        Empty with { CustomerName = "Anna Andersson" },
        Empty with { CustomerEmail = "anna@example.com" },
    };

    [Theory]
    [MemberData(nameof(OneValidField))]
    public void Request_with_only_one_valid_field_has_no_errors(UpdateTicketRequest request)
    {
        Assert.Empty(UpdateTicketValidator.Validate(request));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_title_is_rejected(string title)
    {
        AssertOnlyError(Empty with { Title = title }, "title", "Rubrik måste fyllas i");
    }

    [Fact]
    public void Title_of_200_characters_is_accepted()
    {
        Assert.Empty(UpdateTicketValidator.Validate(Empty with { Title = new string('a', 200) }));
    }

    [Fact]
    public void Title_of_201_characters_is_rejected()
    {
        AssertOnlyError(Empty with { Title = new string('a', 201) }, "title", "Rubrik får vara högst 200 tecken");
    }

    [Fact]
    public void Title_length_counts_surrounding_spaces()
    {
        AssertOnlyError(Empty with { Title = new string('a', 199) + "  " }, "title", "Rubrik får vara högst 200 tecken");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_description_is_rejected(string description)
    {
        AssertOnlyError(Empty with { Description = description }, "description", "Beskrivning måste fyllas i");
    }

    [Fact]
    public void Description_of_5000_characters_is_accepted()
    {
        Assert.Empty(UpdateTicketValidator.Validate(Empty with { Description = new string('a', 5000) }));
    }

    [Fact]
    public void Description_of_5001_characters_is_rejected()
    {
        AssertOnlyError(
            Empty with { Description = new string('a', 5001) },
            "description",
            "Beskrivning får vara högst 5000 tecken");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_category_is_rejected(string category)
    {
        AssertOnlyError(Empty with { Category = category }, "category", "Välj en kategori");
    }

    [Theory]
    [InlineData("Foo")]
    [InlineData("other")]
    [InlineData("0")]
    public void Unknown_category_is_rejected(string category)
    {
        AssertOnlyError(Empty with { Category = category }, "category", "Välj en kategori");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_priority_is_rejected(string priority)
    {
        AssertOnlyError(Empty with { Priority = priority }, "priority", "Välj en prioritet");
    }

    [Theory]
    [InlineData("Foo")]
    [InlineData("medium")]
    [InlineData("1")]
    [InlineData("Low, High")]
    public void Unknown_priority_is_rejected(string priority)
    {
        AssertOnlyError(Empty with { Priority = priority }, "priority", "Välj en prioritet");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_customer_name_is_rejected(string name)
    {
        AssertOnlyError(Empty with { CustomerName = name }, "customerName", "Namn måste fyllas i");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Sent_empty_customer_email_is_rejected(string email)
    {
        AssertOnlyError(Empty with { CustomerEmail = email }, "customerEmail", "E-postadress måste fyllas i");
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
        AssertOnlyError(Empty with { CustomerEmail = email }, "customerEmail", "Ange en giltig e-postadress");
    }

    [Fact]
    public void Each_invalid_field_gets_its_own_error()
    {
        var errors = UpdateTicketValidator.Validate(Empty with { Title = "", CustomerEmail = "anna" });

        Assert.Equal(["customerEmail", "title"], errors.Keys.Order());
    }
}

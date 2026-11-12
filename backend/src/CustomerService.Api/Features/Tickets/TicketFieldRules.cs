using System.Text.RegularExpressions;

using CustomerService.Api.Data;

namespace CustomerService.Api.Features.Tickets;

// Rules and messages come from the Felfall table in docs/specs/registrera-ärende.md.
// Shared by CreateTicketValidator and UpdateTicketValidator. Each method returns the error
// message for the value, or null if the value is valid. Values are not trimmed.
// The length limits are constants on Ticket.
public static partial class TicketFieldRules
{
    public static string? Title(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "Rubrik måste fyllas i"
        : value.Length > Ticket.TitleMaxLength ? $"Rubrik får vara högst {Ticket.TitleMaxLength} tecken"
        : null;

    public static string? Description(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "Beskrivning måste fyllas i"
        : value.Length > Ticket.DescriptionMaxLength ? $"Beskrivning får vara högst {Ticket.DescriptionMaxLength} tecken"
        : null;

    public static string? Category(string? value) =>
        IsEnumName<TicketCategory>(value) ? null : "Välj en kategori";

    public static string? Priority(string? value) =>
        IsEnumName<TicketPriority>(value) ? null : "Välj en prioritet";

    public static string? CustomerName(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "Namn måste fyllas i" : null;

    public static string? CustomerEmail(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "E-postadress måste fyllas i"
        : !EmailFormat().IsMatch(value) ? "Ange en giltig e-postadress"
        : null;

    // Exact, case-sensitive name match. Enum.TryParse would also accept "1" and "Low, High".
    private static bool IsEnumName<TEnum>(string? value) where TEnum : struct, Enum =>
        value is not null && Enum.GetNames<TEnum>().Contains(value);

    // The spec regex, with \z instead of $: in .NET, $ also matches before a trailing newline,
    // which JavaScript (the frontend) does not.
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+\z")]
    private static partial Regex EmailFormat();
}

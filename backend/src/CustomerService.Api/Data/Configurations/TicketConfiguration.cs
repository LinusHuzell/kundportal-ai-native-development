using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerService.Api.Data.Configurations;

public sealed class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("Tickets");
        builder.HasKey(ticket => ticket.Id);

        builder.Property(ticket => ticket.TicketNumber)
            .HasMaxLength(32)
            .IsRequired();
        builder.HasIndex(ticket => ticket.TicketNumber)
            .IsUnique();

        builder.Property(ticket => ticket.Title)
            .HasMaxLength(Ticket.TitleMaxLength)
            .IsRequired();
        builder.Property(ticket => ticket.Description)
            .HasMaxLength(Ticket.DescriptionMaxLength)
            .IsRequired();
        builder.Property(ticket => ticket.Category)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(ticket => ticket.Priority)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(ticket => ticket.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(ticket => ticket.CustomerName)
            .IsRequired();
        builder.Property(ticket => ticket.CustomerEmail)
            .IsRequired();
        builder.Property(ticket => ticket.CreatedAt)
            .IsRequired();
    }
}
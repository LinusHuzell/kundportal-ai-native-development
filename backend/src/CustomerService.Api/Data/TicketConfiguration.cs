using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerService.Api.Data;

public sealed class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");
        builder.HasKey(ticket => ticket.Id);

        builder.Property(ticket => ticket.Title).HasMaxLength(200).IsRequired();
        builder.Property(ticket => ticket.Description).HasMaxLength(5000).IsRequired();
        builder.Property(ticket => ticket.Category).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(ticket => ticket.Priority).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(ticket => ticket.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(ticket => ticket.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(ticket => ticket.CustomerEmail).HasMaxLength(320).IsRequired();
        builder.Property(ticket => ticket.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        builder.HasIndex(ticket => ticket.CreatedAt).IsDescending();
    }
}
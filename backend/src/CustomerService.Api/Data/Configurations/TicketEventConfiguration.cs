using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerService.Api.Data.Configurations;

public sealed class TicketEventConfiguration : IEntityTypeConfiguration<TicketEvent>
{
    public void Configure(EntityTypeBuilder<TicketEvent> builder)
    {
        builder.ToTable("TicketEvents");
        builder.HasKey(ticketEvent => ticketEvent.Id);

        builder.Property(ticketEvent => ticketEvent.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();
        builder.Property(ticketEvent => ticketEvent.OccurredAt)
            .IsRequired();
        builder.Property(ticketEvent => ticketEvent.FromStatus)
            .HasConversion<string>()
            .HasMaxLength(32);
        builder.Property(ticketEvent => ticketEvent.ToStatus)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.HasOne<Ticket>()
            .WithMany()
            .HasForeignKey(ticketEvent => ticketEvent.TicketId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(ticketEvent => ticketEvent.TicketId);
    }
}

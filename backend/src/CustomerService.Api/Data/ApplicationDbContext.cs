using CustomerService.Api.Features.Tickets;
using Microsoft.EntityFrameworkCore;

namespace CustomerService.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new TicketConfiguration());
    }
}
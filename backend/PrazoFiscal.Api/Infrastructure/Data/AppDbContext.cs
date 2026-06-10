using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Domain.Entities;

namespace PrazoFiscal.Api.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<ObligationDelivery> ObligationDeliveries => Set<ObligationDelivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Company>(entity =>
        {
            entity.ToTable("companies");
            entity.HasKey(company => company.Id);
            entity.Property(company => company.Name).HasMaxLength(200).IsRequired();
            entity.Property(company => company.Cnpj).HasMaxLength(14).IsRequired();
            entity.HasIndex(company => company.Cnpj).IsUnique();
            entity.Property(company => company.TaxRegime).HasConversion<string>().HasMaxLength(50);
        });

        modelBuilder.Entity<ObligationDelivery>(entity =>
        {
            entity.ToTable("obligation_deliveries");
            entity.HasKey(delivery => delivery.Id);
            entity.Property(delivery => delivery.ObligationType).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(delivery => new
            {
                delivery.CompanyId,
                delivery.ObligationType,
                delivery.CompetenceMonth,
                delivery.CompetenceYear
            }).IsUnique();

            entity.HasOne(delivery => delivery.Company)
                .WithMany(company => company.Deliveries)
                .HasForeignKey(delivery => delivery.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

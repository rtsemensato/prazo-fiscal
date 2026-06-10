using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Infrastructure.Data.Seed;

public static class DatabaseSeeder
{
    // IDs fixos para garantir idempotência e facilitar referências nos testes
    private static readonly Guid CompanyPadaria   = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CompanyTech      = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CompanyIndustria = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CompanyAssoc     = Guid.Parse("44444444-4444-4444-4444-444444444444");

    public static async Task SeedAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        if (await dbContext.Companies.AnyAsync(cancellationToken))
            return;

        SeedCompanies(dbContext);
        SeedDeliveries(dbContext);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────
    // Empresas — 4 regimes distintos para cobrir toda a engine de regras
    // ─────────────────────────────────────────────────────────────────
    private static void SeedCompanies(AppDbContext dbContext)
    {
        dbContext.Companies.AddRange(
            new Company
            {
                Id = CompanyPadaria,
                Name = "Padaria Sol Nascente Ltda",
                Cnpj = "11222333000181",
                TaxRegime = TaxRegime.SimplesNacional
            },
            new Company
            {
                Id = CompanyTech,
                Name = "Tech Solutions Presumido S.A.",
                Cnpj = "11444777000161",
                TaxRegime = TaxRegime.LucroPresumido
            },
            new Company
            {
                Id = CompanyIndustria,
                Name = "Indústria Metalúrgica Real Ltda",
                Cnpj = "55666777000144",
                TaxRegime = TaxRegime.LucroReal
            },
            new Company
            {
                Id = CompanyAssoc,
                Name = "Associação Beneficente Esperança",
                Cnpj = "99888777000155",
                TaxRegime = TaxRegime.ImunidadeIsencao
            }
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Entregas — estado representativo para demonstrar todas as telas:
    //
    //  MÊS ATUAL
    //  ├── Padaria  : DAS entregue / eSocial pendente
    //  ├── Tech     : EFD-ICMS + EFD Contrib entregues / eSocial + DCTF + EFD-Reinf pendentes
    //  ├── Industria: EFD-ICMS + EFD Contrib entregues / eSocial + DCTF + EFD-Reinf pendentes
    //  └── Assoc    : tudo Não Aplicável (sem entregas)
    //
    //  JANEIRO (obrigações anuais — só incluídas nos alertas fora de janeiro)
    //  ├── Padaria  : todas as anuais entregues (empresa modelo / em dia)
    //  ├── Tech     : mensais entregues; DIRF/RAIS/SPED ECD não entregues → Atrasadas
    //  └── Industria: mensais entregues; DIRF/RAIS/SPED ECD não entregues → Atrasadas
    //
    //  Dashboard resultante (mês atual):
    //    ~5 entregues / ~7 pendentes / 0 atrasadas
    //    (vencimentos do mês atual caem no mês seguinte, então nada está atrasado)
    //
    //  Alertas:
    //    Vencendo em 30 dias: eSocial de Padaria, Tech e Industria (vence dia 7 do próximo mês)
    //    Atrasadas: DIRF + RAIS + SPED ECD de Tech e Industria (vencidos em fev/mar/mai)
    // ─────────────────────────────────────────────────────────────────
    private static void SeedDeliveries(AppDbContext dbContext)
    {
        var now = DateTime.UtcNow;
        var currentMonth = now.Month;
        var currentYear  = now.Year;

        // ── Mês atual ────────────────────────────────────────────────
        var currentMonthDeliveries = new List<ObligationDelivery>
        {
            // Padaria (Simples): DAS entregue
            D(CompanyPadaria, ObligationType.Das, currentMonth, currentYear, now.AddDays(-5)),

            // Tech (Presumido): EFD-ICMS e EFD Contribuições entregues
            D(CompanyTech, ObligationType.EfdIcmsIpi,       currentMonth, currentYear, now.AddDays(-4)),
            D(CompanyTech, ObligationType.EfdContribuicoes, currentMonth, currentYear, now.AddDays(-4)),

            // Industria (Real): EFD-ICMS e EFD Contribuições entregues
            D(CompanyIndustria, ObligationType.EfdIcmsIpi,       currentMonth, currentYear, now.AddDays(-4)),
            D(CompanyIndustria, ObligationType.EfdContribuicoes, currentMonth, currentYear, now.AddDays(-4)),
        };

        dbContext.ObligationDeliveries.AddRange(currentMonthDeliveries);

        // ── Janeiro do ano corrente ───────────────────────────────────
        // Só inclui se não estivermos em janeiro para não duplicar com o
        // mês atual e porque o serviço de alertas só mescla janeiro em
        // meses subsequentes.
        if (currentMonth == 1)
            return;

        // Mensais de janeiro — eSocial entregue para todos (vence fev/7, curto prazo).
        // DCTF (vence mar/15) e EFDs (vence fev/15) de Tech e Industria deliberadamente
        // NÃO entregues → aparecem como Atrasadas nos alertas e ativam o badge do menu.
        var januaryMonthlyDeliveries = new List<ObligationDelivery>
        {
            // Padaria (empresa modelo — todas mensais em dia)
            D(CompanyPadaria, ObligationType.Das,     1, currentYear, Utc(currentYear, 1, 22)),
            D(CompanyPadaria, ObligationType.Esocial, 1, currentYear, Utc(currentYear, 1, 8)),

            // Tech — só eSocial entregue
            D(CompanyTech, ObligationType.Esocial, 1, currentYear, Utc(currentYear, 1, 7)),

            // Industria — só eSocial entregue
            D(CompanyIndustria, ObligationType.Esocial, 1, currentYear, Utc(currentYear, 1, 8)),
        };

        dbContext.ObligationDeliveries.AddRange(januaryMonthlyDeliveries);

        // Anuais de janeiro — Padaria em dia (empresa modelo)
        var januaryAnnualPadaria = new List<ObligationDelivery>
        {
            D(CompanyPadaria, ObligationType.Dirf,  1, currentYear, Utc(currentYear, 1, 25)),
            D(CompanyPadaria, ObligationType.Rais,  1, currentYear, Utc(currentYear, 1, 25)),
            D(CompanyPadaria, ObligationType.Defis, 1, currentYear, Utc(currentYear, 1, 25)),
        };

        dbContext.ObligationDeliveries.AddRange(januaryAnnualPadaria);

        // Tech e Industria: DIRF, RAIS e SPED ECD deliberadamente NÃO entregues
        // → aparecem como Atrasadas na tela de Alertas (vencimentos já passados)
        // SPED ECF (vence em julho) também não entregue → aparece como Pendente nos alertas
    }

    // Cria um DateTime explicitamente UTC para satisfazer o Npgsql/PostgreSQL
    // (timestamp with time zone rejeita Kind=Unspecified)
    private static DateTime Utc(int year, int month, int day) =>
        new(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    private static ObligationDelivery D(
        Guid companyId,
        ObligationType type,
        int month,
        int year,
        DateTime deliveredAt) =>
        new()
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ObligationType = type,
            CompetenceMonth = month,
            CompetenceYear = year,
            DeliveredAt = deliveredAt
        };
}

public static class DatabaseMigrationExtensions
{
    public static async Task MigrateAndSeedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
        await DatabaseSeeder.SeedAsync(dbContext);
    }
}

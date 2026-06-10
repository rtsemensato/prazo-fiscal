using FluentAssertions;
using PrazoFiscal.Api.Application.Rules;
using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Tests.Rules;

public class ObligationEngineTests
{
    private static readonly Guid CompanyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void SimplesNacional_ShouldGenerateExpectedMonthlyObligations()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Simples",
            TaxRegime.SimplesNacional,
            6,
            2026,
            []);

        obligations.Select(item => item.Type).Should().Contain(new[]
        {
            ObligationType.Das,
            ObligationType.Esocial
        });

        obligations.Select(item => item.Type).Should().NotContain(new[]
        {
            ObligationType.Dctf,
            ObligationType.EfdIcmsIpi,
            ObligationType.EfdContribuicoes,
            ObligationType.EfdReinf
        });
    }

    [Fact]
    public void SimplesNacional_InJanuary_ShouldIncludeAnnualObligations()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Simples",
            TaxRegime.SimplesNacional,
            1,
            2026,
            []);

        obligations.Select(item => item.Type).Should().Contain(new[]
        {
            ObligationType.Defis,
            ObligationType.Dirf,
            ObligationType.Rais
        });
    }

    [Fact]
    public void LucroPresumido_ShouldGenerateExpectedObligations()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Presumido",
            TaxRegime.LucroPresumido,
            6,
            2026,
            []);

        obligations.Select(item => item.Type).Should().Contain(new[]
        {
            ObligationType.Dctf,
            ObligationType.EfdIcmsIpi,
            ObligationType.EfdContribuicoes,
            ObligationType.EfdReinf,
            ObligationType.Esocial
        });

        obligations.Select(item => item.Type).Should().NotContain(ObligationType.Das);
    }

    [Fact]
    public void LucroReal_InJanuary_ShouldIncludeSpedAnnualObligations()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Real",
            TaxRegime.LucroReal,
            1,
            2026,
            []);

        obligations.Select(item => item.Type).Should().Contain(new[]
        {
            ObligationType.SpedEcd,
            ObligationType.SpedEcf,
            ObligationType.Dirf,
            ObligationType.Rais
        });
    }

    [Fact]
    public void ImunidadeIsencao_ShouldMarkAllAsNotApplicable()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Entidade Isenta",
            TaxRegime.ImunidadeIsencao,
            6,
            2026,
            []);

        obligations.Should().NotBeEmpty();
        obligations.Should().OnlyContain(item => item.Status == ObligationStatus.NotApplicable);
    }

    [Fact]
    public void AnnualObligations_ShouldNotAppearOutsideJanuary()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Presumido",
            TaxRegime.LucroPresumido,
            6,
            2026,
            []);

        obligations.Select(item => item.Type).Should().NotContain(new[]
        {
            ObligationType.SpedEcd,
            ObligationType.SpedEcf,
            ObligationType.Dirf,
            ObligationType.Rais
        });
    }

    [Fact]
    public void DasDueDate_OnWeekend_ShouldMoveToNextBusinessDay()
    {
        // Competência fevereiro/2026 -> vencimento base 20/03/2026 (sexta)
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Das, 2, 2026);
        dueDate.Should().Be(new DateOnly(2026, 3, 20));

        // Competência janeiro/2026 -> vencimento base 20/02/2026 (sexta)
        var weekendCase = ObligationEngine.CalculateDueDate(ObligationType.Das, 1, 2026);
        weekendCase.Should().Be(new DateOnly(2026, 2, 20));
    }

    [Fact]
    public void DasDueDate_WhenFallsOnSaturday_ShouldPostponeToMonday()
    {
        // Competência outubro/2026 -> vencimento base 20/11/2026 (sexta) - not weekend
        // Competência setembro/2026 -> vencimento 20/10/2026 (terça)
        // Find a month where 20th of next month is Saturday: May 2026 competence -> June 20 2026 is Saturday
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Das, 5, 2026);
        dueDate.Should().Be(new DateOnly(2026, 6, 22));
    }

    [Theory]
    [InlineData("2026-06-01", null, ObligationStatus.Overdue)]
    [InlineData("2026-12-31", null, ObligationStatus.Pending)]
    [InlineData("2026-06-01", "2026-06-01", ObligationStatus.Delivered)]
    public void ResolveStatus_ShouldReturnExpectedStatus(string dueDate, string? deliveredAt, ObligationStatus expected)
    {
        var due = DateOnly.Parse(dueDate);
        DateTime? delivered = deliveredAt is null ? null : DateTime.Parse(deliveredAt);
        var reference = new DateOnly(2026, 6, 7);

        ObligationEngine.ResolveStatus(due, delivered, reference).Should().Be(expected);
    }

    [Fact]
    public void DctfDueDate_ShouldBeFifteenthOfSecondFollowingMonth()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Dctf, 3, 2026);
        dueDate.Should().Be(new DateOnly(2026, 5, 15));
    }

    [Fact]
    public void EsocialDueDate_ShouldBeSeventhOfFollowingMonth()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Esocial, 3, 2026);
        dueDate.Should().Be(new DateOnly(2026, 4, 7));
    }

    [Theory]
    [InlineData(ObligationType.EfdIcmsIpi)]
    [InlineData(ObligationType.EfdContribuicoes)]
    [InlineData(ObligationType.EfdReinf)]
    public void MonthlyEfdDueDate_ShouldBeFifteenthOfFollowingMonth(ObligationType type)
    {
        var dueDate = ObligationEngine.CalculateDueDate(type, 3, 2026);
        dueDate.Should().Be(new DateOnly(2026, 4, 15));
    }

    [Fact]
    public void DefisDueDate_ShouldBeMarchThirtyFirstOfFollowingYear()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Defis, 1, 2026);
        dueDate.Should().Be(new DateOnly(2027, 3, 31));
    }

    [Fact]
    public void SpedEcdDueDate_ShouldBeMayThirtyFirstOfFollowingYear()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.SpedEcd, 1, 2026);
        dueDate.Should().Be(new DateOnly(2027, 5, 31));
    }

    [Fact]
    public void SpedEcfDueDate_ShouldBeJulyThirtyFirstOfFollowingYear()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.SpedEcf, 1, 2026);
        dueDate.Should().Be(new DateOnly(2027, 7, 31));
    }

    [Fact]
    public void DirfDueDate_ShouldBeLastDayOfFebruaryOfFollowingYear()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Dirf, 1, 2026);
        dueDate.Should().Be(new DateOnly(2027, 2, 28));
    }

    [Fact]
    public void RaisDueDate_ShouldBeMarchThirtyFirstOfFollowingYear()
    {
        var dueDate = ObligationEngine.CalculateDueDate(ObligationType.Rais, 1, 2026);
        dueDate.Should().Be(new DateOnly(2027, 3, 31));
    }

    [Fact]
    public void LucroReal_ShouldGenerateExpectedMonthlyObligationsOutsideJanuary()
    {
        var obligations = ObligationEngine.Generate(
            CompanyId,
            "Empresa Real",
            TaxRegime.LucroReal,
            6,
            2026,
            []);

        obligations.Select(item => item.Type).Should().Contain(new[]
        {
            ObligationType.Dctf,
            ObligationType.EfdIcmsIpi,
            ObligationType.EfdContribuicoes,
            ObligationType.EfdReinf,
            ObligationType.Esocial
        });

        obligations.Select(item => item.Type).Should().NotContain(new[]
        {
            ObligationType.SpedEcd,
            ObligationType.SpedEcf,
            ObligationType.Dirf,
            ObligationType.Rais
        });
    }
}

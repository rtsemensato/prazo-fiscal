using System.Text.Json;
using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Application.Rules;

public static class ObligationEngine
{
    private sealed record ObligationRule(
        ObligationType Type,
        ObligationPeriodicity Periodicity,
        bool AnnualJanuaryOnly,
        Func<TaxRegime, bool> AppliesTo,
        Func<int, int, DateOnly> DueDateCalculator);

    private static readonly JsonNamingPolicy CamelCase = JsonNamingPolicy.CamelCase;

    private static readonly ObligationRule[] Rules =
    [
        Rule(ObligationType.Das, ObligationPeriodicity.Monthly, false,
            regime => regime == TaxRegime.SimplesNacional,
            (month, year) => NextBusinessDay(new DateOnly(year, month, 1).AddMonths(1).AddDays(19))),

        Rule(ObligationType.Dctf, ObligationPeriodicity.Monthly, false,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (month, year) => new DateOnly(year, month, 1).AddMonths(2).AddDays(14)),

        Rule(ObligationType.EfdIcmsIpi, ObligationPeriodicity.Monthly, false,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (month, year) => new DateOnly(year, month, 1).AddMonths(1).AddDays(14)),

        Rule(ObligationType.EfdContribuicoes, ObligationPeriodicity.Monthly, false,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (month, year) => new DateOnly(year, month, 1).AddMonths(1).AddDays(14)),

        Rule(ObligationType.EfdReinf, ObligationPeriodicity.Monthly, false,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (month, year) => new DateOnly(year, month, 1).AddMonths(1).AddDays(14)),

        Rule(ObligationType.Esocial, ObligationPeriodicity.Monthly, false,
            regime => regime is TaxRegime.SimplesNacional or TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (month, year) => new DateOnly(year, month, 1).AddMonths(1).AddDays(6)),

        Rule(ObligationType.Defis, ObligationPeriodicity.Annual, true,
            regime => regime == TaxRegime.SimplesNacional,
            (_, year) => new DateOnly(year + 1, 3, 31)),

        Rule(ObligationType.SpedEcd, ObligationPeriodicity.Annual, true,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (_, year) => new DateOnly(year + 1, 5, 31)),

        Rule(ObligationType.SpedEcf, ObligationPeriodicity.Annual, true,
            regime => regime is TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (_, year) => new DateOnly(year + 1, 7, 31)),

        Rule(ObligationType.Dirf, ObligationPeriodicity.Annual, true,
            regime => regime is TaxRegime.SimplesNacional or TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (_, year) => new DateOnly(year + 1, 2, DateTime.DaysInMonth(year + 1, 2))),

        Rule(ObligationType.Rais, ObligationPeriodicity.Annual, true,
            regime => regime is TaxRegime.SimplesNacional or TaxRegime.LucroPresumido or TaxRegime.LucroReal,
            (_, year) => new DateOnly(year + 1, 3, 31))
    ];

    public static DateOnly CalculateDueDate(ObligationType type, int competenceMonth, int competenceYear)
    {
        var rule = Rules.FirstOrDefault(item => item.Type == type)
            ?? throw new ArgumentOutOfRangeException(nameof(type), type, "Tipo de obrigação não suportado.");

        return rule.DueDateCalculator(competenceMonth, competenceYear);
    }

    public static ObligationStatus ResolveStatus(DateOnly dueDate, DateTime? deliveredAt, DateOnly? referenceDate = null)
    {
        if (deliveredAt.HasValue)
        {
            return ObligationStatus.Delivered;
        }

        var today = referenceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return dueDate < today ? ObligationStatus.Overdue : ObligationStatus.Pending;
    }

    public static string BuildObligationId(Guid companyId, ObligationType type, int month, int year)
    {
        var typeKey = CamelCase.ConvertName(type.ToString());
        return $"{companyId}-{typeKey}-{month}-{year}";
    }

    public static IReadOnlyList<ComputedObligation> Generate(
        Guid companyId,
        string companyName,
        TaxRegime taxRegime,
        int month,
        int year,
        IEnumerable<ObligationDelivery> deliveries,
        DateOnly? referenceDate = null)
    {
        // Valor como DateTime? (nullable) para que TryGetValue retorne null
        // quando não há entrega — DateTime não-nullable retornaria DateTime.MinValue,
        // que tem HasValue=true e enganaria o ResolveStatus marcando tudo como Delivered.
        var deliveryLookup = deliveries.ToDictionary(
            delivery => (delivery.ObligationType, delivery.CompetenceMonth, delivery.CompetenceYear),
            delivery => (DateTime?)delivery.DeliveredAt);

        if (taxRegime == TaxRegime.ImunidadeIsencao)
        {
            return Rules
                .Where(rule => !rule.AnnualJanuaryOnly || month == 1)
                .Select(rule => BuildComputedObligation(
                    companyId,
                    companyName,
                    rule,
                    month,
                    year,
                    null,
                    ObligationStatus.NotApplicable,
                    referenceDate))
                .ToList();
        }

        return Rules
            .Where(rule => rule.AppliesTo(taxRegime))
            .Where(rule => !rule.AnnualJanuaryOnly || month == 1)
            .Select(rule =>
            {
                deliveryLookup.TryGetValue((rule.Type, month, year), out var deliveredAt);
                var dueDate = rule.DueDateCalculator(month, year);
                var status = ResolveStatus(dueDate, deliveredAt, referenceDate);

                return BuildComputedObligation(
                    companyId,
                    companyName,
                    rule,
                    month,
                    year,
                    deliveredAt,
                    status,
                    referenceDate);
            })
            .ToList();
    }

    public static IReadOnlyList<ComputedObligation> GenerateForCompanies(
        IEnumerable<Company> companies,
        int month,
        int year,
        DateOnly? referenceDate = null)
    {
        return companies
            .SelectMany(company => Generate(
                company.Id,
                company.Name,
                company.TaxRegime,
                month,
                year,
                company.Deliveries,
                referenceDate))
            .ToList();
    }

    private static ComputedObligation BuildComputedObligation(
        Guid companyId,
        string companyName,
        ObligationRule rule,
        int month,
        int year,
        DateTime? deliveredAt,
        ObligationStatus status,
        DateOnly? referenceDate)
    {
        var dueDate = rule.DueDateCalculator(month, year);
        var resolvedStatus = status == ObligationStatus.NotApplicable
            ? ObligationStatus.NotApplicable
            : ResolveStatus(dueDate, deliveredAt, referenceDate);

        return new ComputedObligation(
            BuildObligationId(companyId, rule.Type, month, year),
            companyId,
            companyName,
            rule.Type,
            rule.Periodicity,
            month,
            year,
            dueDate,
            resolvedStatus,
            deliveredAt);
    }

    private static ObligationRule Rule(
        ObligationType type,
        ObligationPeriodicity periodicity,
        bool annualJanuaryOnly,
        Func<TaxRegime, bool> appliesTo,
        Func<int, int, DateOnly> dueDateCalculator) =>
        new(type, periodicity, annualJanuaryOnly, appliesTo, dueDateCalculator);

    private static DateOnly NextBusinessDay(DateOnly date)
    {
        while (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            date = date.AddDays(1);
        }

        return date;
    }
}

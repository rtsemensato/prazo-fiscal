using System.Globalization;
using System.Text;
using PrazoFiscal.Api.Domain.Enums;
using PrazoFiscal.Api.DTOs.Obligation;

namespace PrazoFiscal.Api.Common.Helpers;

public static class CalendarCsvExporter
{
    private static readonly Dictionary<ObligationType, string> TypeLabels = new()
    {
        [ObligationType.Das] = "DAS",
        [ObligationType.Defis] = "DEFIS",
        [ObligationType.Dctf] = "DCTF",
        [ObligationType.EfdIcmsIpi] = "EFD-ICMS/IPI",
        [ObligationType.EfdContribuicoes] = "EFD Contribuições",
        [ObligationType.EfdReinf] = "EFD-Reinf",
        [ObligationType.SpedEcd] = "SPED ECD",
        [ObligationType.SpedEcf] = "SPED ECF",
        [ObligationType.Esocial] = "eSocial",
        [ObligationType.Dirf] = "DIRF",
        [ObligationType.Rais] = "RAIS"
    };

    private static readonly Dictionary<ObligationPeriodicity, string> PeriodicityLabels = new()
    {
        [ObligationPeriodicity.Monthly] = "Mensal",
        [ObligationPeriodicity.Annual] = "Anual"
    };

    private static readonly Dictionary<ObligationStatus, string> StatusLabels = new()
    {
        [ObligationStatus.Pending] = "Pendente",
        [ObligationStatus.Overdue] = "Atrasada",
        [ObligationStatus.Delivered] = "Entregue",
        [ObligationStatus.NotApplicable] = "Não Aplicável"
    };

    public static string ToCsv(IEnumerable<ObligationResponseDto> obligations)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Empresa;Obrigação;Periodicidade;Competência;Vencimento;Status;Data Entrega");

        foreach (var obligation in obligations)
        {
            var competence = $"{obligation.CompetenceMonth:D2}/{obligation.CompetenceYear}";
            builder.Append(CultureInfo.InvariantCulture, $"{Escape(obligation.CompanyName)};");
            builder.Append(CultureInfo.InvariantCulture, $"{TypeLabels[obligation.Type]};");
            builder.Append(CultureInfo.InvariantCulture, $"{PeriodicityLabels[obligation.Periodicity]};");
            builder.Append(CultureInfo.InvariantCulture, $"{competence};");
            builder.Append(CultureInfo.InvariantCulture, $"{obligation.DueDate};");
            builder.Append(CultureInfo.InvariantCulture, $"{StatusLabels[obligation.Status]};");
            builder.AppendLine(Escape(obligation.DeliveredAt ?? string.Empty));
        }

        return builder.ToString();
    }

    private static string Escape(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        return value.Contains(';') || value.Contains('"')
            ? $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\""
            : value;
    }
}

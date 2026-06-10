using System.Text.Json;
using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Common.Helpers;

public static class ObligationIdParser
{
    private static readonly JsonNamingPolicy CamelCase = JsonNamingPolicy.CamelCase;

    public static (Guid CompanyId, ObligationType Type, int Month, int Year) Parse(string obligationId)
    {
        var parts = obligationId.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length < 8)
        {
            throw new FormatException("Identificador de obrigação inválido.");
        }

        if (!int.TryParse(parts[^2], out var month) || !int.TryParse(parts[^1], out var year))
        {
            throw new FormatException("Identificador de obrigação inválido.");
        }

        var companyIdValue = string.Join('-', parts.Take(5));
        if (!Guid.TryParse(companyIdValue, out var companyId))
        {
            throw new FormatException("Identificador de obrigação inválido.");
        }

        var typeKey = string.Join(string.Empty, parts.Skip(5).Take(parts.Length - 7));
        if (parts.Length == 8)
        {
            typeKey = parts[5];
        }

        if (!TryParseObligationType(typeKey, out var obligationType))
        {
            throw new FormatException("Tipo de obrigação inválido.");
        }

        return (companyId, obligationType, month, year);
    }

    private static bool TryParseObligationType(string typeKey, out ObligationType obligationType)
    {
        foreach (var value in Enum.GetValues<ObligationType>())
        {
            if (string.Equals(CamelCase.ConvertName(value.ToString()), typeKey, StringComparison.OrdinalIgnoreCase))
            {
                obligationType = value;
                return true;
            }
        }

        obligationType = default;
        return false;
    }
}

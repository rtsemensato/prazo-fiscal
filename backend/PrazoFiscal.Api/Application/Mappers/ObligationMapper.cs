using PrazoFiscal.Api.Application.Rules;
using PrazoFiscal.Api.DTOs.Obligation;

namespace PrazoFiscal.Api.Application.Mappers;

public static class ObligationMapper
{
    public static ObligationResponseDto ToDto(ComputedObligation obligation) =>
        new()
        {
            Id = obligation.Id,
            CompanyId = obligation.CompanyId,
            CompanyName = obligation.CompanyName,
            Type = obligation.Type,
            Periodicity = obligation.Periodicity,
            CompetenceMonth = obligation.CompetenceMonth,
            CompetenceYear = obligation.CompetenceYear,
            DueDate = obligation.DueDate.ToString("yyyy-MM-dd"),
            Status = obligation.Status,
            DeliveredAt = obligation.DeliveredAt?.ToString("yyyy-MM-dd")
        };
}

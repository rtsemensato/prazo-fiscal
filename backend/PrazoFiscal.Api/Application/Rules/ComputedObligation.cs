using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Application.Rules;

public record ComputedObligation(
    string Id,
    Guid CompanyId,
    string? CompanyName,
    ObligationType Type,
    ObligationPeriodicity Periodicity,
    int CompetenceMonth,
    int CompetenceYear,
    DateOnly DueDate,
    ObligationStatus Status,
    DateTime? DeliveredAt);

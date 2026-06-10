using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.DTOs.Company;

public class CompanyRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public TaxRegime TaxRegime { get; set; }
}

public class CompanyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public TaxRegime TaxRegime { get; set; }
}

public class DeliveryHistoryItemDto
{
    public string ObligationId { get; set; } = string.Empty;
    public ObligationType Type { get; set; }
    public ObligationPeriodicity Periodicity { get; set; }
    public int CompetenceMonth { get; set; }
    public int CompetenceYear { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public ObligationStatus Status { get; set; }
    public string DeliveredAt { get; set; } = string.Empty;
}

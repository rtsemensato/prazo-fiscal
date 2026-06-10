using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.DTOs.Obligation;

public class CalendarQueryDto
{
    public Guid? CompanyId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string? Status { get; set; }
}

public class DeliverObligationDto
{
    public DateTime DeliveredAt { get; set; }
}

public class ObligationResponseDto
{
    public string Id { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public ObligationType Type { get; set; }
    public ObligationPeriodicity Periodicity { get; set; }
    public int CompetenceMonth { get; set; }
    public int CompetenceYear { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public ObligationStatus Status { get; set; }
    public string? DeliveredAt { get; set; }
}

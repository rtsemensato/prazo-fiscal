using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Domain.Entities;

public class ObligationDelivery
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public ObligationType ObligationType { get; set; }
    public int CompetenceMonth { get; set; }
    public int CompetenceYear { get; set; }
    public DateTime DeliveredAt { get; set; }
}

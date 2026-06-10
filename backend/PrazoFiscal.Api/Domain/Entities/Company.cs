using PrazoFiscal.Api.Domain.Enums;

namespace PrazoFiscal.Api.Domain.Entities;

public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public TaxRegime TaxRegime { get; set; }
    public ICollection<ObligationDelivery> Deliveries { get; set; } = [];
}

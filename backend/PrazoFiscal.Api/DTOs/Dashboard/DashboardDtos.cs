namespace PrazoFiscal.Api.DTOs.Dashboard;

public class DashboardResponseDto
{
    public int TotalCompanies { get; set; }
    public int MonthObligations { get; set; }
    public int PendingCount { get; set; }
    public int DeliveredCount { get; set; }
    public int OverdueCount { get; set; }
}

public class AlertsResponseDto
{
    public List<Obligation.ObligationResponseDto> Upcoming { get; set; } = [];
    public List<Obligation.ObligationResponseDto> Overdue { get; set; } = [];
}

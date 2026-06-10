using PrazoFiscal.Api.DTOs.Company;
using PrazoFiscal.Api.DTOs.Dashboard;
using PrazoFiscal.Api.DTOs.Obligation;

namespace PrazoFiscal.Api.Application.Interfaces;

public interface ICompanyService
{
    Task<List<CompanyResponseDto>> ListAsync(string? search, CancellationToken cancellationToken);
    Task<CompanyResponseDto> CreateAsync(CompanyRequestDto request, CancellationToken cancellationToken);
    Task<CompanyResponseDto> UpdateAsync(Guid id, CompanyRequestDto request, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
    Task<List<DeliveryHistoryItemDto>> GetDeliveriesAsync(Guid companyId, CancellationToken cancellationToken);
}

public interface ICalendarService
{
    Task<List<ObligationResponseDto>> GetCalendarAsync(CalendarQueryDto query, CancellationToken cancellationToken);
    Task<ObligationResponseDto> RegisterDeliveryAsync(string obligationId, DateTime deliveredAt, CancellationToken cancellationToken);
    Task<string> ExportCalendarCsvAsync(CalendarQueryDto query, CancellationToken cancellationToken);
    Task<byte[]> ExportCalendarPdfAsync(CalendarQueryDto query, CancellationToken cancellationToken);
}

public interface IDashboardService
{
    Task<DashboardResponseDto> GetDashboardAsync(CancellationToken cancellationToken);
    Task<AlertsResponseDto> GetAlertsAsync(CancellationToken cancellationToken);
}

using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Application.Interfaces;
using PrazoFiscal.Api.Application.Mappers;
using PrazoFiscal.Api.Application.Rules;
using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.Domain.Enums;
using PrazoFiscal.Api.DTOs.Dashboard;
using PrazoFiscal.Api.Infrastructure.Data;

namespace PrazoFiscal.Api.Application.Services;

public class DashboardService(AppDbContext dbContext) : IDashboardService
{
    public async Task<DashboardResponseDto> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var companies = await LoadCompaniesAsync(cancellationToken);

        var obligations = ObligationEngine.GenerateForCompanies(companies, now.Month, now.Year)
            .Where(obligation => obligation.Status != ObligationStatus.NotApplicable)
            .ToList();

        return new DashboardResponseDto
        {
            TotalCompanies = companies.Count,
            MonthObligations = obligations.Count,
            PendingCount = obligations.Count(item => item.Status == ObligationStatus.Pending),
            DeliveredCount = obligations.Count(item => item.Status == ObligationStatus.Delivered),
            OverdueCount = obligations.Count(item => item.Status == ObligationStatus.Overdue)
        };
    }

    public async Task<AlertsResponseDto> GetAlertsAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var limit = today.AddDays(30);

        var companies = await LoadCompaniesAsync(cancellationToken);
        var obligations = GenerateAlertObligations(companies, today.Month, today.Year)
            .Where(obligation => obligation.Status != ObligationStatus.NotApplicable)
            .Select(ObligationMapper.ToDto)
            .ToList();

        var upcoming = obligations
            .Where(obligation =>
                obligation.Status == ObligationStatus.Pending &&
                DateOnly.Parse(obligation.DueDate) >= today &&
                DateOnly.Parse(obligation.DueDate) <= limit)
            .OrderBy(obligation => obligation.DueDate)
            .ToList();

        var overdue = obligations
            .Where(obligation => obligation.Status == ObligationStatus.Overdue)
            .OrderBy(obligation => obligation.DueDate)
            .ToList();

        return new AlertsResponseDto
        {
            Upcoming = upcoming,
            Overdue = overdue
        };
    }

    private async Task<List<Company>> LoadCompaniesAsync(CancellationToken cancellationToken) =>
        await dbContext.Companies
            .AsNoTracking()
            .Include(company => company.Deliveries)
            .ToListAsync(cancellationToken);

    private static List<ComputedObligation> GenerateAlertObligations(
        IEnumerable<Company> companies,
        int month,
        int year)
    {
        var obligations = ObligationEngine.GenerateForCompanies(companies, month, year).ToList();

        if (month == 1)
        {
            return obligations;
        }

        var existingIds = obligations.Select(obligation => obligation.Id).ToHashSet();
        var januaryObligations = ObligationEngine.GenerateForCompanies(companies, 1, year)
            .Where(obligation => existingIds.Add(obligation.Id));

        obligations.AddRange(januaryObligations);
        return obligations;
    }
}

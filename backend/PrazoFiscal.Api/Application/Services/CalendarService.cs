using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Application.Interfaces;
using PrazoFiscal.Api.Application.Mappers;
using PrazoFiscal.Api.Application.Rules;
using PrazoFiscal.Api.Common.Helpers;
using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.Domain.Enums;
using PrazoFiscal.Api.DTOs.Obligation;
using PrazoFiscal.Api.Infrastructure.Data;

namespace PrazoFiscal.Api.Application.Services;

public class CalendarService(AppDbContext dbContext) : ICalendarService
{
    public async Task<List<ObligationResponseDto>> GetCalendarAsync(CalendarQueryDto query, CancellationToken cancellationToken)
    {
        var companiesQuery = dbContext.Companies
            .AsNoTracking()
            .Include(company => company.Deliveries)
            .AsQueryable();

        if (query.CompanyId.HasValue)
        {
            companiesQuery = companiesQuery.Where(company => company.Id == query.CompanyId.Value);
        }

        var companies = await companiesQuery.ToListAsync(cancellationToken);

        ObligationStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<ObligationStatus>(query.Status, ignoreCase: true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var obligations = companies
            .SelectMany(company => ObligationEngine.Generate(
                company.Id,
                company.Name,
                company.TaxRegime,
                query.Month,
                query.Year,
                company.Deliveries))
            .Where(obligation => !statusFilter.HasValue || obligation.Status == statusFilter.Value)
            .Select(ObligationMapper.ToDto)
            .OrderBy(obligation => obligation.DueDate)
            .ThenBy(obligation => obligation.CompanyName)
            .ToList();

        return obligations;
    }

    public async Task<ObligationResponseDto> RegisterDeliveryAsync(
        string obligationId,
        DateTime deliveredAt,
        CancellationToken cancellationToken)
    {
        var (companyId, obligationType, month, year) = ObligationIdParser.Parse(obligationId);

        var company = await dbContext.Companies
            .Include(item => item.Deliveries)
            .FirstOrDefaultAsync(item => item.Id == companyId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        var computed = ObligationEngine.Generate(
            company.Id,
            company.Name,
            company.TaxRegime,
            month,
            year,
            company.Deliveries)
            .FirstOrDefault(item => item.Type == obligationType)
            ?? throw new KeyNotFoundException("Obrigação não encontrada.");

        if (computed.Status == ObligationStatus.NotApplicable)
        {
            throw new InvalidOperationException("Esta obrigação não se aplica ao regime tributário da empresa.");
        }

        var existingDelivery = company.Deliveries.FirstOrDefault(delivery =>
            delivery.ObligationType == obligationType &&
            delivery.CompetenceMonth == month &&
            delivery.CompetenceYear == year);

        // Normaliza para UTC: o modal envia "YYYY-MM-DD" sem timezone,
        // que o System.Text.Json desserializa como Kind=Unspecified.
        // Npgsql rejeita Kind=Unspecified em colunas timestamp with time zone.
        deliveredAt = DateTime.SpecifyKind(deliveredAt, DateTimeKind.Utc);

        if (existingDelivery is null)
        {
            existingDelivery = new ObligationDelivery
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                ObligationType = obligationType,
                CompetenceMonth = month,
                CompetenceYear = year,
                DeliveredAt = deliveredAt
            };

            dbContext.ObligationDeliveries.Add(existingDelivery);
        }
        else
        {
            existingDelivery.DeliveredAt = deliveredAt;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Usa company.Deliveries diretamente — após dbContext.Add(), o EF Core já
        // inseriu existingDelivery na coleção via relationship fixup, então usar
        // .Append(existingDelivery) geraria chave duplicada no ToDictionary do engine.
        var updated = ObligationEngine.Generate(
            company.Id,
            company.Name,
            company.TaxRegime,
            month,
            year,
            company.Deliveries)
            .First(item => item.Type == obligationType);

        return ObligationMapper.ToDto(updated);
    }

    public async Task<string> ExportCalendarCsvAsync(CalendarQueryDto query, CancellationToken cancellationToken)
    {
        var obligations = await GetCalendarAsync(query, cancellationToken);
        return CalendarCsvExporter.ToCsv(obligations);
    }

    public async Task<byte[]> ExportCalendarPdfAsync(CalendarQueryDto query, CancellationToken cancellationToken)
    {
        var obligations = await GetCalendarAsync(query, cancellationToken);
        return CalendarPdfExporter.Generate(obligations, query.Month, query.Year);
    }
}

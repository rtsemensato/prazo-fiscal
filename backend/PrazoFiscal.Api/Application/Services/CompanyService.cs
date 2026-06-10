using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Application.Interfaces;
using PrazoFiscal.Api.Application.Rules;
using PrazoFiscal.Api.Common.Validation;
using PrazoFiscal.Api.Domain.Entities;
using PrazoFiscal.Api.DTOs.Company;
using PrazoFiscal.Api.Infrastructure.Data;

namespace PrazoFiscal.Api.Application.Services;

public class CompanyService(AppDbContext dbContext) : ICompanyService
{
    public async Task<List<CompanyResponseDto>> ListAsync(string? search, CancellationToken cancellationToken)
    {
        var query = dbContext.Companies.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            var digits = CnpjValidator.Normalize(search);

            query = query.Where(company =>
                company.Name.ToLower().Contains(normalizedSearch) ||
                (!string.IsNullOrEmpty(digits) && company.Cnpj.Contains(digits)));
        }

        return await query
            .OrderBy(company => company.Name)
            .Select(company => ToDto(company))
            .ToListAsync(cancellationToken);
    }

    public async Task<CompanyResponseDto> CreateAsync(CompanyRequestDto request, CancellationToken cancellationToken)
    {
        var normalizedCnpj = CnpjValidator.Normalize(request.Cnpj);

        if (await dbContext.Companies.AnyAsync(company => company.Cnpj == normalizedCnpj, cancellationToken))
        {
            throw new InvalidOperationException("Já existe uma empresa cadastrada com este CNPJ.");
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Cnpj = normalizedCnpj,
            TaxRegime = request.TaxRegime
        };

        dbContext.Companies.Add(company);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(company);
    }

    public async Task<CompanyResponseDto> UpdateAsync(Guid id, CompanyRequestDto request, CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        var normalizedCnpj = CnpjValidator.Normalize(request.Cnpj);

        if (await dbContext.Companies.AnyAsync(item => item.Cnpj == normalizedCnpj && item.Id != id, cancellationToken))
        {
            throw new InvalidOperationException("Já existe uma empresa cadastrada com este CNPJ.");
        }

        company.Name = request.Name.Trim();
        company.Cnpj = normalizedCnpj;
        company.TaxRegime = request.TaxRegime;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(company);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        dbContext.Companies.Remove(company);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<DeliveryHistoryItemDto>> GetDeliveriesAsync(
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies
            .AsNoTracking()
            .Include(item => item.Deliveries)
            .FirstOrDefaultAsync(item => item.Id == companyId, cancellationToken)
            ?? throw new KeyNotFoundException("Empresa não encontrada.");

        return company.Deliveries
            .Select(delivery =>
            {
                var computed = ObligationEngine.Generate(
                    company.Id,
                    company.Name,
                    company.TaxRegime,
                    delivery.CompetenceMonth,
                    delivery.CompetenceYear,
                    company.Deliveries)
                    .First(obligation => obligation.Type == delivery.ObligationType);

                return new DeliveryHistoryItemDto
                {
                    ObligationId = computed.Id,
                    Type = delivery.ObligationType,
                    Periodicity = computed.Periodicity,
                    CompetenceMonth = delivery.CompetenceMonth,
                    CompetenceYear = delivery.CompetenceYear,
                    DueDate = computed.DueDate.ToString("yyyy-MM-dd"),
                    Status = computed.Status,
                    DeliveredAt = delivery.DeliveredAt.ToString("yyyy-MM-dd")
                };
            })
            .OrderByDescending(item => item.DeliveredAt)
            .ToList();
    }

    private static CompanyResponseDto ToDto(Company company) =>
        new()
        {
            Id = company.Id,
            Name = company.Name,
            Cnpj = company.Cnpj,
            TaxRegime = company.TaxRegime
        };
}

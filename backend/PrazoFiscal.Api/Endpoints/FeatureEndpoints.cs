using FluentValidation;
using PrazoFiscal.Api.Application.Interfaces;
using PrazoFiscal.Api.Common.Responses;
using PrazoFiscal.Api.Common.Validation;
using PrazoFiscal.Api.DTOs.Company;
using PrazoFiscal.Api.DTOs.Company.Validators;
using PrazoFiscal.Api.DTOs.Obligation;
using PrazoFiscal.Api.DTOs.Obligation.Validators;
using System.Text;

namespace PrazoFiscal.Api.Endpoints;

public static class CompaniesEndpoints
{
    public static RouteGroupBuilder MapCompanies(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/companies").WithTags("Companies");

        group.MapGet("/", async (string? search, ICompanyService service, CancellationToken cancellationToken) =>
        {
            var data = await service.ListAsync(search, cancellationToken);
            return Results.Ok(ApiListResponse<CompanyResponseDto>.Ok(data));
        });

        group.MapPost("/", async (
            CompanyRequestDto request,
            IValidator<CompanyRequestDto> validator,
            ICompanyService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(request, cancellationToken);
            var data = await service.CreateAsync(request, cancellationToken);
            return Results.Ok(ApiResponse<CompanyResponseDto>.Ok(data, "Empresa cadastrada com sucesso."));
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            CompanyRequestDto request,
            IValidator<CompanyRequestDto> validator,
            ICompanyService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(request, cancellationToken);
            var data = await service.UpdateAsync(id, request, cancellationToken);
            return Results.Ok(ApiResponse<CompanyResponseDto>.Ok(data, "Empresa atualizada com sucesso."));
        });

        group.MapDelete("/{id:guid}", async (Guid id, ICompanyService service, CancellationToken cancellationToken) =>
        {
            await service.DeleteAsync(id, cancellationToken);
            return Results.Ok(ApiResponse<object?>.Ok(null, "Empresa removida com sucesso."));
        });

        group.MapGet("/{id:guid}/deliveries", async (Guid id, ICompanyService service, CancellationToken cancellationToken) =>
        {
            var data = await service.GetDeliveriesAsync(id, cancellationToken);
            return Results.Ok(ApiListResponse<DeliveryHistoryItemDto>.Ok(data));
        });

        return group;
    }
}

public static class ObligationsEndpoints
{
    public static RouteGroupBuilder MapObligations(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/obligations").WithTags("Obligations");

        group.MapGet("/calendar", async (
            [AsParameters] CalendarQueryDto query,
            IValidator<CalendarQueryDto> validator,
            ICalendarService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(query, cancellationToken);
            var data = await service.GetCalendarAsync(query, cancellationToken);
            return Results.Ok(ApiListResponse<ObligationResponseDto>.Ok(data));
        });

        group.MapGet("/calendar/export", async (
            [AsParameters] CalendarQueryDto query,
            IValidator<CalendarQueryDto> validator,
            ICalendarService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(query, cancellationToken);
            var csv = await service.ExportCalendarCsvAsync(query, cancellationToken);
            var fileName = $"calendario-{query.Month:D2}-{query.Year}.csv";
            return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", fileName);
        });

        group.MapGet("/calendar/export/pdf", async (
            [AsParameters] CalendarQueryDto query,
            IValidator<CalendarQueryDto> validator,
            ICalendarService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(query, cancellationToken);
            var pdf = await service.ExportCalendarPdfAsync(query, cancellationToken);
            var fileName = $"calendario-{query.Month:D2}-{query.Year}.pdf";
            return Results.File(pdf, "application/pdf", fileName);
        });

        group.MapPost("/{obligationId}/deliveries", async (
            string obligationId,
            DeliverObligationDto request,
            IValidator<DeliverObligationDto> validator,
            ICalendarService service,
            CancellationToken cancellationToken) =>
        {
            await validator.ValidateOrThrowAsync(request, cancellationToken);
            var data = await service.RegisterDeliveryAsync(obligationId, request.DeliveredAt, cancellationToken);
            return Results.Ok(ApiResponse<ObligationResponseDto>.Ok(data, "Entrega registrada com sucesso."));
        });

        return group;
    }
}

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboard(this IEndpointRouteBuilder app)
    {
        var dashboardGroup = app.MapGroup("/api/dashboard").WithTags("Dashboard");

        dashboardGroup.MapGet("/", async (IDashboardService service, CancellationToken cancellationToken) =>
        {
            var data = await service.GetDashboardAsync(cancellationToken);
            return Results.Ok(ApiResponse<DTOs.Dashboard.DashboardResponseDto>.Ok(data));
        });

        app.MapGet("/api/alerts", async (IDashboardService service, CancellationToken cancellationToken) =>
        {
            var data = await service.GetAlertsAsync(cancellationToken);
            return Results.Ok(ApiResponse<DTOs.Dashboard.AlertsResponseDto>.Ok(data));
        }).WithTags("Dashboard");

        return dashboardGroup;
    }
}

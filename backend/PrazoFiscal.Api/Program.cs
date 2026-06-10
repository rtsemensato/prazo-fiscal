using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PrazoFiscal.Api.Application.Interfaces;
using PrazoFiscal.Api.Application.Services;
using PrazoFiscal.Api.Common.Errors;
using PrazoFiscal.Api.DTOs.Company;
using PrazoFiscal.Api.DTOs.Company.Validators;
using PrazoFiscal.Api.DTOs.Obligation;
using PrazoFiscal.Api.DTOs.Obligation.Validators;
using PrazoFiscal.Api.Endpoints;
using PrazoFiscal.Api.Infrastructure.Data;
using PrazoFiscal.Api.Infrastructure.Data.Seed;
using Scalar.AspNetCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration).WriteTo.Console());

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<ICompanyService, CompanyService>();
    builder.Services.AddScoped<ICalendarService, CalendarService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();

    builder.Services.AddValidatorsFromAssemblyContaining<CompanyRequestValidator>();
    builder.Services.AddValidatorsFromAssemblyContaining<CalendarQueryValidator>();
    builder.Services.AddExceptionHandler<AppExceptionHandler>();
    builder.Services.AddProblemDetails();

    builder.Services.AddOpenApi();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontendPolicy", policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:4173",
                    "http://localhost")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.ConfigureHttpJsonOptions(options =>
    {
        options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

    var app = builder.Build();

    if (!IsDesignTime())
    {
        await app.MigrateAndSeedAsync();
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseExceptionHandler();
    app.UseSerilogRequestLogging();
    app.UseCors("FrontendPolicy");

    app.MapCompanies();
    app.MapObligations();
    app.MapDashboard();

    app.Run();
}
catch (Exception exception)
{
    Log.Fatal(exception, "Aplicação encerrada inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}

static bool IsDesignTime() =>
    string.Equals(Environment.GetEnvironmentVariable("DOTNET_EF"), "true", StringComparison.OrdinalIgnoreCase);

public partial class Program;

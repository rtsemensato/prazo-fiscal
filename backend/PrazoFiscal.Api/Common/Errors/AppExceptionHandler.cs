using FluentValidation.Results;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace PrazoFiscal.Api.Common.Errors;

public class ApiValidationException : Exception
{
    public ApiValidationException(IEnumerable<ValidationFailure> failures)
        : base("Erro de validação.")
    {
        Errors = failures
            .GroupBy(failure => failure.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(item => item.ErrorMessage).ToArray());
    }

    public Dictionary<string, string[]> Errors { get; }
}

public class AppExceptionHandler : IExceptionHandler
{
    private readonly ILogger<AppExceptionHandler> _logger;

    public AppExceptionHandler(ILogger<AppExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, extensions) = exception switch
        {
            ApiValidationException validationException => (
                StatusCodes.Status422UnprocessableEntity,
                "Erro de validação",
                (IDictionary<string, object?>)new Dictionary<string, object?> { ["errors"] = validationException.Errors }),

            KeyNotFoundException => (
                StatusCodes.Status404NotFound,
                exception.Message,
                null),

            InvalidOperationException => (
                StatusCodes.Status409Conflict,
                exception.Message,
                null),

            FormatException => (
                StatusCodes.Status400BadRequest,
                exception.Message,
                null),

            BadHttpRequestException => (
                StatusCodes.Status400BadRequest,
                exception.Message,
                null),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Erro interno do servidor.",
                null)
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Erro não tratado");
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = statusCode >= StatusCodes.Status500InternalServerError ? null : exception.Message,
            Instance = httpContext.Request.Path
        };

        if (extensions is not null)
        {
            foreach (var entry in extensions)
            {
                problemDetails.Extensions[entry.Key] = entry.Value;
            }
        }

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}

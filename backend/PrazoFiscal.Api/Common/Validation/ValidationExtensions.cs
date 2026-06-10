using FluentValidation;
using PrazoFiscal.Api.Common.Errors;

namespace PrazoFiscal.Api.Common.Validation;

public static class ValidationExtensions
{
    public static async Task<T> ValidateOrThrowAsync<T>(this IValidator<T> validator, T instance, CancellationToken cancellationToken = default)
    {
        var result = await validator.ValidateAsync(instance, cancellationToken);
        if (!result.IsValid)
        {
            throw new ApiValidationException(result.Errors);
        }

        return instance;
    }
}

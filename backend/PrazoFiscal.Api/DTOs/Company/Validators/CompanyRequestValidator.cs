using FluentValidation;
using PrazoFiscal.Api.Common.Validation;
using PrazoFiscal.Api.DTOs.Company;

namespace PrazoFiscal.Api.DTOs.Company.Validators;

public class CompanyRequestValidator : AbstractValidator<CompanyRequestDto>
{
    public CompanyRequestValidator()
    {
        RuleFor(company => company.Name)
            .NotEmpty()
            .MinimumLength(3)
            .WithMessage("Informe a razão social com pelo menos 3 caracteres.");

        RuleFor(company => company.Cnpj)
            .NotEmpty()
            .Must(CnpjValidator.IsValid)
            .WithMessage("CNPJ inválido.");

        RuleFor(company => company.TaxRegime)
            .IsInEnum();
    }
}

using FluentValidation;
using PrazoFiscal.Api.Domain.Enums;
using PrazoFiscal.Api.DTOs.Obligation;

namespace PrazoFiscal.Api.DTOs.Obligation.Validators;

public class CalendarQueryValidator : AbstractValidator<CalendarQueryDto>
{
    public CalendarQueryValidator()
    {
        RuleFor(query => query.Month)
            .InclusiveBetween(1, 12);

        RuleFor(query => query.Year)
            .InclusiveBetween(2000, 2100);

        RuleFor(query => query.Status)
            .Must(status => Enum.TryParse<ObligationStatus>(status, ignoreCase: true, out _))
            .When(query => !string.IsNullOrWhiteSpace(query.Status))
            .WithMessage("Status inválido.");
    }
}

public class DeliverObligationValidator : AbstractValidator<DeliverObligationDto>
{
    public DeliverObligationValidator()
    {
        RuleFor(delivery => delivery.DeliveredAt)
            .NotEmpty()
            // Compara apenas a parte da data (sem horário) para evitar falsos positivos
            // de timezone: o frontend envia "YYYY-MM-DD" sem offset, que o deserializador
            // converte para DateTime meia-noite. Se o servidor estiver adiantado em relação
            // ao cliente, "hoje local" poderia ser rejeitado por ser "amanhã UTC".
            .Must(d => DateOnly.FromDateTime(d) <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("A data de entrega não pode ser futura.");
    }
}

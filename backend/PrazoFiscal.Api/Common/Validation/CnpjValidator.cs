namespace PrazoFiscal.Api.Common.Validation;

public static class CnpjValidator
{
    public static string Normalize(string cnpj) => new(cnpj.Where(char.IsDigit).ToArray());

    public static bool IsValid(string cnpj)
    {
        var digits = Normalize(cnpj);

        if (digits.Length != 14 || digits.Distinct().Count() == 1)
        {
            return false;
        }

        int CalculateDigit(string baseNumber, int[] weights)
        {
            var sum = baseNumber.Select((digit, index) => (digit - '0') * weights[index]).Sum();
            var remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        }

        var firstWeights = new[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var secondWeights = new[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        var firstDigit = CalculateDigit(digits[..12], firstWeights);
        var secondDigit = CalculateDigit(digits[..13], secondWeights);

        return firstDigit == digits[12] - '0' && secondDigit == digits[13] - '0';
    }
}

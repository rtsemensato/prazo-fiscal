using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace PrazoFiscal.Tests.Integration;

public class ApiIntegrationTests(ApiIntegrationFixture fixture) : IClassFixture<ApiIntegrationFixture>
{
    // IDs fixos do seed — usados nos testes que não precisam criar dados próprios.
    private const string PadariaId   = "11111111-1111-1111-1111-111111111111"; // Simples Nacional
    private const string TechId      = "22222222-2222-2222-2222-222222222222"; // Lucro Presumido

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    // ─── Smoke tests ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCompanies_ShouldReturnSeededCompanies()
    {
        var response = await fixture.Client.GetAsync("/api/companies");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await ReadListResponseAsync(response);
        payload.GetProperty("success").GetBoolean().Should().BeTrue();
        payload.GetProperty("data").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PostCompany_ShouldCreateCompany()
    {
        var request = new
        {
            name = "Empresa Integração Ltda",
            cnpj = "34028316000103",
            taxRegime = "lucroPresumido"
        };

        var response = await fixture.Client.PostAsJsonAsync("/api/companies", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        payload.GetProperty("success").GetBoolean().Should().BeTrue();
        payload.GetProperty("data").GetProperty("name").GetString().Should().Be(request.name);
    }

    [Fact]
    public async Task PostCompany_WithDuplicateCnpj_ShouldReturnConflict()
    {
        var request = new
        {
            name = "Duplicada Ltda",
            cnpj = "11222333000181",
            taxRegime = "simplesNacional"
        };

        var response = await fixture.Client.PostAsJsonAsync("/api/companies", request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetCalendar_ShouldReturnObligations()
    {
        var now = DateTime.UtcNow;
        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month={now.Month}&year={now.Year}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await ReadListResponseAsync(response);
        payload.GetProperty("data").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetCalendar_WithInvalidStatus_ShouldReturnUnprocessableEntity()
    {
        var now = DateTime.UtcNow;
        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month={now.Month}&year={now.Year}&status=invalid");

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task GetDashboard_ShouldReturnKpis()
    {
        var response = await fixture.Client.GetAsync("/api/dashboard");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        payload.GetProperty("success").GetBoolean().Should().BeTrue();
        payload.GetProperty("data").GetProperty("totalCompanies").GetInt32().Should().BeGreaterThan(0);
    }

    // ─── Registro de entrega ─────────────────────────────────────────────────────

    [Fact]
    public async Task PostDelivery_WithFutureDate_ShouldReturnUnprocessableEntity()
    {
        // Verifica que o validator rejeita datas futuras com 422 — e que a comparação
        // é feita por DateOnly (sem componente de horário) para evitar falso positivo de timezone.
        // CNPJ 11222333000777 é matematicamente válido (dígitos verificadores: 1 e 7).
        var company = await CreateCompanyAsync("Empresa Data Futura Test", "11222333000777", "simplesNacional");
        var companyId = company.GetProperty("id").GetString()!;
        var now = DateTime.UtcNow;
        var obligationId = $"{companyId}-esocial-{now.Month}-{now.Year}";

        var response = await fixture.Client.PostAsJsonAsync(
            $"/api/obligations/{obligationId}/deliveries",
            new { deliveredAt = now.AddDays(5).ToString("yyyy-MM-dd") });

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task PostDelivery_ShouldReturnObligationWithDeliveredStatus()
    {
        // Cria empresa isolada para não interferir nos KPIs dos outros testes.
        // CNPJ 11222333000262 é matematicamente válido (dígitos verificadores: 6 e 2).
        var company = await CreateCompanyAsync("Empresa Entrega Test", "11222333000262", "simplesNacional");
        var companyId = company.GetProperty("id").GetString()!;
        var now = DateTime.UtcNow;
        var obligationId = $"{companyId}-esocial-{now.Month}-{now.Year}";

        var response = await fixture.Client.PostAsJsonAsync(
            $"/api/obligations/{obligationId}/deliveries",
            new { deliveredAt = now.AddDays(-1).ToString("yyyy-MM-dd") });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        payload.GetProperty("data").GetProperty("status").GetString().Should().Be("delivered");
    }

    [Fact]
    public async Task PostDelivery_ShouldReflectOnSubsequentCalendarQuery()
    {
        // Verifica que a engine recalcula o status corretamente após persistir a entrega.
        // CNPJ 11222333000343 é matematicamente válido (dígitos verificadores: 4 e 3).
        var company = await CreateCompanyAsync("Empresa Entrega Calendario Test", "11222333000343", "simplesNacional");
        var companyId = company.GetProperty("id").GetString()!;
        var now = DateTime.UtcNow;
        var obligationId = $"{companyId}-esocial-{now.Month}-{now.Year}";

        await fixture.Client.PostAsJsonAsync(
            $"/api/obligations/{obligationId}/deliveries",
            new { deliveredAt = now.AddDays(-1).ToString("yyyy-MM-dd") });

        var calendarResponse = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month={now.Month}&year={now.Year}&companyId={companyId}");

        calendarResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await ReadListResponseAsync(calendarResponse);

        var esocial = payload.GetProperty("data").EnumerateArray()
            .First(o => o.GetProperty("type").GetString() == "esocial");

        esocial.GetProperty("status").GetString().Should().Be("delivered");
        esocial.GetProperty("deliveredAt").GetString().Should().NotBeNullOrEmpty();
    }

    // ─── Deleção em cascata ──────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteCompany_ShouldReturn404ForSubsequentDeliveriesRequest()
    {
        // Cria empresa, registra uma entrega e então deleta — verifica que o
        // endpoint de histórico retorna 404 (cascata no banco funcionando).
        // CNPJ 11222333000424 é matematicamente válido (dígitos verificadores: 2 e 4).
        var company = await CreateCompanyAsync("Empresa Para Deletar", "11222333000424", "lucroReal");
        var companyId = company.GetProperty("id").GetString()!;
        var now = DateTime.UtcNow;
        var obligationId = $"{companyId}-esocial-{now.Month}-{now.Year}";

        await fixture.Client.PostAsJsonAsync(
            $"/api/obligations/{obligationId}/deliveries",
            new { deliveredAt = now.AddDays(-1).ToString("yyyy-MM-dd") });

        var deleteResponse = await fixture.Client.DeleteAsync($"/api/companies/{companyId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var deliveriesResponse = await fixture.Client.GetAsync($"/api/companies/{companyId}/deliveries");
        deliveriesResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─── Filtros do calendário ───────────────────────────────────────────────────

    [Fact]
    public async Task GetCalendar_WithCompanyIdFilter_ShouldReturnOnlyThatCompany()
    {
        var now = DateTime.UtcNow;

        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month={now.Month}&year={now.Year}&companyId={PadariaId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await ReadListResponseAsync(response);
        var obligations = payload.GetProperty("data").EnumerateArray().ToList();

        obligations.Should().NotBeEmpty();
        obligations.Should().OnlyContain(o =>
            o.GetProperty("companyId").GetString() == PadariaId);
    }

    [Fact]
    public async Task GetCalendar_WithPendingStatusFilter_ShouldReturnOnlyPendingObligations()
    {
        var now = DateTime.UtcNow;

        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month={now.Month}&year={now.Year}&status=pending");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await ReadListResponseAsync(response);
        var obligations = payload.GetProperty("data").EnumerateArray().ToList();

        obligations.Should().NotBeEmpty();
        obligations.Should().OnlyContain(o => o.GetProperty("status").GetString() == "pending");
    }

    // ─── Edição de empresa ───────────────────────────────────────────────────────

    [Fact]
    public async Task PutCompany_ShouldUpdateCompanyData()
    {
        // CNPJ 11222333000505 é matematicamente válido (dígitos verificadores: 0 e 5).
        var company = await CreateCompanyAsync("Empresa Original", "11222333000505", "simplesNacional");
        var companyId = company.GetProperty("id").GetString()!;
        var cnpj = company.GetProperty("cnpj").GetString()!;

        var response = await fixture.Client.PutAsJsonAsync(
            $"/api/companies/{companyId}",
            new { name = "Empresa Atualizada", cnpj, taxRegime = "lucroPresumido" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        payload.GetProperty("data").GetProperty("name").GetString().Should().Be("Empresa Atualizada");
        payload.GetProperty("data").GetProperty("taxRegime").GetString().Should().Be("lucroPresumido");
    }

    [Fact]
    public async Task PutCompany_WithCnpjAlreadyInUse_ShouldReturnConflict()
    {
        // Tenta alterar o CNPJ para um já cadastrado (Padaria, seeded).
        // CNPJ 11222333000696 é matematicamente válido (dígitos verificadores: 9 e 6).
        var company = await CreateCompanyAsync("Empresa Cnpj Conflict Test", "11222333000696", "lucroReal");
        var companyId = company.GetProperty("id").GetString()!;

        var response = await fixture.Client.PutAsJsonAsync(
            $"/api/companies/{companyId}",
            new { name = "Empresa Cnpj Conflict Test", cnpj = "11222333000181", taxRegime = "lucroReal" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    // ─── Alertas ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAlerts_ShouldReturnUpcomingAndOverdueSections()
    {
        var response = await fixture.Client.GetAsync("/api/alerts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        payload.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = payload.GetProperty("data");
        // Seed garante: eSociais do mês corrente aparecem em upcoming (vence dia 7 do mês seguinte)
        // e obrigações de janeiro não entregues por Tech/Industria aparecem em overdue.
        data.GetProperty("upcoming").GetArrayLength().Should().BeGreaterThan(0);
        data.GetProperty("overdue").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetAlerts_AllUpcomingShouldBePendingAndAllOverdueShouldBeOverdue()
    {
        var response = await fixture.Client.GetAsync("/api/alerts");
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var data = payload.GetProperty("data");

        data.GetProperty("upcoming").EnumerateArray()
            .Should().OnlyContain(o => o.GetProperty("status").GetString() == "pending");

        data.GetProperty("overdue").EnumerateArray()
            .Should().OnlyContain(o => o.GetProperty("status").GetString() == "overdue");
    }

    // ─── Regras de vencimento via API ────────────────────────────────────────────

    [Fact]
    public async Task GetCalendar_DctfForMarch_DueDateShouldBeMay15()
    {
        // Verifica end-to-end que a engine calcula o vencimento da DCTF
        // como o dia 15 do segundo mês seguinte à competência (PDF seção 3.3).
        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month=3&year=2026&companyId={TechId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await ReadListResponseAsync(response);

        var dctf = payload.GetProperty("data").EnumerateArray()
            .First(o => o.GetProperty("type").GetString() == "dctf");

        dctf.GetProperty("dueDate").GetString().Should().Be("2026-05-15");
    }

    [Fact]
    public async Task GetCalendar_EsocialForMarch_DueDateShouldBeApril7()
    {
        // Verifica que o eSocial vence no dia 7 do mês seguinte (PDF seção 3.3).
        var response = await fixture.Client.GetAsync(
            $"/api/obligations/calendar?month=3&year=2026&companyId={TechId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await ReadListResponseAsync(response);

        var esocial = payload.GetProperty("data").EnumerateArray()
            .First(o => o.GetProperty("type").GetString() == "esocial");

        esocial.GetProperty("dueDate").GetString().Should().Be("2026-04-07");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private async Task<JsonElement> CreateCompanyAsync(string name, string cnpj, string taxRegime)
    {
        var response = await fixture.Client.PostAsJsonAsync("/api/companies",
            new { name, cnpj, taxRegime });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        return payload.GetProperty("data");
    }

    private static async Task<JsonElement> ReadListResponseAsync(HttpResponseMessage response)
    {
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        return payload;
    }
}

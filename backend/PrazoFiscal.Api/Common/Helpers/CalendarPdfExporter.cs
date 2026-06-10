using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using PrazoFiscal.Api.Domain.Enums;
using PrazoFiscal.Api.DTOs.Obligation;

namespace PrazoFiscal.Api.Common.Helpers;

/// <summary>
/// Gera um PDF do calendário de obrigações acessórias usando QuestPDF.
/// A paleta de cores segue a identidade visual da e-Auditoria (seção 4.3 do case).
/// </summary>
public static class CalendarPdfExporter
{
    // ── Paleta e-Auditoria ────────────────────────────────────────────
    private static readonly string NavyHex     = "#0D1B2A";
    private static readonly string PrimaryHex  = "#1565C0";
    private static readonly string AccentHex   = "#00ACC1";
    private static readonly string SuccessHex  = "#2E7D32";
    private static readonly string WarningHex  = "#F57F17";
    private static readonly string ErrorHex    = "#C62828";
    private static readonly string SurfaceHex  = "#F5F7FA";
    private static readonly string TextHex     = "#212121";
    private static readonly string MutedHex    = "#757575";

    private static readonly Dictionary<ObligationType, string> TypeLabels = new()
    {
        [ObligationType.Das]              = "DAS",
        [ObligationType.Defis]            = "DEFIS",
        [ObligationType.Dctf]             = "DCTF",
        [ObligationType.EfdIcmsIpi]       = "EFD-ICMS/IPI",
        [ObligationType.EfdContribuicoes] = "EFD Contribuições",
        [ObligationType.EfdReinf]         = "EFD-Reinf",
        [ObligationType.SpedEcd]          = "SPED ECD",
        [ObligationType.SpedEcf]          = "SPED ECF",
        [ObligationType.Esocial]          = "eSocial",
        [ObligationType.Dirf]             = "DIRF",
        [ObligationType.Rais]             = "RAIS"
    };

    private static readonly Dictionary<ObligationPeriodicity, string> PeriodicityLabels = new()
    {
        [ObligationPeriodicity.Monthly] = "Mensal",
        [ObligationPeriodicity.Annual]  = "Anual"
    };

    private static readonly Dictionary<ObligationStatus, string> StatusLabels = new()
    {
        [ObligationStatus.Pending]       = "Pendente",
        [ObligationStatus.Overdue]       = "Atrasada",
        [ObligationStatus.Delivered]     = "Entregue",
        [ObligationStatus.NotApplicable] = "Não Aplicável"
    };

    private static readonly Dictionary<ObligationStatus, string> StatusColors = new()
    {
        [ObligationStatus.Pending]       = WarningHex,
        [ObligationStatus.Overdue]       = ErrorHex,
        [ObligationStatus.Delivered]     = SuccessHex,
        [ObligationStatus.NotApplicable] = MutedHex
    };

    private static readonly string[] MonthNames =
    [
        "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    public static byte[] Generate(
        IReadOnlyList<ObligationResponseDto> obligations,
        int month,
        int year,
        string? companyFilter = null,
        string? statusFilter = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(32, Unit.Point);
                page.DefaultTextStyle(ts => ts.FontFamily("Arial").FontSize(9).FontColor(TextHex));

                page.Header().Element(ComposeHeader(month, year, companyFilter, statusFilter));
                page.Content().Element(ComposeContent(obligations));
                page.Footer().Element(ComposeFooter(obligations));
            });
        }).GeneratePdf();
    }

    // ── Header ───────────────────────────────────────────────────────
    private static Action<IContainer> ComposeHeader(int month, int year, string? company, string? status) =>
        header =>
        {
            header.Column(col =>
            {
                // barra superior colorida
                col.Item()
                    .Background(NavyHex)
                    .Padding(12, Unit.Point)
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .Text("Painel de Obrigações Acessórias")
                            .FontSize(15).Bold().FontColor(Colors.White);

                        row.ConstantItem(200)
                            .AlignRight()
                            .Text($"{MonthNames[month]} de {year}")
                            .FontSize(11).FontColor(AccentHex).Bold();
                    });

                // linha de filtros ativos (se houver)
                if (company is not null || status is not null)
                {
                    col.Item()
                        .Background(SurfaceHex)
                        .PaddingHorizontal(12, Unit.Point)
                        .PaddingVertical(6, Unit.Point)
                        .Text(txt =>
                        {
                            txt.Span("Filtros: ").SemiBold().FontColor(MutedHex);
                            if (company is not null)
                                txt.Span($"Empresa — {company}  ").FontColor(PrimaryHex);
                            if (status is not null)
                                txt.Span($"Status — {status}").FontColor(PrimaryHex);
                        });
                }

                col.Item().Height(8, Unit.Point);
            });
        };

    // ── Tabela de obrigações ─────────────────────────────────────────
    private static Action<IContainer> ComposeContent(IReadOnlyList<ObligationResponseDto> obligations) =>
        content =>
        {
            content.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(3.0f); // Empresa
                    cols.RelativeColumn(1.6f); // Obrigação
                    cols.RelativeColumn(1.2f); // Periodicidade
                    cols.RelativeColumn(1.2f); // Competência
                    cols.RelativeColumn(1.4f); // Vencimento
                    cols.RelativeColumn(1.4f); // Status
                    cols.RelativeColumn(1.4f); // Entrega
                });

                // cabeçalho da tabela
                static IContainer HeaderCell(IContainer c) =>
                    c.Background(PrimaryHex)
                     .PaddingHorizontal(6, Unit.Point)
                     .PaddingVertical(5, Unit.Point)
                     .AlignMiddle();

                table.Header(h =>
                {
                    string[] headers = ["Empresa", "Obrigação", "Periodicidade", "Competência", "Vencimento", "Status", "Data Entrega"];
                    foreach (var title in headers)
                        h.Cell().Element(HeaderCell)
                                .Text(title).Bold().FontColor(Colors.White).FontSize(8.5f);
                });

                // linhas
                for (var i = 0; i < obligations.Count; i++)
                {
                    var ob = obligations[i];
                    var bg = i % 2 == 0 ? "#FFFFFF" : SurfaceHex;
                    var statusColor = StatusColors[ob.Status];

                    IContainer DataCell(IContainer c) =>
                        c.Background(bg)
                         .BorderBottom(0.5f, Unit.Point)
                         .BorderColor("#E0E0E0")
                         .PaddingHorizontal(6, Unit.Point)
                         .PaddingVertical(5, Unit.Point)
                         .AlignMiddle();

                    var competence = $"{ob.CompetenceMonth:D2}/{ob.CompetenceYear}";
                    var dueDate = DateTime.TryParse(ob.DueDate, out var d) ? d.ToString("dd/MM/yyyy") : ob.DueDate;
                    var deliveredAt = ob.DeliveredAt is not null && DateTime.TryParse(ob.DeliveredAt, out var del)
                        ? del.ToString("dd/MM/yyyy")
                        : "—";

                    table.Cell().Element(DataCell).Text(ob.CompanyName ?? "—").FontSize(8.5f);
                    table.Cell().Element(DataCell).Text(TypeLabels.GetValueOrDefault(ob.Type, ob.Type.ToString())).FontSize(8.5f);
                    table.Cell().Element(DataCell).Text(PeriodicityLabels.GetValueOrDefault(ob.Periodicity, "—")).FontSize(8.5f).FontColor(MutedHex);
                    table.Cell().Element(DataCell).Text(competence).FontSize(8.5f);
                    table.Cell().Element(DataCell).Text(dueDate).FontSize(8.5f);

                    // Status com cor semântica
                    table.Cell().Element(DataCell).Text(txt =>
                    {
                        txt.Span("● ").FontColor(statusColor).FontSize(7f);
                        txt.Span(StatusLabels.GetValueOrDefault(ob.Status, "—")).FontColor(statusColor).FontSize(8.5f).Bold();
                    });

                    table.Cell().Element(DataCell).Text(deliveredAt).FontSize(8.5f).FontColor(MutedHex);
                }
            });
        };

    // ── Footer ───────────────────────────────────────────────────────
    private static Action<IContainer> ComposeFooter(IReadOnlyList<ObligationResponseDto> obligations) =>
        footer =>
        {
            var pending   = obligations.Count(o => o.Status == ObligationStatus.Pending);
            var overdue   = obligations.Count(o => o.Status == ObligationStatus.Overdue);
            var delivered = obligations.Count(o => o.Status == ObligationStatus.Delivered);
            var total     = obligations.Count(o => o.Status != ObligationStatus.NotApplicable);

            footer.Column(col =>
            {
                col.Item().Height(8, Unit.Point);

                col.Item()
                    .Background(SurfaceHex)
                    .Padding(10, Unit.Point)
                    .Row(row =>
                    {
                        SummaryBadge(row, "Total aplicável", total.ToString(), PrimaryHex);
                        SummaryBadge(row, "Pendentes",  pending.ToString(),   WarningHex);
                        SummaryBadge(row, "Atrasadas",  overdue.ToString(),   ErrorHex);
                        SummaryBadge(row, "Entregues",  delivered.ToString(), SuccessHex);

                        row.RelativeItem()
                           .AlignRight()
                           .AlignBottom()
                           .Text($"Gerado em {DateTime.Now:dd/MM/yyyy HH:mm}  •  e-Auditoria")
                           .FontSize(7.5f).FontColor(MutedHex);
                    });
            });
        };

    private static void SummaryBadge(RowDescriptor row, string label, string value, string color)
    {
        row.ConstantItem(100)
            .Border(0.5f, Unit.Point)
            .BorderColor(color)
            .Padding(6, Unit.Point)
            .Column(col =>
            {
                col.Item().Text(value).FontSize(14).Bold().FontColor(color);
                col.Item().Text(label).FontSize(7.5f).FontColor(MutedHex);
            });

        row.ConstantItem(8);
    }
}

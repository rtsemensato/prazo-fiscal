import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPage } from '@/pages/Calendar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useCompaniesStore } from '@/store/useCompaniesStore';
import { ObligationPeriodicity, ObligationStatus, ObligationType } from '@/models/obligation';
import { TaxRegime } from '@/models/company';
import * as companiesApi from '@/api/fiscalService/companies';
import * as obligationsApi from '@/api/fiscalService/obligations';

vi.mock('@/api/fiscalService/companies');
vi.mock('@/api/fiscalService/obligations', async (importOriginal) => {
  const actual = await importOriginal<typeof obligationsApi>();
  return {
    ...actual,
    getCalendarObligations: vi.fn(),
    markObligationAsDelivered: vi.fn(),
  };
});

const company = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Padaria Sol Nascente',
  cnpj: '11222333000181',
  taxRegime: TaxRegime.SimplesNacional,
};

const obligation = {
  id: '11111111-1111-1111-1111-111111111111-das-6-2026',
  companyId: company.id,
  companyName: company.name,
  type: ObligationType.DAS,
  periodicity: ObligationPeriodicity.Monthly,
  competenceMonth: 6,
  competenceYear: 2026,
  dueDate: '2026-07-20',
  status: ObligationStatus.Pending,
};

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // estado de zustand é compartilhado entre testes — garante baseline previsível
    useCalendarStore.setState({
      companyId: undefined,
      month: 6,
      year: 2026,
      statusFilter: undefined,
    });
    useCompaniesStore.setState({ search: '' });

    vi.mocked(companiesApi.getCompanies).mockResolvedValue({
      success: true,
      message: '',
      data: [company],
    });
    vi.mocked(obligationsApi.getCalendarObligations).mockResolvedValue({
      success: true,
      message: '',
      data: [obligation],
    });
  });

  it('renderiza a tabela de obrigações do mês selecionado', async () => {
    renderWithProviders(<CalendarPage />);

    await waitFor(() => expect(screen.getByText('Padaria Sol Nascente')).toBeInTheDocument());
    expect(screen.getByText('DAS')).toBeInTheDocument();
    expect(screen.getByText('Calendário de Obrigações')).toBeInTheDocument();
  });

  it('envia o filtro de status escolhido para a query do calendário', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarPage />);

    await waitFor(() => expect(screen.getByText('Padaria Sol Nascente')).toBeInTheDocument());

    const statusPlaceholder = screen.getByText('Filtrar por status');
    const statusInput = statusPlaceholder.closest('.ant-select')?.querySelector('input[role="combobox"]');
    expect(statusInput).not.toBeNull();
    await user.click(statusInput as Element);

    const option = await screen.findByTitle('Atrasada');
    await user.click(option);

    await waitFor(() =>
      expect(obligationsApi.getCalendarObligations).toHaveBeenCalledWith(
        expect.objectContaining({ status: ObligationStatus.Overdue }),
        expect.anything(),
      ),
    );
  });

  it('abre uma nova aba com a URL de exportação ao clicar em "Exportar CSV"', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderWithProviders(<CalendarPage />);

    await waitFor(() => expect(screen.getByText('Padaria Sol Nascente')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /exportar csv/i }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url] = openSpy.mock.calls[0];
    expect(String(url)).toContain('/obligations/calendar/export');
    expect(String(url)).toContain('month=6');
    expect(String(url)).toContain('year=2026');

    openSpy.mockRestore();
  });

  it('abre o modal de entrega e confirma a marcação da obrigação selecionada', async () => {
    const user = userEvent.setup();

    vi.mocked(obligationsApi.markObligationAsDelivered).mockResolvedValue({
      success: true,
      message: 'Entrega registrada com sucesso!',
      data: { ...obligation, status: ObligationStatus.Delivered, deliveredAt: '2026-06-08' },
    });

    renderWithProviders(<CalendarPage />);

    const deliverButton = await screen.findByRole('button', { name: /marcar entregue/i });
    await user.click(deliverButton);

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Registrar Entrega')).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: /confirmar/i }));

    await waitFor(() =>
      expect(obligationsApi.markObligationAsDelivered).toHaveBeenCalledWith(obligation.id, expect.any(String)),
    );
  });
});

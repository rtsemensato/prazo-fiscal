import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsPage } from '@/pages/Alerts';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ObligationPeriodicity, ObligationStatus, ObligationType } from '@/models/obligation';
import * as dashboardApi from '@/api/fiscalService/dashboard';
import * as obligationsApi from '@/api/fiscalService/obligations';

vi.mock('@/api/fiscalService/dashboard');
vi.mock('@/api/fiscalService/obligations');

const upcomingObligation = {
  id: '11111111-1111-1111-1111-111111111111-das-6-2026',
  companyId: '11111111-1111-1111-1111-111111111111',
  companyName: 'Padaria Sol Nascente',
  type: ObligationType.DAS,
  periodicity: ObligationPeriodicity.Monthly,
  competenceMonth: 6,
  competenceYear: 2026,
  dueDate: '2026-07-20',
  status: ObligationStatus.Pending,
};

const overdueObligation = {
  id: '22222222-2222-2222-2222-222222222222-dctf-4-2026',
  companyId: '22222222-2222-2222-2222-222222222222',
  companyName: 'Tech Solutions Presumido',
  type: ObligationType.DCTF,
  periodicity: ObligationPeriodicity.Monthly,
  competenceMonth: 4,
  competenceYear: 2026,
  dueDate: '2026-06-15',
  status: ObligationStatus.Overdue,
};

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lista as obrigações vencendo nos próximos 30 dias e as atrasadas em seções separadas', async () => {
    vi.mocked(dashboardApi.getAlerts).mockResolvedValue({
      success: true,
      message: '',
      data: { upcoming: [upcomingObligation], overdue: [overdueObligation] },
    });

    renderWithProviders(<AlertsPage />);

    await waitFor(() => expect(screen.getByText('Padaria Sol Nascente')).toBeInTheDocument());

    expect(screen.getByText('Vencendo nos próximos 30 dias')).toBeInTheDocument();
    expect(screen.getByText('Atrasadas')).toBeInTheDocument();

    expect(screen.getByText('Padaria Sol Nascente')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Presumido')).toBeInTheDocument();
    expect(screen.getByText('DAS')).toBeInTheDocument();
    expect(screen.getByText('DCTF')).toBeInTheDocument();
  });

  it('mostra mensagens de "vazio" quando não há alertas em uma das seções', async () => {
    vi.mocked(dashboardApi.getAlerts).mockResolvedValue({
      success: true,
      message: '',
      data: { upcoming: [], overdue: [overdueObligation] },
    });

    renderWithProviders(<AlertsPage />);

    await waitFor(() =>
      expect(screen.getByText('Nenhuma obrigação vencendo nos próximos 30 dias.')).toBeInTheDocument(),
    );
    expect(screen.getByText('Tech Solutions Presumido')).toBeInTheDocument();
  });

  it('permite abrir o modal de registro de entrega e confirma a mutação para a obrigação selecionada', async () => {
    const user = userEvent.setup();

    vi.mocked(dashboardApi.getAlerts).mockResolvedValue({
      success: true,
      message: '',
      data: { upcoming: [upcomingObligation], overdue: [] },
    });
    vi.mocked(obligationsApi.markObligationAsDelivered).mockResolvedValue({
      success: true,
      message: 'Entrega registrada com sucesso!',
      data: { ...upcomingObligation, status: ObligationStatus.Delivered, deliveredAt: '2026-06-08' },
    });

    renderWithProviders(<AlertsPage />);

    const deliverButton = await screen.findByRole('button', { name: /marcar entregue/i });
    await user.click(deliverButton);

    expect(await screen.findByText('Registrar Entrega')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() =>
      expect(obligationsApi.markObligationAsDelivered).toHaveBeenCalledWith(
        upcomingObligation.id,
        expect.any(String),
      ),
    );
  });
});

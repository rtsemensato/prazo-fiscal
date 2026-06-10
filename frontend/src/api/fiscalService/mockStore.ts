import { TaxRegime, type CompanyFormData, type CompanyWithId, type DeliveryHistoryItem } from '@/models/company';
import type { DashboardStats } from '@/models/dashboard';
import type { AlertsResponse, CalendarFilter, CompaniesFilter } from '@/models/filters';
import { ObligationStatus, type ObligationWithId } from '@/models/obligation';
import type {
  StandardResponseCreate,
  StandardResponseDelete,
  StandardResponseEdit,
  StandardResponseGetList,
  StandardResponseGetUnique,
} from '@/models/standardResponse';
import { stripCnpj } from '@/utils/cnpj';
import { dayjs, isWithinNextDays } from '@/utils/dates';
import { generateObligationsForMonth, resolveObligationStatus } from '@/utils/obligationRules';

interface MockState {
  companies: CompanyWithId[];
  deliveries: Record<string, string>;
}

const initialCompanies: CompanyWithId[] = [
  {
    id: '1',
    name: 'Padaria Sol Nascente Ltda',
    cnpj: '11222333000181',
    taxRegime: TaxRegime.SimplesNacional,
  },
  {
    id: '2',
    name: 'Tech Solutions Presumido S.A.',
    cnpj: '11444777000161',
    taxRegime: TaxRegime.LucroPresumido,
  },
  {
    id: '3',
    name: 'Indústria Metalúrgica Real Ltda',
    cnpj: '55666777000144',
    taxRegime: TaxRegime.LucroReal,
  },
  {
    id: '4',
    name: 'Associação Beneficente Esperança',
    cnpj: '99888777000155',
    taxRegime: TaxRegime.ImunidadeIsencao,
  },
];

const mockState: MockState = {
  companies: [...initialCompanies],
  deliveries: {
    '1-esocial-6-2026': dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
  },
};

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return crypto.randomUUID();
}

function getAllObligations(): ObligationWithId[] {
  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();

  return generateObligationsForMonth(mockState.companies, month, year, mockState.deliveries);
}

function enrichObligations(obligations: ObligationWithId[]): ObligationWithId[] {
  return obligations.map((obligation) => {
    const deliveredAt = mockState.deliveries[obligation.id];
    return {
      ...obligation,
      deliveredAt,
      status: resolveObligationStatus(obligation.dueDate, deliveredAt),
    };
  });
}

export const mockStore = {
  async getCompanies(filter: CompaniesFilter): Promise<StandardResponseGetList<CompanyWithId>> {
    await delay();
    const search = filter.search.trim().toLowerCase();
    const data = mockState.companies.filter((company) => {
      if (!search) return true;
      return (
        company.name.toLowerCase().includes(search) ||
        stripCnpj(company.cnpj).includes(stripCnpj(search))
      );
    });

    return { success: true, data };
  },

  async getCompanyDeliveries(id: string): Promise<StandardResponseGetList<DeliveryHistoryItem>> {
    await delay();
    const company = mockState.companies.find((item) => item.id === id);
    if (!company) {
      throw new Error('Empresa não encontrada.');
    }

    const data = Object.entries(mockState.deliveries)
      .filter(([obligationId]) => obligationId.startsWith(`${id}-`))
      .map(([obligationId, deliveredAt]) => {
        const parts = obligationId.split('-');
        const year = Number(parts[parts.length - 1]);
        const month = Number(parts[parts.length - 2]);
        const obligation = enrichObligations(
          generateObligationsForMonth([company], month, year, mockState.deliveries),
        ).find((item) => item.id === obligationId);

        if (!obligation) {
          throw new Error('Obrigação não encontrada.');
        }

        return {
          obligationId,
          type: obligation.type,
          periodicity: obligation.periodicity,
          competenceMonth: obligation.competenceMonth,
          competenceYear: obligation.competenceYear,
          dueDate: obligation.dueDate,
          status: obligation.status,
          deliveredAt,
        };
      })
      .sort((left, right) => dayjs(right.deliveredAt).valueOf() - dayjs(left.deliveredAt).valueOf());

    return { success: true, data };
  },

  async createCompany(payload: CompanyFormData): Promise<StandardResponseCreate<CompanyWithId>> {
    await delay();
    const company: CompanyWithId = {
      id: generateId(),
      ...payload,
      cnpj: stripCnpj(payload.cnpj),
    };
    mockState.companies.push(company);
    return { success: true, data: company, message: 'Empresa cadastrada com sucesso.' };
  },

  async updateCompany(id: string, payload: CompanyFormData): Promise<StandardResponseEdit<CompanyWithId>> {
    await delay();
    const index = mockState.companies.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Empresa não encontrada.');
    }

    const updated: CompanyWithId = {
      id,
      ...payload,
      cnpj: stripCnpj(payload.cnpj),
    };
    mockState.companies[index] = updated;
    return { success: true, data: updated, message: 'Empresa atualizada com sucesso.' };
  },

  async deleteCompany(id: string): Promise<StandardResponseDelete> {
    await delay();
    mockState.companies = mockState.companies.filter((item) => item.id !== id);
    return { success: true, data: null, message: 'Empresa removida com sucesso.' };
  },

  async getCalendar(filter: CalendarFilter): Promise<StandardResponseGetList<ObligationWithId>> {
    await delay();
    const companies = filter.companyId
      ? mockState.companies.filter((company) => company.id === filter.companyId)
      : mockState.companies;

    let obligations = enrichObligations(
      generateObligationsForMonth(companies, filter.month, filter.year, mockState.deliveries),
    );

    if (filter.status) {
      obligations = obligations.filter((obligation) => obligation.status === filter.status);
    }

    return { success: true, data: obligations };
  },

  async markAsDelivered(
    obligationId: string,
    deliveredAt: string,
  ): Promise<StandardResponseEdit<ObligationWithId>> {
    await delay();
    mockState.deliveries[obligationId] = deliveredAt;

    const obligation = getAllObligations().find((item) => item.id === obligationId);
    if (!obligation) {
      throw new Error('Obrigação não encontrada.');
    }

    const updated: ObligationWithId = {
      ...obligation,
      deliveredAt,
      status: ObligationStatus.Delivered,
    };

    return { success: true, data: updated, message: 'Entrega registrada com sucesso.' };
  },

  async getAlerts(): Promise<StandardResponseGetUnique<AlertsResponse>> {
    await delay();
    const obligations = enrichObligations(getAllObligations()).filter(
      (obligation) => obligation.status !== ObligationStatus.NotApplicable,
    );

    const upcoming = obligations
      .filter(
        (obligation) =>
          obligation.status === ObligationStatus.Pending && isWithinNextDays(obligation.dueDate, 30),
      )
      .sort((left, right) => dayjs(left.dueDate).valueOf() - dayjs(right.dueDate).valueOf());

    const overdue = obligations
      .filter((obligation) => obligation.status === ObligationStatus.Overdue)
      .sort((left, right) => dayjs(left.dueDate).valueOf() - dayjs(right.dueDate).valueOf());

    return { success: true, data: { upcoming, overdue } };
  },

  async getDashboard(): Promise<StandardResponseGetUnique<DashboardStats>> {
    await delay();
    const now = dayjs();
    const obligations = enrichObligations(
      generateObligationsForMonth(
        mockState.companies,
        now.month() + 1,
        now.year(),
        mockState.deliveries,
      ),
    ).filter((obligation) => obligation.status !== ObligationStatus.NotApplicable);

    return {
      success: true,
      data: {
        totalCompanies: mockState.companies.length,
        monthObligations: obligations.length,
        pendingCount: obligations.filter((item) => item.status === ObligationStatus.Pending).length,
        deliveredCount: obligations.filter((item) => item.status === ObligationStatus.Delivered).length,
        overdueCount: obligations.filter((item) => item.status === ObligationStatus.Overdue).length,
      },
    };
  },
};

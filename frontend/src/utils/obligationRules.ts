// Este arquivo espelha a ObligationEngine do backend exclusivamente para o modo mock
// (VITE_USE_MOCK=true). A fonte de verdade das regras é o backend; qualquer alteração
// nas regras fiscais deve ser replicada aqui manualmente.
//
// Trade-off documentado: a abordagem alternativa seria MSW (Mock Service Worker), que
// intercepta chamadas HTTP reais e retorna fixtures estáticos — sem replicar lógica.
// MSW eliminaria o risco de divergência silenciosa, mas exigiria manter um conjunto
// de dados de fixture representativos. Para o escopo deste projeto, a duplicação é
// aceitável porque o mock é usado apenas em desenvolvimento/testes de componente, e
// o CI testa sempre contra a API real.
import { TaxRegime } from '@/models/company';
import {
  ObligationPeriodicity,
  ObligationStatus,
  ObligationType,
  type ObligationWithId,
} from '@/models/obligation';
import { dayjs, isPastDue, nextBusinessDay, toIsoDate } from '@/utils/dates';

interface ObligationRule {
  type: ObligationType;
  periodicity: ObligationPeriodicity;
  appliesTo: Record<TaxRegime, boolean>;
  annualJanuaryOnly?: boolean;
  dueDate: (competenceMonth: number, competenceYear: number) => string;
}

const MONTHLY_OBLIGATIONS: ObligationRule[] = [
  {
    type: ObligationType.DAS,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: true,
      [TaxRegime.LucroPresumido]: false,
      [TaxRegime.LucroReal]: false,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(nextBusinessDay(dayjs().year(year).month(month - 1).add(1, 'month').date(20))),
  },
  {
    type: ObligationType.DCTF,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(dayjs().year(year).month(month - 1).add(2, 'month').date(15)),
  },
  {
    type: ObligationType.EfdIcmsIpi,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(dayjs().year(year).month(month - 1).add(1, 'month').date(15)),
  },
  {
    type: ObligationType.EfdContribuicoes,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(dayjs().year(year).month(month - 1).add(1, 'month').date(15)),
  },
  {
    type: ObligationType.EfdReinf,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(dayjs().year(year).month(month - 1).add(1, 'month').date(15)),
  },
  {
    type: ObligationType.Esocial,
    periodicity: ObligationPeriodicity.Monthly,
    appliesTo: {
      [TaxRegime.SimplesNacional]: true,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (month, year) =>
      toIsoDate(dayjs().year(year).month(month - 1).add(1, 'month').date(7)),
  },
];

const ANNUAL_OBLIGATIONS: ObligationRule[] = [
  {
    type: ObligationType.DEFIS,
    periodicity: ObligationPeriodicity.Annual,
    annualJanuaryOnly: true,
    appliesTo: {
      [TaxRegime.SimplesNacional]: true,
      [TaxRegime.LucroPresumido]: false,
      [TaxRegime.LucroReal]: false,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (_month, year) => toIsoDate(dayjs().year(year + 1).month(2).date(31)),
  },
  {
    type: ObligationType.SpedEcd,
    periodicity: ObligationPeriodicity.Annual,
    annualJanuaryOnly: true,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (_month, year) => toIsoDate(dayjs().year(year + 1).month(4).date(31)),
  },
  {
    type: ObligationType.SpedEcf,
    periodicity: ObligationPeriodicity.Annual,
    annualJanuaryOnly: true,
    appliesTo: {
      [TaxRegime.SimplesNacional]: false,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (_month, year) => toIsoDate(dayjs().year(year + 1).month(6).date(31)),
  },
  {
    type: ObligationType.Dirf,
    periodicity: ObligationPeriodicity.Annual,
    annualJanuaryOnly: true,
    appliesTo: {
      [TaxRegime.SimplesNacional]: true,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (_month, year) => toIsoDate(dayjs().year(year + 1).month(1).endOf('month')),
  },
  {
    type: ObligationType.Rais,
    periodicity: ObligationPeriodicity.Annual,
    annualJanuaryOnly: true,
    appliesTo: {
      [TaxRegime.SimplesNacional]: true,
      [TaxRegime.LucroPresumido]: true,
      [TaxRegime.LucroReal]: true,
      [TaxRegime.ImunidadeIsencao]: false,
    },
    dueDate: (_month, year) => toIsoDate(dayjs().year(year + 1).month(2).date(31)),
  },
];

const ALL_RULES = [...MONTHLY_OBLIGATIONS, ...ANNUAL_OBLIGATIONS];

export function resolveObligationStatus(dueDate: string, deliveredAt?: string): ObligationStatus {
  if (deliveredAt) {
    return ObligationStatus.Delivered;
  }

  return isPastDue(dueDate) ? ObligationStatus.Overdue : ObligationStatus.Pending;
}

export function generateObligationsForCompany(
  companyId: string,
  companyName: string,
  taxRegime: TaxRegime,
  month: number,
  year: number,
  existingDeliveries: Record<string, string> = {},
): ObligationWithId[] {
  if (taxRegime === TaxRegime.ImunidadeIsencao) {
    return ALL_RULES.map((rule) => ({
      id: `${companyId}-${rule.type}-${month}-${year}`,
      companyId,
      companyName,
      type: rule.type,
      periodicity: rule.periodicity,
      competenceMonth: month,
      competenceYear: year,
      dueDate: rule.dueDate(month, year),
      deliveredAt: existingDeliveries[`${companyId}-${rule.type}-${month}-${year}`],
      status: ObligationStatus.NotApplicable,
    }));
  }

  return ALL_RULES.filter((rule) => {
    if (rule.annualJanuaryOnly && month !== 1) {
      return false;
    }

    return rule.appliesTo[taxRegime];
  }).map((rule) => {
    const id = `${companyId}-${rule.type}-${month}-${year}`;
    const deliveredAt = existingDeliveries[id];
    const dueDate = rule.dueDate(month, year);

    return {
      id,
      companyId,
      companyName,
      type: rule.type,
      periodicity: rule.periodicity,
      competenceMonth: month,
      competenceYear: year,
      dueDate,
      deliveredAt,
      status: resolveObligationStatus(dueDate, deliveredAt),
    };
  });
}

export function generateObligationsForMonth(
  companies: { id: string; name: string; taxRegime: TaxRegime }[],
  month: number,
  year: number,
  existingDeliveries: Record<string, string> = {},
): ObligationWithId[] {
  return companies.flatMap((company) =>
    generateObligationsForCompany(
      company.id,
      company.name,
      company.taxRegime,
      month,
      year,
      existingDeliveries,
    ),
  );
}

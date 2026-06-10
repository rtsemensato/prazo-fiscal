import type { ObligationPeriodicity, ObligationStatus, ObligationType } from '@/models/obligation';

export enum TaxRegime {
  SimplesNacional = 'simplesNacional',
  LucroPresumido = 'lucroPresumido',
  LucroReal = 'lucroReal',
  ImunidadeIsencao = 'imunidadeIsencao',
}

export interface CompanyBase {
  name: string;
  cnpj: string;
  taxRegime: TaxRegime;
}

export interface CompanyWithId extends CompanyBase {
  id: string;
}

export interface DeliveryHistoryItem {
  obligationId: string;
  type: ObligationType;
  periodicity: ObligationPeriodicity;
  competenceMonth: number;
  competenceYear: number;
  dueDate: string;
  status: ObligationStatus;
  deliveredAt: string;
}

export type CompanyFormData = CompanyBase;

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  [TaxRegime.SimplesNacional]: 'Simples Nacional',
  [TaxRegime.LucroPresumido]: 'Lucro Presumido',
  [TaxRegime.LucroReal]: 'Lucro Real',
  [TaxRegime.ImunidadeIsencao]: 'Imunidade / Isenção',
};

export const TAX_REGIME_OPTIONS = Object.entries(TAX_REGIME_LABELS).map(([value, label]) => ({
  value: value as TaxRegime,
  label,
}));

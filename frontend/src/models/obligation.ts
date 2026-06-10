export enum ObligationType {
  DAS = 'das',
  DEFIS = 'defis',
  DCTF = 'dctf',
  EfdIcmsIpi = 'efdIcmsIpi',
  EfdContribuicoes = 'efdContribuicoes',
  EfdReinf = 'efdReinf',
  SpedEcd = 'spedEcd',
  SpedEcf = 'spedEcf',
  Esocial = 'esocial',
  Dirf = 'dirf',
  Rais = 'rais',
}

export enum ObligationStatus {
  Pending = 'pending',
  Overdue = 'overdue',
  Delivered = 'delivered',
  NotApplicable = 'notApplicable',
}

export enum ObligationPeriodicity {
  Monthly = 'monthly',
  Annual = 'annual',
}

export interface ObligationBase {
  companyId: string;
  type: ObligationType;
  periodicity: ObligationPeriodicity;
  competenceMonth: number;
  competenceYear: number;
  dueDate: string;
  status: ObligationStatus;
  deliveredAt?: string;
}

export interface ObligationWithId extends ObligationBase {
  id: string;
  companyName?: string;
}

export const OBLIGATION_TYPE_LABELS: Record<ObligationType, string> = {
  [ObligationType.DAS]: 'DAS',
  [ObligationType.DEFIS]: 'DEFIS',
  [ObligationType.DCTF]: 'DCTF',
  [ObligationType.EfdIcmsIpi]: 'EFD-ICMS/IPI',
  [ObligationType.EfdContribuicoes]: 'EFD Contribuições',
  [ObligationType.EfdReinf]: 'EFD-Reinf',
  [ObligationType.SpedEcd]: 'SPED ECD',
  [ObligationType.SpedEcf]: 'SPED ECF',
  [ObligationType.Esocial]: 'eSocial',
  [ObligationType.Dirf]: 'DIRF',
  [ObligationType.Rais]: 'RAIS',
};

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  [ObligationStatus.Pending]: 'Pendente',
  [ObligationStatus.Overdue]: 'Atrasada',
  [ObligationStatus.Delivered]: 'Entregue',
  [ObligationStatus.NotApplicable]: 'Não Aplicável',
};

export const OBLIGATION_PERIODICITY_LABELS: Record<ObligationPeriodicity, string> = {
  [ObligationPeriodicity.Monthly]: 'Mensal',
  [ObligationPeriodicity.Annual]: 'Anual',
};

export const OBLIGATION_STATUS_OPTIONS = Object.entries(OBLIGATION_STATUS_LABELS).map(([value, label]) => ({
  value: value as ObligationStatus,
  label,
}));

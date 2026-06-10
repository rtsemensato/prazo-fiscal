import type { ObligationStatus, ObligationWithId } from '@/models/obligation';

export interface AlertsResponse {
  upcoming: ObligationWithId[];
  overdue: ObligationWithId[];
}

export interface CalendarFilter {
  companyId?: string;
  month: number;
  year: number;
  status?: ObligationStatus;
}

export interface CompaniesFilter {
  search: string;
}

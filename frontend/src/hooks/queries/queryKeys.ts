import type { CalendarFilter, CompaniesFilter } from '@/models/filters';

export const queryKeys = {
  companies: (filter?: CompaniesFilter) => ['companies', filter] as const,
  companyDeliveries: (id: string) => ['companies', id, 'deliveries'] as const,
  calendar: (filter: CalendarFilter) => ['calendar', filter] as const,
  dashboard: () => ['dashboard'] as const,
  alerts: () => ['alerts'] as const,
};

import { fiscalApi, USE_MOCK } from '@/api/fiscalService/client';
import { mockStore } from '@/api/fiscalService/mockStore';
import type { CalendarFilter } from '@/models/filters';
import type { ObligationWithId } from '@/models/obligation';
import type { StandardResponseEdit, StandardResponseGetList } from '@/models/standardResponse';

export const getCalendarObligations = (
  filter: CalendarFilter,
  signal?: AbortSignal,
): Promise<StandardResponseGetList<ObligationWithId>> => {
  if (USE_MOCK) {
    return mockStore.getCalendar(filter);
  }

  return fiscalApi.get('/obligations/calendar', { params: filter, signal }).then((response) => response.data);
};

export const markObligationAsDelivered = (
  obligationId: string,
  deliveredAt: string,
): Promise<StandardResponseEdit<ObligationWithId>> => {
  if (USE_MOCK) {
    return mockStore.markAsDelivered(obligationId, deliveredAt);
  }

  return fiscalApi
    .post(`/obligations/${obligationId}/deliveries`, { deliveredAt })
    .then((response) => response.data);
};

type ExportFilter = {
  month: number;
  year: number;
  companyId?: string;
  status?: string;
};

function buildExportParams(filter: ExportFilter): URLSearchParams {
  const params = new URLSearchParams({
    month: String(filter.month),
    year: String(filter.year),
  });
  if (filter.companyId) params.set('companyId', filter.companyId);
  if (filter.status) params.set('status', filter.status);
  return params;
}

export const buildCalendarExportUrl = (filter: ExportFilter) => {
  const baseUrl = import.meta.env.VITE_API_URL ?? '/api';
  return `${baseUrl}/obligations/calendar/export?${buildExportParams(filter).toString()}`;
};

export const buildCalendarPdfExportUrl = (filter: ExportFilter) => {
  const baseUrl = import.meta.env.VITE_API_URL ?? '/api';
  return `${baseUrl}/obligations/calendar/export/pdf?${buildExportParams(filter).toString()}`;
};

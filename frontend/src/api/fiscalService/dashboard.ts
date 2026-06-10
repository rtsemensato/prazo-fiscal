import { fiscalApi, USE_MOCK } from '@/api/fiscalService/client';
import { mockStore } from '@/api/fiscalService/mockStore';
import type { DashboardStats } from '@/models/dashboard';
import type { AlertsResponse } from '@/models/filters';
import type { StandardResponseGetUnique } from '@/models/standardResponse';

export const getDashboardStats = (
  signal?: AbortSignal,
): Promise<StandardResponseGetUnique<DashboardStats>> => {
  if (USE_MOCK) {
    return mockStore.getDashboard();
  }

  return fiscalApi.get('/dashboard', { signal }).then((response) => response.data);
};

export const getAlerts = (signal?: AbortSignal): Promise<StandardResponseGetUnique<AlertsResponse>> => {
  if (USE_MOCK) {
    return mockStore.getAlerts();
  }

  return fiscalApi.get('/alerts', { signal }).then((response) => response.data);
};

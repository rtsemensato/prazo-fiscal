import { fiscalApi, USE_MOCK } from '@/api/fiscalService/client';
import { mockStore } from '@/api/fiscalService/mockStore';
import type { CompanyFormData, CompanyWithId, DeliveryHistoryItem } from '@/models/company';
import type { CompaniesFilter } from '@/models/filters';
import type {
  StandardResponseCreate,
  StandardResponseDelete,
  StandardResponseEdit,
  StandardResponseGetList,
} from '@/models/standardResponse';

export const getCompanies = (
  filter: CompaniesFilter,
  signal?: AbortSignal,
): Promise<StandardResponseGetList<CompanyWithId>> => {
  if (USE_MOCK) {
    return mockStore.getCompanies(filter);
  }

  return fiscalApi.get('/companies', { params: filter, signal }).then((response) => response.data);
};

export const getCompanyDeliveries = (
  id: string,
  signal?: AbortSignal,
): Promise<StandardResponseGetList<DeliveryHistoryItem>> => {
  if (USE_MOCK) {
    return mockStore.getCompanyDeliveries(id);
  }

  return fiscalApi.get(`/companies/${id}/deliveries`, { signal }).then((response) => response.data);
};

export const createCompany = (data: CompanyFormData): Promise<StandardResponseCreate<CompanyWithId>> => {
  if (USE_MOCK) {
    return mockStore.createCompany(data);
  }

  return fiscalApi.post('/companies', data).then((response) => response.data);
};

export const updateCompany = (
  id: string,
  data: CompanyFormData,
): Promise<StandardResponseEdit<CompanyWithId>> => {
  if (USE_MOCK) {
    return mockStore.updateCompany(id, data);
  }

  return fiscalApi.put(`/companies/${id}`, data).then((response) => response.data);
};

export const deleteCompany = (id: string): Promise<StandardResponseDelete> => {
  if (USE_MOCK) {
    return mockStore.deleteCompany(id);
  }

  return fiscalApi.delete(`/companies/${id}`).then((response) => response.data);
};

import { useQuery } from '@tanstack/react-query';
import { getCompanyDeliveries } from '@/api/fiscalService/companies';
import { queryKeys } from '@/hooks/queries/queryKeys';

export function useCompanyDeliveriesQuery(companyId?: string) {
  const query = useQuery({
    queryKey: queryKeys.companyDeliveries(companyId ?? ''),
    queryFn: ({ signal }) =>
      getCompanyDeliveries(companyId!, signal).then((response) => response.data),
    enabled: Boolean(companyId),
  });

  return {
    deliveries: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
}

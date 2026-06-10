import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/api/fiscalService/dashboard';
import { queryKeys } from '@/hooks/queries/queryKeys';

export function useDashboardQuery() {
  const query = useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: ({ signal }) => getDashboardStats(signal).then((response) => response.data),
  });

  return {
    stats: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

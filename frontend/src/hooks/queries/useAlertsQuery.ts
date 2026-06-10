import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '@/api/fiscalService/dashboard';
import { queryKeys } from '@/hooks/queries/queryKeys';

export function useAlertsQuery() {
  const query = useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: ({ signal }) => getAlerts(signal).then((response) => response.data),
  });

  return {
    upcoming: query.data?.upcoming ?? [],
    overdue: query.data?.overdue ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

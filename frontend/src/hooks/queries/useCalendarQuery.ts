import { useQuery } from '@tanstack/react-query';
import { getCalendarObligations } from '@/api/fiscalService/obligations';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useCalendarStore } from '@/store/useCalendarStore';

export function useCalendarQuery() {
  const companyId = useCalendarStore((state) => state.companyId);
  const month = useCalendarStore((state) => state.month);
  const year = useCalendarStore((state) => state.year);
  const statusFilter = useCalendarStore((state) => state.statusFilter);

  const filter = { companyId, month, year, status: statusFilter };

  const query = useQuery({
    queryKey: queryKeys.calendar(filter),
    queryFn: ({ signal }) => getCalendarObligations(filter, signal).then((response) => response.data),
  });

  return {
    obligations: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

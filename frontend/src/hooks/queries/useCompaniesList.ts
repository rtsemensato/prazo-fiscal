import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '@/api/fiscalService/companies';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useCompaniesStore } from '@/store/useCompaniesStore';

export function useCompaniesList() {
  const search = useCompaniesStore((state) => state.search);

  const query = useQuery({
    queryKey: queryKeys.companies({ search }),
    queryFn: ({ signal }) => getCompanies({ search }, signal).then((response) => response.data),
  });

  return {
    companies: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

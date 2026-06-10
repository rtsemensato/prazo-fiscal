import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createCompany, deleteCompany, updateCompany } from '@/api/fiscalService/companies';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { CompanyFormData } from '@/models/company';
import { ApiError } from '@/models/apiError';
import { getErrorMessage } from '@/utils/errorHandling';

export function useCreateCompanyMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await createCompany(data);
      if (!response.success) {
        throw new Error(response.message ?? 'Erro ao cadastrar empresa.');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Empresa cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onSuccess?.();
    },
    onError: (error) => {
      // 422 ficam dentro do modal de empresa — sem toast
      if (error instanceof ApiError && (error.isValidation || error.isBusinessRule)) return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateCompanyMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const response = await updateCompany(id, data);
      if (!response.success) {
        throw new Error(response.message ?? 'Erro ao atualizar empresa.');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Empresa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onSuccess?.();
    },
    onError: (error) => {
      // 422 ficam dentro do modal de empresa — sem toast
      if (error instanceof ApiError && (error.isValidation || error.isBusinessRule)) return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteCompanyMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteCompany(id);
      if (!response.success) {
        throw new Error(response.message ?? 'Erro ao remover empresa.');
      }
      return response;
    },
    onSuccess: () => {
      toast.success('Empresa removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      onSuccess?.();
    },
    onError: (error) => {
      // Delete não tem modal — toast para qualquer tipo de erro
      toast.error(getErrorMessage(error));
    },
  });
}

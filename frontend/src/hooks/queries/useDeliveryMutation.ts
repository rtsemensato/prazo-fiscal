import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { markObligationAsDelivered } from '@/api/fiscalService/obligations';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { ApiError } from '@/models/apiError';
import { getErrorMessage } from '@/utils/errorHandling';

export function useDeliveryMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ obligationId, deliveredAt }: { obligationId: string; deliveredAt: string }) => {
      const response = await markObligationAsDelivered(obligationId, deliveredAt);
      if (!response.success) {
        throw new Error(response.message ?? 'Erro ao registrar entrega.');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Entrega registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onSuccess?.();
    },
    onError: (error) => {
      // Erros 422 (validação de campo ou regra de negócio) são exibidos inline
      // dentro do modal pelo componente que usa esta mutation — sem toast.
      if (error instanceof ApiError && (error.isValidation || error.isBusinessRule)) return;
      toast.error(getErrorMessage(error));
    },
  });
}

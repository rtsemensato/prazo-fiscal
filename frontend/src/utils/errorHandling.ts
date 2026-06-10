import axios from 'axios';
import { ApiError } from '@/models/apiError';

/**
 * Extrai a melhor mensagem de texto de um erro qualquer.
 * Usada para preencher o texto de toasts de erro.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? 'Erro inesperado. Tente novamente.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado. Tente novamente.';
}

/**
 * Extrai mensagens para exibição inline (dentro de modais/formulários).
 *
 * Retorna array não-vazio apenas para erros 422 — validação de campo
 * (FluentValidation) ou violação de regra de negócio. Para 404, 500 e
 * erros de rede, retorna [] porque esses são exibidos como toast.
 */
export function extractInlineMessages(error: unknown): string[] {
  if (error instanceof ApiError) {
    if (error.isValidation) return error.validationMessages;
    if (error.isBusinessRule) return [error.userMessage];
  }
  return [];
}

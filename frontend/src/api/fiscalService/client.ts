import axios from 'axios';
import { ApiError, type ProblemDetails } from '@/models/apiError';

export const fiscalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de resposta: converte qualquer 4xx/5xx em ApiError tipado.
 *
 * A API segue RFC 7807 (ProblemDetails) para todos os erros. Ao transformar
 * aqui, qualquer camada que receba o erro (mutations, queries) já trabalha
 * com tipos conhecidos — sem necessidade de inspecionar o AxiosError.
 */
fiscalApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as Partial<ProblemDetails>;
      return Promise.reject(
        new ApiError(
          error.response.status,
          data.title ?? 'Erro',
          data.detail,
          data.errors,
        ),
      );
    }
    return Promise.reject(error);
  },
);

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

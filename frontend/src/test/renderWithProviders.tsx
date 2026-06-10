import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Cria um QueryClient isolado por teste, sem retries (evita timeouts em cenários de erro)
 * e sem cache entre execuções.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renderiza um componente envolto pelos providers que a aplicação real utiliza
 * (TanStack Query + Ant Design ConfigProvider), para que hooks de query e
 * componentes antd funcionem como em produção.
 */
export function renderWithProviders(ui: ReactElement, queryClient = createTestQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>{ui}</ConfigProvider>
    </QueryClientProvider>,
  );
}

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Sem esse exclude, o Vitest coleta os specs em tests/e2e/** e tenta
    // executá-los no ambiente jsdom. O problema é que esses arquivos importam
    // @playwright/test, que registra um `test` global próprio — diferente do
    // Vitest. O resultado é o erro "Playwright Test did not expect test.describe()
    // to be called here" em todos os specs E2E durante o job de CI.
    // O CI já separa os runners (npm test → Vitest; npm run test:e2e → Playwright),
    // mas o Vitest precisa ser explicitamente instruído a não tocar nesses arquivos.
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
});

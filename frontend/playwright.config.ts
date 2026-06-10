import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do prazo-fiscal.
 *
 * - Localmente: requer a stack docker compose rodando (`docker compose up -d`).
 * - CI: o job "e2e" do workflow sobe o compose antes de executar os testes.
 *
 * URL base: http://localhost:5173 (frontend nginx servindo o build + proxy /api → backend)
 */
export default defineConfig({
  testDir: './tests/e2e',

  fullyParallel: false, // testes compartilham seed do banco — rodar em série evita race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

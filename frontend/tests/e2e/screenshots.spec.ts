import { test } from '@playwright/test';

// Caminho de saída relativo ao cwd do processo (raiz do frontend)
const OUT = 'H:/Projetos/Gelic/prazo-fiscal/docs/screenshots';

test.describe('Screenshots para README', () => {
  test('dashboard', async ({ page }) => {
    await page.goto('/');
    // Aguarda o card de KPI carregar para garantir que os dados chegaram
    await page.getByText('Total de Empresas').waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/dashboard.png` });
  });

  test('calendario', async ({ page }) => {
    await page.goto('/calendario');
    await page.getByText('Padaria Sol Nascente Ltda').first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/calendario.png` });
  });

  test('alertas', async ({ page }) => {
    await page.goto('/alertas');
    await page.getByText('Vencendo nos próximos 30 dias').first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/alertas.png` });
  });

  test('empresas', async ({ page }) => {
    await page.goto('/empresas');
    await page.getByText('Padaria Sol Nascente Ltda').waitFor({ timeout: 30000 });
    await page.screenshot({ path: `${OUT}/empresas.png` });
  });
});

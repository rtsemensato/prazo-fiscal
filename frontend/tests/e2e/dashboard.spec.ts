import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('carrega com os 5 cards de KPI visíveis e valor de empresas > 0', async ({ page }) => {
    await page.goto('/');

    // Aguarda o carregamento dos dados
    await expect(page.getByText('Total de Empresas')).toBeVisible();

    // Todos os 5 KPI cards visíveis via data-testid — evita conflito com labels
    // homônimas do gráfico de distribuição (Progress bars têm os mesmos textos)
    await expect(page.getByTestId('kpi-obrigacoes-mes')).toBeVisible();
    await expect(page.getByTestId('kpi-pendentes')).toBeVisible();
    await expect(page.getByTestId('kpi-entregues')).toBeVisible();
    await expect(page.getByTestId('kpi-atrasadas')).toBeVisible();

    // O card de empresas deve exibir um valor numérico positivo
    // (não fixamos em 4 para não depender da ordem de execução dos outros testes)
    const empresasCard = page.getByTestId('kpi-total-empresas');
    const value = await empresasCard.locator('.ant-statistic-content-value').textContent();
    expect(Number(value)).toBeGreaterThanOrEqual(4);
  });
});

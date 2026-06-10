import { test, expect } from '@playwright/test';

test.describe('Painel de Alertas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alertas');
    // Espera pelos títulos dos dois cards (usa first() pois o Ant Design
    // pode duplicar o texto em mais de um nó DOM)
    await expect(page.getByText('Vencendo nos próximos 30 dias').first()).toBeVisible();
    await expect(page.getByText('Atrasadas').first()).toBeVisible();
  });

  test('exibe as duas seções: vencendo em 30 dias e atrasadas', async ({ page }) => {
    // Localiza os dois cards pelos seus títulos distintos
    const upcomingCard = page.locator('.ant-card').filter({ hasText: 'Vencendo nos próximos 30 dias' });
    const overdueCard  = page.locator('.ant-card').filter({ hasText: 'Atrasadas' }).last();

    await expect(upcomingCard).toBeVisible();
    await expect(overdueCard).toBeVisible();
  });

  test('obrigações atrasadas têm botão de marcar entregue ou mensagem de vazio', async ({ page }) => {
    const overdueCard = page.locator('.ant-card').filter({ hasText: 'Atrasadas' }).last();
    const emptyText   = overdueCard.getByText('Nenhuma obrigação atrasada.');
    const deliverBtn  = overdueCard.getByRole('button', { name: /marcar entregue/i }).first();

    // Uma das duas situações deve ser verdadeira
    await expect(emptyText.or(deliverBtn)).toBeVisible({ timeout: 8000 });
  });
});

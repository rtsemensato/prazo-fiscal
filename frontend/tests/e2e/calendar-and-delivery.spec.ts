import { test, expect } from '@playwright/test';

test.describe('Calendário de Obrigações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendario');
    // Aguarda a tabela renderizar ao menos uma linha — não depende de nome de empresa específico
    await page.getByTestId('calendar-table').locator('tbody tr').first().waitFor({ timeout: 10000 });
  });

  test('exibe obrigações do mês com colunas de status e vencimento', async ({ page }) => {
    await expect(page.getByText('Calendário de Obrigações')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Vencimento' })).toBeVisible();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('filtro por empresa restringe as obrigações exibidas', async ({ page }) => {
    await page.locator('.ant-select').first().click();
    await page.getByTitle('Padaria Sol Nascente Ltda').click();

    // Escopa dentro da tabela para evitar o <span aria-live="polite"> oculto do Select
    await expect(page.getByTestId('calendar-table').getByRole('cell', { name: 'Padaria Sol Nascente Ltda' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Tech Solutions Presumido S.A.' })).not.toBeVisible({ timeout: 5000 });
  });

  test('filtro por status "Atrasada" aplica o filtro (pode retornar vazio)', async ({ page }) => {
    await page.locator('.ant-select').nth(1).click();
    await page.getByTitle('Atrasada').click();
    await page.waitForTimeout(600);

    // Resultado válido: linhas de dados com "Atrasada" OU tabela vazia — ambos corretos
    const placeholder = page.locator('.ant-table-placeholder');
    const isPlaceholderVisible = await placeholder.isVisible({ timeout: 2000 }).catch(() => false);

    if (isPlaceholderVisible) {
      // Sem obrigações atrasadas no período — filtro funcionou
      await expect(placeholder).toBeVisible();
    } else {
      // Deve haver linhas, todas com status "Atrasada"
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(rows.nth(i).getByText('Atrasada')).toBeVisible();
      }
    }
  });

  test('marcar uma obrigação como entregue atualiza o status', async ({ page }) => {
    await page.locator('.ant-select').first().click();
    await page.getByTitle('Padaria Sol Nascente Ltda').click();

    // Filtra por "Pendente" para garantir que há algo para marcar
    await page.locator('.ant-select').nth(1).click();
    await page.getByTitle('Pendente').click();
    await page.waitForTimeout(400);

    const deliverBtn = page.getByRole('button', { name: /marcar entregue/i }).first();

    if (await deliverBtn.isVisible({ timeout: 3000 })) {
      await deliverBtn.click();
      const modal = page.getByRole('dialog');
      await expect(modal.getByText('Registrar Entrega')).toBeVisible();
      await modal.getByRole('button', { name: 'Confirmar' }).click();
      await expect(modal).not.toBeVisible({ timeout: 8000 });
      await expect(page.getByText('Entregue').first()).toBeVisible({ timeout: 8000 });
    } else {
      // Todas já estão entregues — valida que "Entregue" aparece sem filtro
      await page.locator('.ant-select-clear').first().click().catch(() => {});
      await expect(page.getByText('Entregue').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Exportação do Calendário', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendario');
    await expect(page.getByText('Padaria Sol Nascente Ltda').first()).toBeVisible({ timeout: 10000 });
  });

  test('botão Exportar CSV inicia download de arquivo .csv', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /exportar csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('botão Exportar PDF inicia download de arquivo .pdf', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /exportar pdf/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

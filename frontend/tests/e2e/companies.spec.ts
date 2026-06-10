import { test, expect } from '@playwright/test';

const TEST_COMPANY_NAME = 'Empresa E2E Ltda';
const TEST_CNPJ = '12.345.678/0001-95';

/** Localiza a linha da tabela para a empresa E2E (ignora aria-live do Select). */
const companyRow = (page: import('@playwright/test').Page) =>
  page.getByRole('row').filter({ hasText: TEST_COMPANY_NAME });

async function deleteIfExists(page: import('@playwright/test').Page) {
  if (await companyRow(page).isVisible()) {
    await companyRow(page).getByRole('button', { name: 'Excluir' }).click();
    const popBtn = page.locator('.ant-popconfirm-buttons').getByRole('button', { name: 'Remover' });
    await expect(popBtn).toBeVisible({ timeout: 3000 });
    await popBtn.click();
    await expect(companyRow(page)).not.toBeVisible({ timeout: 5000 });
  }
}

test.describe('Gestão de Empresas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/empresas');
    await expect(page.getByRole('row').filter({ hasText: 'Padaria Sol Nascente Ltda' })).toBeVisible({ timeout: 10000 });
  });

  test('lista as empresas do seed', async ({ page }) => {
    await expect(page.getByRole('row').filter({ hasText: 'Tech Solutions Presumido S.A.' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Indústria Metalúrgica Real Ltda' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Associação Beneficente Esperança' })).toBeVisible();
  });

  test('cadastra uma nova empresa e ela aparece na lista', async ({ page }) => {
    await deleteIfExists(page);

    await page.getByRole('button', { name: 'Nova Empresa' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByPlaceholder('Nome da empresa').fill(TEST_COMPANY_NAME);
    await modal.getByPlaceholder('00.000.000/0000-00').fill(TEST_CNPJ);
    await modal.locator('.ant-select').click();
    await page.getByTitle('Lucro Presumido').click();
    await modal.getByRole('button', { name: 'Salvar' }).click();

    await expect(modal).not.toBeVisible();
    // Verifica pela linha da tabela, não pelo texto solto (evita aria-live hidden)
    await expect(companyRow(page)).toBeVisible();
  });

  test('busca empresa por nome filtra a tabela', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por razão social ou CNPJ');
    await searchInput.fill('Padaria');
    // A busca é disparada pelo Enter ou pelo botão de lupa
    await searchInput.press('Enter');

    await expect(page.getByRole('row').filter({ hasText: 'Padaria Sol Nascente Ltda' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Tech Solutions Presumido S.A.' })).not.toBeVisible({ timeout: 5000 });
  });

  test('remove a empresa de teste', async ({ page }) => {
    // Garante que a empresa existe
    if (!(await companyRow(page).isVisible())) {
      await page.getByRole('button', { name: 'Nova Empresa' }).click();
      const modal = page.getByRole('dialog');
      await modal.getByPlaceholder('Nome da empresa').fill(TEST_COMPANY_NAME);
      await modal.getByPlaceholder('00.000.000/0000-00').fill(TEST_CNPJ);
      await modal.locator('.ant-select').click();
      await page.getByTitle('Lucro Presumido').click();
      await modal.getByRole('button', { name: 'Salvar' }).click();
      await expect(modal).not.toBeVisible();
    }

    await companyRow(page).getByRole('button', { name: 'Excluir' }).click();

    // Popconfirm: botão de confirmação é "Remover" (título do popconfirm é "Remover empresa?")
    const popBtn = page.locator('.ant-popconfirm-buttons').getByRole('button', { name: 'Remover' });
    await expect(popBtn).toBeVisible({ timeout: 5000 });
    await popBtn.click();

    await expect(companyRow(page)).not.toBeVisible({ timeout: 8000 });
  });
});

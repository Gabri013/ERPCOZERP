import { test, expect } from '../fixtures/index.js';

test.describe('Sidebar — Navegação', () => {
  test('sidebar aparece após login com logo COZINCA', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=COZINCA')).toBeVisible({ timeout: 10000 });
  });

  test('grupo Vendas expande e exibe subitens', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await expect(page.locator('a:has-text("Pedidos de Venda")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a:has-text("Orçamentos")')).toBeVisible({ timeout: 5000 });
  });

  test('navega para Pedidos de Venda', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Pedidos de Venda")').click();
    await expect(page).toHaveURL(/\/vendas\/pedidos/);
  });

  test('navega para Estoque > Produtos', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Estoque")').first().click();
    await page.locator('a:has-text("Produtos")').first().click();
    await expect(page).toHaveURL(/\/estoque\/produtos/);
  });

  test('navega para Produção > Kanban', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Kanban")').click();
    await expect(page).toHaveURL(/\/producao\/kanban/);
  });

  test('sidebar recolhe ao clicar no botão de fechar', async ({ authenticatedPage: page }) => {
    const closeBtn = page.locator('[aria-label="Recolher menu"]');
    await closeBtn.click();
    await expect(page.locator('[aria-label="Expandir menu"]')).toBeVisible({ timeout: 3000 });
  });

  test('sidebar expande ao clicar no botão de abrir', async ({ authenticatedPage: page }) => {
    await page.locator('[aria-label="Recolher menu"]').click();
    await page.locator('[aria-label="Expandir menu"]').click();
    await expect(page.locator('text=COZINCA')).toBeVisible({ timeout: 3000 });
  });

  test('Dashboard no menu leva para página inicial', async ({ authenticatedPage: page }) => {
    await page.locator('a:has-text("Dashboard")').first().click();
    await expect(page).toHaveURL(/^\/$|\/dashboard/);
  });
});

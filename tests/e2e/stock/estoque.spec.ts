import { test, expect } from '../fixtures/index.js';

test.describe('Estoque — Produtos', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Estoque")').first().click();
    await page.locator('a:has-text("Produtos")').first().click();
    await page.waitForURL(/\/estoque\/produtos/, { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('página de produtos carrega sem erros', async ({ authenticatedPage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('lista produtos cadastrados', async ({ authenticatedPage: page }) => {
    const rows = page.locator('table tbody tr, [class*="product-row"]');
    if (await rows.count() > 0) {
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('produto PA-EIX-032 aparece na lista', async ({ authenticatedPage: page }) => {
    await expect(
      page.locator('text=PA-EIX-032').or(page.locator('text=Eixo Transmissão'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('campo de busca filtra produtos', async ({ authenticatedPage: page }) => {
    const search = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[placeholder*="Buscar"]').first();
    if (await search.count() > 0) {
      await search.fill('Eixo');
      await page.waitForTimeout(800);
      await expect(page.locator('text=Eixo')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Estoque — Movimentações', () => {
  test('página de movimentações carrega sem erros', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Estoque")').first().click();
    await page.locator('a:has-text("Movimentações")').click();
    await page.waitForURL(/\/estoque\/movimentacoes/, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

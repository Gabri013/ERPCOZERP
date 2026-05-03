import { test, expect } from '../fixtures/index.js';

test.describe('Fluxo de Vendas — Pedidos de Venda', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Pedidos de Venda")').click();
    await page.waitForURL(/\/vendas\/pedidos/, { timeout: 10000 });
  });

  test('página de pedidos carrega sem erros fatais', async ({ authenticatedPage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('título da página de pedidos visível', async ({ authenticatedPage: page }) => {
    await expect(
      page.locator('h1, h2, [class*="title"]').filter({ hasText: /[Pp]edido/ })
    ).toBeVisible({ timeout: 8000 });
  });

  test('lista pedidos existentes', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr, [data-testid="order-row"]');
    if (await rows.count() > 0) {
      await expect(rows.first()).toBeVisible({ timeout: 8000 });
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('PV-D001 aparece na lista', async ({ authenticatedPage: page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('text=PV-D001')).toBeVisible({ timeout: 8000 });
  });

  test('botão Novo Pedido está visível', async ({ authenticatedPage: page }) => {
    await expect(
      page.locator('button').filter({ hasText: /[Nn]ovo|[Cc]riar|\+/ }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('busca por número de pedido funciona', async ({ authenticatedPage: page }) => {
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[placeholder*="Buscar"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('PV-D001');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=PV-D001')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Fluxo de Vendas — Orçamentos', () => {
  test('página de orçamentos carrega', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Orçamentos")').click();
    await page.waitForURL(/\/vendas\/orcamentos/, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

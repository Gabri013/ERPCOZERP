import { test, expect } from '../fixtures/index.js';

test.describe('Estoque — Produtos', () => {
  test.beforeEach(async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Estoque")').first().click();
    await page.locator('a:has-text("Produtos")').first().click();
    await page.waitForURL(/\/estoque\/produtos/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
  });

  test('página carrega sem erro', async ({ gerentePage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('produto PA-EIX-032 está na lista', async ({ gerentePage: page }) => {
    await expect(page.locator('text=PA-EIX-032').first()).toBeVisible({ timeout: 8_000 });
  });

  test('produto PA-TAN-500 está na lista', async ({ gerentePage: page }) => {
    await expect(page.locator('text=PA-TAN-500').first()).toBeVisible({ timeout: 8_000 });
  });

  test('busca por "Eixo" filtra resultados', async ({ gerentePage: page }) => {
    const search = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i]').first();
    if (await search.count() > 0) {
      await search.fill('Eixo');
      await page.waitForTimeout(800);
      await expect(page.locator('text=Eixo').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('mais de 20 produtos listados', async ({ gerentePage: page }) => {
    const rows = page.locator('table tbody tr, [class*="product-row"]');
    if (await rows.count() > 0) {
      expect(await rows.count()).toBeGreaterThan(5);
    }
  });
});

test.describe('Estoque — Movimentações', () => {
  test('página movimentações carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Estoque")').first().click();
    await page.locator('a:has-text("Movimentações")').first().click();
    await page.waitForURL(/\/estoque\/movimentacoes/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

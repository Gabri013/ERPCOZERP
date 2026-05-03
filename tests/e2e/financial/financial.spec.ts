import { test, expect } from '../fixtures/index.js';

test.describe('Financeiro', () => {
  test('página Contas a Receber carrega', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Financeiro")').first().click();
    await page.locator('a:has-text("Contas a Receber")').click();
    await page.waitForURL(/\/financeiro\/receber/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('página Contas a Pagar carrega', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Financeiro")').first().click();
    await page.locator('a:has-text("Contas a Pagar")').click();
    await page.waitForURL(/\/financeiro\/pagar/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('DRE carrega', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Financeiro")').first().click();
    await page.locator('a:has-text("DRE")').click();
    await page.waitForURL(/\/financeiro\/dre/, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

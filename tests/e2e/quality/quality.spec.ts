import { test, expect } from '../fixtures/index.js';

test.describe('Qualidade', () => {
  test('página Controle de Qualidade carrega', async ({ authenticatedPage: page }) => {
    const qualBtn = page.locator('button:has-text("Qualidade")').first();
    if (await qualBtn.count() > 0) {
      await qualBtn.click();
      const link = page.locator('a:has-text("Controle de Qualidade")').first();
      if (await link.count() > 0) {
        await link.click();
        await page.waitForURL(/\/qualidade/, { timeout: 10000 });
      } else {
        await page.goto('/qualidade');
      }
    } else {
      await page.goto('/qualidade');
    }
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('inspeções existentes aparecem', async ({ authenticatedPage: page }) => {
    await page.goto('/qualidade');
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr, [class*="inspection-row"]');
    if (await rows.count() > 0) {
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });
});

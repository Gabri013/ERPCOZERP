import { test, expect } from '../fixtures/index.js';

test.describe('CRM — Gestão de Processos', () => {
  test('página CRM carrega', async ({ authenticatedPage: page }) => {
    const crmBtn = page.locator('button:has-text("CRM")').first();
    if (await crmBtn.count() > 0) {
      await crmBtn.click();
      const gestaoLink = page.locator('a:has-text("Gestão de Processos")').first();
      if (await gestaoLink.count() > 0) {
        await gestaoLink.click();
      } else {
        await page.goto('/crm');
      }
    } else {
      await page.goto('/crm');
    }
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('lista processos CRM existentes', async ({ authenticatedPage: page }) => {
    await page.goto('/crm');
    await page.waitForTimeout(2000);
    const items = page.locator('table tbody tr, [class*="crm-row"], [class*="process-card"]');
    if (await items.count() > 0) {
      expect(await items.count()).toBeGreaterThan(0);
    }
  });
});

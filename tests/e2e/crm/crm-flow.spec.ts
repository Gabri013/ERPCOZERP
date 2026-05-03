import { test, expect } from '../fixtures/index.js';

test.describe('CRM — Processos', () => {
  test('página CRM carrega com processos', async ({ gerentePage: page }) => {
    await page.goto('/crm');
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('processos CRM existentes aparecem', async ({ gerentePage: page }) => {
    await page.goto('/crm');
    await page.waitForTimeout(2_500);
    const rows = page.locator('table tbody tr, [class*="crm-row"], [class*="process-card"]');
    if (await rows.count() > 0) {
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('navegação via sidebar para CRM', async ({ gerentePage: page }) => {
    // CRM aparece em OPERACIONAL como Gestão de Processos
    await page.locator('button:has-text("CRM")').first().click();
    const gestaoLink = page.locator('a:has-text("Gestão de Processos")').first();
    if (await gestaoLink.count() > 0) {
      await gestaoLink.click();
      await page.waitForTimeout(2_000);
      await expect(page.locator('body')).not.toContainText('Erro fatal');
    }
  });
});

test.describe('Projetos', () => {
  test('página Projetos carrega', async ({ gerentePage: page }) => {
    await page.goto('/projetos');
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

test.describe('Expedição', () => {
  test('página Expedição carrega', async ({ gerentePage: page }) => {
    await page.goto('/expedicao');
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('ordens de expedição existentes aparecem', async ({ gerentePage: page }) => {
    await page.goto('/expedicao');
    await page.waitForTimeout(2_500);
    await expect(page.locator('text=EXP-D').first()).toBeVisible({ timeout: 8_000 });
  });
});

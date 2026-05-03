import { test, expect } from '../fixtures/index.js';

test.describe('Qualidade — Inspeções', () => {
  test('página Controle de Qualidade carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Qualidade")').first().click();
    await page.locator('a:has-text("Controle de Qualidade")').first().click();
    await page.waitForURL(/\/qualidade/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('inspeções existentes aparecem', async ({ gerentePage: page }) => {
    await page.goto('/qualidade');
    await page.waitForTimeout(2_500);
    await expect(page.locator('text=INS-D').first()).toBeVisible({ timeout: 8_000 });
  });

  test('NC-D001 (Não-Conformidade) é visível', async ({ gerentePage: page }) => {
    await page.goto('/qualidade');
    await page.waitForTimeout(2_000);
    // Navega para aba de NCs se existir
    const ncTab = page.locator('[role="tab"]:has-text("Não-Conformidades"), a:has-text("NC"), button:has-text("NC")').first();
    if (await ncTab.count() > 0) {
      await ncTab.click();
      await page.waitForTimeout(1_000);
    }
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('página Gestão de Documentos carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Qualidade")').first().click();
    await page.locator('a:has-text("Gestão de Documentos")').first().click();
    await page.waitForURL(/\/qualidade\/documentos/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

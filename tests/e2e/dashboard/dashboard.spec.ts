import { test, expect } from '../fixtures/index.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('dashboard carrega após login sem erros', async ({ authenticatedPage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('widgets ou cards aparecem no dashboard', async ({ authenticatedPage: page }) => {
    const cards = page.locator('[class*="kpi"], [class*="metric"], [class*="stat-card"], [class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('título COZINCA ou Dashboard visível', async ({ authenticatedPage: page }) => {
    await expect(
      page.locator('text=COZINCA').or(page.locator('h1, h2').filter({ hasText: /[Dd]ashboard/ })).first()
    ).toBeVisible({ timeout: 8000 });
  });
});

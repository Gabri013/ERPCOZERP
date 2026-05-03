import { test, expect } from '@playwright/test';

async function loginAndGoTo(page: any, path = '/') {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'gerente@cozinha.com');
  await page.fill('input[type="password"]', 'demo123_dev');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|\//, { timeout: 15000 });
  if (path !== '/') await page.goto(path);
}

test.describe('Responsividade — Desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar visível no desktop', async ({ page }) => {
    await loginAndGoTo(page);
    await expect(page.locator('text=COZINCA')).toBeVisible();
  });

  test('dashboard renderiza no desktop sem erros', async ({ page }) => {
    await loginAndGoTo(page);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

test.describe('Responsividade — Tablet', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('página carrega no tablet sem overflow horizontal', async ({ page }) => {
    await loginAndGoTo(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1024 + 20);
  });
});

test.describe('Responsividade — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('página de login usável no mobile', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    const box = await emailInput.boundingBox();
    if (box) expect(box.height).toBeGreaterThan(30);
  });

  test('login funciona no mobile', async ({ page }) => {
    await loginAndGoTo(page);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('não há overflow horizontal no mobile', async ({ page }) => {
    await loginAndGoTo(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390 + 20);
  });
});

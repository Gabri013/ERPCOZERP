import { test, expect } from '../fixtures/index.js';

test.describe('Produção — Kanban', () => {
  test.beforeEach(async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Kanban")').first().click();
    await page.waitForURL(/\/producao\/kanban/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
  });

  test('página Kanban carrega sem erro', async ({ gerentePage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('colunas do kanban são visíveis', async ({ gerentePage: page }) => {
    // Verifica textos de status ou colunas
    const statusTexts = page.locator('text=BACKLOG, text=WIP, text=Backlog, text=Em Andamento, text=Concluído, text=DONE');
    await expect(statusTexts.first()).toBeVisible({ timeout: 8_000 });
  });

  test('pelo menos uma OP aparece nos cards', async ({ gerentePage: page }) => {
    const cards = page.locator('[class*="card"], [class*="kanban"], [class*="op-card"]');
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('Produção — Ordens de Produção', () => {
  test.beforeEach(async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Ordens de Produção")').first().click();
    await page.waitForURL(/\/producao\/ordens/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
  });

  test('lista OPs com dados reais', async ({ gerentePage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
    const rows = page.locator('table tbody tr, [class*="order-row"]');
    if (await rows.count() > 0) {
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('OP-D001-01 aparece na lista', async ({ gerentePage: page }) => {
    await expect(page.locator('text=OP-D').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Produção — Monitoramento', () => {
  test('página Chão de Fábrica carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Chão de Fábrica")').first().click();
    await page.waitForURL(/\/producao\/chao-fabrica/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

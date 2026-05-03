import { test, expect } from '../fixtures/index.js';

test.describe('Produção — Kanban', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Kanban")').click();
    await page.waitForURL(/\/producao\/kanban/, { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('página do Kanban carrega sem erros', async ({ authenticatedPage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('exibe pelo menos uma coluna ou texto de status no Kanban', async ({ authenticatedPage: page }) => {
    const kanbanCols = page.locator('[class*="kanban-col"], [class*="column"], [data-column]');
    const statusText = page.locator('text=/BACKLOG|WIP|Em Andamento|Backlog/i');
    const hasColumns = await kanbanCols.count() > 0;
    const hasText = await statusText.count() > 0;
    expect(hasColumns || hasText).toBe(true);
  });
});

test.describe('Produção — Ordens de Produção', () => {
  test('lista OPs carrega sem erros', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Produção")').first().click();
    await page.locator('a:has-text("Ordens de Produção")').click();
    await page.waitForURL(/\/producao\/ordens/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

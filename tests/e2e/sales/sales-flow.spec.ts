import { test, expect } from '../fixtures/index.js';

test.describe('Fluxo de Vendas — Pedidos', () => {
  test.beforeEach(async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Pedidos de Venda")').first().click();
    await page.waitForURL(/\/vendas\/pedidos/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
  });

  test('título da página está visível', async ({ gerentePage: page }) => {
    await expect(
      page.locator('h1, h2, [class*="title"], [class*="heading"]')
        .filter({ hasText: /pedido/i }).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('tabela/lista de pedidos tem linhas', async ({ gerentePage: page }) => {
    const rows = page.locator('table tbody tr, [class*="order-row"], [data-row]');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('PV-D001 aparece na lista', async ({ gerentePage: page }) => {
    await expect(page.locator('text=PV-D001').first()).toBeVisible({ timeout: 8_000 });
  });

  test('PV-D006 (em produção) aparece na lista', async ({ gerentePage: page }) => {
    await expect(page.locator('text=PV-D006').first()).toBeVisible({ timeout: 8_000 });
  });

  test('botão Novo Pedido está presente', async ({ gerentePage: page }) => {
    await expect(
      page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("+")').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('busca por PV-D001 retorna resultado', async ({ gerentePage: page }) => {
    const search = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[placeholder*="filtrar" i]').first();
    if (await search.count() > 0) {
      await search.fill('PV-D001');
      await page.waitForTimeout(1_000);
      await expect(page.locator('text=PV-D001').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('página não exibe erro fatal', async ({ gerentePage: page }) => {
    await expect(page.locator('body')).not.toContainText('Erro fatal');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });
});

test.describe('Fluxo de Vendas — Orçamentos', () => {
  test('página de orçamentos carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Orçamentos")').first().click();
    await page.waitForURL(/\/vendas\/orcamentos/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('ORC-D001 aparece na lista de orçamentos', async ({ gerentePage: page }) => {
    await page.goto('/vendas/orcamentos');
    await page.waitForTimeout(2_000);
    await expect(page.locator('text=ORC-D001').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Fluxo de Vendas — Clientes', () => {
  test('página de clientes carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Vendas")').first().click();
    await page.locator('a:has-text("Clientes")').first().click();
    await page.waitForURL(/\/vendas\/clientes/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('lista clientes existentes', async ({ gerentePage: page }) => {
    await page.goto('/vendas/clientes');
    await page.waitForTimeout(2_000);
    await expect(page.locator('text=Metalúrgica São Paulo').first()).toBeVisible({ timeout: 8_000 });
  });
});

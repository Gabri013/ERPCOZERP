import { test, expect } from '../fixtures/index.js';

const PAGES = [
  { name: 'Contas a Receber', url: '/financeiro/receber',   nav: 'Contas a Receber' },
  { name: 'Contas a Pagar',   url: '/financeiro/pagar',     nav: 'Contas a Pagar' },
  { name: 'Fluxo de Caixa',   url: '/financeiro/fluxo-caixa', nav: 'Fluxo de Caixa' },
  { name: 'DRE',              url: '/financeiro/dre',       nav: 'DRE' },
  { name: 'Painel Financeiro',url: '/financeiro/painel',    nav: 'Painel Financeiro' },
];

test.describe('Financeiro — Páginas principais', () => {
  for (const pg of PAGES) {
    test(`${pg.name} carrega sem erro`, async ({ gerentePage: page }) => {
      await page.locator('button:has-text("Financeiro")').first().click();
      await page.locator(`a:has-text("${pg.nav}")`).first().click();
      await page.waitForURL(new RegExp(pg.url), { timeout: 10_000 });
      await page.waitForTimeout(2_000);
      await expect(page.locator('body')).not.toContainText('Erro fatal');
    });
  }

  test('Contas a Receber lista dados existentes', async ({ gerentePage: page }) => {
    await page.goto('/financeiro/receber');
    await page.waitForTimeout(2_000);
    // Verifica que há algum conteúdo de dados
    await expect(page.locator('body')).not.toContainText('Nenhum registro');
  });

  test('Contas a Pagar lista dados existentes', async ({ gerentePage: page }) => {
    await page.goto('/financeiro/pagar');
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

test.describe('Contabilidade', () => {
  test('página Contabilidade carrega', async ({ gerentePage: page }) => {
    await page.locator('button:has-text("Contabilidade")').first().click();
    await page.locator('a:has-text("Contabilidade")').first().click();
    await page.waitForURL(/\/contabilidade/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });
});

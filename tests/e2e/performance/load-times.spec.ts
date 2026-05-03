import { test, expect } from '@playwright/test';

async function loginAs(page: any) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'gerente@cozinha.com');
  await page.fill('input[type="password"]', 'demo123_dev');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|\//, { timeout: 15000 });
}

const ROUTES = [
  { name: 'Dashboard',        path: '/' },
  { name: 'Pedidos de Venda', path: '/vendas/pedidos' },
  { name: 'Kanban Produção',  path: '/producao/kanban' },
  { name: 'Produtos Estoque', path: '/estoque/produtos' },
  { name: 'Financeiro',       path: '/financeiro/receber' },
];

test.describe('Performance — Tempo de Carregamento', () => {
  for (const route of ROUTES) {
    test(`${route.name} carrega em < 5s`, async ({ page }) => {
      await loginAs(page);
      const startTime = Date.now();
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`  ⏱  ${route.name}: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    });
  }

  test('API /api/health responde em < 500ms', async ({ request }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const startTime = Date.now();
    const res = await request.get(`${backendUrl}/api/health`);
    const elapsed = Date.now() - startTime;

    expect(res.ok()).toBe(true);
    console.log(`  ⏱  API health: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });
});

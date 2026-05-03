import { test, expect } from '@playwright/test';

const DEMO_PWD = 'demo123_dev';

test.describe('Autenticação — Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('exibe formulário de login', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 12_000 });
  });

  test('campo de senha é do tipo password', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'SenhaErrada');
    await page.click('button[type="submit"]');
    await expect(
      page.locator('[role="alert"], [class*="error"], [class*="toast"], [class*="destructive"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('login com gerente redireciona para dashboard', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'gerente@cozinha.com');
    await page.fill('input[type="password"]', DEMO_PWD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 20_000 });
    await expect(page.locator('text=COZINCA').first()).toBeVisible({ timeout: 10_000 });
  });

  test('login com usuário de produção', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'gerente.producao@cozinha.com');
    await page.fill('input[type="password"]', DEMO_PWD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText('Erro fatal');
  });

  test('rota protegida redireciona para login', async ({ page }) => {
    await page.goto('/vendas/pedidos');
    await page.waitForURL(/login|\/$/, { timeout: 10_000 });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('token JWT fica no localStorage após login', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'gerente@cozinha.com');
    await page.fill('input[type="password"]', DEMO_PWD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 20_000 });
    const token = await page.evaluate(() => localStorage.getItem('access_token') ?? localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});

test.describe('Autenticação — Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"], input[name="email"]', 'gerente@cozinha.com');
    await page.fill('input[type="password"]', DEMO_PWD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 20_000 });
  });

  test('logout redireciona para login e limpa sessão', async ({ page }) => {
    const logoutBtn = page.locator('button:has-text("Sair"), button:has-text("Logout"), a:has-text("Sair")').first();
    const profileBtn = page.locator('[aria-label*="perfil"], [aria-label*="user"], [class*="avatar"], [class*="profile"]').first();

    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
    } else if (await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Sair"), a:has-text("Sair")').first().click();
    }

    await page.waitForURL(/login|\/$/, { timeout: 10_000 });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 8_000 });
  });
});

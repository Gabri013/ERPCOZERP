import { test as base, type Page } from '@playwright/test';

const DEMO_PASSWORD = 'demo123_dev';

const BASE_USERS = {
  gerente:    { email: 'gerente@cozinha.com',          password: DEMO_PASSWORD },
  producao:   { email: 'gerente.producao@cozinha.com', password: DEMO_PASSWORD },
  financeiro: { email: 'financeiro@cozinha.com',       password: DEMO_PASSWORD },
  qualidade:  { email: 'qualidade@cozinha.com',        password: DEMO_PASSWORD },
  master:     { email: 'master@cozinca.com',            password: DEMO_PASSWORD },
};

export async function doLogin(page: Page, role: keyof typeof BASE_USERS = 'gerente') {
  const { email, password } = BASE_USERS[role];
  await page.goto('/');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15_000 });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$|\/dashboard/, { timeout: 20_000 });
}

export interface AuthFixtures {
  gerentePage: Page;
  producaoPage: Page;
}

export const test = base.extend<AuthFixtures>({
  gerentePage: async ({ page }, use) => {
    await doLogin(page, 'gerente');
    await use(page);
  },
  producaoPage: async ({ page }, use) => {
    await doLogin(page, 'producao');
    await use(page);
  },
});

export { expect } from '@playwright/test';

import { test as base, type Page } from '@playwright/test';

const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD || 'demo123_dev';
const MASTER_PASSWORD = process.env.E2E_MASTER_PASSWORD || 'master123_dev';

/** Credenciais alinhadas ao `prisma/seed.ts` e `tests/audit/matrix/users.json`. */
const BASE_USERS = {
  master: {
    email: process.env.E2E_MASTER_EMAIL || 'master@Cozinha.com',
    password: MASTER_PASSWORD,
  },
  gerente: {
    email: process.env.E2E_GERENTE_EMAIL || 'gerente@cozinha.com',
    password: DEMO_PASSWORD,
  },
  /** Alias legado usado noutros specs */
  producao: {
    email: 'gerente.producao@cozinha.com',
    password: DEMO_PASSWORD,
  },
  gerente_producao: {
    email: 'gerente.producao@cozinha.com',
    password: DEMO_PASSWORD,
  },
  vendas: { email: 'vendas@cozinha.com', password: DEMO_PASSWORD },
  projetista: { email: 'engenharia@cozinha.com', password: DEMO_PASSWORD },
  compras: { email: 'compras@cozinha.com', password: DEMO_PASSWORD },
  operador_laser: { email: 'laser@cozinha.com', password: DEMO_PASSWORD },
  operador_dobra: { email: 'dobra@cozinha.com', password: DEMO_PASSWORD },
  operador_solda: { email: 'solda@cozinha.com', password: DEMO_PASSWORD },
  qualidade: { email: 'qualidade@cozinha.com', password: DEMO_PASSWORD },
  expedicao: { email: 'expedicao@cozinha.com', password: DEMO_PASSWORD },
  financeiro: { email: 'financeiro@cozinha.com', password: DEMO_PASSWORD },
  rh: { email: 'rh@cozinha.com', password: DEMO_PASSWORD },
} as const;

export type AuditPersona = keyof typeof BASE_USERS;

export async function doLogin(page: Page, role: AuditPersona = 'gerente') {
  const { email, password } = BASE_USERS[role];
  await page.goto('/');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15_000 });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(
    (url) => !url.pathname.toLowerCase().includes('login'),
    { timeout: 30_000 }
  );
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

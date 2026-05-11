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
    password: process.env.E2E_GERENTE_PASSWORD || DEMO_PASSWORD,
  },
  /** Alias legado usado noutros specs */
  producao: {
    email: process.env.E2E_PRODUCAO_EMAIL || 'gerente.producao@cozinha.com',
    password: process.env.E2E_PRODUCAO_PASSWORD || DEMO_PASSWORD,
  },
  gerente_producao: {
    email: process.env.E2E_GERENTE_PRODUCAO_EMAIL || process.env.E2E_PRODUCAO_EMAIL || 'gerente.producao@cozinha.com',
    password: process.env.E2E_GERENTE_PRODUCAO_PASSWORD || process.env.E2E_PRODUCAO_PASSWORD || DEMO_PASSWORD,
  },
  vendas: {
    email: process.env.E2E_VENDAS_EMAIL || 'vendas@cozinha.com',
    password: process.env.E2E_VENDAS_PASSWORD || DEMO_PASSWORD,
  },
  projetista: {
    email: process.env.E2E_PROJETISTA_EMAIL || 'engenharia@cozinha.com',
    password: process.env.E2E_PROJETISTA_PASSWORD || DEMO_PASSWORD,
  },
  compras: {
    email: process.env.E2E_COMPRAS_EMAIL || 'compras@cozinha.com',
    password: process.env.E2E_COMPRAS_PASSWORD || DEMO_PASSWORD,
  },
  operador_laser: {
    email: process.env.E2E_OPERADOR_LASER_EMAIL || 'laser@cozinha.com',
    password: process.env.E2E_OPERADOR_LASER_PASSWORD || DEMO_PASSWORD,
  },
  operador_dobra: {
    email: process.env.E2E_OPERADOR_DOBRA_EMAIL || 'dobra@cozinha.com',
    password: process.env.E2E_OPERADOR_DOBRA_PASSWORD || DEMO_PASSWORD,
  },
  operador_solda: {
    email: process.env.E2E_OPERADOR_SOLDA_EMAIL || 'solda@cozinha.com',
    password: process.env.E2E_OPERADOR_SOLDA_PASSWORD || DEMO_PASSWORD,
  },
  qualidade: {
    email: process.env.E2E_QUALIDADE_EMAIL || 'qualidade@cozinha.com',
    password: process.env.E2E_QUALIDADE_PASSWORD || DEMO_PASSWORD,
  },
  expedicao: {
    email: process.env.E2E_EXPEDICAO_EMAIL || 'expedicao@cozinha.com',
    password: process.env.E2E_EXPEDICAO_PASSWORD || DEMO_PASSWORD,
  },
  financeiro: {
    email: process.env.E2E_FINANCEIRO_EMAIL || 'financeiro@cozinha.com',
    password: process.env.E2E_FINANCEIRO_PASSWORD || DEMO_PASSWORD,
  },
  rh: {
    email: process.env.E2E_RH_EMAIL || 'rh@cozinha.com',
    password: process.env.E2E_RH_PASSWORD || DEMO_PASSWORD,
  },
} as const;

export type AuditPersona = keyof typeof BASE_USERS;

export async function doLogin(page: Page, role: AuditPersona = 'gerente') {
  const { email, password } = BASE_USERS[role];
  // Navegar para login e aguardar redirecionamento se já autenticado
  await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
  
  // Se já está no painel (não no login), retornar
  if (!page.url().toLowerCase().includes('login')) {
    return;
  }
  
  // Esperar pelo formulário de email (com múltiplos seletores possíveis)
  const emailSelector = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="@"]',
    'form input[type="text"]',
  ].join(', ');
  
  await page.waitForSelector(emailSelector, { timeout: 20_000 });
  
  // Preencher email e senha
  await page.fill(emailSelector, email);
  await page.fill('input[type="password"]', password);
  
  // Clique no submit com retry
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.click('button[type="submit"]');
      break;
    } catch (e) {
      if (attempt === 2) throw e;
      await page.waitForTimeout(500);
    }
  }
  
  // Aguardar redirecionamento para fora do login
  await page.waitForURL(
    (url) => !url.pathname.toLowerCase().includes('login'),
    { timeout: 40_000 }
  );
  
  // Aguardar o loader "Carregando módulo..." desaparecer (ou qualquer elemento de carregamento)
  await page.waitForFunction(
    () => {
      const loaders = document.querySelectorAll('[class*="loading" i], [class*="spinner" i], [class*="skeleton" i]');
      return loaders.length === 0;
    },
    { timeout: 20_000 }
  ).catch(() => {
    // Se timeout no loader, continuar mesmo assim
  });
  
  // Aguardar um pouco antes de retornar para garantir estabilidade
  await page.waitForTimeout(1000);
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

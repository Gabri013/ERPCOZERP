# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-and-estoque-produtos.spec.ts >> login works and Produtos CRUD persists via backend
- Location: tests\e2e\auth-and-estoque-produtos.spec.ts:17:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByLabel('Email')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "ERP COZ (base)" [level=1] [ref=e4]
  - paragraph [ref=e5]: Frontend React base — pronto para evoluir para módulos do ERP.
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]: Status da API
      - generic [ref=e9]: "{ \"ok\": true, \"service\": \"erpcoz-backend-core\", \"env\": \"production\", \"postgres\": \"ok\", \"redis\": \"configured\", \"timestamp\": \"2026-05-01T12:52:46.481Z\" }"
    - generic [ref=e10]:
      - generic [ref=e11]: Próximos passos
      - list [ref=e12]:
        - listitem [ref=e13]: Autenticação (JWT)
        - listitem [ref=e14]: Layout e roteamento
        - listitem [ref=e15]: "Módulos: Estoque, Produção, Compras, Financeiro"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'master@Cozinha.com';
  4  | const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD || 'master123_dev';
  5  | 
  6  | async function login(page) {
  7  |   await page.goto('/login', { waitUntil: 'domcontentloaded' });
  8  | 
> 9  |   await page.getByLabel('Email').fill(LOGIN_EMAIL);
     |                                  ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  10 |   await page.getByLabel('Senha').fill(LOGIN_PASSWORD);
  11 |   await page.getByRole('button', { name: 'Entrar' }).click();
  12 | 
  13 |   // After login it navigates to "/"
  14 |   await page.waitForURL('**/');
  15 | }
  16 | 
  17 | test('login works and Produtos CRUD persists via backend', async ({ page }) => {
  18 |   await login(page);
  19 | 
  20 |   // Go directly to Produtos route (sidebar UX can be added later)
  21 |   await page.goto('/estoque/produtos', { waitUntil: 'domcontentloaded' });
  22 |   await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
  23 | 
  24 |   // Create
  25 |   const desc = `Produto E2E ${Date.now()}`;
  26 |   await page.getByRole('button', { name: /Novo Produto/i }).click();
  27 |   await page.locator('label:has-text("Descrição")').locator('..').locator('input').fill(desc);
  28 |   await Promise.all([
  29 |     page.waitForResponse((r) => r.url().includes('/api/estoque') && r.request().method() === 'POST' && r.ok(), { timeout: 20000 }),
  30 |     page.getByRole('button', { name: /Salvar/i }).click(),
  31 |   ]);
  32 | 
  33 |   // Expect it in table (may appear after save)
  34 |   // A UI pode re-renderizar/filtrar; garantimos consistência re-carregando a lista
  35 |   await page.waitForTimeout(250);
  36 |   await page.reload({ waitUntil: 'domcontentloaded' });
  37 |   await expect(page.getByText(desc).first()).toBeVisible({ timeout: 20000 });
  38 | 
  39 |   // Open detail (click description link/button)
  40 |   await page.getByRole('button', { name: desc }).click();
  41 |   await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();
  42 | 
  43 |   // Edit
  44 |   await page.getByRole('button', { name: 'Editar' }).click();
  45 |   const edited = `${desc} (editado)`;
  46 |   await page.locator('label:has-text("Descrição")').locator('..').locator('input').fill(edited);
  47 |   await Promise.all([
  48 |     page.waitForResponse((r) => r.url().includes('/api/estoque/') && r.request().method() === 'PUT' && r.ok(), { timeout: 20000 }),
  49 |     page.getByRole('button', { name: /Salvar/i }).click(),
  50 |   ]);
  51 |   await page.waitForTimeout(250);
  52 |   await page.reload({ waitUntil: 'domcontentloaded' });
  53 |   await expect(page.getByText(edited).first()).toBeVisible({ timeout: 20000 });
  54 | 
  55 |   // Delete
  56 |   await page.getByRole('button', { name: edited }).click();
  57 |   page.once('dialog', (d) => d.accept());
  58 |   await Promise.all([
  59 |     page.waitForResponse((r) => r.url().includes('/api/estoque/') && r.request().method() === 'DELETE' && r.ok(), { timeout: 20000 }),
  60 |     page.getByRole('button', { name: 'Excluir' }).click(),
  61 |   ]);
  62 |   await page.waitForTimeout(250);
  63 |   await page.reload({ waitUntil: 'domcontentloaded' });
  64 |   await expect(page.getByText(edited)).toHaveCount(0);
  65 | 
  66 |   // Reload and ensure it did not come back (backend persistence check)
  67 |   await page.reload({ waitUntil: 'domcontentloaded' });
  68 |   await expect(page.getByText(edited)).toHaveCount(0);
  69 | });
  70 | 
  71 | 
```
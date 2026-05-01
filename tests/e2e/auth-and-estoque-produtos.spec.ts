import { expect, test } from '@playwright/test';

const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL || 'master@Cozinha.com';
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD || 'master123_dev';

async function login(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await page.getByLabel('Email').fill(LOGIN_EMAIL);
  await page.getByLabel('Senha').fill(LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // After login it navigates to "/"
  await page.waitForURL('**/');
}

test('login works and Produtos CRUD persists via backend', async ({ page }) => {
  await login(page);

  // Go directly to Produtos route (sidebar UX can be added later)
  await page.goto('/estoque/produtos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();

  // Create
  const desc = `Produto E2E ${Date.now()}`;
  await page.getByRole('button', { name: /Novo Produto/i }).click();
  await page.locator('label:has-text("Descrição")').locator('..').locator('input').fill(desc);
  await page.getByRole('button', { name: /Salvar/i }).click();

  // Expect it in table (may appear after save)
  await expect(page.getByText(desc).first()).toBeVisible();

  // Open detail (click description link/button)
  await page.getByRole('button', { name: desc }).click();
  await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible();

  // Edit
  await page.getByRole('button', { name: 'Editar' }).click();
  const edited = `${desc} (editado)`;
  await page.locator('label:has-text("Descrição")').locator('..').locator('input').fill(edited);
  await page.getByRole('button', { name: /Salvar/i }).click();
  await expect(page.getByText(edited).first()).toBeVisible();

  // Delete
  await page.getByRole('button', { name: edited }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(edited)).toHaveCount(0);

  // Reload and ensure it did not come back (backend persistence check)
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(edited)).toHaveCount(0);
});


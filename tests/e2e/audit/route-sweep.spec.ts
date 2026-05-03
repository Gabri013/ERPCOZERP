import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { doLogin, type AuditPersona } from '../fixtures/index';

const matrixDir = path.join(process.cwd(), 'tests', 'audit', 'matrix');
const routes = JSON.parse(fs.readFileSync(path.join(matrixDir, 'frontend-routes.json'), 'utf8')) as Array<{
  path: string;
  module: string;
  label: string;
}>;
const users = JSON.parse(fs.readFileSync(path.join(matrixDir, 'users.json'), 'utf8')) as Array<{
  key: string;
  label: string;
  email: string;
  password: string;
  passwordEnv?: string;
}>;

function auditDir() {
  return process.env.AUDIT_LOG_DIR;
}

function logEvent(obj: Record<string, unknown>) {
  const dir = auditDir();
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(
    path.join(dir, 'events.ndjson'),
    JSON.stringify({ ts: new Date().toISOString(), source: 'e2e-route-sweep', ...obj }) + '\n',
    'utf8'
  );
}

function shotsDir() {
  return process.env.PLAYWRIGHT_AUDIT_SHOTS || (auditDir() ? path.join(auditDir()!, 'shots') : null);
}

test.describe.configure({ mode: 'serial', timeout: 900_000 });

for (const u of users) {
  test(`varredura de rotas — ${u.key} (${u.label})`, async ({ page, context }) => {
    await context.clearCookies();
    const persona = u.key as AuditPersona;
    try {
      await doLogin(page, persona);
    } catch (e) {
      logEvent({
        severity: 'CRITICO',
        module: 'auth',
        user: u.key,
        action: 'login',
        error: String(e),
      });
      expect.soft(false, `login falhou: ${u.key}`).toBe(true);
      return;
    }

    const buffers: Array<{ kind: string; type?: string; text: string }> = [];
    const onConsole = (msg: { type: () => string; text: () => string }) => {
      const t = msg.type();
      if (t === 'error' || t === 'warning') buffers.push({ kind: 'console', type: t, text: msg.text() });
    };
    const onPageError = (err: Error) => buffers.push({ kind: 'pageerror', text: String(err) });
    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    for (const r of routes) {
      buffers.length = 0;

      let navigated = true;
      try {
        await page.goto(r.path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      } catch (e) {
        navigated = false;
        logEvent({
          severity: 'CRITICO',
          module: r.module,
          user: u.key,
          action: `goto ${r.path}`,
          error: String(e),
        });
      }

      await page.waitForTimeout(400);
      const denied = await page.getByText('Acesso restrito').isVisible().catch(() => false);
      const checking = await page.getByText('Verificando permissões').isVisible().catch(() => false);

      for (const b of buffers) {
        if (b.kind === 'pageerror') {
          const shot = shotsDir();
          let screenshot: string | undefined;
          if (shot) {
            fs.mkdirSync(shot, { recursive: true });
            const safe = `${u.key}_${r.path.replace(/\//g, '_').slice(0, 80) || 'root'}.png`;
            const fp = path.join(shot, safe);
            await page.screenshot({ path: fp, fullPage: false }).catch(() => {});
            screenshot = fp;
          }
          logEvent({
            severity: 'CRITICO',
            module: r.module,
            user: u.key,
            action: r.path,
            error: b.text,
            screenshot,
          });
        } else if (b.type === 'error') {
          logEvent({
            severity: 'ALTO',
            module: r.module,
            user: u.key,
            action: r.path,
            error: b.text,
            note: 'console.error',
          });
        } else if (b.type === 'warning') {
          logEvent({
            severity: 'MEDIO',
            module: r.module,
            user: u.key,
            action: r.path,
            error: b.text,
            note: 'console.warn',
          });
        }
      }

      if (u.key === 'master' && denied) {
        logEvent({
          severity: 'CRITICO',
          module: r.module,
          user: u.key,
          action: r.path,
          error: 'Master viu "Acesso restrito" — possível bug de permissão',
        });
      } else if (denied) {
        logEvent({
          severity: 'BAIXO',
          module: r.module,
          user: u.key,
          action: r.path,
          note: 'UI bloqueou rota (esperado para perfil sem permissão)',
        });
      }

      if (checking) {
        logEvent({
          severity: 'MEDIO',
          module: r.module,
          user: u.key,
          action: r.path,
          note: 'Permissões ainda em carregamento após timeout curto',
        });
      }

      if (navigated && !denied && !checking) {
        const broken = await page.getByText(/404|não encontrad|not found/i).first().isVisible().catch(() => false);
        if (broken) {
          logEvent({
            severity: 'MEDIO',
            module: r.module,
            user: u.key,
            action: r.path,
            note: 'Possível rota ou página não encontrada no conteúdo',
          });
        }
      }

    }
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  });
}

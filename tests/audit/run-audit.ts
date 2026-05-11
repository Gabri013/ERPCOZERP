/**
 * Orquestra auditoria: define AUDIT_LOG_DIR, roda testes API (Vitest) e E2E
 * (Playwright), e agrega relatorio.
 *
 * Pre-requisito E2E: frontend + backend respondendo e base seedada.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

async function main() {
  const cwd = process.cwd();
  const nodeCmd = process.execPath;
  const runId = process.env.AUDIT_RUN_ID || `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const base = join(cwd, 'artifacts', 'audit', runId);
  mkdirSync(join(base, 'shots'), { recursive: true });

  process.env.AUDIT_LOG_DIR = base;
  const env = { ...process.env, AUDIT_LOG_DIR: base, PLAYWRIGHT_AUDIT_SHOTS: join(base, 'shots') };

  console.log('AUDIT_LOG_DIR =', base);

  const be = spawnSync(
    nodeCmd,
    [join(cwd, 'apps', 'backend', 'node_modules', 'vitest', 'vitest.mjs'), 'run', 'src/__tests__/audit/api-surface.test.ts'],
    { cwd: join(cwd, 'apps', 'backend'), stdio: 'inherit', env }
  );
  if (be.error) {
    console.warn('[audit] falha ao iniciar backend api-surface:', be.error.message);
  }
  if (be.status !== 0) {
    console.warn('[audit] backend api-surface terminou com codigo', be.status, '(continuando auditoria E2E)');
  }

  const fe = spawnSync(
    nodeCmd,
    [join(cwd, 'node_modules', '@playwright', 'test', 'cli.js'), 'test', 'tests/e2e/audit', '--project', 'Desktop Chrome'],
    { cwd, stdio: 'inherit', env }
  );
  if (fe.error) {
    console.warn('[audit] falha ao iniciar Playwright:', fe.error.message);
  }
  if (fe.status !== 0) {
    console.warn('[audit] Playwright terminou com codigo', fe.status);
  }

  await import(pathToFileURL(join(cwd, 'tests', 'audit', 'aggregate-report.ts')).href);
  const { writeAuditSummary } = await import(pathToFileURL(join(cwd, 'tests', 'audit', 'lib', 'logger.ts')).href);
  writeAuditSummary({ runId, backendExit: be.status ?? 0, playwrightExit: fe.status ?? 0 });

  console.log('\nConcluido. Artefatos em:', base);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

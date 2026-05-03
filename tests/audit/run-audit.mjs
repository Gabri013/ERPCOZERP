/**
 * Orquestra auditoria: define AUDIT_LOG_DIR, corre testes API (Vitest) e E2E (Playwright), agrega relatório.
 * Pré-requisito E2E: frontend + backend a responder (ex.: npm run dev) e base seedada.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const runId = process.env.AUDIT_RUN_ID || `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const base = join(cwd, 'artifacts', 'audit', runId);
mkdirSync(join(base, 'shots'), { recursive: true });

process.env.AUDIT_LOG_DIR = base;
const env = { ...process.env, AUDIT_LOG_DIR: base, PLAYWRIGHT_AUDIT_SHOTS: join(base, 'shots') };

console.log('AUDIT_LOG_DIR =', base);

const be = spawnSync(
  'npm',
  ['run', 'test', '--', '--run', 'src/__tests__/audit/api-surface.test.ts'],
  { cwd: join(cwd, 'apps', 'backend'), stdio: 'inherit', shell: true, env }
);
if (be.status !== 0) {
  console.warn('[audit] backend api-surface terminou com código', be.status, '(continuação da auditoria E2E)');
}

const fe = spawnSync(
  'npx',
  ['playwright', 'test', 'tests/e2e/audit', '--project=Desktop Chrome'],
  { cwd, stdio: 'inherit', shell: true, env }
);
if (fe.status !== 0) {
  console.warn('[audit] Playwright terminou com código', fe.status);
}

await import(pathToFileURL(join(cwd, 'tests', 'audit', 'aggregate-report.mjs')).href);
const { writeAuditSummary } = await import(pathToFileURL(join(cwd, 'tests', 'audit', 'lib', 'logger.mjs')).href);
writeAuditSummary({ runId, backendExit: be.status ?? 0, playwrightExit: fe.status ?? 0 });

console.log('\nConcluído. Artefactos em:', base);

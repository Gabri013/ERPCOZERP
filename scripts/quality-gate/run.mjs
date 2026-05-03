#!/usr/bin/env node
/**
 * QUALITY GATE agregador — relatório JSON em reports/quality-gate-last.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scan as scanBackend } from './validate-backend.mjs';
import { scan as scanFrontend } from './validate-frontend.mjs';
import { scan as scanBusiness } from './business-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '../..');
const OUT = path.join(REPO_ROOT, 'reports', 'quality-gate-last.json');

function runCmd(label, cwd, argv) {
  const r = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return { label, exitCode: r.status ?? 0, stdout: (r.stdout || '').slice(-8000), stderr: (r.stderr || '').slice(-8000) };
}

const eslintFe = runCmd(
  'eslint:frontend',
  path.join(REPO_ROOT, 'apps/frontend'),
  ['npm', 'run', 'lint'],
);

const tscBe = runCmd('tsc:backend', path.join(REPO_ROOT, 'apps/backend'), ['npm', 'run', 'lint']);

const aggregated = {
  generatedAt: new Date().toISOString(),
  backendRoutes: scanBackend(),
  frontend: scanFrontend(),
  businessRules: scanBusiness(),
  commands: [
    eslintFe,
    tscBe,
  ],
};

aggregated.summary = {
  heuristicWarns:
    (aggregated.backendRoutes.warnings?.length || 0) +
    (aggregated.frontend.warnings?.length || 0) +
    (aggregated.businessRules.warnings?.length || 0),
  eslintFrontendExit: eslintFe.exitCode,
  tscBackendExit: tscBe.exitCode,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(aggregated, null, 2), 'utf8');
console.log('Relatório:', OUT);
console.log(JSON.stringify(aggregated.summary, null, 2));

const strict = process.argv.includes('--strict');
const eslintFail = eslintFe.exitCode !== 0;
const tscFail = tscBe.exitCode !== 0;
/** Heuristic strict */
const heuristicFail =
  strict &&
  (aggregated.backendRoutes.warnings?.length ||
    aggregated.frontend.warnings?.length ||
    aggregated.businessRules.warnings?.length);

process.exit(eslintFail || tscFail || heuristicFail ? 1 : 0);

#!/usr/bin/env node
/**
 * Heurísticas de rotas (*.routes.ts) — modo advisory por defeito.
 * --strict: falha (exit 1) se existir qualquer aviso.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFilesRecursive } from './walk.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_MODULES = path.join(__dirname, '../../apps/backend/src/modules');

const FILE_EXEMPT = ['health.routes.ts', 'webhooks', '/auth/', 'me.routes.ts', '/error-monitor/', '/health/'];

function exempt(filePath) {
  const n = filePath.replace(/\\/g, '/');
  return FILE_EXEMPT.some((p) => n.includes(p));
}

/** Autenticação pode estar apenas no *.module.ts — só aviso. */
function hasLocalAuthIndicators(txt) {
  return (
    /\bauthenticate\b/.test(txt) ||
    /\brequirePermission\b/.test(txt) ||
    /middleware\/auth\.js/.test(txt.replace(/\\/g, '/'))
  );
}

function hasErrorHandlingIndicators(txt) {
  return /\bcatch\s*\(/.test(txt) || /\.catch\s*\(/.test(txt);
}

export function scan() {
  const warnings = [];
  if (!fs.existsSync(BACKEND_MODULES)) {
    return { warnings, scanned: 0, note: 'modules path missing' };
  }

  const files = collectFilesRecursive(BACKEND_MODULES, { extTests: ['.ts'] }).filter((f) =>
    /\.routes\.ts$/.test(f),
  );

  for (const file of files) {
    if (exempt(file)) continue;
    const rel = path.relative(path.join(__dirname, '../..'), file);
    const txt = fs.readFileSync(file, 'utf8');

    if (!hasLocalAuthIndicators(txt)) {
      warnings.push({
        severity: 'warn',
        file: rel,
        rule: 'rbac-visible-in-route-file',
        message:
          'Sem import/middleware auth visível neste ficheiro — proteção pode estar no *module.ts (app.use + authenticate).',
        suggestion: 'Confirmar apps/backend/src/modules/**/**.module.ts ou adicionar gate explícito nas rotas.',
      });
    }

    const hasMutation = /\.(post|put|patch|delete)\(/i.test(txt);
    if (hasMutation && !hasErrorHandlingIndicators(txt)) {
      warnings.push({
        severity: 'warn',
        file: rel,
        rule: 'mutation-error-handling',
        message:
          'Métodos HTTP mutativos sem catch() ou .catch() detetável no ficheiro — risco de 500 não tratado.',
        suggestion: 'Usar try/catch ou Promise.catch e responder JSON estruturado.',
      });
    }

    const hasMutationForZodWarn = /\.(post|put|patch)\(/i.test(txt);
    const hasZod = /safeParse|z\.object\s*\(|from\s+['"]zod['"]/.test(txt);
    if (hasMutationForZodWarn && !hasZod) {
      warnings.push({
        severity: 'warn',
        file: rel,
        rule: 'input-validation-zod-hint',
        message: 'POST/PUT/PATCH sem Zod óbvio neste router (validação pode estar no service).',
        suggestion: 'Garantir validação centralizada (Zod) antes de persistir dados.',
      });
    }

    if (/\/infra\/prisma/.test(txt) || /\bprisma\./.test(txt)) {
      warnings.push({
        severity: 'warn',
        file: rel,
        rule: 'architecture-prisma-in-router',
        message: 'Uso de Prisma no ficheiro de rotas — preferir encapsular em *service*.ts.',
        suggestion: 'Refatorar incrementalmente quando tocar neste módulo.',
      });
    }
  }

  return { warnings, scanned: files.filter((f) => !exempt(f)).length };
}

const strict = process.argv.includes('--strict');

const isMainNode = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainNode) {
  const { warnings, scanned } = scan();
  const report = {
    target: 'backend-routes-heuristic',
    mode: strict ? 'strict' : 'advisory',
    scanned,
    warnCount: warnings.length,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(strict && warnings.length ? 1 : 0);
}

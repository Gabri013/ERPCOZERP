#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFilesRecursive } from './walk.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FE_SRC = path.join(__dirname, '../../apps/frontend/src');

function shouldScan(abs) {
  const rel = abs.replace(/\\/g, '/');
  if (rel.includes('/components/ui/')) return false;
  if (/\/lib\/devLog\.js$/.test(rel)) return false;
  return /\.(jsx|js|tsx|ts)$/.test(abs) && !/\.test\./.test(abs);
}

export function scan() {
  const warnings = [];
  if (!fs.existsSync(FE_SRC)) return { warnings, scanned: 0 };

  const files = collectFilesRecursive(FE_SRC, { extTests: ['.jsx', '.js', '.tsx', '.ts'] }).filter(
    shouldScan,
  );

  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    const rel = path.relative(path.join(__dirname, '../..'), file);

    if (/console\.log\s*\(/.test(txt)) {
      warnings.push({
        severity: 'warn',
        file: rel,
        rule: 'no-console-log',
        message: 'Evitar console.log em código de produção.',
        suggestion: 'Remover ou usar utilitário de debug condicional.',
      });
    }

    const lines = txt.split('\n');
    lines.forEach((line, i) => {
      if (!/await\s+api\.(get|post|put|patch|delete)\(/.test(line)) return;
      if (/\.catch\s*\(/.test(line)) return;
      const prev = (lines[i - 1] || '').trimEnd();
      if (/\btry\s*\{\s*$/.test(prev)) return;
      if (/\btry\s*\{/.test(prev)) return;
      warnings.push({
        severity: 'warn',
        file: rel,
        line: i + 1,
        rule: 'api-await-without-visible-try',
        message: 'await api.* sem try na linha anterior e sem .catch() na mesma linha.',
        suggestion: 'Adicionar try/catch ou .catch() para mostrar erro ao utilizador.',
      });
    });
  }

  return { warnings, scanned: files.length };
}

const strict = process.argv.includes('--strict');
const isMainNode = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainNode) {
  const { warnings, scanned } = scan();
  const report = { target: 'frontend-heuristic', mode: strict ? 'strict' : 'advisory', scanned, warnings };
  console.log(JSON.stringify(report, null, 2));
  process.exit(strict && warnings.length ? 1 : 0);
}

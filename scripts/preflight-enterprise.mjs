#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function hasCmd(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(probe, [cmd], { stdio: 'ignore', shell: true });
  return res.status === 0;
}

console.log('==> Preflight enterprise (cross-platform)');

const required = ['node', 'npm'];
let missing = false;
for (const cmd of required) {
  if (!hasCmd(cmd)) {
    console.error(`❌ Dependência ausente: ${cmd}`);
    missing = true;
  } else {
    console.log(`✅ ${cmd} encontrado`);
  }
}

if (hasCmd('docker')) {
  console.log('✅ docker encontrado (modo compose habilitado)');
} else {
  console.log('⚠️ docker não encontrado (modo local será usado)');
}

if (!process.env.JWT_SECRET) {
  console.log('⚠️ JWT_SECRET não definido no ambiente atual.');
}

if (missing) {
  process.exit(1);
}

console.log('✅ Preflight concluído.');

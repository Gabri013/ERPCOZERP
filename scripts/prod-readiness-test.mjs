#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const isWin = process.platform === 'win32';
const shell = true;

function run(cmd, args = [], required = true) {
  const pretty = [cmd, ...args].join(' ');
  console.log(`\n$ ${pretty}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell });
  if (res.status !== 0 && required) {
    process.exit(res.status ?? 1);
  }
  return res.status ?? 0;
}

function hasCmd(cmd) {
  const probe = isWin ? 'where' : 'which';
  return spawnSync(probe, [cmd], { stdio: 'ignore', shell }).status === 0;
}

const hasDocker = hasCmd('docker');

console.log('==> [1/7] Subindo stack');
if (hasDocker) {
  run('docker', ['compose', 'up', '-d', '--build']);
} else {
  console.log('⚠️ Docker não encontrado. Modo local.');
}

console.log('==> [2/7] Healthcheck API');
let healthy = false;
for (let i = 0; i < 60; i++) {
  const curlCmd = hasCmd('curl')
    ? spawnSync('curl', ['-fsS', 'http://127.0.0.1:3001/health'], { stdio: 'ignore', shell })
    : spawnSync('node', ['-e', "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"], { stdio: 'ignore', shell });
  if (curlCmd.status === 0) {
    healthy = true;
    break;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
}

if (!healthy) {
  console.error('ERRO: API não ficou saudável em até 120s');
  if (hasDocker) run('docker', ['compose', 'logs', 'backend', '--tail=200'], false);
  process.exit(1);
}

console.log('==> [3/7] Seed');
if (hasDocker) {
  run('docker', ['compose', 'run', '--rm', '-e', 'SEED_ENABLED=true', 'backend', 'npm', 'run', 'prisma:seed']);
} else {
  run('npm', ['run', 'prisma:seed', '--prefix', 'apps/backend']);
}

console.log('==> [4/7] Smoke API');
run('npm', ['run', 'test:smoke:core']);

console.log('==> [5/7] Unit backend');
run('npm', ['run', 'test:unit', '--prefix', 'apps/backend']);

console.log('==> [6/7] Build produção');
run('npm', ['run', 'build']);

console.log('==> [7/7] E2E críticos');
run('npx', ['playwright', 'test', 'tests/e2e/auth', 'tests/e2e/navigation', '--project=Desktop Chrome']);

console.log('✅ Teste de produção completo finalizado com sucesso.');

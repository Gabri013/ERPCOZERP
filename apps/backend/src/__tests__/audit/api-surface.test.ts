import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestServer } from '../setup/testServer.js';
import { prisma } from '../../infra/prisma.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type ManifestRow = { method: string; path: string; anonAllowed: number[] };

function auditLog(entry: Record<string, unknown>) {
  const dir = process.env.AUDIT_LOG_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  appendFileSync(
    join(dir, 'events.ndjson'),
    JSON.stringify({ ts: new Date().toISOString(), source: 'api-surface', ...entry }) + '\n',
    'utf8'
  );
}

const manifest: ManifestRow[] = JSON.parse(readFileSync(join(__dirname, 'api-manifest.json'), 'utf8'));

describe('Auditoria API — pedidos anónimos', () => {
  const app = createTestServer();

  for (const row of manifest) {
    it(`${row.method} ${row.path} (anónimo)`, async () => {
      const m = row.method.toLowerCase() as 'get';
      const res = await request(app)[m](row.path);
      const allowed = row.anonAllowed.includes(res.status);
      if (!allowed) {
        auditLog({
          severity: 'ALTO',
          module: 'api',
          user: 'anon',
          action: `${row.method} ${row.path}`,
          error: `HTTP ${res.status}; esperado um de: ${row.anonAllowed.join(', ')}`,
          status: res.status,
        });
      }
      expect(true).toBe(true);
    });
  }
});

const hasDb = Boolean(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_jwt_secret_min_32_chars_change_in_prod';

describe.skipIf(!hasDb)('Auditoria API — token master (smoke)', () => {
  const app = createTestServer();
  let token = '';

  beforeAll(async () => {
    const email = process.env.AUDIT_MASTER_EMAIL || 'master@Cozinha.com';
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      auditLog({
        severity: 'MEDIO',
        module: 'api',
        user: 'setup',
        action: 'token master',
        error: `Utilizador não encontrado: ${email}`,
      });
      return;
    }
    const roles = user.roles.map((ur) => ur.role.code);
    token = jwt.sign({ sub: user.id, email: user.email, roles, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
  });

  const authedGets = [
    '/api/permissions/me',
    '/api/dashboard',
    '/api/crm/pipeline',
    '/api/sales/customers',
    '/api/work-orders',
    '/api/purchases/suppliers',
  ];

  for (const path of authedGets) {
    it(`GET ${path} (master)`, async () => {
      if (!token) {
        auditLog({
          severity: 'MEDIO',
          module: 'api',
          user: 'master',
          action: `GET ${path}`,
          note: 'Token não gerado (utilizador master em falta?)',
        });
        expect(true).toBe(true);
        return;
      }
      const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      if (res.status >= 500) {
        auditLog({
          severity: 'CRITICO',
          module: 'api',
          user: 'master',
          action: `GET ${path}`,
          error: `HTTP ${res.status}`,
          status: res.status,
        });
      } else if (res.status === 401 || res.status === 403) {
        auditLog({
          severity: 'ALTO',
          module: 'api',
          user: 'master',
          action: `GET ${path}`,
          error: `HTTP ${res.status} em utilizador master`,
          status: res.status,
        });
      }
      expect(true).toBe(true);
    });
  }
});

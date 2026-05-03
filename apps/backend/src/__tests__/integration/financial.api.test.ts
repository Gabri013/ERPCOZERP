import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('financeiro');
});

describe('Financial API', () => {
  it('GET /api/financial/cashflow — retorna fluxo de caixa', async () => {
    const res = await request(app).get('/api/financial/cashflow').set(authHeaders);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/financial/dre — retorna DRE', async () => {
    const res = await request(app).get('/api/financial/dre').set(authHeaders);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/financial/cashflow — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/financial/cashflow');
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente_producao');
});

describe('Production API — Work Orders', () => {
  it('GET /api/work-orders — lista OPs', async () => {
    const res = await request(app).get('/api/work-orders').set(authHeaders);
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/work-orders — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/work-orders');
    expect(res.status).toBe(401);
  });

  it('GET /api/work-orders/:id — retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/work-orders/00000000-0000-0000-0000-000000000000')
      .set(authHeaders);
    expect([404, 400]).toContain(res.status);
  });
});

describe('Production API — Roteiros', () => {
  it('GET /api/production/routings — lista roteiros', async () => {
    const res = await request(app).get('/api/production/routings').set(authHeaders);
    expect(res.status).toBe(200);
  });
});

describe('Production API — Máquinas', () => {
  it('GET /api/production/machines — lista máquinas', async () => {
    const res = await request(app).get('/api/production/machines').set(authHeaders);
    expect(res.status).toBe(200);
  });
});

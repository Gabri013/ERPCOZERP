import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

describe('Purchases API', () => {
  it('GET /api/purchases/orders — lista OCs', async () => {
    const res = await request(app).get('/api/purchases/orders').set(authHeaders);
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/purchases/orders — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/purchases/orders');
    expect(res.status).toBe(401);
  });

  it('GET /api/purchases/suppliers — lista fornecedores', async () => {
    const res = await request(app).get('/api/purchases/suppliers').set(authHeaders);
    expect(res.status).toBe(200);
  });

  it('POST /api/purchases/orders — valida campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/purchases/orders')
      .set(authHeaders)
      .send({});
    expect([400, 422]).toContain(res.status);
  });
});

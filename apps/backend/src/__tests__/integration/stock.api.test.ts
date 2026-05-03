import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

describe('Stock API — Produtos', () => {
  it('GET /api/stock/products — lista produtos', async () => {
    const res = await request(app).get('/api/stock/products').set(authHeaders);
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/stock/products — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/stock/products');
    expect(res.status).toBe(401);
  });

  it('GET /api/stock/products — suporta paginação', async () => {
    const res = await request(app)
      .get('/api/stock/products?page=1&limit=5')
      .set(authHeaders);
    expect(res.status).toBe(200);
  });

  it('GET /api/stock/products?search=Eixo — filtra por nome', async () => {
    const res = await request(app)
      .get('/api/stock/products?search=Eixo')
      .set(authHeaders);
    expect(res.status).toBe(200);
  });

  it('POST /api/stock/products — valida código único duplicado', async () => {
    const res = await request(app)
      .post('/api/stock/products')
      .set(authHeaders)
      .send({ code: 'PA-EIX-032', name: 'Duplicado', unit: 'UN' });
    expect([400, 409, 422]).toContain(res.status);
  });
});

describe('Stock API — Movimentações', () => {
  it('GET /api/stock/movements — lista movimentações', async () => {
    const res = await request(app).get('/api/stock/movements').set(authHeaders);
    expect(res.status).toBe(200);
  });
});

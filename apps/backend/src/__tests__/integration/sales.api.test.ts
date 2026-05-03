import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

describe('Sales API — Pedidos de Venda', () => {
  it('GET /api/sales/sale-orders — lista pedidos (autenticado)', async () => {
    const res = await request(app).get('/api/sales/sale-orders').set(authHeaders);
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/sales/sale-orders — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/sales/sale-orders');
    expect(res.status).toBe(401);
  });

  it('POST /api/sales/sale-orders — valida campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/sales/sale-orders')
      .set(authHeaders)
      .send({ items: [] });
    expect([400, 422]).toContain(res.status);
  });
});

describe('Sales API — Clientes', () => {
  it('GET /api/sales/customers — lista clientes', async () => {
    const res = await request(app).get('/api/sales/customers').set(authHeaders);
    expect(res.status).toBe(200);
  });

  it('GET /api/sales/customers/:id — retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/sales/customers/00000000-0000-0000-0000-000000000000')
      .set(authHeaders);
    expect(res.status).toBe(404);
  });
});

describe('Sales API — Orçamentos', () => {
  it('GET /api/sales/quotes — lista orçamentos', async () => {
    const res = await request(app).get('/api/sales/quotes').set(authHeaders);
    expect(res.status).toBe(200);
  });
});

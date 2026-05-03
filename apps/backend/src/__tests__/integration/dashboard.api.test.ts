import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

describe('Dashboard API', () => {
  it('GET /api/dashboard — retorna dados do dashboard', async () => {
    const res = await request(app).get('/api/dashboard').set(authHeaders);
    expect(res.status).toBe(200);
  });

  it('GET /api/dashboard — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /api/dashboard/layout — retorna layout do usuário', async () => {
    const res = await request(app).get('/api/dashboard/layout').set(authHeaders);
    expect(res.status).toBe(200);
    // response: { success: true, data: { widgets: [...] } }
    expect(res.body.data).toHaveProperty('widgets');
    expect(Array.isArray(res.body.data.widgets)).toBe(true);
  });

  it('PUT /api/dashboard/layout — salva layout', async () => {
    const res = await request(app)
      .put('/api/dashboard/layout')
      .set(authHeaders)
      .send({ widgets: ['kpi_vendas', 'kpi_producao'] });
    expect(res.status).toBe(200);
  });
});

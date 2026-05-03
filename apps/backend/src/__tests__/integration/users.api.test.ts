import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';

const app = createTestServer();
let authHeaders: Record<string, string>;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

describe('Users API', () => {
  it('GET /api/users — lista usuários', async () => {
    const res = await request(app).get('/api/users').set(authHeaders);
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('GET /api/users — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/users — não retorna senhas', async () => {
    const res = await request(app).get('/api/users').set(authHeaders);
    const data = res.body.data ?? res.body;
    data.forEach((u: any) => {
      expect(u.passwordHash).toBeUndefined();
      expect(u.password).toBeUndefined();
    });
  });

  it('POST /api/users — valida email inválido', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeaders)
      .send({ email: 'nao-e-email', fullName: 'Teste', password: 'Abc@1234' });
    expect([400, 422]).toContain(res.status);
  });

  it('POST /api/users — valida email duplicado', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeaders)
      .send({ email: 'gerente@cozinha.com', fullName: 'Gerente Duplicado', password: 'Abc@1234' });
    expect([400, 409, 422]).toContain(res.status);
  });
});

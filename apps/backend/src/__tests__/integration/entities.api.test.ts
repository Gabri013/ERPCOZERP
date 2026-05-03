import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { getAuthHeaders } from '../setup/fixtures.js';
import { prisma } from '../../infra/prisma.js';

const app = createTestServer();
let authHeaders: Record<string, string>;
let createdEntityCode: string;

beforeAll(async () => {
  authHeaders = await getAuthHeaders('gerente');
});

afterAll(async () => {
  if (createdEntityCode) {
    await prisma.entity.deleteMany({ where: { code: createdEntityCode } });
  }
});

describe('Entities API', () => {
  it('GET /api/entities — lista entidades', async () => {
    const res = await request(app).get('/api/entities').set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/entities — 401 sem autenticação', async () => {
    const res = await request(app).get('/api/entities');
    expect(res.status).toBe(401);
  });

  it('Entidades do sistema têm is_system=true', async () => {
    const res = await request(app).get('/api/entities').set(authHeaders);
    const systemCodes = ['cliente', 'produto', 'fornecedor', 'pedido_venda'];
    const entities: any[] = res.body.data;
    systemCodes.forEach((code) => {
      const ent = entities.find((e) => e.code === code);
      if (ent) {
        expect(ent.is_system).toBe(true);
      }
    });
  });

  it('POST /api/entities — cria entidade customizada', async () => {
    createdEntityCode = `test_entity_${Date.now()}`;
    const res = await request(app)
      .post('/api/entities')
      .set(authHeaders)
      .send({ code: createdEntityCode, name: 'Entidade de Teste', description: 'Criada em teste' });
    expect([200, 201]).toContain(res.status);
  });

  it('GET /api/entities/:code — retorna entidade por código', async () => {
    const res = await request(app).get('/api/entities/cliente').set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('cliente');
  });

  it('GET /api/entities/:code — retorna 404 para código inexistente', async () => {
    const res = await request(app).get('/api/entities/xxx-inexistente-abcxyz').set(authHeaders);
    expect(res.status).toBe(404);
  });
});

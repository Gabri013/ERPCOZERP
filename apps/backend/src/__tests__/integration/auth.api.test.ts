import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';
import { cleanupTestUsers } from '../setup/fixtures.js';

const app = createTestServer();

describe('Auth API', () => {
  afterAll(() => cleanupTestUsers());

  describe('POST /api/auth/login', () => {
    it('retorna 400 com credenciais em branco', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('retorna 401 com credenciais inválidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'naoexiste@cozinca.com', password: 'WrongPass' });
      expect(res.status).toBe(401);
    });

    it('retorna 200 com credenciais válidas (gerente@cozinha.com)', async () => {
      const demoPass = process.env.DEFAULT_DEMO_PASSWORD || 'demo123_dev';
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'gerente@cozinha.com', password: demoPass });
      expect(res.status).toBe(200);
      // auth route retorna `token` (não `accessToken`)
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'gerente@cozinha.com');
    });

    it('retorna 200 com credenciais master', async () => {
      const masterEmail = process.env.DEFAULT_MASTER_EMAIL || 'master@Cozinha.com';
      const masterPass  = process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev';
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: masterEmail, password: masterPass });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const demoPass = process.env.DEFAULT_DEMO_PASSWORD || 'demo123_dev';
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'gerente@cozinha.com', password: demoPass });
      token = res.body.token;
    });

    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('retorna 200 com token válido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email');
    });
  });
});

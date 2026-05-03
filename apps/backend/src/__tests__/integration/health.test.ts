import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../setup/testServer.js';

const app = createTestServer();

describe('Health Check', () => {
  it('GET /health → 200 com ok=true', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('GET / → 200 com info da API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
  });
});

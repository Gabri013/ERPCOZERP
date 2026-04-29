const request = require('supertest');

jest.mock('../src/config/database', () => {
  const query = jest.fn(async (sql) => {
    if (sql.includes('FROM users u')) {
      return [{
        id: 'user-1',
        email: 'admin@erp.local',
        full_name: 'Admin ERP',
        password_hash: 'hashed-password',
        active: 1,
        email_verified: 1,
        locked_until: null,
        failed_login_attempts: 0,
        roles: '["admin"]'
      }];
    }

    if (sql.includes('INSERT INTO user_sessions')) return [];
    if (sql.includes('UPDATE users SET failed_login_attempts = 0')) return [];
    if (sql.includes('INSERT INTO audit_logs')) return [];
    return [];
  });

  return {
    query,
    getClient: jest.fn(async () => ({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn(async () => [])
    })),
    pool: {}
  };
});

jest.mock('bcrypt', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'hashed-password')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `token-${payload.userId}`),
  verify: jest.fn((token) => ({ userId: 'user-1', email: 'admin@erp.local', roles: ['admin'], token }))
}));

const express = require('express');
const authRoutes = require('../src/routes/auth');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Auth login', () => {
  it('logs in successfully', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@erp.local', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('admin@erp.local');
    expect(response.body.user.roles).toEqual(['admin']);
    expect(response.body.accessToken).toBe('token-user-1');
  });
});
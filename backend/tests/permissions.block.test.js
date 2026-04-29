const request = require('supertest');

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-2', userId: 'user-2', roles: ['user'], email_verified: true, active: true };
    req.token = 'token-user-2';
    next();
  },
  requirePermission: () => (req, res, next) => {
    if (req.user.roles.includes('user')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  },
  requireMaster: (req, res, next) => next(),
  requireEmailVerified: (_req, _res, next) => next(),
  requireActiveUser: (_req, _res, next) => next()
}));

const express = require('express');
const userRoutes = require('../src/routes/users');
const { authenticateToken } = require('../src/middleware/auth');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', authenticateToken, userRoutes);
  return app;
}

describe('Permission blocking', () => {
  it('blocks a user without manage permission', async () => {
    const app = buildApp();

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token-user-2');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });
});
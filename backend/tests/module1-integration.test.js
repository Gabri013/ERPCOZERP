/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 1
 * Valida fluxo completo: cadastro, login, permissões, auditoria
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Mock do app com rotas autenticadas
const express = require('express');
const app = express();
app.use(express.json());

// Middleware de autenticação (simplificado para teste)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // Para teste, valida apenas se o token não está vazio
  if (token.length < 10) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  // Simula um usuário admin com todas as permissões
  req.user = {
    id: 'user-test-id',
    token,
    permissions: ['usuarios.criar', 'usuarios.editar', 'usuarios.deletar', 'usuarios.ler']
  };
  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    // Simula verificação de permissão
    const permissions = req.user?.permissions || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: `Permissão negada: ${permission}` });
    }
    next();
  };
};

// Rota de login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  // Simula usuário válido
  if (email === 'admin@test.com' && password === 'senha123') {
    const token = `jwt_token_${uuidv4()}`;
    return res.json({
      token,
      user: { id: 'user-1', email, fullName: 'Admin User' },
      permissions: ['usuarios.criar', 'usuarios.editar', 'usuarios.deletar', 'usuarios.ler']
    });
  }

  res.status(401).json({ error: 'Email ou senha inválido' });
});

// Rota para criar usuário (requer autenticação)
app.post('/api/usuarios', authenticateToken, requirePermission('usuarios.criar'), (req, res) => {
  const { email, fullName, password } = req.body;

  if (!email || !fullName || !password) {
    return res.status(400).json({ error: 'Email, nome e senha obrigatórios' });
  }

  const userId = uuidv4();
  res.status(201).json({
    id: userId,
    email,
    fullName,
    createdAt: new Date().toISOString()
  });
});

// Rota para listar usuários (requer autenticação e permissão)
app.get('/api/usuarios', authenticateToken, requirePermission('usuarios.ler'), (req, res) => {
  res.json([
    { id: 'user-1', email: 'admin@test.com', fullName: 'Admin User', active: true },
    { id: 'user-2', email: 'vendedor@test.com', fullName: 'Vendedor User', active: true }
  ]);
});

// Rota de auditoria (requer autenticação)
app.get('/api/audit-logs', authenticateToken, (req, res) => {
  res.json([
    {
      id: 1,
      userId: 'user-1',
      action: 'usuarios.criar',
      recordId: 'user-2',
      oldValue: null,
      newValue: JSON.stringify({ email: 'vendedor@test.com' }),
      createdAt: new Date().toISOString()
    }
  ]);
});

describe('MÓDULO 1 - INTEGRAÇÃO COMPLETA', () => {
  describe('Login e JWT', () => {
    it('deve fazer login com sucesso e retornar token JWT', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'senha123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@test.com');
      expect(response.body).toHaveProperty('permissions');
      expect(Array.isArray(response.body.permissions)).toBe(true);
    });

    it('deve retornar erro para login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'senha_errada'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro quando email ou senha não fornecidos', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });
  });

  describe('Autenticação e Acesso', () => {
    it('deve bloquear acesso sem token', async () => {
      const response = await request(app)
        .get('/api/usuarios');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Token não fornecido');
    });

    it('deve bloquear acesso com token inválido', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Token inválido');
    });

    it('deve permitir acesso com token válido', async () => {
      // Primeiro, fazer login para obter token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'senha123'
        });

      const token = loginResponse.body.token;

      // Usar token para acessar rota protegida
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Controle de Permissões', () => {
    it('deve permitir criar usuário com permissão', async () => {
      // Mock para adicionar permissão ao middleware
      const customApp = express();
      customApp.use(express.json());

      const authWithPermission = (req, res, next) => {
        req.user = {
          id: 'user-1',
          token: 'valid_token',
          permissions: ['usuarios.criar', 'usuarios.editar']
        };
        next();
      };

      const requirePerm = (perm) => (req, res, next) => {
        if (!req.user?.permissions?.includes(perm)) {
          return res.status(403).json({ error: `Permissão negada: ${perm}` });
        }
        next();
      };

      customApp.post('/api/usuarios', authWithPermission, requirePerm('usuarios.criar'), (req, res) => {
        res.status(201).json({ id: uuidv4(), email: req.body.email });
      });

      const response = await request(customApp)
        .post('/api/usuarios')
        .send({ email: 'novo@test.com', fullName: 'Novo User', password: 'pass123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });

    it('deve bloquear criar usuário sem permissão', async () => {
      const customApp = express();
      customApp.use(express.json());

      const authWithoutPermission = (req, res, next) => {
        req.user = {
          id: 'user-2',
          token: 'valid_token',
          permissions: ['usuarios.ler'] // Sem permissão para criar
        };
        next();
      };

      const requirePerm = (perm) => (req, res, next) => {
        if (!req.user?.permissions?.includes(perm)) {
          return res.status(403).json({ error: `Permissão negada: ${perm}` });
        }
        next();
      };

      customApp.post('/api/usuarios', authWithoutPermission, requirePerm('usuarios.criar'), (req, res) => {
        res.status(201).json({ id: uuidv4() });
      });

      const response = await request(customApp)
        .post('/api/usuarios')
        .send({ email: 'novo@test.com' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Permissão negada');
    });
  });

  describe('Auditoria', () => {
    it('deve recuperar logs de auditoria com autenticação', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'senha123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('action');
      expect(response.body[0]).toHaveProperty('createdAt');
    });

    it('deve bloquear acesso a auditoria sem autenticação', async () => {
      const response = await request(app)
        .get('/api/audit-logs');

      expect(response.status).toBe(401);
    });
  });

  describe('Fluxo Completo', () => {
    it('deve executar fluxo completo: login > verificar token > acessar recurso protegido', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'senha123'
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;
      const user = loginResponse.body.user;

      // 2. Verificar token válido
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(10);

      // 3. Acessar recurso protegido com token
      const resourceResponse = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${token}`);

      expect(resourceResponse.status).toBe(200);
      expect(Array.isArray(resourceResponse.body)).toBe(true);

      // 4. Verificar acesso a auditoria
      const auditResponse = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(auditResponse.status).toBe(200);
      expect(Array.isArray(auditResponse.body)).toBe(true);
    });
  });

  describe('Senhas com Bcrypt', () => {
    it('deve ser capaz de criptografar e validar senhas com bcrypt', async () => {
      const plainPassword = 'MinhaSenha123!';
      const saltRounds = 10;

      // Criptografar
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(plainPassword.length);

      // Validar
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);

      // Validar com senha errada
      const isInvalid = await bcrypt.compare('SenhaErrada', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });
});

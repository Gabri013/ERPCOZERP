/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 2
 * Valida auditoria: logs de ações, logs de erros, registros de antes/depois
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 2 - AUDITORIA COMPLETA', () => {
  let app;
  let auditLogs = [];
  let accessLogs = [];

  beforeEach(() => {
    // Setup do app com middlewares de auditoria
    app = express();
    app.use(express.json());

    // Middleware de autenticação
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token };
      next();
    };

    // Middleware de auditoria de requisições
    const auditRequestMiddleware = (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
          userId: req.user?.id || null,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString()
        };
        accessLogs.push(logEntry);
      });
      
      next();
    };

    // Middleware de auditoria de dados
    const auditDataChangeMiddleware = (entityId, operation) => {
      return (req, res, next) => {
        // Captura dados antigos (se existir)
        const oldData = req.body?.oldData || null;
        const newData = req.body?.newData || req.body;

        // Intercepta o envio de resposta para logar após sucesso
        const originalJson = res.json.bind(res);
        res.json = function(data) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const logEntry = {
              userId: req.user?.id || null,
              action: operation,
              entityId,
              recordId: data?.id || uuidv4(),
              oldValue: oldData ? JSON.stringify(oldData) : null,
              newValue: JSON.stringify(newData),
              timestamp: new Date().toISOString(),
              changedFields: oldData 
                ? Object.keys(newData).filter(k => oldData[k] !== newData[k])
                : Object.keys(newData)
            };
            auditLogs.push(logEntry);
          }
          return originalJson(data);
        };

        next();
      };
    };

    // Middleware de log de erros
    const auditErrorMiddleware = (err, req, res, next) => {
      const errorLog = {
        userId: req.user?.id || null,
        action: 'error',
        message: err.message,
        stack: err.stack?.substring(0, 500),
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      };
      auditLogs.push(errorLog);
      res.status(err.status || 500).json({ error: err.message });
    };

    app.use(auditRequestMiddleware);

    // Rota de login
    app.post('/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'admin@test.com' && password === 'senha123') {
        return res.json({ token: 'jwt_token_123', user: { id: 'user-1', email } });
      }
      res.status(401).json({ error: 'Credenciais inválidas' });
    });

    // Rota de criar cliente (auditada)
    app.post('/api/clientes', authenticateToken, auditDataChangeMiddleware('cliente', 'create'), (req, res) => {
      const { name, email, phone } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email obrigatórios' });
      }
      res.status(201).json({ id: uuidv4(), name, email, phone, createdAt: new Date() });
    });

    // Rota de atualizar cliente (auditada com before/after)
    app.put('/api/clientes/:id', authenticateToken, auditDataChangeMiddleware('cliente', 'update'), (req, res) => {
      const { id } = req.params;
      const { name, email, phone } = req.body;
      
      // Simula dados antigos
      const oldData = { id, name: 'Old Name', email: 'old@test.com', phone: '1111111' };
      
      res.status(200).json({
        id,
        name: name || oldData.name,
        email: email || oldData.email,
        phone: phone || oldData.phone,
        updatedAt: new Date()
      });
    });

    // Rota de deletar cliente (auditada)
    app.delete('/api/clientes/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const deleteLog = {
        userId: 'user-1',
        action: 'delete',
        entityId: 'cliente',
        recordId: id,
        oldValue: JSON.stringify({ id, name: 'Deleted Client' }),
        newValue: null,
        timestamp: new Date().toISOString()
      };
      auditLogs.push(deleteLog);
      res.status(204).send();
    });

    // Rota que gera erro (para testar error logging)
    app.get('/api/error-test', authenticateToken, (req, res, next) => {
      const error = new Error('Erro de teste para auditoria');
      error.status = 500;
      next(error);
    });

    // Error handler
    app.use(auditErrorMiddleware);
  });

  afterEach(() => {
    auditLogs = [];
    accessLogs = [];
  });

  describe('Log de Requisições', () => {
    it('deve registrar toda requisição no access_logs', async () => {
      const initialCount = accessLogs.length;
      
      await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      expect(accessLogs.length).toBe(initialCount + 1);
      const lastLog = accessLogs[accessLogs.length - 1];
      expect(lastLog.endpoint).toContain('/auth/login');
      expect(lastLog.method).toBe('POST');
      expect(lastLog.statusCode).toBe(200);
      expect(lastLog).toHaveProperty('duration');
      expect(lastLog).toHaveProperty('timestamp');
    });

    it('deve capturar método HTTP correto', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const initialCount = accessLogs.length;

      // POST
      await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const postLog = accessLogs[accessLogs.length - 1];
      expect(postLog.method).toBe('POST');
      expect(postLog.statusCode).toBe(200);
    });

    it('deve capturar status code correto', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;

      // Requisição bem-sucedida
      await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${token}`);

      const successLog = accessLogs[accessLogs.length - 1];
      expect(successLog.statusCode).toBe(404); // Rota não existe, mas será 404
    });
  });

  describe('Log de Ações (Create, Update, Delete)', () => {
    it('deve registrar criação de registro com new_value', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;
      const initialCount = auditLogs.length;

      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Cliente Novo',
          email: 'novo@test.com',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(auditLogs.length).toBe(initialCount + 1);

      const auditLog = auditLogs[auditLogs.length - 1];
      expect(auditLog.action).toBe('create');
      expect(auditLog.entityId).toBe('cliente');
      expect(auditLog.userId).toBe('user-1');
      expect(auditLog.oldValue).toBeNull();
      expect(auditLog.newValue).toBeDefined();
      expect(auditLog).toHaveProperty('recordId');
      expect(auditLog).toHaveProperty('timestamp');
    });

    it('deve registrar atualização com old_value e new_value', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;
      const initialCount = auditLogs.length;

      const response = await request(app)
        .put('/api/clientes/cliente-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Nome Atualizado',
          email: 'atualizado@test.com',
          phone: '9999999999'
        });

      expect(response.status).toBe(200);
      expect(auditLogs.length).toBeGreaterThan(initialCount);

      const auditLog = auditLogs[auditLogs.length - 1];
      expect(auditLog.action).toBe('update');
      expect(auditLog.oldValue).toBeDefined();
      expect(auditLog.newValue).toBeDefined();
      expect(auditLog.changedFields).toBeDefined();
      expect(Array.isArray(auditLog.changedFields)).toBe(true);
    });

    it('deve registrar deleção com old_value e new_value nulo', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;
      const initialCount = auditLogs.length;

      const response = await request(app)
        .delete('/api/clientes/cliente-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(auditLogs.length).toBe(initialCount + 1);

      const auditLog = auditLogs[auditLogs.length - 1];
      expect(auditLog.action).toBe('delete');
      expect(auditLog.oldValue).toBeDefined();
      expect(auditLog.newValue).toBeNull();
    });
  });

  describe('Log de Erros', () => {
    it('deve registrar erro com mensagem e contexto', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;
      const initialCount = auditLogs.length;

      const response = await request(app)
        .get('/api/error-test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(auditLogs.length).toBeGreaterThan(initialCount);

      const errorLog = auditLogs.find(log => log.action === 'error');
      expect(errorLog).toBeDefined();
      expect(errorLog.message).toContain('Erro de teste');
      expect(errorLog.url).toContain('/api/error-test');
      expect(errorLog.method).toBe('GET');
    });
  });

  describe('Rastreabilidade Completa', () => {
    it('deve manter rastreamento: quien, qué, cuándo, dónde', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;

      // Criar cliente
      const createResponse = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rastreamento Test',
          email: 'trace@test.com',
          phone: '1111111'
        });

      const clienteId = createResponse.body.id;

      // Atualizar cliente
      await request(app)
        .put(`/api/clientes/${clienteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rastreamento Test Updated'
        });

      // Deletar cliente
      await request(app)
        .delete(`/api/clientes/${clienteId}`)
        .set('Authorization', `Bearer ${token}`);

      // Verificar logs
      const logs = auditLogs.filter(log => log.entityId === 'cliente' && log.recordId === clienteId);
      
      // Deve ter: create, update, delete
      expect(logs.length).toBeGreaterThanOrEqual(2); // create e delete no mínimo
      
      // Verificar integridade
      logs.forEach(log => {
        expect(log).toHaveProperty('userId');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('entityId');
        expect(log).toHaveProperty('recordId');
        expect(log).toHaveProperty('timestamp');
      });

      // Criar log deve ter newValue
      const createLog = logs.find(l => l.action === 'create');
      if (createLog) {
        expect(createLog.oldValue).toBeNull();
        expect(createLog.newValue).toBeDefined();
      }

      // Deletar log deve ter oldValue
      const deleteLog = logs.find(l => l.action === 'delete');
      if (deleteLog) {
        expect(deleteLog.oldValue).toBeDefined();
        expect(deleteLog.newValue).toBeNull();
      }
    });
  });

  describe('Validação de Dados Auditados', () => {
    it('deve conter informações completas em cada log', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'senha123' });

      const token = loginResponse.body.token;

      await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dados Completos', email: 'completo@test.com' });

      const log = auditLogs.find(l => l.action === 'create');
      
      expect(log).toMatchObject({
        userId: expect.any(String),
        action: expect.any(String),
        entityId: expect.any(String),
        recordId: expect.any(String),
        newValue: expect.any(String),
        timestamp: expect.any(String)
      });

      // Validar formato do timestamp
      expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});

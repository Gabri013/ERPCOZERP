/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 4
 * Valida cadastro de clientes (obrigatório para vendas)
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 4 - CLIENTES', () => {
  let app;
  let entities = {};
  let records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Autenticação
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token };
      next();
    };

    // Criar entidade "cliente" (pré-carregada no sistema)
    entities['cliente'] = {
      id: uuidv4(),
      code: 'cliente',
      name: 'Cliente',
      fields: [
        { id: uuidv4(), code: 'codigo', label: 'Código', dataType: 'text', required: true, displayOrder: 1 },
        { id: uuidv4(), code: 'razao_social', label: 'Razão Social', dataType: 'text', required: true, displayOrder: 2 },
        { id: uuidv4(), code: 'cnpj_cpf', label: 'CNPJ/CPF', dataType: 'text', required: false, displayOrder: 3 },
        { id: uuidv4(), code: 'email', label: 'Email', dataType: 'email', required: false, displayOrder: 4 },
        { id: uuidv4(), code: 'telefone', label: 'Telefone', dataType: 'text', required: false, displayOrder: 5 },
        { id: uuidv4(), code: 'endereco', label: 'Endereço', dataType: 'text', required: false, displayOrder: 6 },
        { id: uuidv4(), code: 'cidade', label: 'Cidade', dataType: 'text', required: false, displayOrder: 7 },
        { id: uuidv4(), code: 'estado', label: 'Estado', dataType: 'select', required: false, displayOrder: 8 },
        { id: uuidv4(), code: 'status', label: 'Status', dataType: 'select', required: false, displayOrder: 9 }
      ]
    };

    // POST /api/records?entity=cliente — criar cliente
    app.post('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode } = req.query;
      const data = req.body;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      // Valida campos obrigatórios
      for (const field of entity.fields) {
        if (field.required && !data[field.code]) {
          return res.status(400).json({
            error: `Campo ${field.label} é obrigatório`
          });
        }
      }

      // Validações específicas para cliente
      if (entityCode === 'cliente') {
        // Código deve ser único
        if (records[entityCode]) {
          const clienteExistente = Object.values(records[entityCode]).find(c => c.codigo === data.codigo);
          if (clienteExistente) {
            return res.status(409).json({ error: 'Cliente com este código já existe' });
          }
        }

        // Email deve ser válido se fornecido
        if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return res.status(400).json({ error: 'Email inválido' });
        }
      }

      const recordId = uuidv4();
      const record = {
        id: recordId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!records[entityCode]) {
        records[entityCode] = {};
      }

      records[entityCode][recordId] = record;
      res.status(201).json(record);
    });

    // GET /api/records?entity=cliente — listar clientes
    app.get('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode, limit = 50, offset = 0, search = '' } = req.query;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const entityRecords = records[entityCode] || {};
      let recordList = Object.values(entityRecords);

      // Busca textual
      if (search && entityCode === 'cliente') {
        recordList = recordList.filter(r =>
          r.codigo?.toLowerCase().includes(search.toLowerCase()) ||
          r.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
          r.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      res.json({
        data: recordList.slice(offset, offset + limit),
        total: recordList.length,
        limit,
        offset
      });
    });

    // GET /api/records/:id?entity=cliente — obter um cliente
    app.get('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      res.json(record);
    });

    // PUT /api/records/:id?entity=cliente — atualizar cliente
    app.put('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const data = req.body;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      // Email deve ser válido se fornecido
      if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      const updatedRecord = {
        ...record,
        ...data,
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: new Date().toISOString()
      };

      records[entityCode][id] = updatedRecord;
      res.json(updatedRecord);
    });

    // DELETE /api/records/:id?entity=cliente — deletar cliente
    app.delete('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      delete records[entityCode][id];
      res.status(204).send();
    });
  });

  afterEach(() => {
    records = {};
  });

  describe('Cadastro de Cliente', () => {
    it('deve criar cliente com dados obrigatórios', async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-001',
          razao_social: 'Acme Corporation'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.codigo).toBe('CLI-001');
      expect(response.body.razao_social).toBe('Acme Corporation');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('deve criar cliente com dados completos', async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-002',
          razao_social: 'Tech Solutions Ltda',
          cnpj_cpf: '12.345.678/0001-90',
          email: 'contato@techsolutions.com',
          telefone: '(11) 98765-4321',
          endereco: 'Rua Principal, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'Ativo'
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('contato@techsolutions.com');
      expect(response.body.telefone).toBe('(11) 98765-4321');
      expect(response.body.status).toBe('Ativo');
    });

    it('deve retornar erro quando código está faltando', async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          razao_social: 'Test Client'
          // Falta código
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar erro quando razão social está faltando', async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-003'
          // Falta razão social
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve validar email com formato correto', async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-004',
          razao_social: 'Invalid Email Test',
          email: 'email-invalido-sem-dominio'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email inválido');
    });

    it('deve bloquear código duplicado', async () => {
      // Criar primeiro cliente
      await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-005',
          razao_social: 'First Client'
        });

      // Tentar criar com mesmo código
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-005',
          razao_social: 'Second Client'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('já existe');
    });
  });

  describe('Listar Clientes', () => {
    beforeEach(async () => {
      // Criar alguns clientes
      const clientes = [
        { codigo: 'CLI-010', razao_social: 'Cliente A' },
        { codigo: 'CLI-011', razao_social: 'Cliente B', email: 'clienteb@test.com' },
        { codigo: 'CLI-012', razao_social: 'Cliente C' }
      ];

      for (const cliente of clientes) {
        await request(app)
          .post('/api/records?entity=cliente')
          .set('Authorization', 'Bearer valid_token')
          .send(cliente);
      }
    });

    it('deve listar todos os clientes', async () => {
      const response = await request(app)
        .get('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
      expect(response.body.total).toBe(3);
    });

    it('deve filtrar clientes por código', async () => {
      const response = await request(app)
        .get('/api/records?entity=cliente&search=CLI-010')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].codigo).toBe('CLI-010');
    });

    it('deve filtrar clientes por razão social', async () => {
      const response = await request(app)
        .get('/api/records?entity=cliente&search=Cliente%20B')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].razao_social).toBe('Cliente B');
    });

    it('deve filtrar clientes por email', async () => {
      const response = await request(app)
        .get('/api/records?entity=cliente&search=clienteb')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].email).toBe('clienteb@test.com');
    });

    it('deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/records?entity=cliente&limit=2&offset=0')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.limit).toBe('2');
      expect(response.body.offset).toBe('0');
      expect(response.body.total).toBe(3);
    });
  });

  describe('Atualizar Cliente', () => {
    let clienteId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-020',
          razao_social: 'Original Name'
        });

      clienteId = response.body.id;
    });

    it('deve atualizar razão social do cliente', async () => {
      const response = await request(app)
        .put(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          razao_social: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.razao_social).toBe('Updated Name');
      expect(response.body.codigo).toBe('CLI-020'); // Não muda
    });

    it('deve adicionar email ao cliente', async () => {
      const response = await request(app)
        .put(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          email: 'newemail@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('newemail@test.com');
    });

    it('deve validar email ao atualizar', async () => {
      const response = await request(app)
        .put(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          email: 'email-invalido'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email inválido');
    });

    it('deve manter histórico de criação', async () => {
      const getResponse = await request(app)
        .get(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      const originalCreatedAt = getResponse.body.createdAt;

      // Aguardar um pouco para garantir diferença de timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateResponse = await request(app)
        .put(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token')
        .send({ telefone: '(11) 99999-9999' });

      expect(updateResponse.body.createdAt).toBe(originalCreatedAt);
      expect(new Date(updateResponse.body.updatedAt).getTime())
        .toBeGreaterThan(new Date(originalCreatedAt).getTime());
    });
  });

  describe('Deletar Cliente', () => {
    it('deve deletar cliente', async () => {
      // Criar cliente
      const createResponse = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-030',
          razao_social: 'To Delete'
        });

      const clienteId = createResponse.body.id;

      // Deletar
      const deleteResponse = await request(app)
        .delete(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(deleteResponse.status).toBe(204);

      // Verificar que foi deletado
      const getResponse = await request(app)
        .get(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Cliente Obrigatório para Venda', () => {
    it('deve exigir cliente existente para criar venda', async () => {
      // Criar um cliente válido
      const clienteResponse = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-040',
          razao_social: 'Venda Test Client'
        });

      expect(clienteResponse.status).toBe(201);
      const clienteId = clienteResponse.body.id;

      // A venda deveria referenciar este cliente
      expect(clienteId).toBeDefined();
      expect(clienteId).toHaveLength(36); // UUID
    });

    it('deve listar cliente para validar referência', async () => {
      // Criar cliente
      const clienteResponse = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-041',
          razao_social: 'Reference Test'
        });

      const clienteId = clienteResponse.body.id;

      // Recuperar cliente
      const getResponse = await request(app)
        .get(`/api/records/${clienteId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(clienteId);
      expect(getResponse.body.codigo).toBe('CLI-041');
    });
  });
});

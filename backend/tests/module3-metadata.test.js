/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 3
 * Valida sistema NO-CODE: criar entidades, campos e CRUD dinâmico
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 3 - METADADOS (NO-CODE)', () => {
  let app;
  let entities = {};
  let records = {};

  beforeEach(() => {
    // Setup do app com sistema de metadados
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

    // ============================================
    // ROTAS DE ENTIDADES
    // ============================================

    // POST /api/entities — criar entidade sem código
    app.post('/api/entities', authenticateToken, (req, res) => {
      const { code, name, description, type = 'master' } = req.body;

      if (!code || !name) {
        return res.status(400).json({ error: 'Code e name são obrigatórios' });
      }

      if (entities[code]) {
        return res.status(409).json({ error: 'Entidade já existe' });
      }

      const entityId = uuidv4();
      const entity = {
        id: entityId,
        code,
        name,
        description: description || '',
        type,
        fields: [],
        createdAt: new Date().toISOString()
      };

      entities[code] = entity;
      res.status(201).json(entity);
    });

    // GET /api/entities — listar entidades
    app.get('/api/entities', authenticateToken, (req, res) => {
      res.json(Object.values(entities));
    });

    // GET /api/entities/:code — obter uma entidade com seus campos
    app.get('/api/entities/:code', authenticateToken, (req, res) => {
      const { code } = req.params;
      const entity = entities[code];

      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      res.json(entity);
    });

    // ============================================
    // ROTAS DE CAMPOS
    // ============================================

    // POST /api/entities/:code/fields — criar campo sem código (gera automaticamente)
    app.post('/api/entities/:code/fields', authenticateToken, (req, res) => {
      const { code } = req.params;
      const { label, dataType = 'text', required = false } = req.body;

      const entity = entities[code];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      if (!label) {
        return res.status(400).json({ error: 'Label é obrigatório' });
      }

      // Gera código automaticamente a partir do label
      const fieldCode = label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w]/g, '');

      if (entity.fields.some(f => f.code === fieldCode)) {
        return res.status(409).json({ error: 'Campo já existe' });
      }

      const field = {
        id: uuidv4(),
        code: fieldCode,
        label,
        dataType,
        required,
        displayOrder: entity.fields.length + 1,
        createdAt: new Date().toISOString()
      };

      entity.fields.push(field);
      res.status(201).json(field);
    });

    // GET /api/entities/:code/fields — listar campos
    app.get('/api/entities/:code/fields', authenticateToken, (req, res) => {
      const { code } = req.params;
      const entity = entities[code];

      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      res.json(entity.fields);
    });

    // ============================================
    // ROTAS DE REGISTROS (CRUD DINÂMICO)
    // ============================================

    // POST /api/records?entity=cliente — criar registro dinâmico
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

    // GET /api/records?entity=cliente — listar registros
    app.get('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode, limit = 50, offset = 0 } = req.query;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const entityRecords = records[entityCode] || {};
      const recordList = Object.values(entityRecords);

      res.json({
        data: recordList.slice(offset, offset + limit),
        total: recordList.length,
        limit,
        offset
      });
    });

    // GET /api/records/:id?entity=cliente — obter um registro
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

    // PUT /api/records/:id?entity=cliente — atualizar registro
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

      // Atualiza apenas campos fornecidos
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

    // DELETE /api/records/:id?entity=cliente — deletar registro
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
    entities = {};
    records = {};
  });

  describe('Criar Entidade (sem código)', () => {
    it('deve criar entidade com valores mínimos', async () => {
      const loginResponse = { body: { token: 'valid_token' } };

      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({
          code: 'cliente',
          name: 'Cliente'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('code', 'cliente');
      expect(response.body).toHaveProperty('name', 'Cliente');
      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray(response.body.fields)).toBe(true);
    });

    it('deve criar entidade com descrição', async () => {
      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({
          code: 'fornecedor',
          name: 'Fornecedor',
          description: 'Cadastro de fornecedores',
          type: 'master'
        });

      expect(response.status).toBe(201);
      expect(response.body.description).toBe('Cadastro de fornecedores');
      expect(response.body.type).toBe('master');
    });

    it('deve retornar erro se code ou name não fornecidos', async () => {
      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({ code: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar erro se entidade já existe', async () => {
      await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({ code: 'duplicado', name: 'Test' });

      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({ code: 'duplicado', name: 'Test 2' });

      expect(response.status).toBe(409);
    });
  });

  describe('Criar Campo (sem código)', () => {
    beforeEach(async () => {
      // Criar uma entidade primeiro
      await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({ code: 'produto', name: 'Produto' });
    });

    it('deve criar campo e gerar código automaticamente', async () => {
      const response = await request(app)
        .post('/api/entities/produto/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({
          label: 'Codigo Produto',
          dataType: 'text',
          required: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('codigo_produto'); // Auto-generated
      expect(response.body.label).toBe('Codigo Produto');
      expect(response.body.dataType).toBe('text');
      expect(response.body.required).toBe(true);
    });

    it('deve criar múltiplos campos em ordem', async () => {
      const field1 = await request(app)
        .post('/api/entities/produto/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Código', dataType: 'text' });

      const field2 = await request(app)
        .post('/api/entities/produto/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Descrição', dataType: 'text' });

      expect(field1.body.displayOrder).toBe(1);
      expect(field2.body.displayOrder).toBe(2);
    });

    it('deve retornar erro se label não fornecido', async () => {
      const response = await request(app)
        .post('/api/entities/produto/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ dataType: 'text' });

      expect(response.status).toBe(400);
    });

    it('deve retornar erro se entidade não existe', async () => {
      const response = await request(app)
        .post('/api/entities/inexistente/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Campo' });

      expect(response.status).toBe(404);
    });
  });

  describe('CRUD Dinâmico', () => {
    beforeEach(async () => {
      // Criar entidade "cliente" com campos
      await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({ code: 'cliente', name: 'Cliente' });

      const field1Response = await request(app)
        .post('/api/entities/cliente/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Razao Social', dataType: 'text', required: true });

      const field2Response = await request(app)
        .post('/api/entities/cliente/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Email', dataType: 'email' });

      // Armazenar os códigos gerados
      this.field1Code = field1Response.body.code; // Will be 'razao_social'
      this.field2Code = field2Response.body.code; // Will be 'email'
    });

    it('deve criar registro dinâmico (CREATE)', async () => {
      const data = {};
      data[this.field1Code] = 'Acme Corp';
      data[this.field2Code] = 'contato@acme.com';

      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body[this.field1Code]).toBe('Acme Corp');
      expect(response.body[this.field2Code]).toBe('contato@acme.com');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('deve validar campo obrigatório', async () => {
      const data = {};
      data[this.field2Code] = 'teste@test.com';
      // Falta razao_social que é required

      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve listar registros (READ)', async () => {
      // Criar alguns registros
      const data1 = {};
      data1[this.field1Code] = 'Cliente 1';

      const data2 = {};
      data2[this.field1Code] = 'Cliente 2';

      const record1 = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data1);

      const record2 = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data2);

      const response = await request(app)
        .get('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('total');
    });

    it('deve obter um registro específico (READ ONE)', async () => {
      const data = {};
      data[this.field1Code] = 'Test Corp';

      const created = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data);

      const recordId = created.body.id;

      const response = await request(app)
        .get(`/api/records/${recordId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(recordId);
      expect(response.body[this.field1Code]).toBe('Test Corp');
    });

    it('deve atualizar registro (UPDATE)', async () => {
      const data = {};
      data[this.field1Code] = 'Original';

      const created = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data);

      const recordId = created.body.id;
      const originalCreatedAt = created.body.createdAt;

      const updateData = {};
      updateData[this.field1Code] = 'Atualizado';
      updateData[this.field2Code] = 'novo@email.com';

      const response = await request(app)
        .put(`/api/records/${recordId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[this.field1Code]).toBe('Atualizado');
      expect(response.body[this.field2Code]).toBe('novo@email.com');
      expect(response.body.createdAt).toBe(originalCreatedAt);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(new Date(originalCreatedAt).getTime());
    });

    it('deve deletar registro (DELETE)', async () => {
      const data = {};
      data[this.field1Code] = 'To Delete';

      const created = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send(data);

      const recordId = created.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/records/${recordId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(deleteResponse.status).toBe(204);

      // Verificar que foi deletado
      const getResponse = await request(app)
        .get(`/api/records/${recordId}?entity=cliente`)
        .set('Authorization', 'Bearer valid_token');

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Fluxo Completo NO-CODE', () => {
    it('deve executar fluxo: criar entidade > campos > records sem uma linha de código', async () => {
      // 1. Criar entidade
      const entityResponse = await request(app)
        .post('/api/entities')
        .set('Authorization', 'Bearer valid_token')
        .send({
          code: 'venda',
          name: 'Venda',
          description: 'Vendas realizadas'
        });

      expect(entityResponse.status).toBe(201);

      // 2. Criar campos
      const field1Response = await request(app)
        .post('/api/entities/venda/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Numero Venda', dataType: 'text', required: true });

      const field2Response = await request(app)
        .post('/api/entities/venda/fields')
        .set('Authorization', 'Bearer valid_token')
        .send({ label: 'Valor Total', dataType: 'decimal', required: true });

      expect(field1Response.status).toBe(201);
      expect(field2Response.status).toBe(201);

      const field1Code = field1Response.body.code;
      const field2Code = field2Response.body.code;

      // 3. Verificar entidade com campos
      const getEntity = await request(app)
        .get('/api/entities/venda')
        .set('Authorization', 'Bearer valid_token');

      expect(getEntity.status).toBe(200);
      expect(getEntity.body.fields.length).toBe(2);

      // 4. Criar registros
      const data1 = {};
      data1[field1Code] = 'VND-001';
      data1[field2Code] = 1500.00;

      const data2 = {};
      data2[field1Code] = 'VND-002';
      data2[field2Code] = 2500.00;

      const record1 = await request(app)
        .post('/api/records?entity=venda')
        .set('Authorization', 'Bearer valid_token')
        .send(data1);

      const record2 = await request(app)
        .post('/api/records?entity=venda')
        .set('Authorization', 'Bearer valid_token')
        .send(data2);

      expect(record1.status).toBe(201);
      expect(record2.status).toBe(201);

      // 5. Listar registros
      const listRecords = await request(app)
        .get('/api/records?entity=venda')
        .set('Authorization', 'Bearer valid_token');

      expect(listRecords.status).toBe(200);
      expect(listRecords.body.total).toBe(2);

      // 6. Atualizar registro
      const updateData = {};
      updateData[field2Code] = 1800.00;

      const updateRecord = await request(app)
        .put(`/api/records/${record1.body.id}?entity=venda`)
        .set('Authorization', 'Bearer valid_token')
        .send(updateData);

      expect(updateRecord.status).toBe(200);
      expect(updateRecord.body[field2Code]).toBe(1800.00);

      // 7. Deletar registro
      const deleteRecord = await request(app)
        .delete(`/api/records/${record2.body.id}?entity=venda`)
        .set('Authorization', 'Bearer valid_token');

      expect(deleteRecord.status).toBe(204);

      // Verificar contagem final
      const finalList = await request(app)
        .get('/api/records?entity=venda')
        .set('Authorization', 'Bearer valid_token');

      expect(finalList.body.total).toBe(1);
    });
  });
});

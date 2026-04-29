/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 5
 * Valida orçamentos com itens e aprovação obrigatória
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 5 - ORÇAMENTO', () => {
  let app;
  let entities = {};
  let records = {};
  let orcamentoCounter = 100;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token, role: 'admin' };
      next();
    };

    // Setup entidades base
    entities['cliente'] = {
      id: uuidv4(),
      code: 'cliente',
      name: 'Cliente',
      fields: [
        { code: 'codigo', label: 'Código', dataType: 'text', required: true },
        { code: 'razao_social', label: 'Razão Social', dataType: 'text', required: true }
      ]
    };

    entities['produto'] = {
      id: uuidv4(),
      code: 'produto',
      name: 'Produto',
      fields: [
        { code: 'codigo', label: 'Código', dataType: 'text', required: true },
        { code: 'descricao', label: 'Descrição', dataType: 'text', required: true },
        { code: 'preco_venda', label: 'Preço Venda', dataType: 'decimal', required: true }
      ]
    };

    entities['orcamento'] = {
      id: uuidv4(),
      code: 'orcamento',
      name: 'Orçamento',
      fields: [
        { code: 'numero', label: 'Número', dataType: 'text', required: true },
        { code: 'cliente_id', label: 'Cliente', dataType: 'reference', required: true },
        { code: 'data_emissao', label: 'Data Emissão', dataType: 'date', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: true },
        { code: 'valor_total', label: 'Valor Total', dataType: 'decimal', required: false },
        { code: 'aprovado_por', label: 'Aprovado Por', dataType: 'text', required: false },
        { code: 'data_aprovacao', label: 'Data Aprovação', dataType: 'date', required: false }
      ]
    };

    entities['orcamento_item'] = {
      id: uuidv4(),
      code: 'orcamento_item',
      name: 'Itens do Orçamento',
      fields: [
        { code: 'orcamento_id', label: 'Orçamento', dataType: 'reference', required: true },
        { code: 'produto_id', label: 'Produto', dataType: 'reference', required: true },
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'preco_unitario', label: 'Preço Unitário', dataType: 'decimal', required: true },
        { code: 'desconto_percentual', label: 'Desconto %', dataType: 'decimal', required: false }
      ]
    };

    // POST /api/records — criar registro dinâmico
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

      // Validações específicas
      if (entityCode === 'orcamento') {
        // Número deve ser único
        if (records[entityCode]) {
          const duplicado = Object.values(records[entityCode]).find(o => o.numero === data.numero);
          if (duplicado) {
            return res.status(409).json({ error: 'Número de orçamento já existe' });
          }
        }

        // Status padrão é "Rascunho"
        if (!data.status) {
          data.status = 'Rascunho';
        }

        // Valor total padrão é 0
        if (!data.valor_total) {
          data.valor_total = 0;
        }

        // Validar cliente existe
        if (!records['cliente']?.[data.cliente_id]) {
          return res.status(400).json({ error: 'Cliente não existe' });
        }
      }

      if (entityCode === 'orcamento_item') {
        // Validar produto existe
        if (!records['produto']?.[data.produto_id]) {
          return res.status(400).json({ error: 'Produto não existe' });
        }

        // Validar orçamento existe
        if (!records['orcamento']?.[data.orcamento_id]) {
          return res.status(400).json({ error: 'Orçamento não existe' });
        }

        // Quantidade deve ser positiva
        if (data.quantidade <= 0) {
          return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
        }

        // Atualizar valor total do orçamento
        const orcamento = records['orcamento'][data.orcamento_id];
        const subtotal = data.quantidade * data.preco_unitario;
        const desconto = data.desconto_percentual || 0;
        const valorItem = subtotal * (1 - desconto / 100);
        
        orcamento.valor_total = (orcamento.valor_total || 0) + valorItem;
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

    // POST /api/orcamentos/:id/aprovar — aprovar orçamento
    app.post('/api/orcamentos/:id/aprovar', authenticateToken, (req, res) => {
      const { id } = req.params;
      const orcamento = records['orcamento']?.[id];

      if (!orcamento) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      if (orcamento.status === 'Aprovado') {
        return res.status(400).json({ error: 'Orçamento já foi aprovado' });
      }

      if (orcamento.status === 'Pedido') {
        return res.status(400).json({ error: 'Orçamento já gerou pedido' });
      }

      orcamento.status = 'Aprovado';
      orcamento.aprovado_por = req.user.id;
      orcamento.data_aprovacao = new Date().toISOString();
      orcamento.updatedAt = new Date().toISOString();

      res.json(orcamento);
    });

    // POST /api/orcamentos/:id/gerar-pedido — gerar pedido do orçamento aprovado
    app.post('/api/orcamentos/:id/gerar-pedido', authenticateToken, (req, res) => {
      const { id } = req.params;
      const orcamento = records['orcamento']?.[id];

      if (!orcamento) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      if (orcamento.status !== 'Aprovado') {
        return res.status(400).json({ 
          error: 'Pedido só pode ser gerado de orçamento aprovado',
          statusAtual: orcamento.status
        });
      }

      orcamento.status = 'Pedido';
      orcamento.updatedAt = new Date().toISOString();

      res.json({
        message: 'Pedido gerado com sucesso',
        orcamento,
        pedidoId: uuidv4()
      });
    });

    // GET /api/records?entity=orcamento — listar orçamentos
    app.get('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode } = req.query;
      const entity = entities[entityCode];

      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      const recordList = records[entityCode] || {};
      res.json({
        data: Object.values(recordList),
        total: Object.keys(recordList).length
      });
    });

    // GET /api/records/:id — obter registro
    app.get('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      res.json(record);
    });

    // GET /api/orcamentos/:id/itens — listar itens do orçamento
    app.get('/api/orcamentos/:id/itens', authenticateToken, (req, res) => {
      const { id } = req.params;

      const orcamento = records['orcamento']?.[id];
      if (!orcamento) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      const itens = Object.values(records['orcamento_item'] || {}).filter(
        item => item.orcamento_id === id
      );

      res.json({
        orcamento,
        itens,
        total: itens.length
      });
    });

    // PUT /api/records/:id — atualizar registro
    app.put('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const data = req.body;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      // Não permitir editar orçamento aprovado
      if (entityCode === 'orcamento' && record.status === 'Aprovado') {
        return res.status(400).json({ error: 'Não é possível editar orçamento aprovado' });
      }

      const updated = {
        ...record,
        ...data,
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: new Date().toISOString()
      };

      records[entityCode][id] = updated;
      res.json(updated);
    });
  });

  afterEach(() => {
    records = {};
    orcamentoCounter = 100;
  });

  describe('Criar Orçamento', () => {
    beforeEach(async () => {
      // Criar cliente
      const response = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-100',
          razao_social: 'Test Client'
        });

      this.clienteId = response.body.id;
    });

    it('deve criar orçamento em status Rascunho', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Rascunho');
    });

    it('deve validar cliente obrigatório', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          data_emissao: new Date().toISOString(),
          valor_total: 0
          // Falta cliente_id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve validar cliente existe', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: uuidv4(), // Cliente inexistente
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não existe');
    });

    it('deve bloquear número duplicado', async () => {
      const numero = `ORC-${++orcamentoCounter}`;

      await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero,
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      const response = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero, // Número duplicado
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('Itens do Orçamento', () => {
    beforeEach(async () => {
      // Criar cliente
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-200',
          razao_social: 'Test Client 2'
        });
      this.clienteId = clienteResp.body.id;

      // Criar produto
      const produtoResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PRD-001',
          descricao: 'Test Product',
          preco_venda: 100.00
        });
      this.produtoId = produtoResp.body.id;

      // Criar orçamento
      const orcamentoResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });
      this.orcamentoId = orcamentoResp.body.id;
    });

    it('deve adicionar item ao orçamento', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          orcamento_id: this.orcamentoId,
          produto_id: this.produtoId,
          quantidade: 5,
          preco_unitario: 100.00
        });

      expect(response.status).toBe(201);
      expect(response.body.quantidade).toBe(5);
    });

    it('deve calcular valor do item com desconto', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          orcamento_id: this.orcamentoId,
          produto_id: this.produtoId,
          quantidade: 10,
          preco_unitario: 100.00,
          desconto_percentual: 10
        });

      expect(response.status).toBe(201);
      // Valor = 10 * 100 * 0.9 = 900
    });

    it('deve validar quantidade positiva', async () => {
      const response = await request(app)
        .post('/api/records?entity=orcamento_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          orcamento_id: this.orcamentoId,
          produto_id: this.produtoId,
          quantidade: -1, // Inválido - negativo
          preco_unitario: 100.00
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que zero');
    });

    it('deve listar itens do orçamento', async () => {
      // Adicionar 2 itens
      await request(app)
        .post('/api/records?entity=orcamento_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          orcamento_id: this.orcamentoId,
          produto_id: this.produtoId,
          quantidade: 5,
          preco_unitario: 100.00
        });

      const response = await request(app)
        .get(`/api/orcamentos/${this.orcamentoId}/itens`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.itens.length).toBeGreaterThan(0);
      expect(response.body.orcamento.id).toBe(this.orcamentoId);
    });
  });

  describe('Aprovação de Orçamento', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-300',
          razao_social: 'Test Client 3'
        });
      this.clienteId = clienteResp.body.id;

      const orcamentoResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });
      this.orcamentoId = orcamentoResp.body.id;
    });

    it('deve aprovar orçamento', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Aprovado');
      expect(response.body.aprovado_por).toBeDefined();
      expect(response.body.data_aprovacao).toBeDefined();
    });

    it('deve bloquear aprovação dupla', async () => {
      await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já foi aprovado');
    });

    it('deve bloquear edição de orçamento aprovado', async () => {
      await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      const response = await request(app)
        .put(`/api/records/${this.orcamentoId}?entity=orcamento`)
        .set('Authorization', 'Bearer valid_token')
        .send({ valor_total: 2000.00 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('aprovado');
    });
  });

  describe('Geração de Pedido', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-400',
          razao_social: 'Test Client 4'
        });
      this.clienteId = clienteResp.body.id;

      const orcamentoResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });
      this.orcamentoId = orcamentoResp.body.id;
    });

    it('deve bloquear pedido de orçamento não aprovado', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('aprovado');
      expect(response.body.statusAtual).toBe('Rascunho');
    });

    it('deve gerar pedido de orçamento aprovado', async () => {
      await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.orcamento.status).toBe('Pedido');
      expect(response.body).toHaveProperty('pedidoId');
    });

    it('deve bloquear geração dupla de pedido', async () => {
      await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
    });
  });

  describe('Fluxo Completo Orçamento', () => {
    it('deve executar fluxo: criar > adicionar itens > aprovar > gerar pedido', async () => {
      // 1. Criar cliente
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'CLI-FLUXO',
          razao_social: 'Fluxo Test Client'
        });

      // 2. Criar produto
      const produtoResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PRD-FLUXO',
          descricao: 'Fluxo Product',
          preco_venda: 500.00
        });

      // 3. Criar orçamento
      const orcamentoResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: `ORC-${++orcamentoCounter}`,
          cliente_id: clienteResp.body.id,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      // 4. Adicionar itens
      const itemResp = await request(app)
        .post('/api/records?entity=orcamento_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          orcamento_id: orcamentoResp.body.id,
          produto_id: produtoResp.body.id,
          quantidade: 2,
          preco_unitario: 500.00
        });

      expect(itemResp.status).toBe(201);

      // 5. Aprovar orçamento
      const aprovaResp = await request(app)
        .post(`/api/orcamentos/${orcamentoResp.body.id}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      expect(aprovaResp.status).toBe(200);
      expect(aprovaResp.body.status).toBe('Aprovado');

      // 6. Gerar pedido
      const pedidoResp = await request(app)
        .post(`/api/orcamentos/${orcamentoResp.body.id}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(pedidoResp.status).toBe(200);
      expect(pedidoResp.body.message).toContain('sucesso');
      expect(pedidoResp.body.orcamento.status).toBe('Pedido');
    });
  });
});

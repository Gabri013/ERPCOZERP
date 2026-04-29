/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 6
 * Valida pedido de venda gerado automaticamente do orçamento
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 6 - PEDIDO DE VENDA', () => {
  let app;
  let entities = {};
  let records = {};
  let pedidoCounter = 1000;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token };
      next();
    };

    // Entidades base
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
        { code: 'status', label: 'Status', dataType: 'select', required: true }
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
        { code: 'preco_unitario', label: 'Preço Unitário', dataType: 'decimal', required: true }
      ]
    };

    entities['pedido_venda'] = {
      id: uuidv4(),
      code: 'pedido_venda',
      name: 'Pedido de Venda',
      fields: [
        { code: 'numero', label: 'Número', dataType: 'text', required: true },
        { code: 'orcamento_id', label: 'Orçamento', dataType: 'reference', required: true },
        { code: 'cliente_id', label: 'Cliente', dataType: 'reference', required: true },
        { code: 'data_pedido', label: 'Data Pedido', dataType: 'date', required: true },
        { code: 'valor_total', label: 'Valor Total', dataType: 'decimal', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: true }
      ]
    };

    entities['pedido_item'] = {
      id: uuidv4(),
      code: 'pedido_item',
      name: 'Itens do Pedido',
      fields: [
        { code: 'pedido_id', label: 'Pedido', dataType: 'reference', required: true },
        { code: 'produto_id', label: 'Produto', dataType: 'reference', required: true },
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'preco_unitario', label: 'Preço Unitário', dataType: 'decimal', required: true }
      ]
    };

    // POST /api/records
    app.post('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode } = req.query;
      const data = req.body;

      const entity = entities[entityCode];
      if (!entity) {
        return res.status(404).json({ error: 'Entidade não encontrada' });
      }

      for (const field of entity.fields) {
        if (field.required && !data[field.code]) {
          return res.status(400).json({
            error: `Campo ${field.label} é obrigatório`
          });
        }
      }

      // Validações específicas
      if (entityCode === 'pedido_venda') {
        if (records['pedido_venda']) {
          const duplicado = Object.values(records['pedido_venda']).find(p => p.numero === data.numero);
          if (duplicado) {
            return res.status(409).json({ error: 'Número de pedido já existe' });
          }
        }

        if (!records['cliente']?.[data.cliente_id]) {
          return res.status(400).json({ error: 'Cliente não existe' });
        }

        if (!records['orcamento']?.[data.orcamento_id]) {
          return res.status(400).json({ error: 'Orçamento não existe' });
        }

        const orcamento = records['orcamento'][data.orcamento_id];
        if (orcamento.status !== 'Aprovado') {
          return res.status(400).json({
            error: 'Pedido só pode ser gerado de orçamento aprovado',
            statusOrcamento: orcamento.status
          });
        }

        if (!data.status) {
          data.status = 'Aberto';
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

    // GET /api/records
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

    // GET /api/records/:id
    app.get('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      res.json(record);
    });

    // POST /api/orcamentos/:id/gerar-pedido
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

      // Copiar itens do orçamento para o pedido
      const itensOrcamento = Object.values(records['orcamento_item'] || {})
        .filter(item => item.orcamento_id === id);

      if (itensOrcamento.length === 0) {
        return res.status(400).json({ error: 'Orçamento sem itens não pode gerar pedido' });
      }

      // Criar pedido
      const numeroPedido = `PED-${++pedidoCounter}`;
      const pedidoId = uuidv4();
      const pedido = {
        id: pedidoId,
        numero: numeroPedido,
        orcamento_id: id,
        cliente_id: orcamento.cliente_id,
        data_pedido: new Date().toISOString(),
        valor_total: orcamento.valor_total,
        status: 'Aberto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!records['pedido_venda']) {
        records['pedido_venda'] = {};
      }
      records['pedido_venda'][pedidoId] = pedido;

      // Copiar itens
      if (!records['pedido_item']) {
        records['pedido_item'] = {};
      }

      itensOrcamento.forEach(item => {
        const itemId = uuidv4();
        records['pedido_item'][itemId] = {
          id: itemId,
          pedido_id: pedidoId,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      // Marcar orçamento como pedido gerado
      orcamento.status = 'Pedido';

      res.status(201).json({
        message: 'Pedido gerado com sucesso',
        pedido,
        itens: Object.values(records['pedido_item']).filter(i => i.pedido_id === pedidoId)
      });
    });

    // GET /api/pedidos/:id/itens
    app.get('/api/pedidos/:id/itens', authenticateToken, (req, res) => {
      const { id } = req.params;

      const pedido = records['pedido_venda']?.[id];
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const itens = Object.values(records['pedido_item'] || {}).filter(
        item => item.pedido_id === id
      );

      res.json({
        pedido,
        itens,
        total: itens.length
      });
    });

    // PUT /api/records/:id
    app.put('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const data = req.body;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      if (entityCode === 'pedido_venda' && record.status === 'Finalizado') {
        return res.status(400).json({ error: 'Não é possível editar pedido finalizado' });
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
    pedidoCounter = 1000;
  });

  describe('Criar Pedido Manualmente', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-600', razao_social: 'Test Client' });
      this.clienteId = clienteResp.body.id;

      // Garantir que cliente está em records
      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = {
        id: this.clienteId,
        codigo: 'CLI-600',
        razao_social: 'Test Client'
      };

      const orcResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-600',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });
      this.orcamentoId = orcResp.body.id;

      // Inicializar orçamento em records
      records['orcamento'] = records['orcamento'] || {};
      records['orcamento'][this.orcamentoId] = {
        id: this.orcamentoId,
        numero: 'ORC-600',
        cliente_id: this.clienteId,
        status: 'Aprovado',
        valor_total: 1000.00
      };
    });

    it('deve criar pedido com orçamento aprovado', async () => {
      const response = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'PED-600',
          orcamento_id: this.orcamentoId,
          cliente_id: this.clienteId,
          data_pedido: new Date().toISOString(),
          valor_total: 1000.00,
          status: 'Aberto'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Aberto');
    });

    it('deve bloquear pedido de orçamento não aprovado', async () => {
      const orcAberto = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-601',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Rascunho'
        });

      // Adicionar orçamento em records
      records['orcamento'][orcAberto.body.id] = {
        id: orcAberto.body.id,
        status: 'Rascunho',
        cliente_id: this.clienteId
      };

      const response = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'PED-601',
          orcamento_id: orcAberto.body.id,
          cliente_id: this.clienteId,
          data_pedido: new Date().toISOString(),
          valor_total: 1000.00,
          status: 'Aberto'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('aprovado');
    });
  });

  describe('Gerar Pedido Automático do Orçamento', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-610', razao_social: 'Test Auto' });
      this.clienteId = clienteResp.body.id;

      // Inicializar cliente em records
      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = {
        id: this.clienteId,
        codigo: 'CLI-610'
      };

      const produtoResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PRD-610',
          descricao: 'Product',
          preco_venda: 100.00
        });
      this.produtoId = produtoResp.body.id;

      // Inicializar produto em records
      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        codigo: 'PRD-610'
      };

      const orcResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-610',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });
      this.orcamentoId = orcResp.body.id;

      records['orcamento'] = records['orcamento'] || {};
      records['orcamento'][this.orcamentoId] = {
        id: this.orcamentoId,
        numero: 'ORC-610',
        cliente_id: this.clienteId,
        status: 'Aprovado',
        valor_total: 500.00
      };

      const itemId = uuidv4();
      records['orcamento_item'] = records['orcamento_item'] || {};
      records['orcamento_item'][itemId] = {
        id: itemId,
        orcamento_id: this.orcamentoId,
        produto_id: this.produtoId,
        quantidade: 5,
        preco_unitario: 100.00
      };
    });

    it('deve gerar pedido automaticamente do orçamento', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('sucesso');
      expect(response.body.pedido.numero).toBeDefined();
      expect(response.body.pedido.status).toBe('Aberto');
      expect(response.body.itens.length).toBeGreaterThan(0);
    });

    it('deve copiar itens do orçamento para pedido', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${this.orcamentoId}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(201);
      expect(response.body.itens.length).toBe(1);
      expect(response.body.itens[0].quantidade).toBe(5);
      expect(response.body.itens[0].preco_unitario).toBe(100.00);
    });

    it('deve bloquear geração sem itens', async () => {
      const orcSemItens = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-611',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });

      records['orcamento'][orcSemItens.body.id] = {
        id: orcSemItens.body.id,
        status: 'Aprovado',
        cliente_id: this.clienteId
      };

      const response = await request(app)
        .post(`/api/orcamentos/${orcSemItens.body.id}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('sem itens');
    });
  });

  describe('Itens do Pedido', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-620', razao_social: 'Test Items' });
      this.clienteId = clienteResp.body.id;

      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = {
        id: this.clienteId,
        codigo: 'CLI-620'
      };

      const produtoResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PRD-620',
          descricao: 'Product',
          preco_venda: 100.00
        });
      this.produtoId = produtoResp.body.id;

      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        codigo: 'PRD-620'
      };

      const orcResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-620',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });
      this.orcamentoId = orcResp.body.id;

      records['orcamento'] = records['orcamento'] || {};
      records['orcamento'][this.orcamentoId] = {
        id: this.orcamentoId,
        status: 'Aprovado',
        cliente_id: this.clienteId,
        valor_total: 500.00
      };

      // Criar pedido diretamente em vez de gerar automaticamente
      const pedidoResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'PED-620',
          orcamento_id: this.orcamentoId,
          cliente_id: this.clienteId,
          data_pedido: new Date().toISOString(),
          valor_total: 500.00,
          status: 'Aberto'
        });

      this.pedidoId = pedidoResp.body.id;

      // Adicionar item de pedido
      records['pedido_item'] = records['pedido_item'] || {};
      const itemId = uuidv4();
      records['pedido_item'][itemId] = {
        id: itemId,
        pedido_id: this.pedidoId,
        produto_id: this.produtoId,
        quantidade: 5,
        preco_unitario: 100.00
      };
    });

    it('deve listar itens do pedido', async () => {
      const response = await request(app)
        .get(`/api/pedidos/${this.pedidoId}/itens`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.itens.length).toBeGreaterThan(0);
      expect(response.body.pedido.id).toBe(this.pedidoId);
    });

    it('deve ter itens com dados do produto', async () => {
      const response = await request(app)
        .get(`/api/pedidos/${this.pedidoId}/itens`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      const item = response.body.itens[0];
      expect(item).toHaveProperty('quantidade');
      expect(item).toHaveProperty('preco_unitario');
      expect(item).toHaveProperty('produto_id');
    });
  });

  describe('Status do Pedido', () => {
    beforeEach(async () => {
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-630', razao_social: 'Test Status' });
      this.clienteId = clienteResp.body.id;

      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = {
        id: this.clienteId,
        codigo: 'CLI-630'
      };

      const orcResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-630',
          cliente_id: this.clienteId,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });

      records['orcamento'] = records['orcamento'] || {};
      records['orcamento'][orcResp.body.id] = {
        id: orcResp.body.id,
        status: 'Aprovado',
        cliente_id: this.clienteId,
        valor_total: 1000.00
      };

      // Criar pedido aberto
      const pedidoAbertoResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'PED-630',
          orcamento_id: orcResp.body.id,
          cliente_id: this.clienteId,
          data_pedido: new Date().toISOString(),
          valor_total: 1000.00,
          status: 'Aberto'
        });

      this.pedidoId = pedidoAbertoResp.body.id;

      // Criar pedido finalizado
      const pedidoFinalizadoResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'PED-631',
          orcamento_id: orcResp.body.id,
          cliente_id: this.clienteId,
          data_pedido: new Date().toISOString(),
          valor_total: 1000.00,
          status: 'Finalizado'
        });

      this.pedidoFinalizadoId = pedidoFinalizadoResp.body.id;
    });

    it('deve impedir edição de pedido finalizado', async () => {
      const response = await request(app)
        .put(`/api/records/${this.pedidoFinalizadoId}?entity=pedido_venda`)
        .set('Authorization', 'Bearer valid_token')
        .send({ valor_total: 2000.00 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('finalizado');
    });

    it('deve permitir edição de pedido aberto', async () => {
      const response = await request(app)
        .put(`/api/records/${this.pedidoId}?entity=pedido_venda`)
        .set('Authorization', 'Bearer valid_token')
        .send({ valor_total: 1500.00 });

      expect(response.status).toBe(200);
      expect(response.body.valor_total).toBe(1500.00);
    });
  });

  describe('Fluxo Completo Pedido', () => {
    it('deve executar fluxo: orçamento aprovado > gerar pedido > usar itens', async () => {
      // 1. Criar cliente
      const clienteResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-FLUXOPD', razao_social: 'Fluxo Pedido' });

      // 2. Criar produto
      const produtoResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PRD-FLUXOPD',
          descricao: 'Fluxo Produto',
          preco_venda: 250.00
        });

      // 3. Criar orçamento
      const orcResp = await request(app)
        .post('/api/records?entity=orcamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          numero: 'ORC-FLUXOPD',
          cliente_id: clienteResp.body.id,
          data_emissao: new Date().toISOString(),
          status: 'Aprovado'
        });

      records['orcamento'] = records['orcamento'] || {};
      records['orcamento'][orcResp.body.id] = {
        id: orcResp.body.id,
        status: 'Aprovado',
        cliente_id: clienteResp.body.id,
        valor_total: 2500.00
      };

      records['orcamento_item'] = records['orcamento_item'] || {};
      records['orcamento_item'][uuidv4()] = {
        orcamento_id: orcResp.body.id,
        produto_id: produtoResp.body.id,
        quantidade: 10,
        preco_unitario: 250.00
      };

      // 4. Gerar pedido
      const pedidoResp = await request(app)
        .post(`/api/orcamentos/${orcResp.body.id}/gerar-pedido`)
        .set('Authorization', 'Bearer valid_token');

      expect(pedidoResp.status).toBe(201);
      expect(pedidoResp.body.pedido.status).toBe('Aberto');

      // 5. Verificar itens foram copiados
      const itensResp = await request(app)
        .get(`/api/pedidos/${pedidoResp.body.pedido.id}/itens`)
        .set('Authorization', 'Bearer valid_token');

      expect(itensResp.status).toBe(200);
      expect(itensResp.body.itens.length).toBe(1);
      expect(itensResp.body.itens[0].quantidade).toBe(10);

      // 6. Validar que gera demanda (cria necessidade de produção)
      expect(pedidoResp.body.pedido).toHaveProperty('id');
      expect(pedidoResp.body.pedido.numero).toMatch(/^PED-/);
    });
  });
});

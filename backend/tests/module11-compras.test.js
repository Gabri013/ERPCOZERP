/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 11
 * Compras: Requisições, pedidos, recebimento
 * Bloqueio: Material faltando gera compra automática
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 11 - COMPRAS', () => {
  let app;
  let entities = {};
  let records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());

    const authenticateToken = (req, res, next) => {
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token };
      next();
    };

    entities['requisicao_compra'] = {
      id: uuidv4(),
      code: 'requisicao_compra',
      fields: [
        { code: 'materia_prima_id', label: 'Matéria Prima', required: true },
        { code: 'quantidade', label: 'Quantidade', required: true },
        { code: 'status', label: 'Status', required: false }
      ]
    };

    entities['pedido_compra'] = {
      id: uuidv4(),
      code: 'pedido_compra',
      fields: [
        { code: 'numero', label: 'Número', required: false },
        { code: 'requisicao_id', label: 'Requisição', required: true },
        { code: 'fornecedor_id', label: 'Fornecedor', required: true },
        { code: 'valor_total', label: 'Valor Total', required: true },
        { code: 'status', label: 'Status', required: false }
      ]
    };

    entities['fornecedor'] = {
      id: uuidv4(),
      code: 'fornecedor',
      fields: [
        { code: 'codigo', label: 'Código', required: true },
        { code: 'razao_social', label: 'Razão Social', required: true }
      ]
    };

    app.post('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode } = req.query;
      const data = req.body;

      const entity = entities[entityCode];
      if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });

      for (const field of entity.fields) {
        if (field.required && !data[field.code]) {
          return res.status(400).json({ error: `Campo ${field.label} é obrigatório` });
        }
      }

      if (entityCode === 'pedido_compra') {
        if (!records['requisicao_compra']?.[data.requisicao_id]) {
          return res.status(400).json({ error: 'Requisição não existe' });
        }
        if (!records['fornecedor']?.[data.fornecedor_id]) {
          return res.status(400).json({ error: 'Fornecedor não existe' });
        }
        data.numero = data.numero || `PC-${Date.now()}`;
        data.status = data.status || 'Aberto';
      }

      if (entityCode === 'requisicao_compra') {
        data.status = data.status || 'Aberta';
      }

      const recordId = uuidv4();
      const record = { id: recordId, ...data, createdAt: new Date().toISOString() };

      if (!records[entityCode]) records[entityCode] = {};
      records[entityCode][recordId] = record;
      res.status(201).json(record);
    });

    app.get('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const record = records[entityCode]?.[id];
      if (!record) return res.status(404).json({ error: 'Registro não encontrado' });
      res.json(record);
    });

    app.put('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const record = records[entityCode]?.[id];
      if (!record) return res.status(404).json({ error: 'Registro não encontrado' });

      if (entityCode === 'pedido_compra' && record.status !== 'Aberto') {
        return res.status(400).json({ error: 'Não pode editar pedido não aberto' });
      }

      const updated = { ...record, ...req.body, id: record.id, createdAt: record.createdAt };
      records[entityCode][id] = updated;
      res.json(updated);
    });

    app.post('/api/pedido-compra/gerar', authenticateToken, (req, res) => {
      const { requisicao_id, fornecedor_id, valor_unitario } = req.body;

      const requisicao = Object.values(records['requisicao_compra'] || {}).find(r => r.id === requisicao_id);
      if (!requisicao) return res.status(400).json({ error: 'Requisição não existe' });
      if (!records['fornecedor']?.[fornecedor_id]) return res.status(400).json({ error: 'Fornecedor não existe' });

      const pedidoId = uuidv4();
      const valor_total = requisicao.quantidade * valor_unitario;

      const pedido = {
        id: pedidoId,
        numero: `PC-${Date.now()}`,
        requisicao_id,
        fornecedor_id,
        valor_total,
        status: 'Aberto',
        createdAt: new Date().toISOString()
      };

      records['pedido_compra'] = records['pedido_compra'] || {};
      records['pedido_compra'][pedidoId] = pedido;

      requisicao.status = 'Pedido Gerado';

      res.status(201).json({ message: 'Pedido gerado com sucesso', pedido });
    });

    app.post('/api/pedido-compra/:id/receber', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { quantidade_recebida } = req.body;

      const pedido = records['pedido_compra']?.[id];
      if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
      if (pedido.status === 'Recebido') return res.status(400).json({ error: 'Pedido já foi recebido' });

      pedido.status = 'Recebido';
      pedido.quantidade_recebida = quantidade_recebida || 0;

      res.json({ message: 'Pedido recebido com sucesso', pedido });
    });
  });

  describe('Requisições de Compra', () => {
    it('deve criar requisição de compra', async () => {
      const response = await request(app)
        .post('/api/records?entity=requisicao_compra')
        .set('Authorization', 'Bearer valid_token')
        .send({ materia_prima_id: uuidv4(), quantidade: 100 });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Aberta');
    });
  });

  describe('Pedidos de Compra', () => {
    beforeEach(async () => {
      const mpId = uuidv4();
      const forResp = await request(app)
        .post('/api/records?entity=fornecedor')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'FOR-001', razao_social: 'Fornecedor Teste' });
      this.forId = forResp.body.id;
      records['fornecedor'] = records['fornecedor'] || {};
      records['fornecedor'][this.forId] = forResp.body;

      const reqResp = await request(app)
        .post('/api/records?entity=requisicao_compra')
        .set('Authorization', 'Bearer valid_token')
        .send({ materia_prima_id: mpId, quantidade: 100 });
      this.reqId = reqResp.body.id;
      records['requisicao_compra'] = records['requisicao_compra'] || {};
      records['requisicao_compra'][this.reqId] = reqResp.body;
    });

    it('deve gerar pedido de compra de requisição', async () => {
      const response = await request(app)
        .post(`/api/pedido-compra/gerar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          requisicao_id: this.reqId,
          fornecedor_id: this.forId,
          valor_unitario: 50.00
        });

      expect(response.status).toBe(201);
      expect(response.body.pedido.valor_total).toBe(5000);
      expect(response.body.pedido.status).toBe('Aberto');
    });

    it('deve bloquear edição de pedido não aberto', async () => {
      const genResp = await request(app)
        .post(`/api/pedido-compra/gerar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          requisicao_id: this.reqId,
          fornecedor_id: this.forId,
          valor_unitario: 50
        });

      const pedidoId = genResp.body.pedido.id;

      // Receber pedido
      await request(app)
        .post(`/api/pedido-compra/${pedidoId}/receber`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_recebida: 100 });

      // Tentar editar
      const response = await request(app)
        .put(`/api/records/${pedidoId}?entity=pedido_compra`)
        .set('Authorization', 'Bearer valid_token')
        .send({ valor_total: 6000 });

      expect(response.status).toBe(400);
    });

    it('deve receber pedido', async () => {
      const genResp = await request(app)
        .post(`/api/pedido-compra/gerar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          requisicao_id: this.reqId,
          fornecedor_id: this.forId,
          valor_unitario: 50
        });

      const response = await request(app)
        .post(`/api/pedido-compra/${genResp.body.pedido.id}/receber`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_recebida: 100 });

      expect(response.status).toBe(200);
      expect(response.body.pedido.status).toBe('Recebido');
    });
  });

  describe('Fluxo Completo Compras', () => {
    it('deve executar fluxo: requisição > pedido > recebimento', async () => {
      const forResp = await request(app)
        .post('/api/records?entity=fornecedor')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'FOR-999', razao_social: 'Fornecedor Fluxo' });
      const forId = forResp.body.id;
      records['fornecedor'] = records['fornecedor'] || {};
      records['fornecedor'][forId] = forResp.body;

      const reqResp = await request(app)
        .post('/api/records?entity=requisicao_compra')
        .set('Authorization', 'Bearer valid_token')
        .send({ materia_prima_id: uuidv4(), quantidade: 500 });
      const reqId = reqResp.body.id;
      records['requisicao_compra'] = records['requisicao_compra'] || {};
      records['requisicao_compra'][reqId] = reqResp.body;

      const genResp = await request(app)
        .post(`/api/pedido-compra/gerar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          requisicao_id: reqId,
          fornecedor_id: forId,
          valor_unitario: 100
        });

      expect(genResp.status).toBe(201);

      const recResp = await request(app)
        .post(`/api/pedido-compra/${genResp.body.pedido.id}/receber`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_recebida: 500 });

      expect(recResp.status).toBe(200);
      expect(recResp.body.pedido.status).toBe('Recebido');
    });
  });
});

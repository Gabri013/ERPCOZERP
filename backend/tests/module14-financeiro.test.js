/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 14
 * Financeiro: Contas a pagar (compras) e contas a receber (vendas)
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 14 - FINANCEIRO', () => {
  let app, entities = {}, records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const auth = (req, res, next) => { if (req.headers['authorization']?.split(' ')[1]) next(); else res.status(401).json({ error: 'Token não fornecido' }); };

    // Reinicializar records para cada teste
    records = { conta_pagar: {}, conta_receber: {} };

    entities['conta_pagar'] = { id: uuidv4(), code: 'conta_pagar', fields: [
      { code: 'pedido_compra_id', required: true },
      { code: 'valor', required: true },
      { code: 'status', required: false },
      { code: 'data_vencimento', required: true }
    ]};
    entities['conta_receber'] = { id: uuidv4(), code: 'conta_receber', fields: [
      { code: 'pedido_venda_id', required: true },
      { code: 'valor', required: true },
      { code: 'status', required: false },
      { code: 'data_vencimento', required: true }
    ]};

    app.post('/api/records', auth, (req, res) => {
      const { entity: entityCode } = req.query;
      if (!entities[entityCode]) return res.status(404).json({ error: 'Entidade não encontrada' });

      const recordId = uuidv4();
      if (!records[entityCode]) records[entityCode] = {};
      records[entityCode][recordId] = { id: recordId, ...req.body, status: req.body.status || 'Aberta' };
      res.status(201).json({ id: recordId, ...records[entityCode][recordId] });
    });

    app.put('/api/records/:id', auth, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const record = records[entityCode]?.[id];
      if (!record) return res.status(404).json({ error: 'Registro não encontrado' });
      const updated = { ...record, ...req.body };
      records[entityCode][id] = updated;
      res.json(updated);
    });

    app.post('/api/records/:id/pagar', auth, (req, res) => {
      const { id } = req.params;
      const conta = records['conta_pagar']?.[id];
      if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
      conta.status = 'Paga';
      conta.data_pagamento = new Date().toISOString();
      res.json(conta);
    });

    app.post('/api/records/:id/receber', auth, (req, res) => {
      const { id } = req.params;
      const conta = records['conta_receber']?.[id];
      if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
      conta.status = 'Recebida';
      conta.data_recebimento = new Date().toISOString();
      res.json(conta);
    });

    app.get('/api/financeiro/resumo', auth, (req, res) => {
      const contas_pagar = Object.values(records['conta_pagar'] || {});
      const contas_receber = Object.values(records['conta_receber'] || {});

      const total_pagar = contas_pagar.reduce((sum, c) => sum + (c.valor || 0), 0);
      const total_receber = contas_receber.reduce((sum, c) => sum + (c.valor || 0), 0);

      res.json({
        contas_pagar: contas_pagar.length,
        contas_receber: contas_receber.length,
        total_pagar,
        total_receber,
        saldo: total_receber - total_pagar
      });
    });
  });

  describe('Contas a Pagar', () => {
    it('deve criar conta a pagar', async () => {
      const response = await request(app)
        .post('/api/records?entity=conta_pagar')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_compra_id: uuidv4(),
          valor: 1000,
          data_vencimento: '2024-02-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Aberta');
    });

    it('deve pagar conta', async () => {
      const cpResp = await request(app)
        .post('/api/records?entity=conta_pagar')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_compra_id: uuidv4(),
          valor: 1000,
          data_vencimento: '2024-02-01'
        });

      const response = await request(app)
        .post(`/api/records/${cpResp.body.id}/pagar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Paga');
    });
  });

  describe('Contas a Receber', () => {
    it('deve criar conta a receber', async () => {
      const response = await request(app)
        .post('/api/records?entity=conta_receber')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_venda_id: uuidv4(),
          valor: 5000,
          data_vencimento: '2024-02-15'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Aberta');
    });

    it('deve receber conta', async () => {
      const crResp = await request(app)
        .post('/api/records?entity=conta_receber')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_venda_id: uuidv4(),
          valor: 5000,
          data_vencimento: '2024-02-15'
        });

      const response = await request(app)
        .post(`/api/records/${crResp.body.id}/receber`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Recebida');
    });
  });

  describe('Resumo Financeiro', () => {
    it('deve calcular resumo financeiro', async () => {
      await request(app)
        .post('/api/records?entity=conta_pagar')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_compra_id: uuidv4(), valor: 1000, data_vencimento: '2024-02-01' });

      await request(app)
        .post('/api/records?entity=conta_receber')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_venda_id: uuidv4(), valor: 5000, data_vencimento: '2024-02-15' });

      const response = await request(app)
        .get('/api/financeiro/resumo')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total_pagar).toBe(1000);
      expect(response.body.total_receber).toBe(5000);
      expect(response.body.saldo).toBe(4000);
    });
  });

  describe('Fluxo Completo Financeiro', () => {
    it('deve executar fluxo: criar contas > pagar > receber > resumo', async () => {
      const cpResp = await request(app)
        .post('/api/records?entity=conta_pagar')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_compra_id: uuidv4(), valor: 2000, data_vencimento: '2024-02-01' });

      const crResp = await request(app)
        .post('/api/records?entity=conta_receber')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_venda_id: uuidv4(), valor: 8000, data_vencimento: '2024-02-15' });

      await request(app).post(`/api/records/${cpResp.body.id}/pagar`).set('Authorization', 'Bearer valid_token');
      await request(app).post(`/api/records/${crResp.body.id}/receber`).set('Authorization', 'Bearer valid_token');

      const resumoResp = await request(app).get('/api/financeiro/resumo').set('Authorization', 'Bearer valid_token');

      expect(resumoResp.status).toBe(200);
      expect(resumoResp.body.saldo).toBe(6000);
    });
  });
});

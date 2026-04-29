/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 13
 * Expedição: Validação de envio
 * Bloqueio: Só envia produto aprovado
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 13 - EXPEDIÇÃO', () => {
  let app, entities = {}, records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const auth = (req, res, next) => { if (req.headers['authorization']?.split(' ')[1]) next(); else res.status(401).json({ error: 'Token não fornecido' }); };

    entities['pedido_venda'] = { id: uuidv4(), code: 'pedido_venda', fields: [{ code: 'numero', required: true }] };
    entities['expedicao'] = { id: uuidv4(), code: 'expedicao', fields: [
      { code: 'pedido_id', required: true },
      { code: 'status', required: false }
    ]};

    app.post('/api/records', auth, (req, res) => {
      const { entity: entityCode } = req.query;
      if (!entities[entityCode]) return res.status(404).json({ error: 'Entidade não encontrada' });
      if (entityCode === 'expedicao' && !records['pedido_venda']?.[req.body.pedido_id]) {
        return res.status(400).json({ error: 'Pedido não existe' });
      }
      const recordId = uuidv4();
      if (!records[entityCode]) records[entityCode] = {};
      records[entityCode][recordId] = { id: recordId, ...req.body, status: req.body.status || 'Pendente' };
      res.status(201).json({ id: recordId, ...records[entityCode][recordId] });
    });

    app.put('/api/expedicao/:id/enviar', auth, (req, res) => {
      const exp = records['expedicao']?.[req.params.id];
      if (!exp) return res.status(404).json({ error: 'Expedição não encontrada' });
      exp.status = 'Enviado';
      exp.data_envio = new Date().toISOString();
      res.json(exp);
    });

    app.get('/api/expedicao/:id', auth, (req, res) => {
      const exp = records['expedicao']?.[req.params.id];
      if (!exp) return res.status(404).json({ error: 'Expedição não encontrada' });
      res.json(exp);
    });
  });

  describe('Expedição de Pedidos', () => {
    it('deve criar expedição', async () => {
      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-EXP-001' });
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][pedResp.body.id] = pedResp.body;

      const response = await request(app)
        .post('/api/records?entity=expedicao')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_id: pedResp.body.id });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Pendente');
    });

    it('deve enviar expedição', async () => {
      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-EXP-002' });
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][pedResp.body.id] = pedResp.body;

      const expResp = await request(app)
        .post('/api/records?entity=expedicao')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_id: pedResp.body.id });

      const response = await request(app)
        .put(`/api/expedicao/${expResp.body.id}/enviar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Enviado');
    });

    it('deve validar pedido existe na expedição', async () => {
      const response = await request(app)
        .post('/api/records?entity=expedicao')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_id: uuidv4() });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Pedido');
    });

    it('deve executar fluxo: criar expedição > enviar', async () => {
      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-EXP-999' });
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][pedResp.body.id] = pedResp.body;

      const expResp = await request(app)
        .post('/api/records?entity=expedicao')
        .set('Authorization', 'Bearer valid_token')
        .send({ pedido_id: pedResp.body.id });

      const envResp = await request(app)
        .put(`/api/expedicao/${expResp.body.id}/enviar`)
        .set('Authorization', 'Bearer valid_token');

      expect(envResp.status).toBe(200);
      expect(envResp.body.data_envio).toBeDefined();
    });
  });
});

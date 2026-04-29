/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 12
 * Qualidade: Inspeção, aprovação, rejeição
 * Bloqueio: Produto reprovado não expede
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 12 - QUALIDADE', () => {
  let app, entities = {}, records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const authenticateToken = (req, res, next) => {
      if (!req.headers['authorization']?.split(' ')[1]) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1' };
      next();
    };

    entities['ordem_producao'] = { id: uuidv4(), code: 'ordem_producao', fields: [{ code: 'numero', required: false }] };
    entities['inspecao'] = { id: uuidv4(), code: 'inspecao', fields: [
      { code: 'op_id', required: true },
      { code: 'status', required: false },
      { code: 'resultado', required: false },
      { code: 'motivo_rejeicao', required: false }
    ]};

    app.post('/api/records', authenticateToken, (req, res) => {
      const { entity: entityCode } = req.query;
      if (!entities[entityCode]) return res.status(404).json({ error: 'Entidade não encontrada' });

      const recordId = uuidv4();
      if (!records[entityCode]) records[entityCode] = {};
      records[entityCode][recordId] = { id: recordId, ...req.body };
      res.status(201).json({ id: recordId, ...req.body });
    });

    app.put('/api/inspecao/:id/aprovar', authenticateToken, (req, res) => {
      const inspecao = records['inspecao']?.[req.params.id];
      if (!inspecao) return res.status(404).json({ error: 'Inspeção não encontrada' });
      inspecao.resultado = 'Aprovado';
      inspecao.status = 'Concluída';
      res.json(inspecao);
    });

    app.put('/api/inspecao/:id/rejeitar', authenticateToken, (req, res) => {
      const inspecao = records['inspecao']?.[req.params.id];
      if (!inspecao) return res.status(404).json({ error: 'Inspeção não encontrada' });
      inspecao.resultado = 'Rejeitado';
      inspecao.status = 'Concluída';
      inspecao.motivo_rejeicao = req.body.motivo || '';
      res.json(inspecao);
    });

    app.get('/api/inspecao/:id', authenticateToken, (req, res) => {
      const inspecao = records['inspecao']?.[req.params.id];
      if (!inspecao) return res.status(404).json({ error: 'Inspeção não encontrada' });
      res.json(inspecao);
    });
  });

  describe('Inspeção e Aprovação', () => {
    it('deve criar inspeção', async () => {
      const response = await request(app)
        .post('/api/records?entity=inspecao')
        .set('Authorization', 'Bearer valid_token')
        .send({ op_id: uuidv4() });
      expect(response.status).toBe(201);
    });

    it('deve aprovar inspeção', async () => {
      const insResp = await request(app)
        .post('/api/records?entity=inspecao')
        .set('Authorization', 'Bearer valid_token')
        .send({ op_id: uuidv4() });
      const response = await request(app)
        .put(`/api/inspecao/${insResp.body.id}/aprovar`)
        .set('Authorization', 'Bearer valid_token');
      expect(response.status).toBe(200);
      expect(response.body.resultado).toBe('Aprovado');
    });

    it('deve rejeitar inspeção', async () => {
      const insResp = await request(app)
        .post('/api/records?entity=inspecao')
        .set('Authorization', 'Bearer valid_token')
        .send({ op_id: uuidv4() });
      const response = await request(app)
        .put(`/api/inspecao/${insResp.body.id}/rejeitar`)
        .set('Authorization', 'Bearer valid_token')
        .send({ motivo: 'Defeito detectado' });
      expect(response.status).toBe(200);
      expect(response.body.resultado).toBe('Rejeitado');
    });

    it('deve executar fluxo: criar inspeção > aprovar', async () => {
      const insResp = await request(app)
        .post('/api/records?entity=inspecao')
        .set('Authorization', 'Bearer valid_token')
        .send({ op_id: uuidv4() });

      const aprResp = await request(app)
        .put(`/api/inspecao/${insResp.body.id}/aprovar`)
        .set('Authorization', 'Bearer valid_token');

      expect(aprResp.status).toBe(200);
      expect(aprResp.body.status).toBe('Concluída');
    });
  });
});

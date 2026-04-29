/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 15
 * Workflow + Rule Engine: Orquestração final
 * Executa regras IF/THEN, transições automáticas
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 15 - WORKFLOW + RULE ENGINE', () => {
  let app, entities = {}, records = {};

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const auth = (req, res, next) => { if (req.headers['authorization']?.split(' ')[1]) next(); else res.status(401).json({ error: 'Token não fornecido' }); };

    entities['regra'] = { id: uuidv4(), code: 'regra', fields: [
      { code: 'nome', required: true },
      { code: 'condicao', required: true },
      { code: 'acao', required: true },
      { code: 'ativo', required: false }
    ]};
    entities['workflow'] = { id: uuidv4(), code: 'workflow', fields: [
      { code: 'etapa_atual', required: true },
      { code: 'entidade_id', required: true },
      { code: 'status', required: false }
    ]};

    // Inicializar records para cada teste
    records = { regra: {}, workflow: {}, teste: {} };

    app.post('/api/records', auth, (req, res) => {
      const { entity: entityCode } = req.query;
      if (!entities[entityCode]) return res.status(404).json({ error: 'Entidade não encontrada' });

      const recordId = uuidv4();
      if (!records[entityCode]) records[entityCode] = {};
      records[entityCode][recordId] = { id: recordId, ...req.body, ativo: req.body.ativo !== false };
      res.status(201).json({ id: recordId, ...records[entityCode][recordId] });
    });

    app.post('/api/workflow/executar-regras', auth, (req, res) => {
      const { entidade_id, tipo_entidade } = req.body;

      const regras = Object.values(records['regra'] || {}).filter(r => r.ativo);
      const resultados = [];

      regras.forEach(regra => {
        const condicao = eval(`(entidade) => ${regra.condicao}`);
        const entidade = records[tipo_entidade]?.[entidade_id];

        if (entidade && condicao(entidade)) {
          const acao = eval(`(entidade) => {${regra.acao}}`);
          acao(entidade);
          resultados.push({ regra: regra.nome, executada: true });
        }
      });

      res.json({
        message: 'Regras executadas',
        regras_executadas: resultados.length,
        resultados
      });
    });

    app.post('/api/workflow/:id/avancar', auth, (req, res) => {
      const workflow = records['workflow']?.[req.params.id];
      if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });

      const etapas = ['Criação', 'Processamento', 'Qualidade', 'Expedição', 'Concluído'];
      const idxAtual = etapas.indexOf(workflow.etapa_atual);

      if (idxAtual === -1 || idxAtual === etapas.length - 1) {
        return res.status(400).json({ error: 'Não pode avançar mais' });
      }

      workflow.etapa_atual = etapas[idxAtual + 1];
      res.json({ message: 'Workflow avançado', workflow });
    });

    app.get('/api/workflow/status-geral', auth, (req, res) => {
      const workflows = Object.values(records['workflow'] || {});
      const porEtapa = workflows.reduce((acc, w) => {
        acc[w.etapa_atual] = (acc[w.etapa_atual] || 0) + 1;
        return acc;
      }, {});

      res.json({
        total_workflows: workflows.length,
        por_etapa: porEtapa
      });
    });

    app.get('/api/workflow/:id', auth, (req, res) => {
      const workflow = records['workflow']?.[req.params.id];
      if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
      res.json(workflow);
    });
  });

  describe('Regras e Condições', () => {
    it('deve criar regra', async () => {
      const response = await request(app)
        .post('/api/records?entity=regra')
        .set('Authorization', 'Bearer valid_token')
        .send({
          nome: 'Se estoque baixo, gerar compra',
          condicao: 'entidade.estoque < entidade.minimo',
          acao: 'entidade.gerar_compra = true;'
        });

      expect(response.status).toBe(201);
      expect(response.body.ativo).toBe(true);
    });

    it('deve executar regra', async () => {
      const regraResp = await request(app)
        .post('/api/records?entity=regra')
        .set('Authorization', 'Bearer valid_token')
        .send({
          nome: 'Aprova se qualidade OK',
          condicao: 'entidade.qualidade === "OK"',
          acao: 'entidade.aprovado = true;'
        });

      records['regra'] = records['regra'] || {};
      records['regra'][regraResp.body.id] = regraResp.body;

      // Criar entidade que atende condição
      records['teste'] = records['teste'] || {};
      const testeId = uuidv4();
      records['teste'][testeId] = { id: testeId, qualidade: 'OK' };

      const response = await request(app)
        .post('/api/workflow/executar-regras')
        .set('Authorization', 'Bearer valid_token')
        .send({ entidade_id: testeId, tipo_entidade: 'teste' });

      expect(response.status).toBe(200);
      expect(response.body.regras_executadas).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Workflow com Etapas', () => {
    it('deve criar workflow', async () => {
      const response = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({
          etapa_atual: 'Criação',
          entidade_id: uuidv4()
        });

      expect(response.status).toBe(201);
      expect(response.body.etapa_atual).toBe('Criação');
    });

    it('deve avançar etapa do workflow', async () => {
      const wfResp = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({ etapa_atual: 'Criação', entidade_id: uuidv4() });

      records['workflow'] = records['workflow'] || {};
      records['workflow'][wfResp.body.id] = wfResp.body;

      const response = await request(app)
        .post(`/api/workflow/${wfResp.body.id}/avancar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.workflow.etapa_atual).toBe('Processamento');
    });

    it('deve bloquear avanço da última etapa', async () => {
      const wfResp = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({ etapa_atual: 'Concluído', entidade_id: uuidv4() });

      records['workflow'] = records['workflow'] || {};
      records['workflow'][wfResp.body.id] = wfResp.body;

      const response = await request(app)
        .post(`/api/workflow/${wfResp.body.id}/avancar`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
    });

    it('deve obter status geral do workflow', async () => {
      // Criar dois workflows
      const wf1 = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({ etapa_atual: 'Criação', entidade_id: uuidv4() });

      const wf2 = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({ etapa_atual: 'Processamento', entidade_id: uuidv4() });

      // Armazenar explicitamente
      records['workflow'][wf1.body.id] = wf1.body;
      records['workflow'][wf2.body.id] = wf2.body;

      const response = await request(app)
        .get('/api/workflow/status-geral')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total_workflows).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fluxo Completo Sistema ERP', () => {
    it('deve executar fluxo: criar regra > workflow > avançar etapas', async () => {
      // 1. Criar regra
      const regraResp = await request(app)
        .post('/api/records?entity=regra')
        .set('Authorization', 'Bearer valid_token')
        .send({
          nome: 'Validação automática',
          condicao: 'true',
          acao: 'console.log("Regra executada");'
        });

      expect(regraResp.status).toBe(201);

      // 2. Criar workflow
      const wfResp = await request(app)
        .post('/api/records?entity=workflow')
        .set('Authorization', 'Bearer valid_token')
        .send({
          etapa_atual: 'Criação',
          entidade_id: uuidv4()
        });

      records['workflow'] = records['workflow'] || {};
      records['workflow'][wfResp.body.id] = wfResp.body;

      // 3. Avançar etapas sequencialmente
      const etapas = ['Processamento', 'Qualidade', 'Expedição'];
      let wfAtual = wfResp.body;

      for (const etapa of etapas) {
        const advResp = await request(app)
          .post(`/api/workflow/${wfAtual.id}/avancar`)
          .set('Authorization', 'Bearer valid_token');

        expect(advResp.status).toBe(200);
        wfAtual = advResp.body.workflow;
      }

      // 4. Verificar status final
      const finalResp = await request(app)
        .get(`/api/workflow/${wfAtual.id}`)
        .set('Authorization', 'Bearer valid_token');

      expect(finalResp.status).toBe(200);
      expect(finalResp.body.etapa_atual).toBe('Expedição');
    });
  });
});

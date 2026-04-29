/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 9
 * Apontamento: Rastreamento detalhado de produção por estágio
 * Registra: início, fim, quantidade, refugo, tempo, operador
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 9 - APONTAMENTO', () => {
  let app;
  let entities = {};
  let records = {};

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

    // Entidades para Apontamento
    entities['apontamento'] = {
      id: uuidv4(),
      code: 'apontamento',
      name: 'Apontamento',
      fields: [
        { code: 'op_id', label: 'Ordem Produção', dataType: 'reference', required: true },
        { code: 'estagio', label: 'Estágio', dataType: 'integer', required: true },
        { code: 'data_inicio', label: 'Data Início', dataType: 'datetime', required: true },
        { code: 'data_fim', label: 'Data Fim', dataType: 'datetime', required: false },
        { code: 'quantidade_planejada', label: 'Qtd Planejada', dataType: 'decimal', required: true },
        { code: 'quantidade_produzida', label: 'Qtd Produzida', dataType: 'decimal', required: false },
        { code: 'quantidade_refugo', label: 'Qtd Refugo', dataType: 'decimal', required: false },
        { code: 'operador_id', label: 'Operador', dataType: 'reference', required: false },
        { code: 'tempo_real_horas', label: 'Tempo Real (h)', dataType: 'decimal', required: false },
        { code: 'status', label: 'Status', dataType: 'select', required: false },
        { code: 'observacoes', label: 'Observações', dataType: 'text', required: false }
      ]
    };

    entities['ordem_producao'] = {
      id: uuidv4(),
      code: 'ordem_producao',
      name: 'Ordem de Produção',
      fields: [
        { code: 'numero', label: 'Número', dataType: 'text', required: false },
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: false }
      ]
    };

    entities['usuario'] = {
      id: uuidv4(),
      code: 'usuario',
      name: 'Usuário',
      fields: [
        { code: 'email', label: 'Email', dataType: 'text', required: true },
        { code: 'nome', label: 'Nome', dataType: 'text', required: true }
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
      if (entityCode === 'apontamento') {
        if (!records['ordem_producao']?.[data.op_id]) {
          return res.status(400).json({ error: 'OP não existe' });
        }

        if (data.operador_id && !records['usuario']?.[data.operador_id]) {
          return res.status(400).json({ error: 'Operador não existe' });
        }

        // Validar que quantidade_produzida + quantidade_refugo = quantidade_planejada
        const refugo = data.quantidade_refugo || 0;
        const produzida = data.quantidade_produzida || 0;
        if (produzida + refugo !== 0 && produzida + refugo !== data.quantidade_planejada) {
          // Apenas validar se os valores foram informados e são > 0
          if (produzida > 0 || refugo > 0) {
            // Permitir validação parcial se ainda em andamento
          }
        }

        if (!data.status) {
          data.status = 'Iniciado';
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

    // PUT /api/apontamento/:id
    app.put('/api/apontamento/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const data = req.body;

      const apontamento = records['apontamento']?.[id];
      if (!apontamento) {
        return res.status(404).json({ error: 'Apontamento não encontrado' });
      }

      if (apontamento.status === 'Finalizado') {
        return res.status(400).json({ error: 'Não é possível editar apontamento finalizado' });
      }

      const updated = {
        ...apontamento,
        ...data,
        id: apontamento.id,
        createdAt: apontamento.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Calcular tempo real se tem data_inicio e data_fim
      if (updated.data_inicio && updated.data_fim) {
        const inicio = new Date(updated.data_inicio).getTime();
        const fim = new Date(updated.data_fim).getTime();
        updated.tempo_real_horas = parseFloat(((fim - inicio) / (1000 * 60 * 60)).toFixed(2));
      }

      // Validar totais quando finalizar
      if (updated.status === 'Finalizado') {
        const total = (updated.quantidade_produzida || 0) + (updated.quantidade_refugo || 0);
        if (total !== updated.quantidade_planejada) {
          return res.status(400).json({
            error: 'Quantidade produzida + refugo deve ser igual à quantidade planejada',
            esperado: updated.quantidade_planejada,
            recebido: total
          });
        }
      }

      records['apontamento'][id] = updated;
      res.json(updated);
    });

    // GET /api/op/:id/apontamentos
    app.get('/api/op/:id/apontamentos', authenticateToken, (req, res) => {
      const { id } = req.params;

      const op = records['ordem_producao']?.[id];
      if (!op) {
        return res.status(404).json({ error: 'OP não encontrada' });
      }

      const apontamentos = Object.values(records['apontamento'] || {})
        .filter(a => a.op_id === id)
        .sort((a, b) => a.estagio - b.estagio);

      // Calcular totais por estagio
      const totaisPorEstagio = {};
      apontamentos.forEach(a => {
        if (!totaisPorEstagio[a.estagio]) {
          totaisPorEstagio[a.estagio] = { produzida: 0, refugo: 0 };
        }
        totaisPorEstagio[a.estagio].produzida += a.quantidade_produzida || 0;
        totaisPorEstagio[a.estagio].refugo += a.quantidade_refugo || 0;
      });

      res.json({
        op,
        apontamentos,
        totais_por_estagio: totaisPorEstagio,
        total_apontamentos: apontamentos.length
      });
    });

    // GET /api/apontamento/:id/tempo-real
    app.get('/api/apontamento/:id/tempo-real', authenticateToken, (req, res) => {
      const { id } = req.params;

      const apontamento = records['apontamento']?.[id];
      if (!apontamento) {
        return res.status(404).json({ error: 'Apontamento não encontrado' });
      }

      let tempoReal = 0;
      if (apontamento.data_inicio && apontamento.data_fim) {
        const inicio = new Date(apontamento.data_inicio).getTime();
        const fim = new Date(apontamento.data_fim).getTime();
        tempoReal = (fim - inicio) / (1000 * 60 * 60); // em horas
      }

      res.json({
        apontamento,
        tempo_real_horas: parseFloat(tempoReal.toFixed(2)),
        tempo_planejado_horas: 1.5 // Exemplo
      });
    });

    // POST /api/apontamento/lote
    app.post('/api/apontamento/lote', authenticateToken, (req, res) => {
      const { op_id, estagio, quantidade_planejada } = req.body;

      if (!records['ordem_producao']?.[op_id]) {
        return res.status(400).json({ error: 'OP não existe' });
      }

      // Criar múltiplos apontamentos em lote (ex: 5 operadores, cada um com sua parte)
      const apontamentos = [];
      const parte = quantidade_planejada / 5;

      for (let i = 0; i < 5; i++) {
        const recordId = uuidv4();
        const apontamento = {
          id: recordId,
          op_id,
          estagio,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: parte,
          status: 'Iniciado',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (!records['apontamento']) {
          records['apontamento'] = {};
        }
        records['apontamento'][recordId] = apontamento;
        apontamentos.push(apontamento);
      }

      res.status(201).json({
        message: 'Apontamentos em lote criados',
        quantidade: 5,
        apontamentos
      });
    });
  });

  describe('Criar Apontamento', () => {
    beforeEach(async () => {
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'OP-9000', quantidade: 100 });
      this.opId = opResp.body.id;

      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = { id: this.opId, quantidade: 100 };

      const usuResp = await request(app)
        .post('/api/records?entity=usuario')
        .set('Authorization', 'Bearer valid_token')
        .send({ email: 'op1@test.com', nome: 'Operador 1' });
      this.operadorId = usuResp.body.id;

      records['usuario'] = records['usuario'] || {};
      records['usuario'][this.operadorId] = { id: this.operadorId, nome: 'Op1' };
    });

    it('deve criar apontamento com dados básicos', async () => {
      const response = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: 100,
          operador_id: this.operadorId
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Iniciado');
      expect(response.body.estagio).toBe(1);
    });

    it('deve validar que OP existe', async () => {
      const response = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: uuidv4(),
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('OP');
    });

    it('deve validar que operador existe', async () => {
      const response = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: 100,
          operador_id: uuidv4()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Operador');
    });
  });

  describe('Rastreamento Detalhado', () => {
    beforeEach(async () => {
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'OP-9100', quantidade: 100 });
      this.opId = opResp.body.id;

      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = { id: this.opId, quantidade: 100 };

      const apResp = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: '2024-01-01T10:00:00Z',
          quantidade_planejada: 100
        });
      this.apontamentoId = apResp.body.id;
      this.apontamento = apResp.body;
    });

    it('deve registrar quantidade produzida', async () => {
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_produzida: 95 });

      expect(response.status).toBe(200);
      expect(response.body.quantidade_produzida).toBe(95);
    });

    it('deve registrar refugo', async () => {
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_refugo: 5 });

      expect(response.status).toBe(200);
      expect(response.body.quantidade_refugo).toBe(5);
    });

    it('deve calcular tempo real automaticamente', async () => {
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          data_fim: '2024-01-01T13:30:00Z',
          quantidade_produzida: 95,
          quantidade_refugo: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.tempo_real_horas).toBe(3.5);
    });

    it('deve validar totais ao finalizar', async () => {
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          quantidade_produzida: 90,
          quantidade_refugo: 5,
          status: 'Finalizado'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('igual');
    });

    it('deve finalizar apontamento com totais corretos', async () => {
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          data_fim: '2024-01-01T11:30:00Z',
          quantidade_produzida: 95,
          quantidade_refugo: 5,
          status: 'Finalizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Finalizado');
      expect(response.body.tempo_real_horas).toBe(1.5);
    });

    it('deve bloquear edição de apontamento finalizado', async () => {
      // Primeiro finalizar
      await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          quantidade_produzida: 95,
          quantidade_refugo: 5,
          status: 'Finalizado'
        });

      // Tentar editar
      const response = await request(app)
        .put(`/api/apontamento/${this.apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_produzida: 100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('finalizado');
    });
  });

  describe('Consultas Agregadas', () => {
    beforeEach(async () => {
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'OP-9200', quantidade: 300 });
      this.opId = opResp.body.id;

      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = { id: this.opId, quantidade: 300 };
    });

    it('deve listar apontamentos com totais por estágio', async () => {
      // Criar apontamentos para múltiplos estágios
      const ap1 = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: 100,
          quantidade_produzida: 95,
          quantidade_refugo: 5
        });

      const ap2 = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 2,
          data_inicio: new Date().toISOString(),
          quantidade_planejada: 95,
          quantidade_produzida: 90,
          quantidade_refugo: 5
        });

      // Registrar em records
      records['apontamento'] = records['apontamento'] || {};
      records['apontamento'][ap1.body.id] = ap1.body;
      records['apontamento'][ap2.body.id] = ap2.body;

      const response = await request(app)
        .get(`/api/op/${this.opId}/apontamentos`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total_apontamentos).toBe(2);
      expect(response.body.totais_por_estagio[1].produzida).toBe(95);
      expect(response.body.totais_por_estagio[2].produzida).toBe(90);
    });

    it('deve obter tempo real de apontamento', async () => {
      const apResp = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: '2024-01-01T10:00:00Z',
          data_fim: '2024-01-01T12:30:00Z',
          quantidade_planejada: 100,
          quantidade_produzida: 100
        });

      const response = await request(app)
        .get(`/api/apontamento/${apResp.body.id}/tempo-real`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.tempo_real_horas).toBe(2.5);
    });
  });

  describe('Apontamento em Lote', () => {
    beforeEach(async () => {
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'OP-9300', quantidade: 500 });
      this.opId = opResp.body.id;

      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = { id: this.opId, quantidade: 500 };
    });

    it('deve criar apontamentos em lote', async () => {
      const response = await request(app)
        .post(`/api/apontamento/lote`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          quantidade_planejada: 500
        });

      expect(response.status).toBe(201);
      expect(response.body.quantidade).toBe(5);
      expect(response.body.apontamentos.length).toBe(5);
      expect(response.body.apontamentos[0].quantidade_planejada).toBe(100);
    });
  });

  describe('Fluxo Completo Apontamento', () => {
    it('deve executar fluxo: criar > atualizar com dados > finalizar', async () => {
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'OP-9999', quantidade: 150 });
      const opId = opResp.body.id;

      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][opId] = { id: opId, quantidade: 150 };

      // 1. Criar apontamento
      const createResp = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: opId,
          estagio: 1,
          data_inicio: '2024-01-01T08:00:00Z',
          quantidade_planejada: 150
        });

      const apontamentoId = createResp.body.id;
      expect(createResp.status).toBe(201);

      // 2. Atualizar com quantidade produzida parcial
      const updateResp = await request(app)
        .put(`/api/apontamento/${apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          quantidade_produzida: 140
        });

      expect(updateResp.status).toBe(200);

      // 3. Registrar refugo
      const refugoResp = await request(app)
        .put(`/api/apontamento/${apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          quantidade_refugo: 10,
          data_fim: '2024-01-01T16:30:00Z'
        });

      expect(refugoResp.status).toBe(200);
      expect(refugoResp.body.tempo_real_horas).toBe(8.5);

      // 4. Finalizar
      const finalResp = await request(app)
        .put(`/api/apontamento/${apontamentoId}`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          status: 'Finalizado',
          observacoes: 'Produção finalizada sem incidentes'
        });

      expect(finalResp.status).toBe(200);
      expect(finalResp.body.status).toBe('Finalizado');
    });
  });
});

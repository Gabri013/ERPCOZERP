/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 10
 * Estoque: Movimentação, saldos, lotes, requisições automáticas
 * Regra: Não pode usar material que não existe no estoque
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 10 - ESTOQUE', () => {
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

    // Entidades para Estoque
    entities['materia_prima'] = {
      id: uuidv4(),
      code: 'materia_prima',
      name: 'Matéria Prima',
      fields: [
        { code: 'codigo', label: 'Código', dataType: 'text', required: true },
        { code: 'descricao', label: 'Descrição', dataType: 'text', required: true },
        { code: 'unidade', label: 'Unidade', dataType: 'text', required: true },
        { code: 'estoque_minimo', label: 'Estoque Mínimo', dataType: 'decimal', required: false }
      ]
    };

    entities['movimento_estoque'] = {
      id: uuidv4(),
      code: 'movimento_estoque',
      name: 'Movimento Estoque',
      fields: [
        { code: 'materia_prima_id', label: 'Matéria Prima', dataType: 'reference', required: true },
        { code: 'tipo', label: 'Tipo', dataType: 'select', required: true }, // Entrada, Saída, Ajuste
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'data_movimento', label: 'Data Movimento', dataType: 'datetime', required: true },
        { code: 'lote', label: 'Lote', dataType: 'text', required: false },
        { code: 'origem', label: 'Origem', dataType: 'text', required: false }, // Compra, OP, etc
        { code: 'referencia_id', label: 'Referência ID', dataType: 'reference', required: false },
        { code: 'observacoes', label: 'Observações', dataType: 'text', required: false }
      ]
    };

    entities['saldo_estoque'] = {
      id: uuidv4(),
      code: 'saldo_estoque',
      name: 'Saldo Estoque',
      fields: [
        { code: 'materia_prima_id', label: 'Matéria Prima', dataType: 'reference', required: true },
        { code: 'saldo_atual', label: 'Saldo Atual', dataType: 'decimal', required: true },
        { code: 'data_atualizacao', label: 'Data Atualização', dataType: 'datetime', required: true },
        { code: 'lote_vigente', label: 'Lote Vigente', dataType: 'text', required: false }
      ]
    };

    entities['requisicao_compra'] = {
      id: uuidv4(),
      code: 'requisicao_compra',
      name: 'Requisição de Compra',
      fields: [
        { code: 'materia_prima_id', label: 'Matéria Prima', dataType: 'reference', required: true },
        { code: 'quantidade_solicitada', label: 'Quantidade Solicitada', dataType: 'decimal', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: false },
        { code: 'motivo', label: 'Motivo', dataType: 'text', required: false },
        { code: 'data_solicitacao', label: 'Data Solicitação', dataType: 'datetime', required: true }
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
      if (entityCode === 'movimento_estoque') {
        if (!records['materia_prima']?.[data.materia_prima_id]) {
          return res.status(400).json({ error: 'Matéria Prima não existe' });
        }

        if (data.quantidade <= 0) {
          return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
        }

        // Validar saída - verificar se há saldo
        if (data.tipo === 'Saída') {
          const saldo = Object.values(records['saldo_estoque'] || {})
            .find(s => s.materia_prima_id === data.materia_prima_id);

          if (!saldo || saldo.saldo_atual < data.quantidade) {
            return res.status(400).json({
              error: 'Quantidade insuficiente em estoque',
              disponivel: saldo?.saldo_atual || 0,
              solicitado: data.quantidade
            });
          }
        }

        // Atualizar saldo
        let saldo = Object.values(records['saldo_estoque'] || {})
          .find(s => s.materia_prima_id === data.materia_prima_id);

        if (!saldo) {
          saldo = {
            id: uuidv4(),
            materia_prima_id: data.materia_prima_id,
            saldo_atual: 0,
            data_atualizacao: new Date().toISOString()
          };
          records['saldo_estoque'] = records['saldo_estoque'] || {};
          records['saldo_estoque'][saldo.id] = saldo;
        }

        // Atualizar saldo
        if (data.tipo === 'Entrada') {
          saldo.saldo_atual += data.quantidade;
        } else if (data.tipo === 'Saída') {
          saldo.saldo_atual -= data.quantidade;
        } else if (data.tipo === 'Ajuste') {
          saldo.saldo_atual = data.quantidade;
        }

        saldo.lote_vigente = data.lote || saldo.lote_vigente;
        saldo.data_atualizacao = new Date().toISOString();

        // Verificar se precisa criar requisição automática
        const mp = records['materia_prima'][data.materia_prima_id];
        if (mp.estoque_minimo && saldo.saldo_atual < mp.estoque_minimo) {
          // Criar requisição automática
          const reqId = uuidv4();
          const quantidade = (mp.estoque_minimo * 2) - saldo.saldo_atual;
          const requisicao = {
            id: reqId,
            materia_prima_id: data.materia_prima_id,
            quantidade_solicitada: quantidade,
            status: 'Aberta',
            motivo: 'Requisição automática - estoque abaixo do mínimo',
            data_solicitacao: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          records['requisicao_compra'] = records['requisicao_compra'] || {};
          records['requisicao_compra'][reqId] = requisicao;
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

    // GET /api/saldo/materia-prima/:id
    app.get('/api/saldo/materia-prima/:id', authenticateToken, (req, res) => {
      const { id } = req.params;

      const saldo = Object.values(records['saldo_estoque'] || {})
        .find(s => s.materia_prima_id === id);

      if (!saldo) {
        return res.status(404).json({ error: 'Sem movimentações para esta matéria prima' });
      }

      const mp = records['materia_prima']?.[id];
      const movimentos = Object.values(records['movimento_estoque'] || {})
        .filter(m => m.materia_prima_id === id)
        .sort((a, b) => new Date(b.data_movimento) - new Date(a.data_movimento));

      res.json({
        materia_prima: mp,
        saldo: saldo.saldo_atual,
        lote_vigente: saldo.lote_vigente,
        estoque_minimo: mp?.estoque_minimo || 0,
        acima_minimo: saldo.saldo_atual >= (mp?.estoque_minimo || 0),
        ultimos_movimentos: movimentos.slice(0, 5)
      });
    });

    // GET /api/estoque/requisicoes-automaticas
    app.get('/api/estoque/requisicoes-automaticas', authenticateToken, (req, res) => {
      const requisicoes = Object.values(records['requisicao_compra'] || {})
        .filter(r => r.motivo && r.motivo.includes('automática'));

      res.json({
        total: requisicoes.length,
        requisicoes
      });
    });

    // POST /api/estoque/ajustar
    app.post('/api/estoque/ajustar', authenticateToken, (req, res) => {
      const { materia_prima_id, novo_saldo } = req.body;

      if (!records['materia_prima']?.[materia_prima_id]) {
        return res.status(400).json({ error: 'Matéria Prima não existe' });
      }

      // Criar movimento de ajuste
      const movimento = {
        id: uuidv4(),
        materia_prima_id,
        tipo: 'Ajuste',
        quantidade: novo_saldo,
        data_movimento: new Date().toISOString(),
        observacoes: 'Ajuste de inventário',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      records['movimento_estoque'] = records['movimento_estoque'] || {};
      records['movimento_estoque'][movimento.id] = movimento;

      // Atualizar saldo
      let saldo = Object.values(records['saldo_estoque'] || {})
        .find(s => s.materia_prima_id === materia_prima_id);

      if (!saldo) {
        saldo = {
          id: uuidv4(),
          materia_prima_id,
          saldo_atual: novo_saldo,
          data_atualizacao: new Date().toISOString()
        };
        records['saldo_estoque'] = records['saldo_estoque'] || {};
        records['saldo_estoque'][saldo.id] = saldo;
      } else {
        saldo.saldo_atual = novo_saldo;
        saldo.data_atualizacao = new Date().toISOString();
      }

      res.json({
        message: 'Ajuste realizado com sucesso',
        movimento,
        saldo: saldo.saldo_atual
      });
    });
  });

  describe('Movimentação de Estoque', () => {
    beforeEach(async () => {
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-10000',
          descricao: 'Tubo Inox',
          unidade: 'metro',
          estoque_minimo: 50
        });
      this.mpId = mpResp.body.id;

      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][this.mpId] = {
        id: this.mpId,
        codigo: 'MP-10000',
        estoque_minimo: 50
      };
    });

    it('deve registrar entrada de material', async () => {
      const response = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 100,
          data_movimento: new Date().toISOString(),
          lote: 'LOTE-001',
          origem: 'Compra'
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo).toBe('Entrada');
      expect(response.body.quantidade).toBe(100);
    });

    it('deve registrar saída de material', async () => {
      // Primeiro adicionar material
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 100,
          data_movimento: new Date().toISOString(),
          origem: 'Compra'
        });

      // Depois remover
      const response = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Saída',
          quantidade: 30,
          data_movimento: new Date().toISOString(),
          origem: 'OP'
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo).toBe('Saída');
    });

    it('deve bloquear saída sem estoque suficiente', async () => {
      const response = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Saída',
          quantidade: 50,
          data_movimento: new Date().toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('insuficiente');
    });

    it('deve fazer ajuste de inventário', async () => {
      const response = await request(app)
        .post(`/api/estoque/ajustar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          novo_saldo: 200
        });

      expect(response.status).toBe(200);
      expect(response.body.saldo).toBe(200);
    });
  });

  describe('Saldo de Estoque', () => {
    beforeEach(async () => {
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-10100',
          descricao: 'Parafuso Inox',
          unidade: 'unidade',
          estoque_minimo: 1000
        });
      this.mpId = mpResp.body.id;

      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][this.mpId] = {
        id: this.mpId,
        codigo: 'MP-10100',
        estoque_minimo: 1000
      };

      // Adicionar material
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 5000,
          data_movimento: new Date().toISOString(),
          lote: 'LOTE-100',
          origem: 'Compra'
        });
    });

    it('deve consultar saldo de matéria prima', async () => {
      const response = await request(app)
        .get(`/api/saldo/materia-prima/${this.mpId}`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.saldo).toBe(5000);
      expect(response.body.acima_minimo).toBe(true);
    });

    it('deve rastrear lote vigente', async () => {
      const response = await request(app)
        .get(`/api/saldo/materia-prima/${this.mpId}`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.lote_vigente).toBe('LOTE-100');
    });

    it('deve mostrar histórico de movimentos', async () => {
      // Fazer saída
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Saída',
          quantidade: 500,
          data_movimento: new Date().toISOString()
        });

      const response = await request(app)
        .get(`/api/saldo/materia-prima/${this.mpId}`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.ultimos_movimentos.length).toBeGreaterThan(0);
    });
  });

  describe('Requisição Automática de Compra', () => {
    beforeEach(async () => {
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-10200',
          descricao: 'Solda Especial',
          unidade: 'kg',
          estoque_minimo: 20
        });
      this.mpId = mpResp.body.id;

      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][this.mpId] = {
        id: this.mpId,
        codigo: 'MP-10200',
        estoque_minimo: 20
      };
    });

    it('deve gerar requisição automática quando estoque abaixo do mínimo', async () => {
      // Colocar 50 kg
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 50,
          data_movimento: new Date().toISOString(),
          origem: 'Compra'
        });

      // Remover 40 kg, deixando 10 (abaixo dos 20 mínimo)
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Saída',
          quantidade: 40,
          data_movimento: new Date().toISOString(),
          origem: 'OP'
        });

      const response = await request(app)
        .get(`/api/estoque/requisicoes-automaticas`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.requisicoes[0].motivo).toContain('automática');
    });
  });

  describe('Controle de Lotes', () => {
    beforeEach(async () => {
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-10300',
          descricao: 'Aço Carbono',
          unidade: 'kg'
        });
      this.mpId = mpResp.body.id;

      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][this.mpId] = {
        id: this.mpId,
        codigo: 'MP-10300'
      };
    });

    it('deve rastrear múltiplos lotes', async () => {
      // Lote 1
      await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 100,
          data_movimento: new Date().toISOString(),
          lote: 'LOTE-A'
        });

      // Lote 2
      const response = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: this.mpId,
          tipo: 'Entrada',
          quantidade: 150,
          data_movimento: new Date().toISOString(),
          lote: 'LOTE-B'
        });

      expect(response.status).toBe(201);
      expect(response.body.lote).toBe('LOTE-B');
    });
  });

  describe('Fluxo Completo Estoque', () => {
    it('deve executar fluxo: entrada > saída > validar saldo > requisição automática', async () => {
      // 1. Criar matéria prima
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-10999',
          descricao: 'Material Fluxo',
          unidade: 'kg',
          estoque_minimo: 30
        });
      const mpId = mpResp.body.id;

      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][mpId] = {
        id: mpId,
        estoque_minimo: 30
      };

      // 2. Entrada: 100 kg
      const entResp = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: mpId,
          tipo: 'Entrada',
          quantidade: 100,
          data_movimento: new Date().toISOString(),
          lote: 'FLUXO-001',
          origem: 'Compra'
        });

      expect(entResp.status).toBe(201);

      // 3. Consultar saldo
      let saldoResp = await request(app)
        .get(`/api/saldo/materia-prima/${mpId}`)
        .set('Authorization', 'Bearer valid_token');

      expect(saldoResp.status).toBe(200);
      expect(saldoResp.body.saldo).toBe(100);

      // 4. Saída: 75 kg (deixando 25, abaixo dos 30 mínimo)
      const saidaResp = await request(app)
        .post('/api/records?entity=movimento_estoque')
        .set('Authorization', 'Bearer valid_token')
        .send({
          materia_prima_id: mpId,
          tipo: 'Saída',
          quantidade: 75,
          data_movimento: new Date().toISOString(),
          origem: 'OP'
        });

      expect(saidaResp.status).toBe(201);

      // 5. Verificar novo saldo
      saldoResp = await request(app)
        .get(`/api/saldo/materia-prima/${mpId}`)
        .set('Authorization', 'Bearer valid_token');

      expect(saldoResp.body.saldo).toBe(25);
      expect(saldoResp.body.acima_minimo).toBe(false);

      // 6. Verificar requisição automática foi gerada
      const reqResp = await request(app)
        .get(`/api/estoque/requisicoes-automaticas`)
        .set('Authorization', 'Bearer valid_token');

      expect(reqResp.body.total).toBeGreaterThan(0);
    });
  });
});

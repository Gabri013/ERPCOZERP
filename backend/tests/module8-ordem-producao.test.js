/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 8
 * Ordem de Produção (OP): Criação a partir de pedido com sequência de estágios
 * Bloqueio: não pode pular estágios, só avança sequencialmente
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 8 - ORDEM DE PRODUÇÃO', () => {
  let app;
  let entities = {};
  let records = {};
  let opCounter = 2000;

  beforeEach(() => {
    // Não zera records aqui - cada describe tem seu próprio setup
    app = express();
    app.use(express.json());

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token não fornecido' });
      req.user = { id: 'user-1', token };
      next();
    };

    // Entidades base para OP
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
        { code: 'roteiro_completo', label: 'Roteiro Completo', dataType: 'boolean', required: false }
      ]
    };

    entities['pedido_venda'] = {
      id: uuidv4(),
      code: 'pedido_venda',
      name: 'Pedido de Venda',
      fields: [
        { code: 'numero', label: 'Número', dataType: 'text', required: true },
        { code: 'cliente_id', label: 'Cliente', dataType: 'reference', required: true },
        { code: 'status', label: 'Status', dataType: 'text', required: true }
      ]
    };

    entities['ordem_producao'] = {
      id: uuidv4(),
      code: 'ordem_producao',
      name: 'Ordem de Produção',
      fields: [
        { code: 'numero', label: 'Número', dataType: 'text', required: false },
        { code: 'pedido_id', label: 'Pedido', dataType: 'reference', required: true },
        { code: 'produto_id', label: 'Produto', dataType: 'reference', required: true },
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: false },
        { code: 'estagio_atual', label: 'Estágio Atual', dataType: 'integer', required: false }
      ]
    };

    entities['apontamento'] = {
      id: uuidv4(),
      code: 'apontamento',
      name: 'Apontamento de Produção',
      fields: [
        { code: 'op_id', label: 'Ordem Produção', dataType: 'reference', required: true },
        { code: 'estagio', label: 'Estágio', dataType: 'integer', required: true },
        { code: 'status', label: 'Status', dataType: 'select', required: false },
        { code: 'data_inicio', label: 'Data Início', dataType: 'datetime', required: true },
        { code: 'data_fim', label: 'Data Fim', dataType: 'datetime', required: false },
        { code: 'quantidade_produzida', label: 'Quantidade Produzida', dataType: 'decimal', required: false }
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

      // Validação de campos obrigatórios
      for (const field of entity.fields) {
        if (field.required && !data[field.code]) {
          return res.status(400).json({
            error: `Campo ${field.label} é obrigatório`
          });
        }
      }

      // Validações específicas para OP
      if (entityCode === 'ordem_producao') {
        // Validar referências
        if (!records['pedido_venda']?.[data.pedido_id]) {
          return res.status(400).json({ error: 'Pedido não existe' });
        }

        if (!records['produto']?.[data.produto_id]) {
          return res.status(400).json({ error: 'Produto não existe' });
        }

        // Validar que produto tem roteiro completo
        const produto = records['produto'][data.produto_id];
        if (!produto.roteiro_completo) {
          return res.status(400).json({
            error: 'Produto sem roteiro completo não pode ser produzido'
          });
        }

        // Validar quantidade > 0
        if (data.quantidade <= 0) {
          return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
        }

        // Gerar número sequencial
        if (!data.numero) {
          data.numero = `OP-${++opCounter}`;
        }

        // Inicializar status se não fornecido
        if (!data.status) {
          data.status = 'Aberta';
        }

        // Inicializar estágio atual = 1
        if (!data.estagio_atual) {
          data.estagio_atual = 1;
        }
      }

      // Validações para apontamento
      if (entityCode === 'apontamento') {
        if (!records['ordem_producao']?.[data.op_id]) {
          return res.status(400).json({ error: 'Ordem de Produção não existe' });
        }

        const op = records['ordem_producao'][data.op_id];
        if (op.status === 'Concluída') {
          return res.status(400).json({ error: 'Não é possível apontar em OP concluída' });
        }

        if (data.estagio !== op.estagio_atual) {
          return res.status(400).json({
            error: `Apontamento deve ser do estágio atual (${op.estagio_atual})`,
            estagio_esperado: op.estagio_atual,
            estagio_recebido: data.estagio
          });
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

    // PUT /api/records/:id
    app.put('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;
      const data = req.body;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      // Bloquear edição de OP em produção
      if (entityCode === 'ordem_producao' && record.status !== 'Aberta') {
        return res.status(400).json({
          error: 'Não é possível editar OP em produção ou concluída',
          status: record.status
        });
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

    // POST /api/op/:id/avancar-estagio
    app.post('/api/op/:id/avancar-estagio', authenticateToken, (req, res) => {
      const { id } = req.params;

      const op = records['ordem_producao']?.[id];
      if (!op) {
        return res.status(404).json({ error: 'Ordem de Produção não encontrada' });
      }

      // Máximo 9 estágios
      if (op.estagio_atual >= 9) {
        return res.status(400).json({
          error: 'Última estágio já atingido',
          estagio_atual: op.estagio_atual
        });
      }

      // Validar que há apontamento finalizado para estágio atual
      const apontamentosEstagio = Object.values(records['apontamento'] || {})
        .filter(a => a.op_id === id && a.estagio === op.estagio_atual);

      const temApontamentoFinalizado = apontamentosEstagio.some(a => a.status === 'Finalizado');
      if (!temApontamentoFinalizado) {
        return res.status(400).json({
          error: 'Não é possível avançar sem apontamento finalizado para o estágio atual',
          estagio_atual: op.estagio_atual
        });
      }

      // Avançar para próximo estágio
      op.estagio_atual = op.estagio_atual + 1;

      // Se atingiu último estágio (9), marcar como concluída
      if (op.estagio_atual > 9) {
        op.status = 'Concluída';
      } else {
        op.status = 'Em Produção';
      }

      res.json({
        message: 'Estágio avançado com sucesso',
        op
      });
    });

    // PUT /api/apontamento/:id/finalizar
    app.put('/api/apontamento/:id/finalizar', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { quantidade_produzida } = req.body;

      const apontamento = records['apontamento']?.[id];
      if (!apontamento) {
        return res.status(404).json({ error: 'Apontamento não encontrado' });
      }

      if (apontamento.status === 'Finalizado') {
        return res.status(400).json({ error: 'Apontamento já foi finalizado' });
      }

      apontamento.status = 'Finalizado';
      apontamento.data_fim = new Date().toISOString();
      apontamento.quantidade_produzida = quantidade_produzida || 0;

      res.json({
        message: 'Apontamento finalizado',
        apontamento
      });
    });

    // GET /api/op/:id/apontamentos
    app.get('/api/op/:id/apontamentos', authenticateToken, (req, res) => {
      const { id } = req.params;

      const op = records['ordem_producao']?.[id];
      if (!op) {
        return res.status(404).json({ error: 'Ordem de Produção não encontrada' });
      }

      const apontamentos = Object.values(records['apontamento'] || {})
        .filter(a => a.op_id === id)
        .sort((a, b) => a.estagio - b.estagio);

      res.json({
        op,
        apontamentos,
        total: apontamentos.length
      });
    });
  });

  describe('Criar Ordem de Produção', () => {
    beforeEach(async () => {
      // Criar cliente
      const cliResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-800', razao_social: 'Cliente OP' });
      this.clienteId = cliResp.body.id;
      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = { id: this.clienteId };

      // Criar pedido
      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-800', cliente_id: this.clienteId, status: 'Aberto' });
      this.pedidoId = pedResp.body.id;
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][this.pedidoId] = { id: this.pedidoId };

      // Criar produto COM roteiro completo
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-800',
          descricao: 'Produto OP',
          roteiro_completo: true
        });
      this.produtoId = prodResp.body.id;
      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        roteiro_completo: true
      };
    });

    it('deve criar OP com número sequencial', async () => {
      const response = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: this.pedidoId,
          produto_id: this.produtoId,
          quantidade: 10
        });

      expect(response.status).toBe(201);
      expect(response.body.numero).toMatch(/^OP-\d+$/);
      expect(response.body.status).toBe('Aberta');
      expect(response.body.estagio_atual).toBe(1);
    });

    it('deve bloquear OP se produto sem roteiro', async () => {
      // Criar produto sem roteiro
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-801',
          descricao: 'Sem Roteiro',
          roteiro_completo: false
        });

      records['produto'][prodResp.body.id] = {
        id: prodResp.body.id,
        roteiro_completo: false
      };

      const response = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: this.pedidoId,
          produto_id: prodResp.body.id,
          quantidade: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('roteiro completo');
    });

    it('deve validar quantidade > 0', async () => {
      const response = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: this.pedidoId,
          produto_id: this.produtoId,
          quantidade: -5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('maior que zero');
    });
  });

  describe('Apontamento de Estágios', () => {
    beforeEach(async () => {
      // Setup: Cliente, Pedido, Produto, OP
      const cliResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-810', razao_social: 'Cliente Apontamento' });
      this.clienteId = cliResp.body.id;
      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = { id: this.clienteId };

      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-810', cliente_id: this.clienteId, status: 'Aberto' });
      this.pedidoId = pedResp.body.id;
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][this.pedidoId] = { id: this.pedidoId };

      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-810',
          descricao: 'Produto Apontamento',
          roteiro_completo: true
        });
      this.produtoId = prodResp.body.id;
      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        roteiro_completo: true
      };

      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: this.pedidoId,
          produto_id: this.produtoId,
          quantidade: 10
        });
      this.opId = opResp.body.id;
      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = {
        id: this.opId,
        estagio_atual: 1,
        status: 'Aberta'
      };
    });

    it('deve criar apontamento para estágio atual', async () => {
      const response = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_produzida: 0
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Iniciado');
      expect(response.body.estagio).toBe(1);
    });

    it('deve bloquear apontamento em estágio errado', async () => {
      const response = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 5,
          data_inicio: new Date().toISOString(),
          quantidade_produzida: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('estágio atual');
    });

    it('deve finalizar apontamento', async () => {
      // Criar apontamento
      const createResp = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_produzida: 0
        });

      const apontamentoId = createResp.body.id;

      // Finalizar
      const response = await request(app)
        .put(`/api/apontamento/${apontamentoId}/finalizar`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          quantidade_produzida: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.apontamento.status).toBe('Finalizado');
      expect(response.body.apontamento.data_fim).toBeDefined();
    });
  });

  describe('Sequência de Estágios', () => {
    beforeEach(async () => {
      const cliResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-820', razao_social: 'Cliente Sequência' });
      this.clienteId = cliResp.body.id;
      records['cliente'] = records['cliente'] || {};
      records['cliente'][this.clienteId] = { id: this.clienteId };

      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-820', cliente_id: this.clienteId, status: 'Aberto' });
      this.pedidoId = pedResp.body.id;
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][this.pedidoId] = { id: this.pedidoId };

      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-820',
          descricao: 'Produto Sequência',
          roteiro_completo: true
        });
      this.produtoId = prodResp.body.id;
      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        roteiro_completo: true
      };

      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: this.pedidoId,
          produto_id: this.produtoId,
          quantidade: 5
        });
      this.opId = opResp.body.id;
      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][this.opId] = {
        id: this.opId,
        estagio_atual: 1,
        status: 'Aberta'
      };
    });

    it('deve bloquear avanço sem apontamento finalizado', async () => {
      const response = await request(app)
        .post(`/api/op/${this.opId}/avancar-estagio`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('apontamento');
    });

    it('deve avançar para próximo estágio após apontamento', async () => {
      // Criar e finalizar apontamento
      const apRes = await request(app)
        .post('/api/records?entity=apontamento')
        .set('Authorization', 'Bearer valid_token')
        .send({
          op_id: this.opId,
          estagio: 1,
          data_inicio: new Date().toISOString(),
          quantidade_produzida: 0
        });

      await request(app)
        .put(`/api/apontamento/${apRes.body.id}/finalizar`)
        .set('Authorization', 'Bearer valid_token')
        .send({ quantidade_produzida: 5 });

      // Avançar
      const response = await request(app)
        .post(`/api/op/${this.opId}/avancar-estagio`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.op.estagio_atual).toBe(2);
    });
  });

  describe('Fluxo Completo OP', () => {
    it('deve executar fluxo: Pedido > OP > Apontamentos > Conclusão', async () => {
      // 1. Preparar dados
      const cliResp = await request(app)
        .post('/api/records?entity=cliente')
        .set('Authorization', 'Bearer valid_token')
        .send({ codigo: 'CLI-899', razao_social: 'Cliente Fluxo' });
      const clienteId = cliResp.body.id;
      records['cliente'] = records['cliente'] || {};
      records['cliente'][clienteId] = { id: clienteId };

      const pedResp = await request(app)
        .post('/api/records?entity=pedido_venda')
        .set('Authorization', 'Bearer valid_token')
        .send({ numero: 'PED-899', cliente_id: clienteId, status: 'Aberto' });
      const pedidoId = pedResp.body.id;
      records['pedido_venda'] = records['pedido_venda'] || {};
      records['pedido_venda'][pedidoId] = { id: pedidoId };

      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-899',
          descricao: 'Produto Fluxo',
          roteiro_completo: true
        });
      const produtoId = prodResp.body.id;
      records['produto'] = records['produto'] || {};
      records['produto'][produtoId] = {
        id: produtoId,
        roteiro_completo: true
      };

      // 2. Criar OP
      const opResp = await request(app)
        .post('/api/records?entity=ordem_producao')
        .set('Authorization', 'Bearer valid_token')
        .send({
          pedido_id: pedidoId,
          produto_id: produtoId,
          quantidade: 5
        });

      const opId = opResp.body.id;
      records['ordem_producao'] = records['ordem_producao'] || {};
      records['ordem_producao'][opId] = {
        id: opId,
        estagio_atual: 1,
        status: 'Aberta'
      };

      expect(opResp.status).toBe(201);

      // 3. Criar apontamentos para 2 estágios
      for (let e = 1; e <= 2; e++) {
        const apResp = await request(app)
          .post('/api/records?entity=apontamento')
          .set('Authorization', 'Bearer valid_token')
          .send({
            op_id: opId,
            estagio: e,
            data_inicio: new Date().toISOString(),
            quantidade_produzida: 0
          });

        expect(apResp.status).toBe(201);

        // Finalizar apontamento
        await request(app)
          .put(`/api/apontamento/${apResp.body.id}/finalizar`)
          .set('Authorization', 'Bearer valid_token')
          .send({ quantidade_produzida: 5 });

        // Avançar estágio
        if (e < 2) {
          const advResp = await request(app)
            .post(`/api/op/${opId}/avancar-estagio`)
            .set('Authorization', 'Bearer valid_token');

          expect(advResp.status).toBe(200);
        }
      }

      // 4. Listar apontamentos
      const listResp = await request(app)
        .get(`/api/op/${opId}/apontamentos`)
        .set('Authorization', 'Bearer valid_token');

      expect(listResp.status).toBe(200);
      expect(listResp.body.total).toBe(2);
    });
  });
});

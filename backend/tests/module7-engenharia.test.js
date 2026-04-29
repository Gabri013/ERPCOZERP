/**
 * TESTE DE INTEGRAÇÃO - MÓDULO 7
 * Engenharia: Produto com BOM (Bill of Materials) e Roteiro com 9 estágios
 * Regra de negócio: Produto só produz com roteiro completo
 */

const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

describe('MÓDULO 7 - ENGENHARIA', () => {
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

    // Entidades base para Engenharia
    entities['produto'] = {
      id: uuidv4(),
      code: 'produto',
      name: 'Produto',
      fields: [
        { code: 'codigo', label: 'Código', dataType: 'text', required: true },
        { code: 'descricao', label: 'Descrição', dataType: 'text', required: true },
        { code: 'preco_venda', label: 'Preço Venda', dataType: 'decimal', required: true },
        { code: 'roteiro_completo', label: 'Roteiro Completo', dataType: 'boolean', required: false }
      ]
    };

    entities['materia_prima'] = {
      id: uuidv4(),
      code: 'materia_prima',
      name: 'Matéria Prima',
      fields: [
        { code: 'codigo', label: 'Código', dataType: 'text', required: true },
        { code: 'descricao', label: 'Descrição', dataType: 'text', required: true },
        { code: 'unidade', label: 'Unidade', dataType: 'text', required: true }
      ]
    };

    entities['bom_item'] = {
      id: uuidv4(),
      code: 'bom_item',
      name: 'Itens da BOM',
      fields: [
        { code: 'produto_id', label: 'Produto', dataType: 'reference', required: true },
        { code: 'materia_prima_id', label: 'Matéria Prima', dataType: 'reference', required: true },
        { code: 'quantidade', label: 'Quantidade', dataType: 'decimal', required: true },
        { code: 'unidade', label: 'Unidade', dataType: 'text', required: true }
      ]
    };

    // 9 estágios do roteiro: Programação, Corte, Dobra, Tubo, Solda, Montagem, Refrigeração, Cocção, Embalagem
    entities['roteiro_estagio'] = {
      id: uuidv4(),
      code: 'roteiro_estagio',
      name: 'Estágios do Roteiro',
      fields: [
        { code: 'produto_id', label: 'Produto', dataType: 'reference', required: true },
        { code: 'numero_estagio', label: 'Número Estágio', dataType: 'integer', required: true },
        { code: 'nome_estagio', label: 'Nome Estágio', dataType: 'text', required: true },
        { code: 'tempo_padrao_horas', label: 'Tempo Padrão (horas)', dataType: 'decimal', required: true },
        { code: 'descricao', label: 'Descrição', dataType: 'text', required: false }
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

      // Validação de referências
      if (entityCode === 'bom_item') {
        if (!records['produto']?.[data.produto_id]) {
          return res.status(400).json({ error: 'Produto não existe' });
        }
        if (!records['materia_prima']?.[data.materia_prima_id]) {
          return res.status(400).json({ error: 'Matéria Prima não existe' });
        }
      }

      if (entityCode === 'roteiro_estagio') {
        if (!records['produto']?.[data.produto_id]) {
          return res.status(400).json({ error: 'Produto não existe' });
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

    // GET /api/produtos/:id/bom
    app.get('/api/produtos/:id/bom', authenticateToken, (req, res) => {
      const { id } = req.params;

      const produto = records['produto']?.[id];
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const itens = Object.values(records['bom_item'] || {})
        .filter(item => item.produto_id === id);

      res.json({
        produto,
        itens,
        total: itens.length
      });
    });

    // GET /api/produtos/:id/roteiro
    app.get('/api/produtos/:id/roteiro', authenticateToken, (req, res) => {
      const { id } = req.params;

      const produto = records['produto']?.[id];
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const estagios = Object.values(records['roteiro_estagio'] || {})
        .filter(e => e.produto_id === id)
        .sort((a, b) => a.numero_estagio - b.numero_estagio);

      res.json({
        produto,
        estagios,
        total: estagios.length,
        completo: estagios.length === 9
      });
    });

    // PUT /api/produtos/:id/marcar-roteiro-completo
    app.put('/api/produtos/:id/marcar-roteiro-completo', authenticateToken, (req, res) => {
      const { id } = req.params;

      const produto = records['produto']?.[id];
      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const estagios = Object.values(records['roteiro_estagio'] || {})
        .filter(e => e.produto_id === id);

      if (estagios.length < 9) {
        return res.status(400).json({
          error: 'Roteiro incompleto. É necessário ter todos os 9 estágios',
          estagios_presentes: estagios.length,
          estagios_necessarios: 9
        });
      }

      produto.roteiro_completo = true;
      res.json({
        message: 'Roteiro marcado como completo',
        produto
      });
    });

    // DELETE /api/records/:id
    app.delete('/api/records/:id', authenticateToken, (req, res) => {
      const { id } = req.params;
      const { entity: entityCode } = req.query;

      const record = records[entityCode]?.[id];
      if (!record) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      delete records[entityCode][id];
      res.json({ message: 'Deletado com sucesso' });
    });
  });

  afterEach(() => {
    records = {};
  });

  describe('Criar Produtos com Engenharia', () => {
    it('deve criar um produto', async () => {
      const response = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-7000',
          descricao: 'Equipamento Inox A',
          preco_venda: 5000.00,
          roteiro_completo: false
        });

      expect(response.status).toBe(201);
      expect(response.body.codigo).toBe('PROD-7000');
      expect(response.body.roteiro_completo).toBe(false);
    });

    it('deve criar matéria prima', async () => {
      const response = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-7000',
          descricao: 'Tubo Inox 304',
          unidade: 'metro'
        });

      expect(response.status).toBe(201);
      expect(response.body.codigo).toBe('MP-7000');
    });
  });

  describe('BOM - Bill of Materials', () => {
    beforeEach(async () => {
      // Criar produto
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-7100',
          descricao: 'Equipamento BOM',
          preco_venda: 3000.00
        });
      this.produtoId = prodResp.body.id;

      // Inicializar em records
      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        codigo: 'PROD-7100'
      };

      // Criar matérias primas
      const mp1Resp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-7100',
          descricao: 'Tubo Inox',
          unidade: 'metro'
        });
      this.mp1Id = mp1Resp.body.id;

      const mp2Resp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-7101',
          descricao: 'Parafuso Inox',
          unidade: 'unidade'
        });
      this.mp2Id = mp2Resp.body.id;

      // Inicializar matérias primas em records
      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][this.mp1Id] = {
        id: this.mp1Id,
        codigo: 'MP-7100'
      };
      records['materia_prima'][this.mp2Id] = {
        id: this.mp2Id,
        codigo: 'MP-7101'
      };
    });

    it('deve adicionar item à BOM', async () => {
      const response = await request(app)
        .post('/api/records?entity=bom_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          produto_id: this.produtoId,
          materia_prima_id: this.mp1Id,
          quantidade: 5.5,
          unidade: 'metro'
        });

      expect(response.status).toBe(201);
      expect(response.body.quantidade).toBe(5.5);
    });

    it('deve validar referências na BOM', async () => {
      const response = await request(app)
        .post('/api/records?entity=bom_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          produto_id: uuidv4(),
          materia_prima_id: this.mp1Id,
          quantidade: 1,
          unidade: 'metro'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Produto');
    });

    it('deve listar itens da BOM', async () => {
      // Adicionar itens
      await request(app)
        .post('/api/records?entity=bom_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          produto_id: this.produtoId,
          materia_prima_id: this.mp1Id,
          quantidade: 2,
          unidade: 'metro'
        });

      await request(app)
        .post('/api/records?entity=bom_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          produto_id: this.produtoId,
          materia_prima_id: this.mp2Id,
          quantidade: 100,
          unidade: 'unidade'
        });

      const response = await request(app)
        .get(`/api/produtos/${this.produtoId}/bom`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.itens.length).toBe(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('Roteiro com 9 Estágios', () => {
    beforeEach(async () => {
      // Criar produto
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-7200',
          descricao: 'Equipamento Roteiro',
          preco_venda: 4000.00
        });
      this.produtoId = prodResp.body.id;

      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        codigo: 'PROD-7200'
      };
    });

    it('deve adicionar estágios ao roteiro', async () => {
      const estagios = [
        { numero: 1, nome: 'Programação', tempo: 2 },
        { numero: 2, nome: 'Corte', tempo: 1.5 },
        { numero: 3, nome: 'Dobra', tempo: 1 },
        { numero: 4, nome: 'Tubo', tempo: 2 },
        { numero: 5, nome: 'Solda', tempo: 3 },
        { numero: 6, nome: 'Montagem', tempo: 2.5 },
        { numero: 7, nome: 'Refrigeração', tempo: 1 },
        { numero: 8, nome: 'Cocção', tempo: 1.5 },
        { numero: 9, nome: 'Embalagem', tempo: 0.5 }
      ];

      for (const estagio of estagios) {
        const response = await request(app)
          .post('/api/records?entity=roteiro_estagio')
          .set('Authorization', 'Bearer valid_token')
          .send({
            produto_id: this.produtoId,
            numero_estagio: estagio.numero,
            nome_estagio: estagio.nome,
            tempo_padrao_horas: estagio.tempo,
            descricao: `Estágio ${estagio.nome}`
          });

        expect(response.status).toBe(201);
      }

      // Verificar que todos os estágios foram criados
      const getResp = await request(app)
        .get(`/api/produtos/${this.produtoId}/roteiro`)
        .set('Authorization', 'Bearer valid_token');

      expect(getResp.status).toBe(200);
      expect(getResp.body.total).toBe(9);
      expect(getResp.body.completo).toBe(true);
    });

    it('deve listar estágios em ordem numérica', async () => {
      // Adicionar estágios fora de ordem
      const estagios = [
        { numero: 5, nome: 'Solda' },
        { numero: 1, nome: 'Programação' },
        { numero: 9, nome: 'Embalagem' }
      ];

      for (const estagio of estagios) {
        await request(app)
          .post('/api/records?entity=roteiro_estagio')
          .set('Authorization', 'Bearer valid_token')
          .send({
            produto_id: this.produtoId,
            numero_estagio: estagio.numero,
            nome_estagio: estagio.nome,
            tempo_padrao_horas: 1
          });
      }

      const response = await request(app)
        .get(`/api/produtos/${this.produtoId}/roteiro`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.estagios[0].numero_estagio).toBe(1);
      expect(response.body.estagios[2].numero_estagio).toBe(9);
    });

    it('deve bloquear marcar roteiro como completo se faltarem estágios', async () => {
      // Adicionar apenas 5 estágios
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/records?entity=roteiro_estagio')
          .set('Authorization', 'Bearer valid_token')
          .send({
            produto_id: this.produtoId,
            numero_estagio: i,
            nome_estagio: `Estágio ${i}`,
            tempo_padrao_horas: 1
          });
      }

      const response = await request(app)
        .put(`/api/produtos/${this.produtoId}/marcar-roteiro-completo`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('incompleto');
      expect(response.body.estagios_presentes).toBe(5);
    });

    it('deve marcar roteiro como completo com todos os 9 estágios', async () => {
      // Adicionar todos os 9 estágios
      const estagios = [
        'Programação', 'Corte', 'Dobra', 'Tubo', 'Solda',
        'Montagem', 'Refrigeração', 'Cocção', 'Embalagem'
      ];

      for (let i = 0; i < estagios.length; i++) {
        await request(app)
          .post('/api/records?entity=roteiro_estagio')
          .set('Authorization', 'Bearer valid_token')
          .send({
            produto_id: this.produtoId,
            numero_estagio: i + 1,
            nome_estagio: estagios[i],
            tempo_padrao_horas: 1
          });
      }

      const response = await request(app)
        .put(`/api/produtos/${this.produtoId}/marcar-roteiro-completo`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.produto.roteiro_completo).toBe(true);
    });
  });

  describe('Regra: Produto só Produz com Roteiro Completo', () => {
    beforeEach(async () => {
      // Criar produto
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-7300',
          descricao: 'Produto Teste Regra',
          preco_venda: 2000.00
        });
      this.produtoId = prodResp.body.id;

      records['produto'] = records['produto'] || {};
      records['produto'][this.produtoId] = {
        id: this.produtoId,
        codigo: 'PROD-7300',
        roteiro_completo: false
      };
    });

    it('deve verificar status roteiro_completo do produto', async () => {
      const response = await request(app)
        .get(`/api/records/${this.produtoId}?entity=produto`)
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.roteiro_completo).toBe(false);
    });
  });

  describe('Fluxo Completo Engenharia', () => {
    it('deve executar fluxo: criar produto > BOM > Roteiro > Marcar Completo', async () => {
      // 1. Criar produto
      const prodResp = await request(app)
        .post('/api/records?entity=produto')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'PROD-7999',
          descricao: 'Equipamento Completo',
          preco_venda: 6000.00
        });

      const produtoId = prodResp.body.id;
      records['produto'] = records['produto'] || {};
      records['produto'][produtoId] = {
        id: produtoId,
        codigo: 'PROD-7999'
      };

      // 2. Criar matéria prima
      const mpResp = await request(app)
        .post('/api/records?entity=materia_prima')
        .set('Authorization', 'Bearer valid_token')
        .send({
          codigo: 'MP-7999',
          descricao: 'Material Base',
          unidade: 'kg'
        });

      const mpId = mpResp.body.id;
      records['materia_prima'] = records['materia_prima'] || {};
      records['materia_prima'][mpId] = {
        id: mpId,
        codigo: 'MP-7999'
      };

      // 3. Adicionar à BOM
      const bomResp = await request(app)
        .post('/api/records?entity=bom_item')
        .set('Authorization', 'Bearer valid_token')
        .send({
          produto_id: produtoId,
          materia_prima_id: mpId,
          quantidade: 50,
          unidade: 'kg'
        });

      expect(bomResp.status).toBe(201);

      // 4. Adicionar todos os 9 estágios
      const estagios = [
        'Programação', 'Corte', 'Dobra', 'Tubo', 'Solda',
        'Montagem', 'Refrigeração', 'Cocção', 'Embalagem'
      ];

      for (let i = 0; i < estagios.length; i++) {
        const eResp = await request(app)
          .post('/api/records?entity=roteiro_estagio')
          .set('Authorization', 'Bearer valid_token')
          .send({
            produto_id: produtoId,
            numero_estagio: i + 1,
            nome_estagio: estagios[i],
            tempo_padrao_horas: 1.5
          });

        expect(eResp.status).toBe(201);
      }

      // 5. Marcar roteiro como completo
      const completeResp = await request(app)
        .put(`/api/produtos/${produtoId}/marcar-roteiro-completo`)
        .set('Authorization', 'Bearer valid_token');

      expect(completeResp.status).toBe(200);
      expect(completeResp.body.produto.roteiro_completo).toBe(true);

      // 6. Verificar produto está pronto para produção
      const finalResp = await request(app)
        .get(`/api/records/${produtoId}?entity=produto`)
        .set('Authorization', 'Bearer valid_token');

      expect(finalResp.status).toBe(200);
      expect(finalResp.body.roteiro_completo).toBe(true);
    });
  });
});

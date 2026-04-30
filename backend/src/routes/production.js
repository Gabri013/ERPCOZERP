const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { WorkflowEngine } = require('../services/workflowEngine');
const { RuleEngine } = require('../services/ruleEngine');

const router = express.Router();

// ============================================
// PRODUÇÃO INDUSTRIAL — ORDENS DE PRODUÇÃO
// ============================================

// GET /api/production/ops/:id — detalhe de uma OP
router.get('/ops/:id', requirePermission('ver_op'), async (req, res) => {
  try {
    const { id } = req.params;

    // Busca entity "ordem_producao"
    const entity = await query("SELECT id FROM entities WHERE code = 'ordem_producao'");
    if (entity.length === 0) {
      return res.status(404).json({ error: 'Entidade ordem_producao não configurada' });
    }

    const op = await query(`
      SELECT 
        er.id, er.data, er.created_at, er.updated_at,
        u.full_name as created_by_name,
        (SELECT CONCAT('[', IFNULL(GROUP_CONCAT(
          JSON_OBJECT('etapa', a.descricao, 'status', a.status, 'quantidade', a.quantidade, 'refugo', a.refugo)
          ORDER BY a.created_at SEPARATOR ','
        ), ''), ']')
         FROM apontamentos a WHERE a.op_id = er.id) as apontamentos
      FROM entity_records er
      LEFT JOIN users u ON er.created_by = u.id
      WHERE er.id = ? AND er.entity_id = ? AND er.deleted_at IS NULL
    `, [id, entity[0].id]);

    if (op.length === 0) {
      return res.status(404).json({ error: 'OP não encontrada' });
    }

    const record = op[0];
    const data = typeof record.data === 'string' ? JSON.parse(record.data || '{}') : (record.data || {});
    let apontamentos = [];
    if (record.apontamentos) {
      apontamentos = Array.isArray(record.apontamentos) 
        ? record.apontamentos 
        : (typeof record.apontamentos === 'string' ? JSON.parse(record.apontamentos || '[]') : record.apontamentos || []);
    }

    res.json({
      success: true,
      data: {
        id: record.id,
        ...data,
        apontamentos,
        created_by: record.created_by_name,
        created_at: record.created_at,
        updated_at: record.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/production/ops — lista de OPs
router.get('/ops', requirePermission('ver_op'), async (req, res) => {
  try {
    const { 
      page = 1, limit = 50, status, 
      search, start_date, end_date 
    } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;

    // Busca entity "ordem_producao"
    const entity = await query("SELECT id FROM entities WHERE code = 'ordem_producao'");
    if (entity.length === 0) {
      return res.status(404).json({ error: 'Entidade ordem_producao não configurada' });
    }
    const entityId = entity[0].id;

    let sql = `
      SELECT 
        er.id, er.data, er.created_at, er.updated_at,
        u.full_name as created_by_name,
        (SELECT CONCAT('[', IFNULL(GROUP_CONCAT(
          JSON_OBJECT('etapa', a.descricao, 'status', a.status, 'quantidade', a.quantidade, 'refugo', a.refugo)
          ORDER BY a.created_at SEPARATOR ','
        ), ''), ']')
         FROM apontamentos a WHERE a.op_id = er.id) as apontamentos
      FROM entity_records er
      LEFT JOIN users u ON er.created_by = u.id
      WHERE er.entity_id = ? AND er.deleted_at IS NULL
    `;
    
    const params = [entityId];

    if (status) {
      sql += ' AND JSON_UNQUOTE(JSON_EXTRACT(er.data, "$.status")) = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (JSON_UNQUOTE(JSON_EXTRACT(er.data, "$.numero")) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(er.data, "$.produtoDescricao")) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(er.data, "$.clienteNome")) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (start_date) {
      sql += ' AND er.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND er.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ` ORDER BY er.created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const ops = await query(sql, params);

    const parsed = ops.map(op => {
      const data = typeof op.data === 'string' ? JSON.parse(op.data || '{}') : (op.data || {});
      let apontamentos = [];
      if (op.apontamentos) {
        if (Array.isArray(op.apontamentos)) {
          apontamentos = op.apontamentos;
        } else if (typeof op.apontamentos === 'string') {
          try {
            apontamentos = JSON.parse(op.apontamentos) || [];
          } catch { apontamentos = []; }
        }
      }

      return {
        id: op.id,
        ...data,
        apontamentos,
        created_by: op.created_by_name,
        created_at: op.created_at,
        updated_at: op.updated_at
      };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/production/ops — criar OP
router.post('/ops', requirePermission('criar_op'), async (req, res) => {
  try {
    let { entity_id, data } = req.body;

    if (!entity_id) {
      const entity = await query("SELECT id FROM entities WHERE code = 'ordem_producao'");
      if (entity.length === 0) {
        return res.status(500).json({ error: 'Entidade ordem_producao não configurada' });
      }
      entity_id = entity[0].id;
    }

    const lastOp = await query(`
      SELECT data->>'$.numero' as numero FROM entity_records 
      WHERE entity_id = ? AND data->>'$.numero' IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `, [entity_id]);

    let nextNum = 1;
    if (lastOp.length > 0) {
      const match = lastOp[0].numero.match(/(\D+)(\d+)/);
      if (match) {
        nextNum = parseInt(match[2]) + 1;
      }
    }
    
    const prefix = 'OP';
    data.numero = `${prefix}-${String(nextNum).padStart(5, '0')}`;
    data.status = 'aberta';
    data.created_at = new Date().toISOString().split('T')[0];
    data.created_by = req.user.userId;

    const id = require('uuid').v4();
    await query(
      'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (?, ?, ?, ?)',
      [id, entity_id, JSON.stringify(data), req.user.userId]
    );

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_id, record_id, metadata)
      VALUES (?, 'op.create', ?, ?, ?)
    `, [req.user.userId, entity_id, id, JSON.stringify({ numero: data.numero })]);

    res.status(201).json({ success: true, id, data: { id, ...data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/production/ops/:id — atualizar OP
router.put('/ops/:id', requirePermission('editar_op'), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: newData } = req.body;

    const ops = await query('SELECT * FROM entity_records WHERE id = ?', [id]);
    if (ops.length === 0) {
      return res.status(404).json({ error: 'OP não encontrada' });
    }

    const op = ops[0];
    const oldData = JSON.parse(op.data || '{}');

    if (oldData.status === 'em_andamento' || oldData.status === 'concluida') {
      const lockedFields = ['quantidade', 'produtoId', 'clienteId'];
      const hasLocked = lockedFields.some(f => newData[f] !== undefined && newData[f] !== oldData[f]);
      if (hasLocked) {
        return res.status(400).json({ 
          error: 'OP em andamento/concluída não permite alterar estos campos' 
        });
      }
    }

    const merged = { ...oldData, ...newData };
    
    await query(
      'UPDATE entity_records SET data = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
      [JSON.stringify(merged), req.user.userId, id]
    );

    res.json({ success: true, data: { id, ...merged } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/production/ops/:id/apontamento
router.post('/ops/:id/apontamento', requirePermission('apontar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { etapa, quantidade } = req.body;
    const status = req.body.status || 'Em Andamento';

    if (!etapa || !quantidade) {
      return res.status(400).json({ error: 'etapa e quantidade são obrigatórios' });
    }

    const ops = await query('SELECT * FROM entity_records WHERE id = ?', [id]);
    if (ops.length === 0) {
      return res.status(404).json({ error: 'OP não encontrada' });
    }

    const apontamentoId = require('uuid').v4();
    await query(`
      INSERT INTO apontamentos 
      (id, op_id, usuario_id, descricao, quantidade, status, refugo, observacao, iniciado_em, finalizado_em)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), CASE WHEN ? = 'Finalizado' THEN NOW() ELSE NULL END)
    `, [apontamentoId, id, req.user.userId, etapa, quantidade, status, req.body.observacao || '', status]);

    const workflowEngine = new (require('../services/workflowEngine').WorkflowEngine)();
    
    res.status(201).json({ success: true, apontamentoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/production/apontamentos/:opId
router.get('/apontamentos/:opId', requirePermission('apontar'), async (req, res) => {
  try {
    const { opId } = req.params;
    
    const apontamentos = await query(`
      SELECT 
        a.id, a.op_id, a.usuario_id,
        a.descricao as etapa,
        a.quantidade,
        a.refugo,
        a.status,
        a.iniciado_em as horaInicio,
        a.finalizado_em as horaFim,
        a.created_at,
        u.full_name as apontado_por_nome
      FROM apontamentos a
      LEFT JOIN users u ON a.usuario_id = u.id
      WHERE a.op_id = ?
      ORDER BY a.created_at DESC
    `, [opId]);

    res.json({ success: true, data: apontamentos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CONSUMO DE ESTOQUE
// ============================================

router.post('/consumo', requirePermission('apontar'), async (req, res) => {
  try {
    const { produto_id, quantidade, op_id, tipo, observacao } = req.body;

    if (!produto_id || !quantidade) {
      return res.status(400).json({ error: 'produto_id e quantidade são obrigatórios' });
    }

    const produtos = await query(`
      SELECT er.* FROM entity_records er 
      JOIN entities e ON er.entity_id = e.id 
      WHERE e.code = 'produto' AND er.id = ? AND er.deleted_at IS NULL
    `, [produto_id]);

    if (produtos.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const produto = produtos[0];
    const produtoData = JSON.parse(produto.data);

    const estoqueAtual = produtoData.estoque_atual || 0;
    if (estoqueAtual < quantidade) {
      return res.status(400).json({ 
        error: 'Estoque insuficiente', 
        disponivel: estoqueAtual,
        solicitado: quantidade
      });
    }

    const newEstoque = estoqueAtual - quantidade;
    produtoData.estoque_atual = newEstoque;

    await query(
      'UPDATE entity_records SET data = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
      [JSON.stringify(produtoData), req.user.userId, produto_id]
    );

    const movId = require('uuid').v4();
    await query(`
      INSERT INTO movimentos_estoque 
      (id, tipo, produto_id, quantidade, produto_codigo, produto_descricao, 
       unidade, valor_unitario, valor_total, origem_id, observacao, criado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      movId,
      'Saída',
      produto_id,
      quantidade,
      produtoData.codigo,
      produtoData.descricao,
      produtoData.unidade || 'UN',
      produtoData.preco_custo || 0,
      quantidade * (produtoData.preco_custo || 0),
      op_id || null,
      observacao || `Consumo via Produção ${op_id ? '(OP ' + op_id + ')' : ''}`,
      req.user.userId
    ]);

    await query(`
      INSERT INTO audit_logs (user_id, action, entity_id, record_id, field_name, old_value, new_value, metadata)
      VALUES (?, 'estoque.consumo', 
        (SELECT id FROM entities WHERE code = 'produto'),
        ?, 'estoque_atual', ?, ?, ?)
    `, [
      req.user.userId,
      produto_id,
      estoqueAtual,
      newEstoque,
      JSON.stringify({ op_id, tipo })
    ]);

    res.json({ 
      success: true, 
      novo_estoque: newEstoque 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ESTOQUE
// ============================================

router.get('/estoque', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { search, tipo } = req.query;

    const entity = await query("SELECT id FROM entities WHERE code = 'produto'");
    if (entity.length === 0) {
      return res.json({ success: true, data: [] });
    }

    let sql = `
      SELECT id, data, created_at, updated_at
      FROM entity_records 
      WHERE entity_id = ? AND deleted_at IS NULL
    `;
    const params = [entity[0].id];

    if (search) {
      sql += ' AND (JSON_UNQUOTE(JSON_EXTRACT(data, "$.codigo")) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(data, "$.descricao")) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tipo) {
      sql += ' AND JSON_UNQUOTE(JSON_EXTRACT(data, "$.tipo")) = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY JSON_UNQUOTE(JSON_EXTRACT(data, "$.codigo"))';

    const produtos = await query(sql, params);

    const parsed = produtos.map(p => ({
      id: p.id,
      ...JSON.parse(p.data || '{}'),
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// COMPRAS
// ============================================

router.get('/compras', requirePermission('ver_compras'), async (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ============================================
// COMPRAS — FORNECEDORES
// ============================================

router.get('/fornecedores', requirePermission('ver_compras'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const entity = await query("SELECT id FROM entities WHERE code = 'fornecedor'");
    
    if (!entity.length) return res.json({ success: true, data: [], pagination: { page: 1, total: 0 } });
    
    const entityId = entity[0].id;
    let sql = `SELECT id, data, created_at FROM entity_records WHERE entity_id = ? AND deleted_at IS NULL`;
    const params = [entityId];

    if (search) {
      sql += ` AND (JSON_UNQUOTE(JSON_EXTRACT(data, '$.nome')) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.cnpj')) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY JSON_UNQUOTE(JSON_EXTRACT(data, "$.nome")) LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [fornecedores, count] = await Promise.all([
      query(sql, params),
      query('SELECT COUNT(*) as total FROM entity_records WHERE entity_id = ? AND deleted_at IS NULL', [entityId])
    ]);

    const parsed = fornecedores.map(f => ({
      id: f.id,
      ...JSON.parse(f.data || '{}'),
      created_at: f.created_at
    }));

    res.json({ 
      success: true, 
      data: parsed, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(count[0].total),
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// COMPRAS — ORDENS DE COMPRA
// ============================================

router.get('/ordens-compra', requirePermission('ver_compras'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const entity = await query("SELECT id FROM entities WHERE code = 'ordem_compra'");
    
    if (!entity.length) return res.json({ success: true, data: [] });
    const entityId = entity[0].id;

    let sql = `
      SELECT er.id, er.data, er.created_at, u.full_name as created_by_nome
      FROM entity_records er
      LEFT JOIN users u ON er.created_by = u.id
      WHERE er.entity_id = ? AND er.deleted_at IS NULL
    `;
    const params = [entityId];

    if (status) {
      sql += ` AND JSON_UNQUOTE(JSON_EXTRACT(er.data, '$.status')) = ?`;
      params.push(status);
    }

    sql += ' ORDER BY er.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [ordens, count] = await Promise.all([
      query(sql, params),
      query('SELECT COUNT(*) as total FROM entity_records WHERE entity_id = ? AND deleted_at IS NULL', [entityId])
    ]);

    const parsed = ordens.map(o => ({
      id: o.id,
      ...JSON.parse(o.data || '{}'),
      created_by: o.created_by_nome,
      created_at: o.created_at
    }));

    res.json({ 
      success: true, 
      data: parsed,
      pagination: { total: parseInt(count[0].total) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ordens-compra', requirePermission('criar_oc'), async (req, res) => {
  try {
    const { data } = req.body;
    const entity = await query("SELECT id FROM entities WHERE code = 'ordem_compra'");
    
    if (!entity.length) {
      return res.status(404).json({ error: 'Entidade ordem_compra não configurada' });
    }

    // Gera número automático
    const last = await query(`
      SELECT data->>'$.numero' as numero FROM entity_records 
      WHERE entity_id = ? AND data->>'$.numero' IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `, [entity[0].id]);

    let nextNum = 1;
    if (last.length > 0) {
      const match = last[0].numero.match(/(\D+)(\d+)/);
      if (match) nextNum = parseInt(match[2]) + 1;
    }
    data.numero = `OC-${String(nextNum).padStart(5, '0')}`;
    data.status = 'pendente';
    data.data_emissao = new Date().toISOString().split('T')[0];

    const id = uuidv4();
    await query(
      'INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (?, ?, ?, ?)',
      [id, entity[0].id, JSON.stringify(data), req.user.userId]
    );

    res.status(201).json({ success: true, id, data: { id, ...data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ordens-compra/:id/aprovar', requirePermission('aprovar_compra'), async (req, res) => {
  try {
    const { id } = req.params;
    const record = await query('SELECT * FROM entity_records WHERE id = ?', [id]);
    
    if (!record.length) {
      return res.status(404).json({ error: 'Ordem não encontrada' });
    }

    const data = JSON.parse(record[0].data);
    data.status = 'aprovada';
    data.data_aprovacao = new Date().toISOString().split('T')[0];
    data.aprovado_por = req.user.userId;

    await query(
      'UPDATE entity_records SET data = ? WHERE id = ?',
      [JSON.stringify(data), id]
    );

    // Log
    await query(`
      INSERT INTO audit_logs (user_id, action, entity_id, record_id, field_name, new_value, metadata)
      VALUES (?, 'ordem_compra.aprovar', ?, ?, 'status', ?, ?)
    `, [req.user.userId, record[0].entity_id, id, 'aprovada', JSON.stringify({ numero: data.numero })]);

    // Dispara regra de negócio (notificação ao fornecedor)
    global.io?.to(`role:compras`).emit('notification', {
      type: 'info',
      message: `Ordem de Compra ${data.numero} foi aprovada`,
      recordId: id
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

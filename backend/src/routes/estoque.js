const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ============================================
// ESTOQUE
// ============================================

async function getProdutoEntityId() {
  const entity = await query("SELECT id FROM entities WHERE code = 'produto'");
  return entity.length > 0 ? entity[0].id : null;
}

router.get('/', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { search, tipo } = req.query;

    const entityId = await getProdutoEntityId();
    if (!entityId) {
      return res.json({ success: true, data: [] });
    }

    let sql = `
      SELECT id, data, created_at, updated_at
      FROM entity_records 
      WHERE entity_id = ? AND deleted_at IS NULL
    `;
    const params = [entityId];

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

router.get('/:id', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { id } = req.params;
    const entityId = await getProdutoEntityId();
    if (!entityId) {
      return res.status(404).json({ error: 'Entidade produto não encontrada' });
    }

    const rows = await query(
      `SELECT id, data, created_at, updated_at FROM entity_records WHERE id = ? AND entity_id = ? AND deleted_at IS NULL`,
      [id, entityId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const p = rows[0];
    res.json({
      success: true,
      data: {
        id: p.id,
        ...JSON.parse(p.data || '{}'),
        created_at: p.created_at,
        updated_at: p.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const entityId = await getProdutoEntityId();
    if (!entityId) {
      return res.status(404).json({ error: 'Entidade produto não encontrada' });
    }

    const data = req.body || {};
    if (!data.descricao) {
      return res.status(400).json({ error: 'descricao é obrigatória' });
    }

    const id = uuidv4();
    const createdBy = req.user?.userId || null;

    await query(
      `INSERT INTO entity_records (id, entity_id, data, created_by, updated_by) VALUES (?, ?, ?, ?, ?)`,
      [id, entityId, JSON.stringify(data), createdBy, createdBy]
    );

    const rows = await query(
      `SELECT id, data, created_at, updated_at FROM entity_records WHERE id = ?`,
      [id]
    );

    const p = rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: p.id,
        ...JSON.parse(p.data || '{}'),
        created_at: p.created_at,
        updated_at: p.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { id } = req.params;
    const entityId = await getProdutoEntityId();
    if (!entityId) {
      return res.status(404).json({ error: 'Entidade produto não encontrada' });
    }

    const data = req.body || {};
    if (!data.descricao) {
      return res.status(400).json({ error: 'descricao é obrigatória' });
    }

    const updatedBy = req.user?.userId || null;

    const existing = await query(
      `SELECT id FROM entity_records WHERE id = ? AND entity_id = ? AND deleted_at IS NULL`,
      [id, entityId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await query(
      `UPDATE entity_records SET data = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_id = ?`,
      [JSON.stringify(data), updatedBy, id, entityId]
    );

    const rows = await query(
      `SELECT id, data, created_at, updated_at FROM entity_records WHERE id = ? AND entity_id = ?`,
      [id, entityId]
    );

    const p = rows[0];
    res.json({
      success: true,
      data: {
        id: p.id,
        ...JSON.parse(p.data || '{}'),
        created_at: p.created_at,
        updated_at: p.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { id } = req.params;
    const entityId = await getProdutoEntityId();
    if (!entityId) {
      return res.status(404).json({ error: 'Entidade produto não encontrada' });
    }

    const existing = await query(
      `SELECT id FROM entity_records WHERE id = ? AND entity_id = ? AND deleted_at IS NULL`,
      [id, entityId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await query(
      `UPDATE entity_records SET deleted_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_id = ?`,
      [req.user?.userId || null, id, entityId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

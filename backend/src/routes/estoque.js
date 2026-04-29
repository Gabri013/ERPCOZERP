const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ============================================
// ESTOQUE
// ============================================

router.get('/', requirePermission('ver_estoque'), async (req, res) => {
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

module.exports = router;

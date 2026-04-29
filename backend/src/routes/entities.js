const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ============================================
// ENTIDADES
// ============================================

// GET /api/entities — lista entidades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entities = await query(`
      SELECT 
        e.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', f.id, 'code', f.code, 'label', f.label, 'data_type', f.data_type,
                      'required', f.required, 'display_order', f.display_order)
        ) FROM entity_fields f WHERE f.entity_id = e.id ORDER BY f.display_order) as fields
      FROM entities e
      ORDER BY e.name
    `);

    const parsed = entities.map(e => ({
      ...e,
      fields: e.fields ? JSON.parse(e.fields) : [],
      layout: e.layout ? JSON.parse(e.layout) : {}
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/entities/:code — uma entidade com campos
router.get('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    const entities = await query(`
      SELECT 
        e.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', f.id, 'code', f.code, 'label', f.label, 
                      'data_type', f.data_type, 'data_type_params', f.data_type_params,
                      'required', f.required, 'unique_field', f.unique_field,
                      'readonly', f.readonly, 'hidden', f.hidden,
                      'default_value', f.default_value, 'validation_rules', f.validation_rules,
                      'display_order', f.display_order, 'width', f.width)
        ) FROM entity_fields f WHERE f.entity_id = e.id ORDER BY f.display_order) as fields
      FROM entities e WHERE e.code = ?
    `, [code]);

    if (entities.length === 0) {
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }

    const entity = entities[0];
    res.json({
      ...entity,
      fields: entity.fields ? JSON.parse(entity.fields) : [],
      layout: entity.layout ? JSON.parse(entity.layout) : {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/entities — criar entidade (master apenas)
router.post('/', requirePermission('entity.*.create'), async (req, res) => {
  try {
    const { code, name, description, icon, type, category, layout, fields } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ error: 'Code, name e type são obrigatórios' });
    }

    // Verifica se já existe
    const exists = await query('SELECT id FROM entities WHERE code = ?', [code]);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Entidade com este código já existe' });
    }

    const id = require('uuid').v4();
    
    await query(`
      INSERT INTO entities (id, code, name, description, icon, type, category, layout, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, code, name, description, icon, type, category, JSON.stringify(layout || {}), req.user.userId]);

    // Criar campos se fornecidos
    if (fields && Array.isArray(fields)) {
      for (const field of fields) {
        await query(`
          INSERT INTO entity_fields 
          (id, entity_id, code, label, data_type, data_type_params, required, 
           unique_field, readonly, hidden, default_value, validation_rules, display_order, width)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, field.code, field.label, field.data_type,
          JSON.stringify(field.data_type_params || {}),
          field.required || false,
          field.unique_field || false,
          field.readonly || false,
          field.hidden || false,
          JSON.stringify(field.default_value || null),
          JSON.stringify(field.validation_rules || null),
          field.display_order || 0,
          field.width || null
        ]);
      }
    }

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/entities/:id — atualizar entidade
router.put('/:id', requirePermission('entity.*.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, layout } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (layout !== undefined) { updates.push('layout = ?'); params.push(JSON.stringify(layout)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);
    await query(`UPDATE entities SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/entities/:id
router.delete('/:id', requirePermission('entity.*.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se é entidade do sistema
    const entity = await query('SELECT is_system FROM entities WHERE id = ?', [id]);
    if (entity.length > 0 && entity[0].is_system) {
      return res.status(400).json({ error: 'Entidade do sistema não pode ser deletada' });
    }

    await query('DELETE FROM entity_fields WHERE entity_id = ?', [id]);
    await query('DELETE FROM entities WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

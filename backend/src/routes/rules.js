const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { RuleEngine } = require('../services/ruleEngine');

const router = express.Router();

// ============================================
// REGRAS DE NEGÓCIO
// ============================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    let sql = `
      SELECT r.*, e.code as entity_code, e.name as entity_name
      FROM business_rules r
      JOIN entities e ON r.entity_id = e.id
    `;
    
    const params = [];
    
    if (entity_id) {
      sql += ' WHERE r.entity_id = ?';
      params.push(entity_id);
    }
    
    sql += ' ORDER BY r.priority ASC, r.created_at DESC';

    const rules = await query(sql, params);
    
    const parsed = rules.map(r => {
      const safeParse = (val) => {
        if (typeof val === 'string' && val.trim()) {
          try { return JSON.parse(val); } catch { return val; }
        }
        return val || (Array.isArray(val) ? val : []);
      };
      return {
        ...r,
        trigger_conditions: safeParse(r.trigger_conditions),
        actions: safeParse(r.actions),
        config: safeParse(r.config)
      };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const rules = await query(`
      SELECT r.*, e.code as entity_code, e.name as entity_name
      FROM business_rules r
      JOIN entities e ON r.entity_id = e.id
      WHERE r.id = ?
    `, [id]);

    if (rules.length === 0) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }

    const rule = rules[0];
    res.json({
      ...rule,
      trigger_conditions: rule.trigger_conditions ? JSON.parse(rule.trigger_conditions) : [],
      actions: rule.actions ? JSON.parse(rule.actions) : [],
      config: rule.config ? JSON.parse(rule.config) : {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePermission('rule.manage'), async (req, res) => {
  try {
    const { 
      entity_id, code, name, description, is_active, priority,
      trigger_event, trigger_conditions, condition_expression, 
      actions, stop_processing 
    } = req.body;

    if (!entity_id || !code || !name || !trigger_event || !actions) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const id = require('uuid').v4();
    
    await query(`
      INSERT INTO business_rules 
      (id, entity_id, code, name, description, is_active, priority,
       trigger_event, trigger_conditions, condition_expression, actions, stop_processing, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, entity_id, code, name, description, is_active !== false, priority || 100,
      trigger_event,
      JSON.stringify(trigger_conditions || []),
      condition_expression,
      JSON.stringify(actions),
      stop_processing || false,
      req.user.userId
    ]);

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requirePermission('rule.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, is_active, priority,
      trigger_event, trigger_conditions, condition_expression, 
      actions, stop_processing 
    } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
    if (trigger_event !== undefined) { updates.push('trigger_event = ?'); params.push(trigger_event); }
    if (trigger_conditions !== undefined) { updates.push('trigger_conditions = ?'); params.push(JSON.stringify(trigger_conditions)); }
    if (condition_expression !== undefined) { updates.push('condition_expression = ?'); params.push(condition_expression); }
    if (actions !== undefined) { updates.push('actions = ?'); params.push(JSON.stringify(actions)); }
    if (stop_processing !== undefined) { updates.push('stop_processing = ?'); params.push(stop_processing); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);
    
    await query(`UPDATE business_rules SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requirePermission('rule.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM business_rules WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXECUÇÃO MANUAL DE REGRAS
// ============================================

router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({ error: 'recordId é obrigatório' });
    }

    // Busca a regra
    const rules = await query('SELECT * FROM business_rules WHERE id = ?', [id]);
    if (rules.length === 0) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }

    const rule = rules[0];
    const record = await query(
      'SELECT * FROM entity_records WHERE id = ?',
      [recordId]
    );

    if (record.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    // Executa regra
    const result = await RuleEngine.evaluateAndExecute(
      rule, 
      { ...record[0], id: recordId }, 
      req.user.userId
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

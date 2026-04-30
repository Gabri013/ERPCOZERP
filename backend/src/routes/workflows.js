const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { WorkflowEngine } = require('../services/workflowEngine');

const router = express.Router();

// ============================================
// WORKFLOWS
// ============================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    let sql = `
      SELECT w.*, e.name as entity_name, e.code as entity_code,
             (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', ws.id, 'code', ws.code, 'label', ws.label, 
                           'description', ws.description, 'color', ws.color,
                           'sort_order', ws.sort_order, 'is_initial', ws.is_initial,
                           'is_final', ws.is_final, 'approver_roles', ws.approver_roles,
                           'can_edit_fields', ws.can_edit_fields, 
                           'can_assign_to_roles', ws.can_assign_to_roles,
                           'required_approval', ws.required_approval)
              ) FROM workflow_steps ws WHERE ws.workflow_id = w.id ORDER BY ws.sort_order) as steps
      FROM workflows w
      JOIN entities e ON w.entity_id = e.id
    `;
    
    const params = [];
    
    if (entity_id) {
      sql += ' WHERE w.entity_id = ?';
      params.push(entity_id);
    }
    
    sql += ' ORDER BY w.created_at DESC';

    const workflows = await query(sql, params);
    
    console.log('[WORKFLOWS DEBUG] Raw result:', JSON.stringify(workflows[0], null, 2));
    
    const parsed = workflows.map(w => ({
      ...w,
      steps: w.steps ? (typeof w.steps === 'string' ? JSON.parse(w.steps) : w.steps) : [],
      config: w.config ? (typeof w.config === 'string' ? JSON.parse(w.config) : w.config) : {}
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflows = await query(`
      SELECT w.*, e.name as entity_name, e.code as entity_code,
             (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', ws.id, 'code', ws.code, 'label', ws.label,
                           'description', ws.description, 'color', ws.color,
                           'sort_order', ws.sort_order, 'is_initial', ws.is_initial,
                           'is_final', ws.is_final, 'approver_roles', ws.approver_roles,
                           'can_edit_fields', ws.can_edit_fields,
                           'can_assign_to_roles', ws.can_assign_to_roles,
                           'required_approval', ws.required_approval)
              ) FROM workflow_steps ws WHERE ws.workflow_id = w.id ORDER BY ws.sort_order) as steps,
             (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', wt.id, 'from_step_code', wt.from_step_code,
                           'to_step_code', wt.to_step_code, 'allowed_roles', wt.allowed_roles,
                           'condition_expression', wt.condition_expression, 'actions', wt.actions)
              ) FROM workflow_transitions wt WHERE wt.workflow_id = w.id) as transitions
      FROM workflows w
      JOIN entities e ON w.entity_id = e.id
      WHERE w.id = ?
    `, [id]);

    if (workflows.length === 0) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }

    const wf = workflows[0];
    res.json({
      ...wf,
      steps: wf.steps ? JSON.parse(wf.steps) : [],
      transitions: wf.transitions ? JSON.parse(wf.transitions) : [],
      config: wf.config ? JSON.parse(wf.config) : {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePermission('workflow.create'), async (req, res) => {
  try {
    const { entity_id, code, name, description, is_active, steps, transitions, config } = req.body;

    if (!entity_id || !code || !name) {
      return res.status(400).json({ error: 'entity_id, code e name são obrigatórios' });
    }

    const id = require('uuid').v4();
    
    await query(`
      INSERT INTO workflows (id, entity_id, code, name, description, is_active, config, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, entity_id, code, name, description, is_active || true, JSON.stringify(config || {}), req.user.userId]);

    // Criar etapas
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await query(`
          INSERT INTO workflow_steps 
          (id, workflow_id, code, label, description, color, sort_order,
           is_initial, is_final, approver_roles, can_edit_fields, 
           can_assign_to_roles, required_approval)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, step.code, step.label, step.description, step.color, step.sort_order || 0,
          step.is_initial || false, step.is_final || false,
          JSON.stringify(step.approver_roles || []),
          JSON.stringify(step.can_edit_fields || []),
          JSON.stringify(step.can_assign_to_roles || []),
          step.required_approval || false
        ]);
      }
    }

    // Criar transições
    if (transitions && Array.isArray(transitions)) {
      for (const t of transitions) {
        await query(`
          INSERT INTO workflow_transitions 
          (id, workflow_id, from_step_code, to_step_code, allowed_roles, condition_expression, actions)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?)
        `, [
          id, t.from_step_code, t.to_step_code,
          JSON.stringify(t.allowed_roles || []),
          t.condition_expression,
          JSON.stringify(t.actions || [])
        ]);
      }
    }

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/workflows/:id/transition
 * Executa transição de workflow
 */
router.post('/:id/transition', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { recordId, toStep, reason, options } = req.body;

    if (!recordId || !toStep) {
      return res.status(400).json({ error: 'recordId e toStep são obrigatórios' });
    }

    const engine = new WorkflowEngine();
    const result = await engine.transition(
      recordId,
      req.query.entityId,
      toStep,
      req.user.userId,
      { reason, ...options }
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/workflows/:id/steps
 * Lista etapas de um workflow
 */
router.get('/:id/steps', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const steps = await query(
      'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY sort_order',
      [id]
    );
    res.json({ success: true, data: steps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

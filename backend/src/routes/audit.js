const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission, requireMaster } = require('../middleware/auth');
const { AuditLogger } = require('../services/auditLogger');

const router = express.Router();

// ============================================
// AUDIT LOGS
// ============================================

router.get('/', requirePermission('system.audit'), async (req, res) => {
  try {
    const { 
      user_id, entity_id, action, 
      page = 1, limit = 100, 
      start_date, end_date 
    } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;

    let sql = `
      SELECT al.*, 
        u.full_name as user_name, 
        u.email as user_email,
        e.name as entity_name, 
        e.code as entity_code,
        (SELECT JSON_OBJECT('id', r.id, 'code', r.code) 
         FROM entity_records r WHERE r.id = al.record_id LIMIT 1) as record_summary
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN entities e ON al.entity_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (user_id) { sql += ' AND al.user_id = ?'; params.push(user_id); }
    if (entity_id) { sql += ' AND al.entity_id = ?'; params.push(entity_id); }
    if (action) { sql += ' AND al.action = ?'; params.push(action); }
    if (start_date) { sql += ' AND al.created_at >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND al.created_at <= ?'; params.push(end_date + ' 23:59:59'); }

    sql += ` ORDER BY al.created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const logs = await query(sql, params);
    
    const parsed = logs.map(l => ({
      ...l,
      metadata: l.metadata ? JSON.parse(l.metadata) : {},
      old_value: l.old_value ? JSON.parse(l.old_value) : null,
      new_value: l.new_value ? JSON.parse(l.new_value) : null
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/record/:recordId', requirePermission('system.audit'), async (req, res) => {
  try {
    const { recordId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await AuditLogger.getRecordHistory(
      req.query.entityId,
      recordId,
      limit
    );

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', requirePermission('system.audit'), async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await AuditLogger.getUserActivity(userId, limit);

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ACCESS LOGS
// ============================================

router.get('/access', requirePermission('system.audit'), async (req, res) => {
  try {
    const { user_id, endpoint, page = 1, limit = 100 } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;
    
    let sql = `SELECT * FROM access_logs WHERE 1=1`;
    const params = [];
    
    if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
    if (endpoint) { sql += ' AND endpoint LIKE ?'; params.push(`%${endpoint}%`); }
    
    sql += ` ORDER BY created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const logs = await query(sql, params);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CONFIG VERSIONS
// ============================================

router.get('/versions', requirePermission('system.config'), async (req, res) => {
  try {
    const versions = await query(`
      SELECT cv.*, u.full_name as created_by_name
      FROM config_versions cv
      JOIN users u ON cv.created_by = u.id
      ORDER BY cv.created_at DESC
    `);

    const parsed = versions.map(v => ({
      ...v,
      snapshot: v.snapshot ? JSON.parse(v.snapshot) : null
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/versions', requireMaster, async (req, res) => {
  try {
    const { version_tag, description, snapshot } = req.body;

    if (!version_tag || !snapshot) {
      return res.status(400).json({ error: 'version_tag e snapshot são obrigatórios' });
    }

    const id = require('uuid').v4();
    await query(`
      INSERT INTO config_versions (id, version_tag, description, snapshot, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [id, version_tag, description, JSON.stringify(snapshot), req.user.userId]);

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/versions/:id/restore', requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Registra restore no log
    await query(
      'UPDATE config_versions SET restored_at = NOW(), restored_by = ? WHERE id = ?',
      [req.user.userId, id]
    );

    // Implementar restauração real dos dados
    res.json({ success: true, message: 'Configuração restaurada (implementar restore real)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

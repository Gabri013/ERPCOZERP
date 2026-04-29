const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================

router.get('/', requirePermission('system.config'), async (req, res) => {
  try {
    const configs = await query('SELECT * FROM system_config ORDER BY config_key');
    res.json({ 
      success: true, 
      data: configs.reduce((acc, c) => {
        acc[c.config_key] = JSON.parse(c.value);
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:key', requirePermission('system.config'), async (req, res) => {
  try {
    const { key } = req.params;
    const config = await query('SELECT * FROM system_config WHERE config_key = ?', [key]);
    
    if (config.length === 0) {
      return res.status(404).json({ error: 'Config não encontrada' });
    }

    res.json({ success: true, data: {
      [key]: JSON.parse(config[0].value)
    }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', requirePermission('system.config'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'value é obrigatório' });
    }

    await query(`
      INSERT INTO system_config (config_key, value, description, updated_by) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description), 
                                updated_by = VALUES(updated_by), updated_at = NOW()
    `, [key, JSON.stringify(value), description || null, req.user.userId]);

    // Log
    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES (?, 'config.update', ?)
    `, [req.user.userId, JSON.stringify({ key, value })]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DASHBOARD CONFIG (personalização do usuário)
// ============================================

router.get('/dashboard/:userId?', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    
    // Apenas o próprio usuário ou admin pode ver
    if (userId !== req.user.userId && !req.user.roles?.includes('master')) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const configs = await query(
      'SELECT * FROM system_config WHERE config_key LIKE ? AND is_encrypted = FALSE',
      [`dashboard_${userId}%`]
    );

    res.json({ 
      success: true, 
      data: configs.reduce((acc, c) => {
        acc[c.config_key.replace(`dashboard_${userId}_`, '')] = JSON.parse(c.value);
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

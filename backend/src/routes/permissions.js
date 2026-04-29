const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission, requireMaster } = require('../middleware/auth');

const router = express.Router();

// ============================================
// PERMISSÕES E ROLES
// ============================================

// GET /api/permissions/roles — lista perfis
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.*, 
        (SELECT JSON_ARRAYAGG(DISTINCT p.code) 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE rp.role_id = r.id AND rp.granted = TRUE) as permissions
      FROM roles r 
      ORDER BY r.created_at
    `);

    const parsed = roles.map(r => ({
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : []
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/permissions/permissions — lista todas permissões disponíveis
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const perms = await query('SELECT * FROM permissions ORDER BY category, code');
    res.json({ success: true, data: perms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/permissions/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userData = await query(`
      SELECT 
        u.id, u.email,
        (SELECT JSON_ARRAYAGG(r.code) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id) as roles,
        (SELECT JSON_ARRAYAGG(DISTINCT CONCAT(p.category,'.',p.code)) 
         FROM user_roles ur 
         JOIN role_permissions rp ON ur.role_id = rp.role_id 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE ur.user_id = u.id AND rp.granted = TRUE) as permissions
      FROM users u WHERE u.id = ?
    `, [userId]);

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userData[0];
    res.json({
      userId: user.id,
      email: user.email,
      roles: user.roles ? JSON.parse(user.roles) : [],
      permissions: user.permissions ? JSON.parse(user.permissions) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/permissions/user/:userId/roles — define papéis do usuário
router.put('/user/:userId/roles', requirePermission('user.manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles } = req.body; // array de role codes

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles deve ser um array' });
    }

    const db = require('../config/database');
    const client = await db.getClient();
    
    try {
      await client.beginTransaction();

      // Remove todos os papéis atuais
      await client.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

      // Adiciona novos papéis
      for (const roleCode of roles) {
        const role = await client.query('SELECT id FROM roles WHERE code = ?', [roleCode]);
        if (role.length > 0) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
            [userId, role[0].id, req.user.userId]
          );
        }
      }

      await client.commit();
      res.json({ success: true });
    } catch (err) {
      await client.rollback();
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/permissions/role/:roleCode/permissions — define permissões do papel
router.put('/role/:roleCode/permissions', requireMaster, async (req, res) => {
  try {
    const { roleCode } = req.params;
    const { permissions } = req.body; // [{ permissionCode: 'entity.*.read', granted: true }]

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions deve ser um array' });
    }

    const db = require('../config/database');
    const client = await db.getClient();

    try {
      await client.beginTransaction();

      // Busca role
      const role = await client.query('SELECT id FROM roles WHERE code = ?', [roleCode]);
      if (role.length === 0) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }
      const roleId = role[0].id;

      // Remove permissões atuais
      await client.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      // Adiciona novas permissões
      for (const perm of permissions) {
        const permRecord = await client.query('SELECT id FROM permissions WHERE code = ?', [perm.permissionCode]);
        if (permRecord.length > 0) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id, granted, conditions) VALUES (?, ?, ?, ?)',
            [
              roleId,
              permRecord[0].id,
              perm.granted !== false, // default true
              JSON.stringify(perm.conditions || [])
            ]
          );
        }
      }

      await client.commit();
      res.json({ success: true });
    } catch (err) {
      await client.rollback();
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// VALIDAÇÃO DE PERMISSÃO
// ============================================

router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { action, entity, record } = req.body;
    
    const allowed = await req.permissionEngine?.can(action, entity, { record });
    
    res.json({ 
      success: true, 
      allowed,
      reason: !allowed ? 'permission_denied' : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

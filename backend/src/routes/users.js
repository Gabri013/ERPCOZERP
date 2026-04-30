const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { AuthService } = require('../services/authService');

const router = express.Router();

// GET /api/users — lista usuários
router.get('/', requirePermission('user.manage'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const limitValue = parseInt(limit, 10);
    const offsetValue = (parseInt(page, 10) - 1) * limitValue;
    
    let sql = `
      SELECT 
        u.id, u.email, u.full_name, u.active, u.email_verified, 
        u.last_login_at, u.created_at,
        (SELECT JSON_ARRAYAGG(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u
    `;
    
    const params = [];
    
    if (search) {
      sql += ' WHERE u.email LIKE ? OR u.full_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY u.created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const users = await query(sql, params);
    
    // Parse roles JSON
    const parsedUsers = users.map(u => ({
      ...u,
      roles: u.roles ? JSON.parse(u.roles) : []
    }));

    res.json({ 
      success: true, 
      data: parsedUsers,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', requirePermission('user.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await query(`
      SELECT 
        u.*,
        (SELECT JSON_ARRAYAGG(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      active: user.active,
      email_verified: user.email_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      roles: user.roles ? JSON.parse(user.roles) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — criar usuário
router.post('/', requirePermission('user.manage'), async (req, res) => {
  try {
    const { email, password, full_name, roles = [] } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Email, senha e nome são obrigatórios' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
    }

    const user = await AuthService.createUser({ 
      email, 
      password, 
      full_name, 
      roles 
    });

    // Log auditoria
    await query(`
      INSERT INTO audit_logs (user_id, action, record_id, metadata)
      VALUES (?, 'user.create', ?, ?)
    `, [req.user.id, user.id, JSON.stringify({ email, roles })]);

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id — atualizar usuário
router.put('/:id', requirePermission('user.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, active, roles } = req.body;

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Atualizar papéis se fornecido
    if (roles) {
      await query('DELETE FROM user_roles WHERE user_id = ?', [id]);
      
      for (const roleCode of roles) {
        const role = await query('SELECT id FROM roles WHERE code = ?', [roleCode]);
        if (role.length > 0) {
          await query(
            'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
            [id, role[0].id, req.user.id]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requirePermission('user.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permite deletar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar próprio usuário' });
    }

    await query('UPDATE users SET active = FALSE WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me — usuário logado
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const users = await query(`
      SELECT 
        u.id, u.email, u.full_name, u.active, u.email_verified, 
        u.last_login_at, u.created_at,
        (SELECT JSON_ARRAYAGG(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u WHERE u.id = ?
    `, [req.user.userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];
    res.json({
      ...user,
      roles: user.roles ? JSON.parse(user.roles) : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me/profile
router.put('/me/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name } = req.body;
    
    await query(
      'UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?',
      [full_name, req.user.userId]
    );

    res.json({ success: true, message: 'Perfil atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/roles — lista todos os perfis
router.get('/roles/list', authenticateToken, async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.*, 
        (SELECT JSON_ARRAYAGG(DISTINCT p.code) 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE rp.role_id = r.id AND rp.granted = 1) as permissions
      FROM roles r ORDER BY r.code
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

module.exports = router;

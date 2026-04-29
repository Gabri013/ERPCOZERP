const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requirePermission, requireMaster } = require('../middleware/auth');
const { ImpersonationService } = require('../services/impersonationService');

const router = express.Router();

// ============================================
// ADMIN: IMPERSONATION (MASTER ONLY)
// ============================================

/**
 * POST /api/admin/impersonate/:userId
 * Master inicia sessão como outro usuário
 */
router.post('/impersonate/:userId', requireMaster, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Valida se master pode impersonar
    const can = await ImpersonationService.canImpersonate(req.user.userId, userId);
    if (!can.allowed) {
      return res.status(403).json({ error: can.reason });
    }

    const result = await ImpersonationService.startImpersonation(
      req.user.userId,
      userId,
      reason || 'Suporte administrativo',
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        sessionToken: req.token
      }
    );

    res.json({
      success: true,
      token: result.impersonationToken,
      user: result.user,
      message: `Agora você está visualizando como ${result.user.full_name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/stop-impersonate
 * Master retorna à sua própria conta
 */
router.post('/stop-impersonate', authenticateToken, async (req, res) => {
  try {
    // O usuário atual deve estar em modo impressonation para parar
    if (!req.isImpersonating) {
      return res.status(400).json({ 
        error: 'Você não está em modo de impersonation' 
      });
    }

    const token = req.token; // token da sessão atual (impersonation)
    await ImpersonationService.endImpersonation(
      req.originalMasterUserId,
      token
    );

    res.json({
      success: true,
      message: 'Retornando à conta original...',
      redirect: '/dashboard'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/impersonation/status
 * Verifica se está em modo impersonation atualmente
 */
router.get('/impersonation/status', authenticateToken, async (req, res) => {
  try {
    if (req.isImpersonating) {
      const db = require('../config/database');
      
      // Busca detalhes do usuário que está sendo impressonado
      const user = await db.query(
        'SELECT id, email, full_name, active FROM users WHERE id = ?',
        [req.user.userId]
      );

      const master = await db.query(
        'SELECT id, email, full_name FROM users WHERE id = ?',
        [req.originalMasterUserId]
      );

      res.json({
        isImpersonating: true,
        impersonatedUser: user[0],
        masterUser: master[0],
        startedAt: req.user.impersonationStartedAt || new Date().toISOString()
      });
    } else {
      res.json({
        isImpersonating: false,
        user: {
          id: req.user.userId,
          email: req.user.email,
          full_name: req.user.full_name
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/impersonation/history
 * Histórico de impersonation do master logado
 */
router.get('/impersonation/history', requireMaster, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await ImpersonationService.getImpersonationHistory(
      req.user.userId,
      limit
    );

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ADMIN: VISUALIZAÇÃO DE USUÁRIO
// ============================================

/**
 * GET /api/admin/user/:userId/permissions
 * Master vê todas as permissões REAIS de um usuário
 */
router.get('/user/:userId/permissions', requireMaster, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica se usuário existe
    const user = await query(
      'SELECT id, email, full_name, active FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = user[0];

    // Busca papéis
    const roles = await query(`
      SELECT r.code, r.name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);

    // Busca permissões diretas (via papéis)
    const permissions = await query(`
      SELECT DISTINCT p.code, p.name, p.category, p.type
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN user_roles ur ON ur.role_id = rp.role_id
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND rp.granted = TRUE
      ORDER BY p.category, p.code
    `, [userId]);

    // Calcula permissões efetivas (após herança)
    const effectivePermissions = await this.calculateEffectivePermissions(userId);

    res.json({
      success: true,
      data: {
        user: userData,
        roles,
        directPermissions: permissions,
        effectivePermissions, // inclui herança e regras ABAC
        loginHistory: await this.getLoginHistory(userId),
        recentActivity: await this.getUserActivity(userId, 20)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/user/:userId/activity
 * Atividade completa de um usuário (audit log)
 */
router.get('/user/:userId/activity', requireMaster, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      action, 
      start_date, 
      end_date 
    } = req.query;

    let sql = `
      SELECT 
        al.*,
        e.code as entity_code,
        e.name as entity_name
      FROM audit_logs al
      LEFT JOIN entities e ON al.entity_id = e.id
      WHERE al.user_id = ?
    `;
    const params = [userId];

    if (action) {
      sql += ' AND al.action = ?';
      params.push(action);
    }

    if (start_date) {
      sql += ' AND al.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND al.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

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

/**
 * GET /api/admin/user/:userId/access-tokens
 * Sessões ativas do usuário
 */
router.get('/user/:userId/sessions', requireMaster, async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await query(`
      SELECT 
        id,
        session_token,
        ip_address,
        user_agent,
        created_at,
        last_activity_at,
        expires_at,
        CASE WHEN expires_at > NOW() THEN 'active' ELSE 'expired' END as status
      FROM user_sessions
      WHERE user_id = ?
      ORDER BY last_activity_at DESC
    `, [userId]);

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/user/:userId/force-logout
 * Master força logout de um usuário (segurança)
 */
router.post('/user/:userId/force-logout', requireMaster, async (req, res) => {
  try {
    const { userId } = req.params;

    // Invalida todas as sessões do usuário
    await query(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [userId]
    );

    // Log
    await query(`
      INSERT INTO audit_logs 
      (user_id, action, entity_id, metadata)
      VALUES (?, 'admin.force_logout', ?, ?)
    `, [
      req.user.userId,
      userId,
      JSON.stringify({ 
        reason: req.body.reason || 'Admin forcou logout',
        performedBy: req.user.userId
      })
    ]);

    res.json({ 
      success: true, 
      message: 'Usuário desconectado de todas as sessões' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/company/overview
 * Master vê visão geral de todos os usuários
 */
router.get('/company/overview', requireMaster, async (req, res) => {
  try {
    const overview = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN last_login_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_last_week,
        COUNT(DISTINCT ur.role_id) as roles_distribution
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
    `);

    // Usuários por papel
    const byRole = await query(`
      SELECT r.code, r.name, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.code, r.name
      ORDER BY count DESC
    `);

    // Últimos logins
    const recentLogins = await query(`
      SELECT 
        u.id, u.email, u.full_name, u.last_login_at,
        (SELECT GROUP_CONCAT(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u
      WHERE u.last_login_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY u.last_login_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: {
        overview: overview[0],
        byRole,
        recentLogins
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HELPERS
// ============================================

async function calculateEffectivePermissions(userId) {
  const db = require('../config/database');
  
  // Busca todas permissões (via papéis + condições ABAC)
  const perms = await db.query(`
    SELECT 
      p.code,
      p.category,
      p.type,
      p.target_entity,
      p.target_field,
      rp.conditions,
      r.code as role_code
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND rp.granted = TRUE
    ORDER BY p.category, p.code
  `, [userId]);

  // Agrupa por permissão e consolida condições
  const effective = {};
  
  for (const p of perms) {
    if (!effective[p.code]) {
      effective[p.code] = {
        code: p.code,
        category: p.category,
        type: p.type,
        granted: true,
        conditions: [],
        viaRoles: []
      };
    }
    
    if (p.conditions) {
      effective[p.code].conditions.push(...JSON.parse(p.conditions));
    }
    if (p.role_code) {
      effective[p.code].viaRoles.push(p.role_code);
    }
  }

  // TODO: Avaliar condições ABAC em runtime para cada recurso
  // Esta é uma versão simplificada

  return Object.values(effective);
}

async function getLoginHistory(userId, limit = 10) {
  const db = require('../config/database');
  
  const logs = await db.query(`
    SELECT 
      al.ip_address,
      al.user_agent,
      al.created_at,
      al.metadata
    FROM audit_logs al
    WHERE al.user_id = ? AND al.action = 'login'
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [userId, limit]);

  return logs.map(l => ({
    ip: l.ip_address,
    userAgent: l.user_agent,
    timestamp: l.created_at,
    metadata: l.metadata ? JSON.parse(l.metadata) : {}
  }));
}

async function getUserActivity(userId, limit = 50) {
  const db = require('../config/database');
  
  const logs = await db.query(`
    SELECT 
      al.action,
      al.created_at,
      al.metadata,
      e.code as entity_code,
      e.name as entity_name
    FROM audit_logs al
    LEFT JOIN entities e ON al.entity_id = e.id
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `, [userId, parseInt(limit)]);

  return logs.map(l => ({
    action: l.action,
    timestamp: l.created_at,
    entity: l.entity_name,
    metadata: l.metadata ? JSON.parse(l.metadata) : {}
  }));
}

module.exports = router;

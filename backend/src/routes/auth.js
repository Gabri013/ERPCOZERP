const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { AuthService } = require('../services/authService');
const { PermissionEngine } = require('../services/permissionEngine');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

function isDatabaseConnectionError(err) {
  return ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ENOTFOUND'].includes(err?.code);
}

async function safeAuditLog(sql, params) {
  try {
    await query(sql, params);
  } catch (logErr) {
    console.error('[auth] Falha ao gravar auditoria:', logErr.message);
  }
}

// ============================================
// LOGIN
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const result = await AuthService.authenticate(email, password, ip, userAgent);
    
    // Log login success
    await safeAuditLog(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata) 
       VALUES (?, 'login', ?, ?, ?)`,
      [result.user.id, ip, userAgent, JSON.stringify({ success: true })]
    );

    res.json(result);
  } catch (err) {
    // Log failed attempt
    await safeAuditLog(
      `INSERT INTO audit_logs (action, ip_address, user_agent, metadata) 
       VALUES ('login_failed', ?, ?, ?)`,
      [req.ip, req.get('user-agent'), JSON.stringify({ 
        error: err.message, 
        email: req.body.email 
      })]
    );

    const status = isDatabaseConnectionError(err) ? 503 : 401;
    res.status(status).json({ error: err.message });
  }
});

// ============================================
// REFRESH TOKEN
// ============================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token obrigatório' });
    }

    const result = await AuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await AuthService.logout(token);
    }
    res.json({ success: true, message: 'Logout realizado' });
  } catch (err) {
    res.json({ success: true }); // Sempre sucesso
  }
});

// ============================================
// VERIFICAÇÃO DE TOKEN (para renovação automática)
// ============================================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = await AuthService.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

// ============================================
// ALTERAR SENHA
// ============================================
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova são obrigatórias' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' });
    }

    await AuthService.changePassword(userId, currentPassword, newPassword);
    
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// PERFIL DO USUÁRIO ATUAL
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Retorna dados do usuário que estão no JWT token
    const user = req.user;
    
    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.email,
      roles: user.roles || [],
      iat: user.iat,
      exp: user.exp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

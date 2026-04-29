const jwt = require('jsonwebtoken');
const { AuthService } = require('../services/authService');

/**
 * Middleware de autenticação
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso required' });
  }

  try {
    const decoded = await AuthService.verifyToken(token);
    
    // Verifica se é modo impersonation
    const { ImpersonationService } = require('../services/impersonationService');
    if (ImpersonationService.isImpersonationRequest(token)) {
      req.isImpersonating = true;
      req.originalMasterUserId = decoded.impersonatedBy;
      req.impersonationSessionId = decoded.sessionId;
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

/**
 * Middleware de autorização (RBAC)
 */
const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Se está em modo impersonation, permissões são do usuário alvo
      if (req.isImpersonating) {
        // Em modo impersonation, valida permissões do usuário que está sendo visualizado
        // Mas actions são logadas como "feitas pelo master"
        // Para simplificar: usa permissões do usuário alvo
      }

      const { PermissionEngine } = require('../services/permissionEngine');
      const engine = new PermissionEngine(req.user, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        isImpersonating: req.isImpersonating,
        originalMasterId: req.originalMasterUserId
      });

      const action = permissionCode.split('.')[1] || 'read';
      const entity = permissionCode.split('.')[0] || req.params.entityId;

      const hasPerm = await engine.can(
        action,
        entity,
        {
          record: req.body,
          field: req.body.field,
          workflowStep: req.body.status
        }
      );

      if (!hasPerm) {
        return res.status(403).json({
          error: 'Acesso negado',
          code: 'PERMISSION_DENIED',
          required: permissionCode
        });
      }

      req.permissionEngine = engine;
      next();
    } catch (err) {
      console.error('Permission error:', err);
      res.status(500).json({ error: 'Erro de autorização' });
    }
  };
};

/**
 * Middleware: Master-only
 */
const requireMaster = (req, res, next) => {
  if (!req.user?.roles?.includes('master')) {
    return res.status(403).json({ error: 'Acesso exclusivo ao Master' });
  }
  next();
};

/**
 * Middleware: Ativação de conta requerida
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user?.email_verified) {
    return res.status(403).json({ 
      error: 'Email não verificado', 
      code: 'EMAIL_NOT_VERIFIED' 
    });
  }
  next();
};

/**
 * Middleware: Check user active
 */
const requireActiveUser = (req, res, next) => {
  if (!req.user?.active) {
    return res.status(403).json({ error: 'Usuário inativo' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireMaster,
  requireEmailVerified,
  requireActiveUser
};

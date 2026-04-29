/**
 * Serviço de Impersonation (Master visualiza como outro usuário)
 * 
 * Use cases:
 * - Suporte: master vê o sistema como cliente
 * - Debug: entender problema de permissão
 * - Auditoria: verificar comportamento real
 */

class ImpersonationService {
  constructor() {
    this.activeSessions = new Map(); // masterUserId -> impersonation data
  }

  /**
   * Inicia sessão de impersonation
   * @param {string} masterUserId — ID do master
   * @param {string} targetUserId — ID do usuário a ser impersonado
   * @param {string} reason — motivo (suporte, debug, etc)
   * @param {object} context — ip, userAgent, sessionToken
   * @returns {Promise<{success: boolean, impersonationToken}>}
   */
  static async startImpersonation(masterUserId, targetUserId, reason = '', context = {}) {
    const db = require('../config/database');

    // 1. Validações de segurança
    // ← Implementar validações

    // 2. Busca dados do usuário alvo
    const targetUser = await db.query(
      'SELECT * FROM users WHERE id = ? AND active = TRUE',
      [targetUserId]
    );

    if (targetUser.length === 0) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    const target = targetUser[0];

    // 3. Gera token especial de impersonation
    const jwt = require('jsonwebtoken');
    const { v4: uuidv4 } = require('uuid');
    
    const impersonationToken = jwt.sign(
      {
        userId: targetUserId,
        email: target.email,
        roles: await this.getUserRoles(targetUserId),
        impersonatedBy: masterUserId,
        impersonation: true,
        sessionId: uuidv4()
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // mais curto que normal
    );

    // 4. Registra sessão de impersonation
    await db.query(`
      INSERT INTO impersonation_sessions 
      (id, master_user_id, impersonated_user_id, reason, ip_address, user_agent, session_token, expires_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR))
    `, [
      masterUserId,
      targetUserId,
      reason.substring(0, 200),
      context.ip || '0.0.0.0',
      context.userAgent || '',
      context.sessionToken || ''
    ]);

    return {
      success: true,
      impersonationToken,
      user: {
        id: target.id,
        email: target.email,
        full_name: target.full_name,
        roles: await this.getUserRoles(targetUserId)
      }
    };
  }

  /**
   * Finaliza sessão de impersonation
   */
  static async endImpersonation(masterUserId, impersonationToken) {
    const db = require('../config/database');
    
    // Decodifica token para pegar userId
    const decoded = require('jsonwebtoken').verify(impersonationToken, process.env.JWT_SECRET);
    const targetUserId = decoded.userId;

    // Marca sessão como finalizada
    await db.query(`
      UPDATE impersonation_sessions 
      SET ended_at = NOW() 
      WHERE master_user_id = ? AND impersonated_user_id = ? AND ended_at IS NULL
    `, [masterUserId, targetUserId]);

    return { success: true };
  }

  /**
   * Verifica se uma requisição é impersonation
   */
  static isImpersonationRequest(token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      return decoded.impersonation === true;
    } catch {
      return false;
    }
  }

  /**
   * Obtém o usuário real (master) por trás de uma sessão de impersonation
   */
  static getOriginalUser(decodedToken) {
    if (decodedToken?.impersonation && decodedToken?.impersonatedBy) {
      return decodedToken.impersonatedBy;
    }
    return decodedToken?.userId;
  }

  /**
   * Lista histórico de impersonation do master
   */
  static async getImpersonationHistory(masterUserId, limit = 50) {
    const db = require('../config/database');
    
    const sessions = await db.query(`
      SELECT 
        ises.*,
        u1.full_name as master_name,
        u1.email as master_email,
        u2.full_name as impersonated_name,
        u2.email as impersonated_email
      FROM impersonation_sessions ises
      JOIN users u1 ON ises.master_user_id = u1.id
      JOIN users u2 ON ises.impersonated_user_id = u2.id
      WHERE ises.master_user_id = ?
      ORDER BY ises.started_at DESC
      LIMIT ?
    `, [masterUserId, parseInt(limit)]);

    return sessions;
  }

  /**
   * Busca papéis de um usuário
   */
  static async getUserRoles(userId) {
    const db = require('../config/database');
    const roles = await db.query(`
      SELECT r.code FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);
    return roles.map(r => r.code);
  }

  /**
   * Verifica se master pode impersonar usuário
   */
  static async canImpersonate(masterUserId, targetUserId) {
    if (!await this.isMaster(masterUserId)) {
      return { allowed: false, reason: 'Apenas master pode impersonar' };
    }

    // Master não pode impersonar outro master (proteção)
    const targetRoles = await this.getUserRoles(targetUserId);
    if (targetRoles.includes('master')) {
      return { allowed: false, reason: 'Não é possível impersonar outro master' };
    }

    return { allowed: true };
  }

  static async isMaster(userId) {
    const roles = await this.getUserRoles(userId);
    return roles.includes('master');
  }
}

/**
 * Middleware para detectar e registrar impersonation
 */
const impersonationMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      
      if (decoded.impersonation) {
        // Requisição é feita em modo impersonation
        req.isImpersonating = true;
        req.originalMasterUserId = decoded.impersonatedBy;
        req.impersonatedUserId = decoded.userId;
        
        // Log especial
        console.log(`[Impersonation] Master ${decoded.impersonatedBy} atuando como ${decoded.userId}`);
      }
      
      req.user = decoded;
    } catch (err) {
      // Token inválido — deixa passar para o auth middleware lidar
    }
  }
  
  next();
};

module.exports = { ImpersonationService, impersonationMiddleware };

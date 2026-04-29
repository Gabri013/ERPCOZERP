const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

class AuthService {
  /**
   * Cria usuário com senha hash
   */
  static async createUser({ email, password, full_name, roles = [] }) {
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('Usuário já existe');
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const id = uuidv4();

    const connection = await require('../config/database').getClient();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO users (id, email, password_hash, full_name) 
         VALUES (?, ?, ?, ?)`,
        [id, email, password_hash, full_name]
      );

      // Adiciona papéis
      for (const roleCode of roles) {
        const role = await connection.query('SELECT id FROM roles WHERE code = ?', [roleCode]);
        if (role.length > 0) {
          await connection.query(
            'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
            [id, role[0].id, id]
          );
        }
      }

      await connection.commit();
      return { id, email, full_name, roles };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Autentica usuário
   */
  static async authenticate(email, password, ip, userAgent) {
    const users = await query(`
      SELECT 
        u.*,
        (SELECT JSON_ARRAYAGG(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u
      WHERE u.email = ? AND u.active = TRUE
    `, [email]);

    if (users.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const user = users[0];
    const userRoles = user.roles ? JSON.parse(user.roles) : [];

    // Verificar conta bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Conta temporariamente bloqueada');
    }

    // Validar senha
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Incrementa tentativas falhas
      await query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
        [user.id]
      );

      const attempts = user.failed_login_attempts + 1;
      if (attempts >= 5) {
        await query(
          "UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?",
          [user.id]
        );
        throw new Error('Conta bloqueada por 30 minutos');
      }

      throw new Error('Senha inválida');
    }

    // Login success — limpa tentativas
    await query(
      'UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Gera tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        roles: userRoles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
    );

    // Cria sessão no banco
    const sessionId = uuidv4();
    await query(
      `INSERT INTO user_sessions (id, user_id, session_token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [sessionId, user.id, accessToken, ip, userAgent]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        roles: userRoles,
        email_verified: user.email_verified
      },
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
  }

  /**
   * Verifica token JWT (também suporta tokens de impersonation)
   * @returns {Promise<object>} decoded token com campos estendidos
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Se for token de impersonation, valida separadamente
      if (decoded.impersonation === true) {
        // Tokens de impersonation não têm sessão no user_sessions
        // São válidos por tempo limitado (2h) e controlados pela tabela impersonation_sessions
        
        // Valida se ainda existe registro ativo
        const session = await query(`
          SELECT * FROM impersonation_sessions 
          WHERE master_user_id = ? AND impersonated_user_id = ? 
            AND ended_at IS NULL AND expires_at > NOW()
        `, [decoded.impersonatedBy, decoded.userId]);

        if (session.length === 0) {
          throw new Error('Sessão de impersonation inválida ou expirada');
        }

        // Não atualiza last_activity pois não é user_sessions
        return decoded;
      }

      // Token normal: valida sessão ativa no banco
      const session = await query(
        'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > NOW()',
        [token]
      );

      if (session.length === 0) {
        throw new Error('Sessão inválida ou expirada');
      }

      // Atualiza last activity
      await query(
        "UPDATE user_sessions SET last_activity_at = NOW() WHERE session_token = ?",
        [token]
      );

      return {
        ...decoded,
        id: decoded.id || decoded.userId,
        userId: decoded.userId || decoded.id
      };
    } catch (err) {
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }

    // Busca user com roles
    const users = await query(`
      SELECT 
        u.id, u.email,
        (SELECT JSON_ARRAYAGG(r.code) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles
      FROM users u WHERE u.id = ?
    `, [decoded.userId]);

    if (users.length === 0) throw new Error('Usuário não encontrado');

    const user = users[0];
    const userRoles = user.roles ? JSON.parse(user.roles) : [];

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        roles: userRoles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Atualiza sessão
    await query(
      "UPDATE user_sessions SET session_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE user_id = ? AND session_token = ?",
      [newAccessToken, user.id, refreshToken]
    );

    return { accessToken: newAccessToken, expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
  }

  /**
   * Logout
   */
  static async logout(token) {
    await query(
      "DELETE FROM user_sessions WHERE session_token = ?",
      [token]
    );
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw new Error('Usuário não encontrado');

    const valid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!valid) throw new Error('Senha atual incorreta');

    const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, userId]);
  }
}

module.exports = AuthService;
module.exports.AuthService = AuthService;
module.exports.createUser = AuthService.createUser.bind(AuthService);
module.exports.authenticate = AuthService.authenticate.bind(AuthService);
module.exports.verifyToken = AuthService.verifyToken.bind(AuthService);
module.exports.refreshToken = AuthService.refreshToken.bind(AuthService);
module.exports.logout = AuthService.logout.bind(AuthService);
module.exports.changePassword = AuthService.changePassword.bind(AuthService);

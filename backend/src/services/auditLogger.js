const { query } = require('../config/database');

class AuditLogger {
  /**
   * Log de requisição da API
   */
  static async logApiRequest(userId, endpoint, method, statusCode, ip, userAgent, duration, requestBody = null) {
    try {
      await query(`
        INSERT INTO access_logs 
        (user_id, endpoint, method, status_code, ip_address, user_agent, request_duration_ms, request_size, response_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        endpoint,
        method,
        statusCode,
        ip,
        userAgent ? userAgent.substring(0, 500) : null,
        duration,
        requestBody ? Buffer.byteLength(requestBody, 'utf8') : null,
        null // response_size - pode ser preenchido depois
      ]);
    } catch (err) {
      console.error('Erro ao salvar access log:', err.message);
    }
  }

  /**
   * Log de erro
   */
  static async logError(userId, errorMessage, context = {}) {
    try {
      await query(`
        INSERT INTO audit_logs 
        (user_id, action, ip_address, metadata)
        VALUES (?, 'error', ?, ?)
      `, [
        userId,
        context.ip || '0.0.0.0',
        JSON.stringify({
          message: errorMessage,
          stack: context.stack,
          url: context.url,
          method: context.method,
          userAgent: context.userAgent
        })
      ]);
    } catch (err) {
      console.error('Erro ao salvar error log:', err.message);
    }
  }

  /**
   * Log de alteração de dados
   */
  static async logDataChange(
    userId, 
    entityId, 
    recordId, 
    operation, // 'create', 'update', 'delete', 'restore'
    oldData = null,
    newData = null,
    changedFields = [],
    ip = null,
    userAgent = null,
    extras = {}
  ) {
    try {
      // Se for update, computa diff
      let calculatedChangedFields = changedFields;
      if (operation === 'update' && oldData && newData && changedFields.length === 0) {
        calculatedChangedFields = Object.keys(newData).filter(
          k => oldData[k] !== newData[k]
        );
      }

      await query(`
        INSERT INTO audit_logs 
        (user_id, action, entity_id, record_id, field_name, old_value, new_value, ip_address, user_agent, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        operation,
        entityId,
        recordId,
        calculatedChangedFields.length === 1 ? calculatedChangedFields[0] : null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ip,
        userAgent ? userAgent.substring(0, 500) : null,
        JSON.stringify({
          changedFields: calculatedChangedFields,
          ...extras,
          timestamp: new Date().toISOString()
        })
      ]);
    } catch (err) {
      console.error('Erro ao salvar audit log:', err.message);
    }
  }

  /**
   * Log de evento de sistema
   */
  static async logSystemEvent(
    userId,
    eventType,
    entityId,
    recordId,
    details = {},
    ip = null,
    userAgent = null
  ) {
    try {
      await query(`
        INSERT INTO audit_logs 
        (user_id, action, entity_id, record_id, ip_address, user_agent, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        eventType,
        entityId,
        recordId,
        ip,
        userAgent,
        JSON.stringify(details)
      ]);
    } catch (err) {
      console.error('Erro ao salvar system event:', err.message);
    }
  }

  /**
   * Log de transição de workflow
   */
  static async logWorkflowTransition(
    userId,
    recordId,
    entityId,
    workflowId,
    fromStep,
    toStep,
    reason = null
  ) {
    try {
      await query(`
        INSERT INTO audit_logs 
        (user_id, action, entity_id, record_id, metadata)
        VALUES (?, 'workflow_transition', ?, ?, ?)
      `, [
        userId,
        entityId,
        recordId,
        JSON.stringify({
          workflow_id: workflowId,
          from_step: fromStep,
          to_step: toStep,
          reason,
          timestamp: new Date().toISOString()
        })
      ]);
    } catch (err) {
      console.error('Erro ao logar workflow transition:', err.message);
    }
  }

  /**
   * Consulta histórico de um registro
   */
  static async getRecordHistory(entityId, recordId, limit = 100) {
    try {
      const logs = await query(`
        SELECT 
          al.*,
          u.full_name as user_name,
          u.email as user_email
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.entity_id = ? AND al.record_id = ?
        ORDER BY al.created_at DESC
        LIMIT ?
      `, [entityId, recordId, parseInt(limit)]);

      return logs.map(l => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : {},
        old_value: l.old_value ? JSON.parse(l.old_value) : null,
        new_value: l.new_value ? JSON.parse(l.new_value) : null
      }));
    } catch (err) {
      console.error('Erro ao buscar histórico:', err.message);
      return [];
    }
  }

  /**
   * Consulta atividade de um usuário
   */
  static async getUserActivity(userId, limit = 50) {
    try {
      const logs = await query(`
        SELECT 
          al.*,
          e.code as entity_code,
          e.name as entity_name
        FROM audit_logs al
        LEFT JOIN entities e ON al.entity_id = e.id
        WHERE al.user_id = ?
        ORDER BY al.created_at DESC
        LIMIT ?
      `, [userId, parseInt(limit)]);

      return logs.map(l => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : {},
        old_value: l.old_value ? JSON.parse(l.old_value) : null,
        new_value: l.new_value ? JSON.parse(l.new_value) : null
      }));
    } catch (err) {
      console.error('Erro ao buscar atividade do usuário:', err.message);
      return [];
    }
  }
}

module.exports = { AuditLogger };

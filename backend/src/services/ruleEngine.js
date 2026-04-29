/**
 * Motor de Regras (Rule Engine)
 */

class RuleEngine {
  /**
   * Avalia uma regra sobre um registro
   */
  static async evaluateRule(record, rule) {
    if (!rule?.is_active) return { matched: false, actions: [] };

    // Avalia condições
    const matched = await this.evaluateConditions(record, rule.trigger_conditions || []);
    
    return {
      matched,
      actions: matched ? (rule.actions || []) : []
    };
  }

  /**
   * Avalia lista de condições
   */
  static async evaluateConditions(record, conditions) {
    if (!conditions || conditions.length === 0) return true;

    // Todas as condições devem ser atendidas (AND)
    for (const condition of conditions) {
      const result = await this.evaluateCondition(record, condition);
      if (!result) return false;
    }
    return true;
  }

  /**
   * Avalia uma condição individual
   */
  static async evaluateCondition(record, condition) {
    const { field, operator, value } = condition;
    const left = record[field] ?? record.data?.[field];

    // Se campo não existe na estrutura plana, tenta buscar em data
    const actual = left !== undefined ? left : (record.data && record.data[field]);

    switch (operator) {
      case '==': return actual == value;
      case '===': return actual === value;
      case '!=': return actual != value;
      case '>': return Number(actual) > Number(value);
      case '>=': return Number(actual) >= Number(value);
      case '<': return Number(actual) < Number(value);
      case '<=': return Number(actual) <= Number(value);
      case 'includes': return Array.isArray(actual) && actual.includes(value);
      case 'contains': return String(actual ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
      case 'empty': return actual === null || actual === undefined || actual === '';
      case 'not_empty': return !(actual === null || actual === undefined || actual === '');
      case 'between': 
        return Number(actual) >= Number(value.min) && Number(actual) <= Number(value.max);
      case 'in': return Array.isArray(value) && value.includes(actual);
      case 'regex': 
        const regex = new RegExp(value);
        return regex.test(String(actual));
      default: 
        console.warn(`Operador desconhecido: ${operator}`);
        return false;
    }
  }

  /**
   * Executa ações de uma regra
   */
  static async executeActions(actions, record, context = {}) {
    for (const action of actions) {
      await this.executeAction(action, record, context);
    }
  }

  /**
   * Executa uma ação específica
   */
  static async executeAction(action, record, context) {
    const { type, field, value, target, operator } = action;

    switch (type) {
      case 'set_field':
        // Define valor de um campo
        await this.setField(record, field, value);
        break;

      case 'increment':
        // Incrementa campo numérico
        await this.incrementField(record, field, value || 1);
        break;

      case 'decrement':
        // Decrementa campo numérico
        await this.decrementField(record, field, value || 1);
        break;

      case 'send_notification':
        // Envia notificação
        await this.sendNotification(record, value, context);
        break;

      case 'create_record':
        // Cria novo registro em outra entidade
        await this.createRelatedRecord(target, value, record);
        break;

      case 'update_related':
        // Atualiza registros relacionados
        await this.updateRelatedRecords(target, field, value, record);
        break;

      case 'call_webhook':
        // Chama webhook externo
        await this.callWebhook(value, record);
        break;

      case 'execute_script':
        // Executa script customizado
        await this.executeCustomScript(value, record, context);
        break;

      case 'transition_workflow':
        // Transiciona workflow
        await this.transitionWorkflow(record, value);
        break;

      default:
        console.warn(`Tipo de ação desconhecido: ${type}`);
    }
  }

  static async setField(record, field, value) {
    const db = require('../config/database');
    
    // Se record é objeto completo, extrai data
    let data = record.data || record;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    // Substitui placeholders como {field_name}
    const resolvedValue = this.resolveValue(value, data);
    
    data[field] = resolvedValue;
    
    await db.query(
      `UPDATE entity_records SET data = ? WHERE id = ?`,
      [JSON.stringify(data), record.id]
    );
  }

  static async incrementField(record, field, amount) {
    const db = require('../config/database');
    let data = record.data || record;
    if (typeof data === 'string') data = JSON.parse(data);
    
    const current = Number(data[field]) || 0;
    data[field] = current + Number(amount);
    
    await db.query(
      `UPDATE entity_records SET data = ? WHERE id = ?`,
      [JSON.stringify(data), record.id]
    );
  }

  static async decrementField(record, field, amount) {
    const db = require('../config/database');
    let data = record.data || record;
    if (typeof data === 'string') data = JSON.parse(data);
    
    const current = Number(data[field]) || 0;
    data[field] = Math.max(0, current - Number(amount));
    
    await db.query(
      `UPDATE entity_records SET data = ? WHERE id = ?`,
      [JSON.stringify(data), record.id]
    );
  }

  static async sendNotification(record, config, context) {
    // Implementar sistema de notificações (pode ser email, push, websocket)
    const { to, message, type } = typeof config === 'string' 
      ? { message: config }
      : config;

    const resolvedMessage = this.resolveValue(message, record.data || record);
    
    // Log para debug
    console.log(`[Notification] ${type || 'info'}: ${resolvedMessage}`);
    
    // Emite via WebSocket
    global.io?.to(`user:${to}`).emit('notification', {
      type: type || 'info',
      message: resolvedMessage,
      recordId: record.id,
      timestamp: new Date()
    });
  }

  static async createRelatedRecord(targetEntity, config, sourceRecord) {
    const db = require('../config/database');
    const targetEntityData = await db.query(
      'SELECT id FROM entities WHERE code = ?',
      [targetEntity]
    );
    
    if (targetEntityData.length === 0) {
      console.error(`Entidade não encontrada: ${targetEntity}`);
      return;
    }

    const entityId = targetEntityData[0].id;
    const newData = {};
    
    // Cria dados baseados no config
    if (typeof config === 'object') {
      Object.assign(newData, config);
    }
    
    // Adiciona referência ao registro origem
    newData.source_record_id = sourceRecord.id;
    newData.source_entity_id = sourceRecord.entity_id;

    await db.query(
      `INSERT INTO entity_records (id, entity_id, data, created_by) 
       VALUES (UUID(), ?, ?, ?)`,
      [entityId, JSON.stringify(newData), sourceRecord.created_by || 'system']
    );
  }

  static async updateRelatedRecords(targetEntity, field, value, sourceRecord) {
    const db = require('../config/database');
    
    // Atualiza registros relacionados (ex: atualizar estoque)
    console.log(`[RuleEngine] Atualizando ${targetEntity} onde ${field} = ${value}`);
  }

  static async callWebhook(url, record) {
    // Implementar chamada HTTP para webhook
    console.log(`[Webhook] POST ${url}`);
  }

  static async executeCustomScript(script, record, context) {
    // Executa script customizado (com sandbox)
    console.log('[CustomScript] Executando...');
  }

  static async transitionWorkflow(record, step) {
    const workflowEngine = new (require('./workflowEngine').WorkflowEngine)();
    await workflowEngine.transition(
      record.id,
      record.entity_id,
      step,
      record.updated_by || record.created_by,
      { trigger: 'rule' }
    );
  }

  static resolveValue(template, data) {
    // Substitui {field} por valor real
    if (typeof template !== 'string') return template;
    
    return template.replace(/\{(\w+)\}/g, (match, field) => {
      return data[field] ?? match;
    });
  }

  /**
   * Executa todas as regras de uma entidade para um evento
   */
  static async runRulesForEvent(entityId, event, record, userId) {
    const db = require('../config/database');
    
    const rules = await db.query(`
      SELECT * FROM business_rules 
      WHERE entity_id = ? AND is_active = 1 AND trigger_event = ?
      ORDER BY priority ASC
    `, [entityId, event]);

    const results = [];
    for (const rule of rules) {
      try {
        const result = await this.evaluateAndExecute(rule, record, userId);
        results.push(result);
        
        if (result.matched && rule.stop_processing) {
          break; // Para execução se regra marcar stop_processing
        }
      } catch (err) {
        console.error('Erro na regra:', rule.code, err.message);
      }
    }

    return results;
  }

  static async evaluateAndExecute(rule, record, userId) {
    const db = require('../config/database');
    
    // Snapshot do estado atual
    const contextSnapshot = JSON.parse(JSON.stringify(record.data || record));
    
    const matched = await this.evaluateConditions(record, rule.trigger_conditions || []);
    
    // Log execução
    await db.query(`
      INSERT INTO rule_executions 
      (rule_id, record_id, entity_id, triggered_by, conditions_matched, context_snapshot)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      rule.id,
      record.id,
      record.entity_id,
      userId,
      matched,
      JSON.stringify(contextSnapshot)
    ]);

    if (matched) {
      await this.executeActions(rule.actions, record, { rule });
    }

    return { ruleId: rule.id, ruleName: rule.name, matched, actions: matched ? rule.actions : [] };
  }
}

module.exports = { RuleEngine };

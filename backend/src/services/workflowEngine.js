/**
 * Motor de Workflow
 */

class WorkflowEngine {
  constructor() {
    this.transitionHandlers = new Map();
    this.validators = new Map();
  }

  /**
   * Transiciona um registro no workflow
   */
  async transition(recordId, entityId, toStepCode, userId, options = {}) {
    const db = require('../config/database');
    
    // Buscar registro
    const records = await db.query(
      'SELECT * FROM entity_records WHERE id = ?',
      [recordId]
    );
    
    if (records.length === 0) throw new Error('Registro não encontrado');

    const record = records[0];

    // Buscar workflow ativo
    const workflow = await this.getActiveWorkflow(entityId);
    if (!workflow) {
      throw new Error('Workflow não configurado para esta entidade');
    }

    // Buscar etapa atual
    const currentStepCode = record.data?.status || workflow.initial_step;
    const currentStep = await this.getWorkflowStep(workflow.id, currentStepCode);
    const toStep = await this.getWorkflowStep(workflow.id, toStepCode);

    if (!toStep) throw new Error('Etapa de destino inválida');

    // Validar transição
    await this.validateTransition(workflow, currentStep, toStep, userId, record, options);

    // Executar pré-ações
    await this.executePreTransitionActions(workflow, currentStep, toStep, record, userId);

    // Atualizar registro
    const updatedData = { 
      ...record.data, 
      status: toStepCode,
      workflow_step_updated_at: new Date().toISOString()
    };

    await db.query(
      `UPDATE entity_records 
       SET data = ?, updated_at = NOW(), updated_by = ? 
       WHERE id = ?`,
      [JSON.stringify(updatedData), userId, recordId]
    );

    // Registrar histórico
    await db.query(`
      INSERT INTO workflow_history 
      (record_id, entity_id, workflow_id, from_step_code, to_step_code, performed_by, reason, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recordId, 
      entityId, 
      workflow.id,
      currentStepCode,
      toStepCode,
      userId,
      options.reason,
      JSON.stringify({ 
        trigger: options.trigger, 
        metadata: options.metadata,
        timestamp: new Date().toISOString()
      })
    ]);

    // Execute post transition actions
    await this.executePostTransitionActions(workflow, currentStep, toStep, record, userId);

    // Emit evento via WebSocket
    global.io?.to(`entity:${entityId}`).emit('workflow.transitioned', {
      recordId,
      entityId,
      from: currentStepCode,
      to: toStepCode,
      userId,
      timestamp: new Date()
    });

    // Dispara regras de negócio
    await this.triggerBusinessRules(entityId, 'on_status_change', record);

    return { success: true, from: currentStepCode, to: toStepCode };
  }

  /**
   * Valida se transição é permitida
   */
  async validateTransition(workflow, fromStep, toStep, userId, record, options) {
    const errors = [];

    if (!workflow.is_active) errors.push('Workflow inativo');
    if (!fromStep) errors.push('Etapa atual não encontrada');
    
    const db = require('../config/database');
    
    // Verificar se transição existe
    const transitions = await db.query(`
      SELECT * FROM workflow_transitions 
      WHERE workflow_id = ? AND from_step_code = ? AND to_step_code = ?
    `, [workflow.id, fromStep?.code, toStep.code]);
    
    const transition = transitions.length > 0 ? transitions[0] : null;

    if (!transition && !options.force) {
      errors.push(`Transição de ${fromStep?.code} para ${toStep.code} não permitida`);
    }

    // Verificar papel do usuário na transição
    if (transition) {
      const allowedRoles = JSON.parse(transition.allowed_roles || '[]');
      const userRoles = await this.getUserRoles(userId);
      const hasRole = allowedRoles.some(r => userRoles.includes(r));
      if (!hasRole && !options.force) {
        errors.push('Usuário não tem permissão para esta transição');
      }
    }

    // Verificar condição da transição
    if (transition?.condition_expression) {
      try {
        const conditionMet = await this.evaluateExpression(
          transition.condition_expression, 
          record.data
        );
        if (!conditionMet) {
          errors.push('Condição da transição não atendida');
        }
      } catch (err) {
        errors.push('Erro ao avaliar condição: ' + err.message);
      }
    }

    // Validar etapa destino
    if (toStep.required_approval && !options.approvedBy) {
      errors.push('Etapa requer aprovação explícita');
    }

    if (errors.length > 0) {
      throw new Error(`Transição bloqueada: ${errors.join(', ')}`);
    }
  }

  /**
   * Executa ações após transição
   */
  async executePostTransitionActions(workflow, fromStep, toStep, record, userId) {
    const db = require('../config/database');
    const AuditLogger = require('./auditLogger').AuditLogger;

    // 1. Notificar responsáveis
    if (toStep.approver_roles && toStep.approver_roles.length > 0) {
      // Implementar notificação
      console.log(`[Workflow] Notificando roles: ${toStep.approver_roles.join(', ')}`);
    }

    // 2. Executar ações configuradas no workflow
    const actions = workflow.config?.post_transition_actions || [];
    for (const action of actions) {
      await this.executeAction(action, record, userId);
    }

    // 3. Log de auditoria
    await AuditLogger.logSystemEvent(
      userId,
      'workflow.transition',
      record.entity_id,
      record.id,
      {
        from: fromStep.code,
        to: toStep.code,
        workflow: workflow.code
      }
    );
  }

  /**
   * Obtém etapas de um workflow
   */
  async getWorkflowSteps(workflowId) {
    const db = require('../config/database');
    return db.query(`
      SELECT * FROM workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY sort_order
    `, [workflowId]);
  }

  /**
   * Obtém workflow ativo para uma entidade
   */
  async getActiveWorkflow(entityId) {
    const db = require('../config/database');
    const wf = await db.query(`
      SELECT * FROM workflows 
      WHERE entity_id = ? AND is_active = 1 
      ORDER BY created_at DESC LIMIT 1
    `, [entityId]);
    return wf[0] || null;
  }

  async getWorkflowStep(workflowId, code) {
    const db = require('../config/database');
    const steps = await db.query(
      'SELECT * FROM workflow_steps WHERE workflow_id = ? AND code = ?',
      [workflowId, code]
    );
    return steps[0] || null;
  }

  async getUserRoles(userId) {
    const db = require('../config/database');
    const roles = await db.query(`
      SELECT r.code FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);
    return roles.map(r => r.code);
  }

  evaluateExpression(expression, data) {
    // Avalia expressão simples: field1 > value AND field2 == value2
    try {
      // Substitui campos pelos valores
      let expr = expression;
      const regex = /\{(\w+)\}/g;
      expr = expr.replace(regex, (match, field) => {
        const val = data[field];
        if (typeof val === 'string') return `'${val}'`;
        return val ?? 'null';
      });

      // AVISO: Em produção, use sandbox seguro (vm2, etc)
      // Esta é uma versão simplificada
      return eval(expr); // eslint-disable-line no-eval
    } catch (err) {
      console.error('Erro ao avaliar expressão:', err);
      return false;
    }
  }

  async executeAction(action, record, userId) {
    // Implementar ação
    console.log('Executando ação:', action);
  }

  async triggerBusinessRules(entityId, event, record) {
    const db = require('../config/database');
    
    const rules = await db.query(`
      SELECT * FROM business_rules 
      WHERE entity_id = ? AND is_active = 1 AND trigger_event = ?
      ORDER BY priority
    `, [entityId, event]);

    for (const rule of rules) {
      await this.executeRule(rule, record);
    }
  }

  async executeRule(rule, record) {
    const db = require('../config/database');
    const RuleEngine = require('./ruleEngine');
    const perfis = require('../../src/lib/perfis');

    try {
      const result = await RuleEngine.evaluateRule(record, rule);
      
      if (result.matched) {
        await RuleEngine.executeActions(rule.actions, record);
        
        // Log execução
        await db.query(`
          INSERT INTO rule_executions 
          (rule_id, record_id, entity_id, triggered_by, conditions_matched, actions_executed, context_snapshot)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          rule.id,
          record.id,
          record.entity_id,
          record.updated_by || record.created_by,
          1,
          JSON.stringify(result.actions),
          JSON.stringify(record.data)
        ]);
      }
    } catch (err) {
      console.error('Erro ao executar regra:', rule.code, err.message);
    }
  }
}

module.exports = { WorkflowEngine };

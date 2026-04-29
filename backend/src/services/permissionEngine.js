/**
 * Motor de Permissões Híbrido (RBAC + ABAC)
 * 
 * RBAC: Papéis baseados em perfis
 * ABAC: Regras baseadas em atributos (campo, valor, contexto)
 */

class PermissionEngine {
  constructor(user = null, session = null) {
    this.user = user;
    this.session = session;
    this.roleCache = new Map();
    this.permissionCache = new Map();
    this.fieldCache = new Map();
  }

  /**
   * Verifica se usuário tem permissão para ação
   * @param {string} action - 'read', 'create', 'update', 'delete', 'execute'
   * @param {string} entity - código da entidade (ex: 'produto')
   * @param {object} context - contexto adicional { field, record, workflowStep }
   * @returns {Promise<boolean>}
   */
  async can(action, entity, context = {}) {
    if (!this.user) {
      // No user context, deny
      return this.logAccess(action, entity, false, 'no_user_context');
    }

    const cacheKey = `${action}:${entity}:${JSON.stringify(context)}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey);
    }

    // 1. Verificar se é master (bypass total)
    if (await this.hasRole('master')) {
      this.logAccess(action, entity, true, 'master_bypass');
      return true;
    }

    // 2. RBAC: Verificar permissão direta do papel
    const rolePerms = await this.getRolePermissions();
    const directPermission = rolePerms.find(p => 
      this.matchPermission(p, action, entity, context)
    );

    if (directPermission) {
      // ABAC: Aplicar condições dinâmicas
      const allowed = await this.evaluateConditions(directPermission, context);
      this.permissionCache.set(cacheKey, allowed);
      return allowed;
    }

    // 3. Verificar permissão por herança de workflow
    if (context.workflowStep) {
      const workflowAllowed = await this.checkWorkflowPermission(action, context);
      if (workflowAllowed) {
        this.permissionCache.set(cacheKey, true);
        return true;
      }
    }

    // 4. Verificar ownership (próprio registro)
    if (this.canByOwnership(action, entity, context)) {
      this.permissionCache.set(cacheKey, true);
      return true;
    }

    this.logAccess(action, entity, false, 'no_permission');
    this.permissionCache.set(cacheKey, false);
    return false;
  }

  /**
   * Verifica permissão por ownership
   */
  canByOwnership(action, entity, context) {
    if (!context.record || !context.record.created_by) return false;
    
    // Só pode editar/deletar próprio registro
    if (action === 'update' || action === 'delete') {
      return context.record.created_by === this.user.id;
    }
    
    return false;
  }

  /**
   * Verifica permissão baseada em workflow
   */
  async checkWorkflowPermission(action, context) {
    const { workflowStep, record } = context;
    
    // Workflow só se aplica se registro tem workflow ativo
    const workflow = await this.getActiveWorkflow(record.entity_id);
    if (!workflow) return false;

    const currentStep = await this.getWorkflowStep(workflow.id, workflowStep);
    if (!currentStep) return false;

    // Verifica se papel do usuário está em approverRoles
    const userRoles = await this.getUserRoles();
    const hasRole = currentStep.approver_roles?.some(r => userRoles.includes(r));
    
    // Verifica se ação é permitida na etapa
    const allowedActions = this.getAllowedActionsForStep(currentStep);
    return hasRole && allowedActions.includes(action);
  }

  /**
   * Avalia condições ABAC
   */
  async evaluateConditions(permission, context) {
    if (!permission.conditions) return true;

    for (const condition of permission.conditions) {
      const result = this.evaluateCondition(condition, context);
      if (!result) return false;
    }
    return true;
  }

  evaluateCondition(condition, context) {
    const { field, operator, value } = condition;
    const actual = this.getFieldValue(context, field);

    switch (operator) {
      case '==': return actual == value;
      case '===': return actual === value;
      case '!=': return actual != value;
      case '>': return Number(actual) > Number(value);
      case '>=': return Number(actual) >= Number(value);
      case '<': return Number(actual) < Number(value);
      case '<=': return Number(actual) <= Number(value);
      case 'in': return Array.isArray(actual) && actual.includes(value);
      case 'not_in': return !Array.isArray(actual) || !actual.includes(value);
      case 'contains': return String(actual).toLowerCase().includes(String(value).toLowerCase());
      case 'empty': return actual === null || actual === undefined || actual === '';
      case 'not_empty': return !(actual === null || actual === undefined || actual === '');
      case 'equals_field': return actual === context[value];
      default: return false;
    }
  }

  matchPermission(permission, action, entity, context) {
    const permCode = permission.code;
    
    if (permCode.startsWith('entity.')) {
      const parts = permCode.split('.');
      const permEntity = parts[1];
      const permAction = parts[2];
      return (permEntity === '*' || permEntity === entity) &&
             (permAction === '*' || permAction === action);
    }
    
    if (permCode.startsWith('field.')) {
      const parts = permCode.split('.');
      const permField = parts[1];
      const permAction = parts[2];
      return context.field === permField && permAction === action;
    }
    
    if (permCode.startsWith('workflow.')) {
      const permAction = permCode.split('.')[1];
      return permAction === action;
    }

    return false;
  }

  async getRolePermissions() {
    if (this.roleCache.has(this.user.id)) {
      return this.roleCache.get(this.user.id);
    }
    
    // Buscar no banco
    const roles = await this.getUserRoles();
    const permissionsList = [];
    
    for (const roleCode of roles) {
      const rolePerms = await require('../config/database').query(`
        SELECT p.*, rp.conditions 
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        JOIN roles r ON r.id = rp.role_id
        WHERE r.code = ? AND rp.granted = 1
      `, [roleCode]);
      
      permissionsList.push(...rolePerms);
    }
    
    this.roleCache.set(this.user.id, permissionsList);
    return permissionsList;
  }

  async getUserRoles() {
    const roles = await require('../config/database').query(`
      SELECT r.code FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [this.user.id]);
    return roles.map(r => r.code);
  }

  async hasRole(roleCode) {
    const roles = await this.getUserRoles();
    return roles.includes(roleCode);
  }

  getFieldValue(context, field) {
    if (context.record && context.record[field] !== undefined) {
      return context.record[field];
    }
    return context[field];
  }

  getAllowedActionsForStep(step) {
    if (step.can_edit_fields) {
      return ['read', 'update', 'execute'];
    }
    return ['read'];
  }

  logAccess(action, entity, granted, reason) {
    require('../config/database').query(`
      INSERT INTO audit_logs 
      (user_id, action, entity_id, ip_address, metadata)
      VALUES (?, ?, 
        (SELECT id FROM entities WHERE code = ?), 
        ?, 
        JSON_OBJECT('granted', ?, 'reason', ?, 'timestamp', NOW()))
    `, [
      this.user?.id || null,
      action,
      entity,
      this.session?.ip || '0.0.0.0',
      granted,
      reason
    ]);
  }

  clearCache() {
    this.permissionCache.clear();
    this.roleCache.clear();
    this.fieldCache.clear();
  }
}

module.exports = { PermissionEngine };

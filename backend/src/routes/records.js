const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { WorkflowEngine } = require('../services/workflowEngine');
const { RuleEngine } = require('../services/ruleEngine');
const { AuditLogger } = require('../services/auditLogger');

const router = express.Router();

// ============================================
// CRUD GENÉRICO DE REGISTROS
// ============================================

/**
 * GET /api/records?entity=produto
 * Lista registros de uma entidade com filtros, paginação, ordenação
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      entity, 
      page = 1, 
      limit = 50, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      search = '',
      filters = '{}'
    } = req.query;

    if (!entity) {
      return res.status(400).json({ error: 'Parâmetro entity é obrigatório' });
    }

    // Verifica permissão
    if (!(await req.permissionEngine?.can('read', entity))) {
      return res.status(403).json({ error: 'Sem permissão para ler esta entidade' });
    }

    // Busca entidade
    const entityData = await query('SELECT * FROM entities WHERE code = ?', [entity]);
    if (entityData.length === 0) {
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }
    
    const entityInfo = entityData[0];
    const entityId = entityInfo.id;

    // Busca campos visíveis para este usuário
    const fields = await query(`
      SELECT * FROM entity_fields 
      WHERE entity_id = ? 
      ORDER BY display_order
    `, [entityId]);

    // Filtra campos ocultos (gera um select dinâmico)
    const visibleFields = fields.filter(f => !f.hidden);

    // Monta query
    let sql = `SELECT id, data, created_by, created_at, updated_at FROM entity_records 
               WHERE entity_id = ? AND deleted_at IS NULL`;
    const params = [entityId];

    // Filtros textuais (busca em campos text)
    if (search) {
      const searchConditions = [];
      for (const field of visibleFields) {
        if (field.data_type === 'text' || field.data_type === 'textarea') {
          searchConditions.push(`JSON_UNQUOTE(JSON_EXTRACT(data, '$.${field.code}')) LIKE ?`);
          params.push(`%${search}%`);
        }
      }
      if (searchConditions.length > 0) {
        sql += ` AND (${searchConditions.join(' OR ')})`;
      }
    }

    // Filtros específicos
    const filtersObj = JSON.parse(filters);
    if (filtersObj && typeof filtersObj === 'object') {
      for (const [key, value] of Object.entries(filtersObj)) {
        if (value !== null && value !== undefined && value !== '') {
          sql += ` AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.${key}')) = ?`;
          params.push(String(value));
        }
      }
    }

    // Count total
    const countResult = await query(sql, params);
    const total = countResult.length;

    // Ordenação
    if (sortBy) {
      sql += ` ORDER BY ${sortBy === 'created_at' ? 'created_at' : `JSON_UNQUOTE(JSON_EXTRACT(data, '$.${sortBy}'))`} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Paginação
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const records = await query(sql, params);

    // Parse data JSON
    const parsed = records.map(r => ({
      id: r.id,
      ...JSON.parse(r.data || '{}'),
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    res.json({
      success: true,
      data: parsed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/records/:id
 * Busca um registro por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const records = await query(`
      SELECT * FROM entity_records 
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (records.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = records[0];
    const parsed = {
      id: record.id,
      entity_id: record.entity_id,
      ...JSON.parse(record.data || '{}'),
      created_by: record.created_by,
      created_at: record.created_at,
      updated_at: record.updated_at
    };

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/records — criar registro
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { entity_id, data } = req.body;

    if (!entity_id || !data) {
      return res.status(400).json({ error: 'entity_id e data são obrigatórios' });
    }

    if (!(await req.permissionEngine?.can('create', entity_id, { record: data }))) {
      return res.status(403).json({ error: 'Sem permissão para criar' });
    }

    // Validação por metadados
    const validation = await validateRecordByMetadata(entity_id, data);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validação falhou', 
        details: validation.errors 
      });
    }

    // Gera código se entidade tiver campo 'codigo' e vier auto-incremento
    if (data.codigo === undefined || data.codigo === null) {
      const autoCode = await generateAutoCode(entity_id);
      if (autoCode) {
        data.codigo = autoCode;
      }
    }

    const id = uuidv4();
    const created_by = req.user.userId;

    await query(
      `INSERT INTO entity_records (id, entity_id, data, created_by) VALUES (?, ?, ?, ?)`,
      [id, entity_id, JSON.stringify(data), created_by]
    );

    // Log auditoria
    await AuditLogger.logDataChange(
      req.user.userId,
      entity_id,
      id,
      'create',
      null,
      data,
      ['*'],
      req.ip,
      req.get('user-agent')
    );

    // Dispara regras de negócio
    const record = { id, entity_id, data, created_by };
    await RuleEngine.runRulesForEvent(entity_id, 'on_create', record, req.user.userId);

    res.status(201).json({ 
      success: true, 
      id,
      data: { id, ...data }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/records/:id — atualizar registro
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: newData } = req.body;

    // Busca registro atual
    const records = await query('SELECT * FROM entity_records WHERE id = ? AND deleted_at IS NULL', [id]);
    if (records.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = records[0];
    const oldData = JSON.parse(record.data || '{}');

    // Verifica permissão
    if (!(await req.permissionEngine?.can('update', record.entity_id, { 
      record: { ...record, ...newData } 
    }))) {
      return res.status(403).json({ error: 'Sem permissão para atualizar' });
    }

    // Validação
    const validation = await validateRecordByMetadata(record.entity_id, newData);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validação falhou', 
        details: validation.errors 
      });
    }

    // Mescla dados antigos com novos (mantém campos não enviados)
    const mergedData = { ...oldData, ...newData };
    
    await query(
      `UPDATE entity_records SET data = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
      [JSON.stringify(mergedData), req.user.userId, id]
    );

    // Log auditoria
    const changedFields = Object.keys(newData).filter(k => oldData[k] !== newData[k]);
    await AuditLogger.logDataChange(
      req.user.userId,
      record.entity_id,
      id,
      'update',
      oldData,
      mergedData,
      changedFields,
      req.ip,
      req.get('user-agent')
    );

    // Dispara regras
    const updatedRecord = { ...record, data: mergedData, updated_by: req.user.userId };
    await RuleEngine.runRulesForEvent(record.entity_id, 'on_update', updatedRecord, req.user.userId);

    res.json({ success: true, data: { id, ...mergedData } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/records/:id — soft delete
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    const records = await query('SELECT * FROM entity_records WHERE id = ?', [id]);
    if (records.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = records[0];

    if (!(await req.permissionEngine?.can('delete', record.entity_id, { record }))) {
      return res.status(403).json({ error: 'Sem permissão para deletar' });
    }

    if (force) {
      // Hard delete
      await query('DELETE FROM entity_records WHERE id = ?', [id]);
    } else {
      // Soft delete
      await query(
        'UPDATE entity_records SET deleted_at = NOW() WHERE id = ?',
        [id]
      );
    }

    // Log auditoria
    await AuditLogger.logDataChange(
      req.user.userId,
      record.entity_id,
      id,
      force ? 'hard_delete' : 'delete',
      JSON.parse(record.data || '{}'),
      null,
      ['deleted'],
      req.ip,
      req.get('user-agent')
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function validateRecordByMetadata(entityId, data) {
  const fields = await query(
    'SELECT * FROM entity_fields WHERE entity_id = ?',
    [entityId]
  );

  const errors = [];

  for (const field of fields) {
    if (!field.required) continue;

    const value = data[field.code];
    
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`Campo '${field.label}' é obrigatório`);
      continue;
    }

    // Validação numérica
    if (field.data_type === 'number' && value !== null && value !== undefined) {
      if (field.validation_rules) {
        const rules = JSON.parse(field.validation_rules);
        if (rules.min !== undefined && Number(value) < Number(rules.min)) {
          errors.push(`'${field.label}' deve ser maior ou igual a ${rules.min}`);
        }
        if (rules.max !== undefined && Number(value) > Number(rules.max)) {
          errors.push(`'${field.label}' deve ser menor ou igual a ${rules.max}`);
        }
      }
    }

    // Validação de string
    if ((field.data_type === 'text' || field.data_type === 'textarea') && value) {
      if (field.validation_rules) {
        const rules = JSON.parse(field.validation_rules);
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`'${field.label}' deve ter no mínimo ${rules.minLength} caracteres`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`'${field.label}' deve ter no máximo ${rules.maxLength} caracteres`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push(`'${field.label}' formato inválido`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

async function generateAutoCode(entityId) {
  // Busca entidade
  const entities = await query('SELECT code FROM entities WHERE id = ?', [entityId]);
  if (entities.length === 0) return null;

  const entityCode = entities[0].code;
  
  // Verifica se há campo de auto-código
  const field = await query(
    'SELECT * FROM entity_fields WHERE entity_id = ? AND code = ?',
    [entityId, 'codigo']
  );
  
  if (field.length === 0) return null;

  // Busca último registro
  const last = await query(`
    SELECT data->>'$.codigo' as code FROM entity_records 
    WHERE entity_id = ? AND data->>'$.codigo' IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  `, [entityId]);

  if (last.length === 0) {
    // Primeiro registro
    const prefixes = {
      produto: 'PRD',
      cliente: 'CLI',
      fornecedor: 'FOR',
      ordem_producao: 'OP',
      pedido_venda: 'PV',
      ordem_compra: 'OC'
    };
    const prefix = prefixes[entityCode] || entityCode.toUpperCase().substring(0, 3);
    return `${prefix}-001`;
  }

  // Incrementa
  const lastCode = last[0].code;
  const match = lastCode.match(/(\D+)(\d+)/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2]) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  }

  return null;
}

module.exports = router;

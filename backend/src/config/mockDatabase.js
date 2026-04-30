// Mock database for quick testing - in-memory store with query support
const mockData = {
  users: [
    {
      id: '1',
      email: 'master@erpcoz.local',
      password_hash: '$2b$12$LQ/qXVmyXVPHTe4IT99nXu/oXJ97tmZeLAFdEld3GibViT42m/Ufa', // master123_dev
      full_name: 'Master User',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['master']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      email: 'admin@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Admin User',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['admin']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      email: 'operador@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Operador de Estoque',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['operador']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      email: 'vendedor@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Vendedor',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['vendedor']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      email: 'supervisor.producao@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Supervisor de Produção',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['supervisor']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      email: 'analista.compras@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Analista de Compras',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['compras']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7',
      email: 'financeiro@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Analista Financeiro',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['financeiro']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '8',
      email: 'rh@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Analista de RH',
      active: true,
      locked_until: null,
      failed_login_attempts: 0,
      last_login_at: null,
      email_verified: true,
      roles: JSON.stringify(['rh']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  user_sessions: [],
  roles: [
    {
      id: '1',
      code: 'master',
      name: 'Master',
      description: 'Acesso total ao sistema',
      active: true,
      permissions: JSON.stringify(['user.manage', 'role.manage', 'permission.manage', 'entity.*.*', 'workflow.create', 'workflow.execute', 'rule.manage', 'system.config', 'ver_financeiro', 'ver_fiscal', 'emitir_nfe', 'cancelar_nfe'])
    },
    {
      id: '2',
      code: 'admin',
      name: 'Administrador',
      description: 'Administração geral',
      active: true,
      permissions: JSON.stringify(['user.manage'])
    }
  ],
  permissions: [
    {
      id: '1',
      code: 'user.manage',
      name: 'Gerenciar usuários',
      category: 'user',
      description: 'Criar, editar e excluir usuários',
      type: 'action',
      active: true
    },
    {
      id: '2',
      code: 'role.manage',
      name: 'Gerenciar papéis',
      category: 'permission',
      description: 'Criar e alterar papéis',
      type: 'action',
      active: true
    },
    {
      id: '3',
      code: 'permission.manage',
      name: 'Gerenciar permissões',
      category: 'permission',
      description: 'Associar permissões aos papéis',
      type: 'action',
      active: true
    },
    {
      id: '4',
      code: 'entity.*.*',
      name: 'Acesso total a entidades',
      category: 'entity',
      description: 'Todas as acoes em todas as entidades',
      type: 'entity',
      active: true
    },
    {
      id: '5',
      code: 'workflow.create',
      name: 'Criar workflows',
      category: 'workflow',
      description: 'Criar workflows',
      type: 'action',
      active: true
    },
    {
      id: '6',
      code: 'workflow.execute',
      name: 'Executar workflows',
      category: 'workflow',
      description: 'Executar transicoes de workflow',
      type: 'action',
      active: true
    },
    {
      id: '7',
      code: 'rule.manage',
      name: 'Gerenciar regras',
      category: 'rule',
      description: 'Criar e alterar regras de negocio',
      type: 'action',
      active: true
    },
    {
      id: '8',
      code: 'system.config',
      name: 'Configurar sistema',
      category: 'system',
      description: 'Alterar configuracoes do sistema',
      type: 'action',
      active: true
    },
    {
      id: '9',
      code: 'ver_financeiro',
      name: 'Ver financeiro',
      category: 'financeiro',
      description: 'Acessar financeiro',
      type: 'action',
      active: true
    },
    {
      id: '10',
      code: 'ver_fiscal',
      name: 'Ver fiscal',
      category: 'fiscal',
      description: 'Acessar fiscal',
      type: 'action',
      active: true
    },
    {
      id: '11',
      code: 'emitir_nfe',
      name: 'Emitir NFe',
      category: 'fiscal',
      description: 'Emitir notas fiscais',
      type: 'action',
      active: true
    },
    {
      id: '12',
      code: 'cancelar_nfe',
      name: 'Cancelar NFe',
      category: 'fiscal',
      description: 'Cancelar notas fiscais',
      type: 'action',
      active: true
    }
  ],
  user_roles: [
    {
      id: '1',
      user_id: '1',
      role_id: '1'
    },
    {
      id: '2',
      user_id: '2',
      role_id: '2'
    }
  ],
  role_permissions: [
    {
      id: '1',
      role_id: '1',
      permission_id: '1',
      granted: true
    },
    {
      id: '2',
      role_id: '1',
      permission_id: '2',
      granted: true
    },
    {
      id: '3',
      role_id: '1',
      permission_id: '3',
      granted: true
    },
    {
      id: '4',
      role_id: '1',
      permission_id: '4',
      granted: true
    },
    {
      id: '5',
      role_id: '1',
      permission_id: '5',
      granted: true
    },
    {
      id: '6',
      role_id: '1',
      permission_id: '6',
      granted: true
    },
    {
      id: '7',
      role_id: '1',
      permission_id: '7',
      granted: true
    },
    {
      id: '8',
      role_id: '1',
      permission_id: '8',
      granted: true
    },
    {
      id: '9',
      role_id: '1',
      permission_id: '9',
      granted: true
    },
    {
      id: '10',
      role_id: '1',
      permission_id: '10',
      granted: true
    },
    {
      id: '11',
      role_id: '1',
      permission_id: '11',
      granted: true
    },
    {
      id: '12',
      role_id: '1',
      permission_id: '12',
      granted: true
    },
    {
      id: '13',
      role_id: '2',
      permission_id: '1',
      granted: true
    }
  ],
  entities: [],
  entity_records: [],
  workflows: [],
  workflow_steps: [],
  workflow_history: [],
  business_rules: [],
  rule_executions: [],
  system_config: [],
  config_versions: [],
  audit_logs: [],
  access_logs: []
};

// Minimal adapter to expose query/getClient like mysql/postgres wrappers
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function query(sql, params = []) {
  const sqlUpper = String(sql || '').toUpperCase();
  // DEBUG
  console.log('[MOCK DB] SQL:', sql.trim().substring(0, 200));
  console.log('[MOCK DB] Params:', params);

  // SELECT from users
  if (sqlUpper.includes('FROM USERS')) {
    let results = mockData.users.slice();

    // filter by email or id if param provided
    if (params && params.length > 0) {
      const p = params[0];
      if (String(sqlUpper).includes('WHERE') && /EMAIL/.test(sqlUpper)) {
        results = results.filter(u => u.email === p);
      } else if (String(sqlUpper).includes('WHERE') && /U.ID|WHERE ID =|WHERE U.ID =/.test(sqlUpper)) {
        results = results.filter(u => u.id === p);
      }
    }

    if (sqlUpper.includes('AND U.ACTIVE') || sqlUpper.includes('AND ACTIVE')) {
      results = results.filter(u => u.active === true);
    }

    // emulate roles subquery: user.roles already contains JSON string
    return results.map(u => clone(u));
  }

  // SELECT from roles
  if (sqlUpper.includes('FROM ROLES')) {
    let results = mockData.roles.slice();
    if (params && params.length > 0 && typeof params[0] === 'string') {
      results = results.filter(r => r.code === params[0]);
    }
    return results.map(r => clone(r));
  }

  // SELECT from permissions
  if (sqlUpper.includes('FROM PERMISSIONS')) {
    return mockData.permissions.map(p => clone(p));
  }

  // INSERT INTO user_sessions
  if (sqlUpper.includes('INSERT INTO USER_SESSIONS')) {
    const [id, user_id, session_token, ip_address, user_agent, expires_at] = params;
    mockData.user_sessions.push({ id, user_id, session_token, ip_address, user_agent, expires_at });
    return { insertId: mockData.user_sessions.length };
  }

  // INSERT INTO audit_logs (best-effort)
  if (sqlUpper.includes('INSERT INTO AUDIT_LOGS')) {
    mockData.audit_logs = mockData.audit_logs || [];
    mockData.audit_logs.push({ id: mockData.audit_logs.length + 1, params: params });
    return { insertId: mockData.audit_logs.length };
  }

  // UPDATE users SET failed_login_attempts
  if (sqlUpper.includes('UPDATE USERS SET') && sqlUpper.includes('FAILED_LOGIN_ATTEMPTS')) {
    const id = params[params.length - 1];
    const user = mockData.users.find(u => u.id === id);
    if (user) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // Generic INSERT fallback: return a fake insertId
  if (sqlUpper.includes('INSERT INTO')) {
    return { insertId: Math.floor(Math.random() * 1000) };
  }

  // Generic UPDATE/DELETE fallback
  if (/UPDATE|DELETE/.test(sqlUpper)) {
    return { affectedRows: 1 };
  }

  return [];
}

async function getClient() {
  return {
    query: async (sql, params) => query(sql, params),
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
}

module.exports = {
  query,
  getClient,
  pool: null,
  // expose raw data for tests/debugging
  _mockData: mockData
};


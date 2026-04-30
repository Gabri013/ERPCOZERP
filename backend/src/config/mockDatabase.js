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
module.exports = mockData;


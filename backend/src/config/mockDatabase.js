// Mock database for quick testing - in-memory store with query support
const mockData = {
  users: [
    {
      id: '1',
      email: 'admin@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
      full_name: 'Administrador',
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
      id: '2',
      email: 'master@erpcoz.local',
      password_hash: '$2b$12$16qbgrLlP4MOjrzkgVXet.NZE/LaxmnwTUNGssMcwVyzofBrTYa9m', // admin123
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
    }
  ],
  clientes: [],
  produtos: [],
  pedidos: [],
  user_sessions: [],
  audit_logs: [],
  roles: [
    { id: '1', code: 'admin', name: 'Administrador', description: 'Acesso total' },
    { id: '2', code: 'master', name: 'Master', description: 'Acesso total com auditoria' },
    { id: '3', code: 'operador', name: 'Operador', description: 'Gestão de estoque e recebimento' },
    { id: '4', code: 'vendedor', name: 'Vendedor', description: 'Pedidos e clientes' }
  ],
  // ACL - Define permissões por role
  permissions: {
    admin: [
      'dashboard:view', 'users:manage', 'roles:manage', 'empresa:manage', 'parametros:view',
      'clientes:view', 'clientes:create', 'clientes:edit', 'clientes:delete',
      'produtos:view', 'produtos:create', 'produtos:edit', 'produtos:delete',
      'estoque:view', 'estoque:manage',
      'pedidos:view', 'pedidos:create', 'pedidos:edit', 'pedidos:delete',
      'producao:view', 'producao:manage',
      'compras:view', 'compras:create', 'compras:edit',
      'financeiro:view', 'financeiro:manage',
      'relatorios:view', 'audit:view'
    ],
    master: [
      'dashboard:view', 'users:view', 'users:create', 'users:edit',
      'clientes:view', 'clientes:create', 'clientes:edit', 'clientes:delete',
      'produtos:view', 'produtos:create', 'produtos:edit', 'produtos:delete',
      'estoque:view', 'estoque:manage',
      'pedidos:view', 'pedidos:create', 'pedidos:edit', 'pedidos:delete',
      'producao:view', 'producao:manage',
      'compras:view', 'compras:create', 'compras:edit',
      'financeiro:view', 'financeiro:edit',
      'relatorios:view', 'audit:view'
    ],
    operador: [
      'dashboard:view',
      'estoque:view', 'estoque:edit',
      'produtos:view',
      'clientes:view',
      'pedidos:view', 'pedidos:create'
    ],
    vendedor: [
      'dashboard:view',
      'clientes:view', 'clientes:create', 'clientes:edit',
      'produtos:view',
      'pedidos:view', 'pedidos:create', 'pedidos:edit',
      'relatorios:view'
    ]
  }
};

// Simple query parser
function parseQuery(sql, params = []) {
  const sqlUpper = sql.toUpperCase();
  console.log('[MockDB] SQL:', sql);
  console.log('[MockDB] Params:', params);
  
  // SELECT queries
  if (sqlUpper.includes('SELECT')) {
    console.log('[MockDB] Processing SELECT query...');
    console.log('[MockDB] SQL Upper:', sqlUpper.substring(0, 200));
    console.log('[MockDB] Contains FROM USERS?', sqlUpper.includes('FROM USERS'));
    if (sqlUpper.includes('FROM USERS') || sqlUpper.includes('FROM U')) {
      console.log('[MockDB] Detected FROM users query');
      let results = mockData.users.slice(); // Copy array
      console.log('[MockDB] Total users before filtering:', results.length);
      
      // Handle WHERE email = ?
      if (sqlUpper.includes('WHERE') && params.length > 0) {
        // First param is usually email in login queries
        const emailToFind = params[0];
        const before = results.length;
        results = results.filter(u => {
          const match = u.email === emailToFind;
          console.log(`[MockDB] User ${u.email} matches ${emailToFind}? ${match}`);
          return match;
        });
        console.log(`[MockDB] Filtered by email: ${emailToFind}, Before: ${before}, After: ${results.length}`);
      }
      
      // Handle AND u.active = TRUE or AND active = TRUE
      if ((sqlUpper.includes('AND U.ACTIVE') || sqlUpper.includes('AND ACTIVE')) && sqlUpper.includes('TRUE')) {
        const before = results.length;
        results = results.filter(u => {
          console.log(`[MockDB] User ${u.email} active? ${u.active}`);
          return u.active === true;
        });
        console.log(`[MockDB] Filtered by active=true, Before: ${before}, After: ${results.length}`);
      }
      
      console.log('[MockDB] Final results:', results.map(r => r.email));
      return results;
    } else if (sqlUpper.includes('FROM ROLES') || sqlUpper.includes('FROM R')) {
      let results = mockData.roles;
      if (sqlUpper.includes('code = ?') && params[0]) {
        results = results.filter(r => r.code === params[0]);
      }
      return results;
    }
    
    return [];
  }
  
  // INSERT queries
  if (sqlUpper.includes('INSERT INTO')) {
    if (sqlUpper.includes('audit_logs')) {
      mockData.audit_logs.push({
        id: Math.random().toString(36).substr(2, 9),
        ...params.reduce((acc, val, idx) => ({ ...acc, [`col_${idx}`]: val }), {})
      });
      return { insertId: mockData.audit_logs.length - 1 };
    }
    if (sqlUpper.includes('user_sessions')) {
      mockData.user_sessions.push({
        id: params[0],
        user_id: params[1],
        session_token: params[2],
        ip_address: params[3],
        user_agent: params[4],
        expires_at: params[5]
      });
      return { insertId: 1 };
    }
    if (sqlUpper.includes('access_logs')) {
      // Mock access log
      return { insertId: 1 };
    }
    return { insertId: Math.random().toString(36).substr(2, 9) };
  }
  
  // UPDATE queries
  if (sqlUpper.includes('UPDATE')) {
    if (sqlUpper.includes('users SET')) {
      // Mock: pretend update succeeded
      return { affectedRows: 1 };
    }
    return { affectedRows: 1 };
  }
  
  // DELETE queries
  if (sqlUpper.includes('DELETE')) {
    return { affectedRows: 1 };
  }
  
  return [];
}

// Simple in-memory database mock
class MockDB {
  async query(sql, params = []) {
    try {
      return parseQuery(sql, params);
    } catch (err) {
      console.error('MockDB query error:', err);
      throw err;
    }
  }

  async getClient() {
    return {
      query: this.query.bind(this),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
}

module.exports = {
  query: (sql, params) => new MockDB().query(sql, params),
  getClient: () => new MockDB().getClient(),
  pool: new MockDB()
};


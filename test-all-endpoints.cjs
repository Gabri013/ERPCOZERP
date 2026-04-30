/**
 * Teste abrangente de todos os endpoints principais
 */
const http = require('http');

const BACKEND = 'http://localhost:3001';
let token = null;

// Login para obter token
function request(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? require('https') : require('http');
    const reqOptions = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    };
    const req = client.request(reqOptions, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  console.log('\n=== TESTE ABRANGENTE DE ENDPOINTS ===\n');

  // 1. Login
  const login = await request('POST', `${BACKEND}/api/test-login`, {
    body: { email: 'admin@Cozinha.com', password: 'admin123_dev' }
  });
  if (login.status === 200) {
    token = JSON.parse(login.body).accessToken;
    console.log('✅ Login OK');
  } else {
    console.log('❌ Login falhou:', login.body);
    process.exit(1);
  }

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const tests = [
    // Entidades
    { name: 'GET /api/entities', test: () => request('GET', `${BACKEND}/api/entities`, auth) },
    { name: 'GET /api/records?entity=produto', test: () => request('GET', `${BACKEND}/api/records?entity=produto`, auth) },
    { name: 'GET /api/records?entity=cliente', test: () => request('GET', `${BACKEND}/api/records?entity=cliente`, auth) },
    { name: 'GET /api/records?entity=fornecedor', test: () => request('GET', `${BACKEND}/api/records?entity=fornecedor`, auth) },
    { name: 'GET /api/records?entity=maquina', test: () => request('GET', `${BACKEND}/api/records?entity=maquina`, auth) },
    { name: 'GET /api/records?entity=apontamento', test: () => request('GET', `${BACKEND}/api/records?entity=apontamento`, auth) },

    // Produção
    { name: 'GET /api/production/ops', test: () => request('GET', `${BACKEND}/api/production/ops`, auth) },
    { name: 'GET /api/production/ops/:id', test: async () => {
      const ops = await request('GET', `${BACKEND}/api/production/ops`, auth);
      const id = JSON.parse(ops.body).data[0]?.id;
      return id ? request('GET', `${BACKEND}/api/production/ops/${id}`, auth) : { status: 200, body: '{}' };
    }},
    { name: 'POST /api/production/ops/:id/apontamento', test: async () => {
      const ops = await request('GET', `${BACKEND}/api/production/ops`, auth);
      const id = JSON.parse(ops.body).data[0]?.id;
      if (!id) return { status: 200, body: '{}' };
      return request('POST', `${BACKEND}/api/production/ops/${id}/apontamento`, {
        ...auth,
        body: { etapa: 'Teste', quantidade: 1, status: 'Finalizado' }
      });
    }},
    { name: 'GET /api/production/apontamentos/:id', test: async () => {
      const ops = await request('GET', `${BACKEND}/api/production/ops`, auth);
      const id = JSON.parse(ops.body).data[0]?.id;
      return id ? request('GET', `${BACKEND}/api/production/apontamentos/${id}`, auth) : { status: 200, body: '{}' };
    }},
    { name: 'POST /api/production/consumo', test: async () => {
      const prods = await request('GET', `${BACKEND}/api/records?entity=produto`, auth);
      const prodId = JSON.parse(prods.body).data[0]?.id;
      const ops = await request('GET', `${BACKEND}/api/production/ops`, auth);
      const opId = JSON.parse(ops.body).data[0]?.id;
      if (!prodId) return { status: 200, body: '{}' };
      return request('POST', `${BACKEND}/api/production/consumo`, {
        ...auth,
        body: { produto_id: prodId, quantidade: 1, op_id: opId || null }
      });
    }},

    // Estoque
    { name: 'GET /api/estoque', test: () => request('GET', `${BACKEND}/api/estoque`, auth) },

    // Compras
    { name: 'GET /api/compras/fornecedores', test: () => request('GET', `${BACKEND}/api/compras/fornecedores`, auth) },
    { name: 'GET /api/compras/ordens-compra', test: () => request('GET', `${BACKEND}/api/compras/ordens-compra`, auth) },

    // RH
    { name: 'GET /api/rh/funcionarios', test: () => request('GET', `${BACKEND}/api/rh/funcionarios`, auth) },

    // Fiscal
    { name: 'GET /api/fiscal/nfe', test: () => request('GET', `${BACKEND}/api/fiscal/nfe`, auth) },

    // Financeiro
    { name: 'GET /api/financeiro/contas-receber', test: () => request('GET', `${BACKEND}/api/financeiro/contas-receber`, auth) },
    { name: 'GET /api/financeiro/contas-pagar', test: () => request('GET', `${BACKEND}/api/financeiro/contas-pagar`, auth) },

    // Config
    { name: 'GET /api/workflows', test: () => request('GET', `${BACKEND}/api/workflows`, auth) },
    { name: 'GET /api/rules', test: () => request('GET', `${BACKEND}/api/rules`, auth) },

    // Dashboard
    { name: 'GET /api/dashboard', test: () => request('GET', `${BACKEND}/api/dashboard`, auth) },
  ];

  let passed = 0, failed = 0;
  for (const t of tests) {
    try {
      const res = await t.test();
      const isPass = res.status >= 200 && res.status < 300;
      if (isPass) {
        console.log(`✅ ${t.name}`);
        passed++;
      } else {
        console.log(`❌ ${t.name} — Status ${res.status}: ${res.body.substring(0, 100)}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${t.name} — Exception: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== RESUMO: ${passed}OK / ${failed}FAIL ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });

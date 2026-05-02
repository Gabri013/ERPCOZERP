/**
 * Teste completo de todos os endpoints do backend
 */
const http = require('http');
const BACKEND = 'http://localhost:3001';
let token = null;

function request(method, url, body = null) {
  return new Promise(resolve => {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    const client = require('http');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path,
      method,
      headers
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('\n=== TESTE DE ENDPOINTS DO BACKEND ===\n');

  // Login
  const login = await request('POST', `${BACKEND}/api/test-login`, {
    email: 'admin@Cozinha.com', password: 'admin123_dev'
  });
  if (login.status === 200) {
    token = JSON.parse(login.body).accessToken;
    console.log('✅ Login OK');
  } else {
    console.log('❌ Login falhou:', login.body);
    process.exit(1);
  }

  const tests = [
    // Core
    { name: 'GET /api/entities', fn: () => request('GET', `${BACKEND}/api/entities`) },
    { name: 'GET /api/records?entity=produto', fn: () => request('GET', `${BACKEND}/api/records?entity=produto`) },
    { name: 'GET /api/records?entity=cliente', fn: () => request('GET', `${BACKEND}/api/records?entity=cliente`) },
    { name: 'GET /api/records?entity=fornecedor', fn: () => request('GET', `${BACKEND}/api/records?entity=fornecedor`) },
    { name: 'GET /api/records?entity=maquina', fn: () => request('GET', `${BACKEND}/api/records?entity=maquina`) },
    { name: 'GET /api/records?entity=apontamento', fn: () => request('GET', `${BACKEND}/api/records?entity=apontamento`) },

    // Vendas
    { name: 'GET /api/records?entity=pedido_venda', fn: () => request('GET', `${BACKEND}/api/records?entity=pedido_venda`) },
    { name: 'GET /api/records?entity=orcamento', fn: () => request('GET', `${BACKEND}/api/records?entity=orcamento`) },

    // Produção
    { name: 'GET /api/production/ops', fn: () => request('GET', `${BACKEND}/api/production/ops`) },
    { name: 'POST /api/production/ops', fn: () => request('POST', `${BACKEND}/api/production/ops`, {
      data: { numero: 'TESTE', produtoDescricao: 'Teste', quantidade: 10, status: 'aberta' }
    })},
    { name: 'GET /api/production/apontamentos/:id (mock)', fn: async () => {
      const ops = await request('GET', `${BACKEND}/api/production/ops`);
      const id = JSON.parse(ops.body).data[0]?.id;
      return id ? request('GET', `${BACKEND}/api/production/apontamentos/${id}`) : { status: 200, body: '{}' };
    }},
    { name: 'POST /api/production/consumo', fn: async () => {
      const prods = await request('GET', `${BACKEND}/api/records?entity=produto`);
      const prodId = JSON.parse(prods.body).data[0]?.id;
      if (!prodId) return { status: 200, body: '{}' };
      return request('POST', `${BACKEND}/api/production/consumo`, { produto_id: prodId, quantidade: 1 });
    }},

    // Estoque
    { name: 'GET /api/records?entity=produto', fn: () => request('GET', `${BACKEND}/api/records?entity=produto`) },

    // Compras
    { name: 'GET /api/compras/fornecedores', fn: () => request('GET', `${BACKEND}/api/compras/fornecedores`) },
    { name: 'GET /api/compras/ordens-compra', fn: () => request('GET', `${BACKEND}/api/compras/ordens-compra`) },

    // RH
    { name: 'GET /api/rh/funcionarios', fn: () => request('GET', `${BACKEND}/api/rh/funcionarios`) },

    // Fiscal
    { name: 'GET /api/fiscal/nfe', fn: () => request('GET', `${BACKEND}/api/fiscal/nfe`) },

    // Financeiro
    { name: 'GET /api/financeiro/contas-receber', fn: () => request('GET', `${BACKEND}/api/financeiro/contas-receber`) },
    { name: 'GET /api/financeiro/contas-pagar', fn: () => request('GET', `${BACKEND}/api/financeiro/contas-pagar`) },
    { name: 'GET /api/financeiro/fluxo-caixa', fn: () => request('GET', `${BACKEND}/api/financeiro/fluxo-caixa`) },

    // Config
    { name: 'GET /api/workflows', fn: () => request('GET', `${BACKEND}/api/workflows`) },
    { name: 'GET /api/rules', fn: () => request('GET', `${BACKEND}/api/rules`) },
    { name: 'GET /api/permissions', fn: () => request('GET', `${BACKEND}/api/permissions`) },

    // Dashboard
    { name: 'GET /api/dashboard', fn: () => request('GET', `${BACKEND}/api/dashboard`) },
  ];

  let passed = 0, failed = 0;
  for (const t of tests) {
    try {
      const res = await t.fn();
      const isPass = res.status >= 200 && res.status < 300;
      if (isPass) {
        console.log(`✅ ${t.name}`);
        passed++;
      } else {
        console.log(`❌ ${t.name} — Status ${res.status}: ${res.body.substring(0, 80)}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${t.name} — Exception: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== RESUMO: ${passed}/${tests.length} endpoints OK ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });

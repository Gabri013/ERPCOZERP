/**
 * Teste abrangente de todos os endpoints principais
 */
const http = require('http');

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3002';
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

async function waitForBackend() {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    const res = await request('GET', `${BACKEND}/health`);
    if (res.status === 200) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  console.log('\n=== TESTE ABRANGENTE DE ENDPOINTS ===\n');

  const ok = await waitForBackend();
  if (!ok) {
    console.log('❌ Backend não ficou saudável em 30s');
    process.exit(1);
  }

  // 1. Login
  const login = await request('POST', `${BACKEND}/api/auth/login`, {
    body: {
      email: process.env.SMOKE_EMAIL || 'master@Cozinha.com',
      password: process.env.SMOKE_PASSWORD || 'master123_dev'
    }
  });
  if (login.status === 200) {
    const parsed = JSON.parse(login.body);
    token = parsed.accessToken || parsed.token;
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
    { name: 'GET /api/records?entity=producao_maquina', test: () => request('GET', `${BACKEND}/api/records?entity=producao_maquina`, auth) },
    { name: 'GET /api/records?entity=apontamento_producao', test: () => request('GET', `${BACKEND}/api/records?entity=apontamento_producao`, auth) },

    // Produção
    { name: 'GET /api/records?entity=ordem_producao', test: () => request('GET', `${BACKEND}/api/records?entity=ordem_producao`, auth) },

    // Estoque
    { name: 'GET /api/records?entity=estoque_inventario', test: () => request('GET', `${BACKEND}/api/records?entity=estoque_inventario`, auth) },
    { name: 'GET /api/records?entity=movimentacao_estoque', test: () => request('GET', `${BACKEND}/api/records?entity=movimentacao_estoque`, auth) },

    // Compras
    { name: 'GET /api/compras/fornecedores', test: () => request('GET', `${BACKEND}/api/compras/fornecedores`, auth) },
    { name: 'GET /api/compras/ordens-compra', test: () => request('GET', `${BACKEND}/api/compras/ordens-compra`, auth) },
    { name: 'GET /api/records?entity=compras_recebimento', test: () => request('GET', `${BACKEND}/api/records?entity=compras_recebimento`, auth) },
    { name: 'GET /api/records?entity=cotacao_compra', test: () => request('GET', `${BACKEND}/api/records?entity=cotacao_compra`, auth) },

    // RH
    { name: 'GET /api/records?entity=rh_funcionario', test: () => request('GET', `${BACKEND}/api/records?entity=rh_funcionario`, auth) },
    { name: 'GET /api/records?entity=rh_ponto', test: () => request('GET', `${BACKEND}/api/records?entity=rh_ponto`, auth) },
    { name: 'GET /api/records?entity=rh_ferias', test: () => request('GET', `${BACKEND}/api/records?entity=rh_ferias`, auth) },

    // Fiscal
    { name: 'GET /api/records?entity=fiscal_nfe', test: () => request('GET', `${BACKEND}/api/records?entity=fiscal_nfe`, auth) },

    // Financeiro
    { name: 'GET /api/financeiro/contas-receber', test: () => request('GET', `${BACKEND}/api/financeiro/contas-receber`, auth) },
    { name: 'GET /api/financeiro/contas-pagar', test: () => request('GET', `${BACKEND}/api/financeiro/contas-pagar`, auth) },

    // Config
    { name: 'GET /api/workflows', test: () => request('GET', `${BACKEND}/api/workflows`, auth) },
    { name: 'GET /api/users', test: () => request('GET', `${BACKEND}/api/users?limit=10`, auth) },

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

/**
 * SMOKE TEST AUTOMATIZADO - ERPCOZERP
 * Testa integridade da API e rotas SPA relacionadas a setores
 * 
 * Executar: node smoke-test.js
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

// Credenciais do ambiente de teste — podem ser sobrescritas por variáveis de ambiente
const TEST_CREDENTIALS = {
  email: process.env.SMOKE_USER_EMAIL || 'master@Cozinha.com',
  password: process.env.SMOKE_USER_PASSWORD || 'master123_dev'
};

// Armazena resultados
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utilitário para requisições HTTP
function request(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        statusText: err.message,
        body: err.message
      });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function logTest(name, success, details = '') {
  const status = success ? '✓ PASS' : '✗ FAIL';
  const color = success ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}${details ? ` - ${details}` : ''}`);
  
  results.tests.push({ name, success, details });
  if (success) results.passed++;
  else results.failed++;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runSmokeTests() {
  console.log('\n========================================');
  console.log('  SMOKE TEST - ERPCOZERP');
  console.log('  Fluxo Completo de Setores (API + SPA)');
  console.log('========================================\n');
  
  let authToken = null;

  // ====================
  // 1. HEALTH CHECKS
  // ====================
  console.log('\n--- 1. HEALTH CHECKS ---\n');

  // Backend health
  const healthRes = await request('GET', `${BACKEND_URL}/health`);
  logTest('Backend /health', healthRes.status === 200, `Status: ${healthRes.status}`);

  // Frontend root
  const frontRes = await request('GET', `${FRONTEND_URL}/`);
  const isHtmlFront = frontRes.body && (
    frontRes.body.toLowerCase().includes('<!doctype html>') ||
    frontRes.body.includes('id="root"') ||
    frontRes.body.includes('React')
  );
  const frontSuccess = frontRes.status === 200 && isHtmlFront;
  logTest('Frontend raiz (/)', frontSuccess, 
    frontRes.status === 200 ? (isHtmlFront ? 'HTML com DOCTYPE' : '200 sem DOCTYPE detectado') : `Status: ${frontRes.status}`);

  // ====================
  // 2. AUTENTICAÇÃO
  // ====================
  console.log('\n--- 2. AUTENTICAÇÃO ---\n');

  const loginRes = await request('POST', `${BACKEND_URL}/api/test-login`, {
    body: TEST_CREDENTIALS
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    authToken = body.accessToken;
    logTest('Login com test-login', true, `Token obtido (${authToken ? authToken.substring(0, 20) + '...' : 'N/A'})`);
  } else {
    logTest('Login com test-login', false, `Status: ${loginRes.status}, Body: ${(loginRes.body || '').substring(0, 100)}`);
  }

  // ====================
  // 3. API ENDPOINTS - CORE
  // ====================
  console.log('\n--- 3. API CORE ENDPOINTS ---\n');

  if (authToken) {
    const authHeaders = { 
      'Authorization': `Bearer ${authToken}` 
    };

    // GET /api/entities
    const entitiesRes = await request('GET', `${BACKEND_URL}/api/entities`, { headers: authHeaders });
    logTest('GET /api/entities', entitiesRes.status === 200, 
      entitiesRes.status === 200 ? 'Lista de entidades obtida' : `Status: ${entitiesRes.status}`);

    // GET /api/estoque (produtos)
    const produtosRes = await request('GET', `${BACKEND_URL}/api/estoque?search=&limit=5`, { headers: authHeaders });
    logTest('GET /api/estoque', produtosRes.status === 200, 
      produtosRes.status === 200 ? 'Produtos listados (estoque)' : `Status: ${produtosRes.status}`);

    // CRUD /api/estoque
    let createdProdutoId = null;
    const novoProduto = {
      codigo: `SMK-${Date.now()}`,
      descricao: `Produto Smoke ${new Date().toISOString()}`,
      tipo: 'Produto',
      unidade: 'UN',
      preco_custo: 1,
      preco_venda: 2,
      estoque_atual: 10,
      estoque_minimo: 1,
      status: 'Ativo',
      grupo: 'Fixadores',
      localizacao: 'SMK'
    };

    const createProdRes = await request('POST', `${BACKEND_URL}/api/estoque`, { headers: authHeaders, body: novoProduto });
    if (createProdRes.status === 201) {
      const body = JSON.parse(createProdRes.body);
      createdProdutoId = body?.data?.id;
      logTest('POST /api/estoque (create)', Boolean(createdProdutoId), createdProdutoId ? 'Criado' : 'Sem id no retorno');
    } else {
      logTest('POST /api/estoque (create)', false, `Status: ${createProdRes.status}, Body: ${(createProdRes.body || '').substring(0, 120)}`);
    }

    if (createdProdutoId) {
      const updateProdRes = await request('PUT', `${BACKEND_URL}/api/estoque/${createdProdutoId}`, {
        headers: authHeaders,
        body: { ...novoProduto, descricao: `${novoProduto.descricao} (editado)` }
      });
      logTest('PUT /api/estoque/:id (update)', updateProdRes.status === 200, `Status: ${updateProdRes.status}`);

      const delProdRes = await request('DELETE', `${BACKEND_URL}/api/estoque/${createdProdutoId}`, { headers: authHeaders });
      logTest('DELETE /api/estoque/:id (delete)', delProdRes.status === 200, `Status: ${delProdRes.status}`);
    } else {
      logTest('PUT /api/estoque/:id (update)', true, 'Create falhou (skip)');
      logTest('DELETE /api/estoque/:id (delete)', true, 'Create falhou (skip)');
    }

    // CRUD financeiro (contas a receber)
    let contaReceberId = null;
    const crRes = await request('POST', `${BACKEND_URL}/api/financeiro/contas-receber`, {
      headers: authHeaders,
      body: {
        descricao: `Smoke CR ${Date.now()}`,
        valor: 10.5,
        data_vencimento: new Date().toISOString().slice(0, 10),
        status: 'aberto'
      }
    });
    if (crRes.status === 201) {
      const body = JSON.parse(crRes.body);
      contaReceberId = body?.data?.id;
      logTest('POST /api/financeiro/contas-receber', Boolean(contaReceberId), contaReceberId ? 'Criado' : 'Sem id no retorno');
    } else {
      logTest('POST /api/financeiro/contas-receber', false, `Status: ${crRes.status}, Body: ${(crRes.body || '').substring(0, 120)}`);
    }

    if (contaReceberId) {
      const crUpRes = await request('PUT', `${BACKEND_URL}/api/financeiro/contas-receber/${contaReceberId}`, {
        headers: authHeaders,
        body: { status: 'recebido' }
      });
      logTest('PUT /api/financeiro/contas-receber/:id', crUpRes.status === 200, `Status: ${crUpRes.status}`);

      const crDelRes = await request('DELETE', `${BACKEND_URL}/api/financeiro/contas-receber/${contaReceberId}`, {
        headers: authHeaders
      });
      logTest('DELETE /api/financeiro/contas-receber/:id', crDelRes.status === 200, `Status: ${crDelRes.status}`);
    } else {
      logTest('PUT /api/financeiro/contas-receber/:id', true, 'Create falhou (skip)');
      logTest('DELETE /api/financeiro/contas-receber/:id', true, 'Create falhou (skip)');
    }

    // CRUD compras (fornecedores)
    let fornecedorId = null;
    const fornRes = await request('POST', `${BACKEND_URL}/api/compras/fornecedores`, {
      headers: authHeaders,
      body: { nome: `Fornecedor Smoke ${Date.now()}`, cnpj: '00.000.000/0000-00', ativo: true }
    });
    if (fornRes.status === 201) {
      const body = JSON.parse(fornRes.body);
      fornecedorId = body?.data?.id;
      logTest('POST /api/compras/fornecedores', Boolean(fornecedorId), fornecedorId ? 'Criado' : 'Sem id no retorno');
    } else {
      logTest('POST /api/compras/fornecedores', false, `Status: ${fornRes.status}, Body: ${(fornRes.body || '').substring(0, 120)}`);
    }

    if (fornecedorId) {
      const fornUpRes = await request('PUT', `${BACKEND_URL}/api/compras/fornecedores/${fornecedorId}`, {
        headers: authHeaders,
        body: { nome: `Fornecedor Smoke ${Date.now()} (editado)`, cnpj: '00.000.000/0000-00', ativo: true }
      });
      logTest('PUT /api/compras/fornecedores/:id', fornUpRes.status === 200, `Status: ${fornUpRes.status}`);

      const fornDelRes = await request('DELETE', `${BACKEND_URL}/api/compras/fornecedores/${fornecedorId}`, {
        headers: authHeaders
      });
      logTest('DELETE /api/compras/fornecedores/:id', fornDelRes.status === 200, `Status: ${fornDelRes.status}`);
    } else {
      logTest('PUT /api/compras/fornecedores/:id', true, 'Create falhou (skip)');
      logTest('DELETE /api/compras/fornecedores/:id', true, 'Create falhou (skip)');
    }

    // GET /api/production/ops
    const opsRes = await request('GET', `${BACKEND_URL}/api/production/ops?limit=5`, { headers: authHeaders });
    logTest('GET /api/production/ops', opsRes.status === 200, 
      opsRes.status === 200 ? 'Ordens de produção listadas' : `Status: ${opsRes.status}`);

    // Se houver OPs, testa detalhe e apontamentos
    let opId = null;
    if (opsRes.status === 200) {
      const opsData = JSON.parse(opsRes.body);
      if (opsData.data && opsData.data.length > 0) {
        opId = opsData.data[0].id;
        
        // GET /api/production/ops/:id (detalhe)
        const opDetailRes = await request('GET', `${BACKEND_URL}/api/production/ops/${opId}`, { headers: authHeaders });
        logTest(`GET /api/production/ops/:id (detalhe)`, opDetailRes.status === 200,
          opDetailRes.status === 200 ? 'Detalhe OP obtido' : `Status: ${opDetailRes.status}`);

        // GET /api/production/apontamentos/:id
        const apontRes = await request('GET', `${BACKEND_URL}/api/production/apontamentos/${opId}`, { headers: authHeaders });
        logTest(`GET /api/production/apontamentos/:id`, apontRes.status === 200,
          apontRes.status === 200 ? 'Apontamentos listados' : `Status: ${apontRes.status}`);
      } else {
        logTest('GET /api/production/ops/:id', true, 'Nenhuma OP para testar detalhe (skip)');
        logTest('GET /api/production/apontamentos/:id', true, 'Nenhuma OP para testar (skip)');
      }
    } else {
      logTest('GET /api/production/ops/:id', false, 'Falha ao listar OPs');
      logTest('GET /api/production/apontamentos/:id', false, 'Falha ao listar OPs');
    }

    // GET /api/records?entity=maquina
    const maquinasRes = await request('GET', `${BACKEND_URL}/api/records?entity=maquina&limit=5`, { headers: authHeaders });
    logTest('GET /api/records?entity=maquina', maquinasRes.status === 200,
      maquinasRes.status === 200 ? 'Máquinas listadas' : `Status: ${maquinasRes.status}`);

    // GET /api/records?entity=apontamento
    const apontamentosRes = await request('GET', `${BACKEND_URL}/api/records?entity=apontamento&limit=5`, { headers: authHeaders });
    logTest('GET /api/records?entity=apontamento', apontamentosRes.status === 200,
      apontamentosRes.status === 200 ? 'Apontamentos (records) listados' : `Status: ${apontamentosRes.status}`);

    // ====================
    // 4. ROTAS SPA - SETORES
    // ====================
    console.log('\n--- 4. ROTAS SPA (Produção) ---\n');

    const spaRoutes = [
      '/producao/ordens',
      '/producao/ordens/novo', 
      '/producao/ordens/123', // com ID fake, ainda deve retornar HTML (React app)
      '/producao/maquinas',
      '/producao/pcp',
      '/producao/kanban',
      '/producao/chao-fabrica',
      '/producao/roteiros',
      '/producao/apontamento' 
    ];

     for (const route of spaRoutes) {
       const spaRes = await request('GET', `${FRONTEND_URL}${route}`);
       const isHtml = spaRes.body && (
         spaRes.body.toLowerCase().includes('<!doctype html>') ||
         spaRes.body.includes('id="root"') ||
         spaRes.body.includes('React')
       );
       const success = spaRes.status === 200 && isHtml;
       logTest(`SPA GET ${route}`, success, 
         success ? 'HTML React retornado' : `Status: ${spaRes.status}, HTML: ${isHtml}`);
     }

    // ====================
    // 5. TESTE DE 404s INTENCIONAIS
    // ====================
    console.log('\n--- 5. TRATAMENTO DE 404 ---\n');

    const notFoundRes = await request('GET', `${BACKEND_URL}/api/records?entity=entidade_inexistente`, { headers: authHeaders });
    logTest('GET /api/records com entity inexistente (deve 404)', notFoundRes.status === 404,
      `Status: ${notFoundRes.status}`);

    const spaNotFoundRes = await request('GET', `${FRONTEND_URL}/rota-que-nao-existe-123`);
    const isHtml404 = spaNotFoundRes.body && (spaNotFoundRes.body.toLowerCase().includes('<!doctype html>') || spaNotFoundRes.body.includes('id="root"') || spaNotFoundRes.body.includes('React'));
    const success404 = spaNotFoundRes.status === 200 && isHtml404;
    logTest('SPA fallback para route desconhecida', success404,
      `Status: ${spaNotFoundRes.status}, HTML: ${isHtml404}`);

  } else {
    console.log('\x1b[33m Pulando testes de API por falta de token de autenticação.\x1b[0m');
  }

  // ====================
  // 6. ROTAS PÚBLICAS
  // ====================
  console.log('\n--- 6. ROTAS PÚBLICAS ---\n');

    const loginPageRes = await request('GET', `${FRONTEND_URL}/login/`);
    const isLoginHtml = loginPageRes.body && (loginPageRes.body.toLowerCase().includes('<!doctype html>') || loginPageRes.body.includes('id="root"') || loginPageRes.body.includes('React'));
    logTest('SPA GET /login', loginPageRes.status === 200 && isLoginHtml, 
      loginPageRes.status === 200 ? (isLoginHtml ? 'HTML login OK' : '200 sem DOCTYPE') : `Status: ${loginPageRes.status}`);

  // ====================
  // RESUMO
  // ====================
  console.log('\n========================================');
  console.log('  RESUMO DOS RESULTADOS');
  console.log('========================================');
  console.log(`Total: ${results.passed + results.failed} testes`);
  console.log(`\x1b[32mPassed: ${results.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${results.failed}\x1b[0m`);
  console.log('========================================\n');

  if (results.failed > 0) {
    console.log('\x1b[31mFALHAS DETECTADAS:\x1b[0m');
    results.tests.filter(t => !t.success).forEach(t => {
      console.log(`  ✗ ${t.name} - ${t.details}`);
    });
    console.log('');
  }

  console.log('Log completo salvo em: smoke-test-results.json\n');
  require('fs').writeFileSync('smoke-test-results.json', JSON.stringify(results, null, 2));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar
runSmokeTests().catch(err => {
  console.error('Erro ao executar smoke test:', err);
  process.exit(1);
});

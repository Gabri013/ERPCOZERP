const http = require('http');
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

function request(method, url, body = null, headers = {}) {
  return new Promise(resolve => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? require('https') : http;
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };

    const req = client.request(opts, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', error => resolve({ status: 0, body: error.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function assertStatus(testName, promise, expectedStatus = 200) {
  const res = await promise;
  const ok = res.status === expectedStatus;
  console.log(`${ok ? '✅' : '❌'} ${testName} — ${res.status}`);
  if (!ok) {
    console.log('   body:', res.body?.substring(0, 200));
  }
  return ok;
}

(async () => {
  const tests = [];
  let token = null;

  tests.push({
    name: 'GET /api/health',
    fn: () => request('GET', `${BACKEND}/api/health`)
  });

  tests.push({
    name: 'POST /api/auth/login (válido)',
    fn: async () => {
      const res = await request('POST', `${BACKEND}/api/auth/login`, {
        email: 'admin@Cozinha.com',
        password: 'admin123_dev'
      });
      if (res.status === 200) {
        try {
          token = JSON.parse(res.body).accessToken || JSON.parse(res.body).token || null;
        } catch (error) {
          token = null;
        }
      }
      return res;
    }
  });

  tests.push({
    name: 'POST /api/auth/login (inválido)',
    fn: () => request('POST', `${BACKEND}/api/auth/login`, {
      email: 'wrong@user.com',
      password: 'badpassword'
    })
  });

  tests.push({
    name: 'GET /api/auth/me',
    fn: () => request('GET', `${BACKEND}/api/auth/me`, null, {
      Authorization: token ? `Bearer ${token}` : 'Bearer invalid'
    })
  });

  tests.push({
    name: 'GET /api/users',
    fn: () => request('GET', `${BACKEND}/api/users`, null, {
      Authorization: token ? `Bearer ${token}` : 'Bearer invalid'
    })
  });

  tests.push({ name: 'GET /api/stock/products', fn: () => request('GET', `${BACKEND}/api/stock/products`, null, { Authorization: `Bearer ${token}` }) });
  tests.push({ name: 'GET /api/sales/orders', fn: () => request('GET', `${BACKEND}/api/sales/orders`, null, { Authorization: `Bearer ${token}` }) });
  tests.push({ name: 'GET /api/financial/entries', fn: () => request('GET', `${BACKEND}/api/financial/entries`, null, { Authorization: `Bearer ${token}` }) });
  tests.push({ name: 'GET /api/work-orders', fn: () => request('GET', `${BACKEND}/api/work-orders`, null, { Authorization: `Bearer ${token}` }) });
  tests.push({ name: 'GET /api/crm/leads', fn: () => request('GET', `${BACKEND}/api/crm/leads`, null, { Authorization: `Bearer ${token}` }) });

  console.log('\n=== SMOKE API TESTS ===\n');
  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await test.fn();
    const expected = test.name.includes('(inválido)') ? 401 : 200;
    const ok = await assertStatus(test.name, Promise.resolve(result), expected);
    if (ok) passed++;

    if (test.name === 'POST /api/auth/login (válido)' && result.status === 200 && !token) {
      try {
        token = JSON.parse(result.body).accessToken || JSON.parse(result.body).token || null;
      } catch (err) {
        token = null;
      }
    }
  }

  console.log(`\nResultado: ${passed}/${total} testes passaram\n`);
  process.exit(passed === total ? 0 : 1);
})();

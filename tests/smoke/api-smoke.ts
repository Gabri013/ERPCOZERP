import http from 'node:http';
import https from 'node:https';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

type SmokeResponse = {
  status: number;
  body: string;
};

type SmokeTestCase = {
  name: string;
  fn: () => Promise<SmokeResponse>;
};

type TestResult = {
  name: string;
  passed: boolean;
  error?: string;
};

function request(method: string, url: string, body: unknown = null, headers: Record<string, string> = {}) {
  return new Promise<SmokeResponse>((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };

    const req = client.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });

    req.on('error', (error: Error) => resolve({ status: 0, body: error.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function assertStatus(testName: string, response: SmokeResponse, expectedStatus = 200): Promise<boolean> {
  const ok = response.status === expectedStatus;
  console.log(`${ok ? '✅' : '❌'} ${testName} — ${response.status}`);
  if (!ok) {
    console.log('   body:', response.body.substring(0, 200));
  }
  return ok;
}

void (async () => {
  const tests: SmokeTestCase[] = [];
  let token: string | null = null;

  tests.push({
    name: 'GET /api/health',
    fn: () => request('GET', `${BACKEND}/api/health`),
  });

  tests.push({
    name: 'POST /api/auth/login (válido)',
    fn: async () => {
      const response = await request('POST', `${BACKEND}/api/auth/login`, {
        email: 'admin@Cozinha.com',
        password: 'admin123_dev',
      });
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.body) as { accessToken?: string; token?: string };
          token = parsed.accessToken || parsed.token || null;
        } catch {
          token = null;
        }
      }
      return response;
    },
  });

  tests.push({
    name: 'POST /api/auth/login (inválido)',
    fn: () =>
      request('POST', `${BACKEND}/api/auth/login`, {
        email: 'wrong@user.com',
        password: 'badpassword',
      }),
  });

  tests.push({
    name: 'GET /api/auth/me',
    fn: () =>
      request('GET', `${BACKEND}/api/auth/me`, null, {
        Authorization: token ? `Bearer ${token}` : 'Bearer invalid',
      }),
  });

  tests.push({
    name: 'GET /api/users',
    fn: () =>
      request('GET', `${BACKEND}/api/users`, null, {
        Authorization: token ? `Bearer ${token}` : 'Bearer invalid',
      }),
  });

  tests.push({
    name: 'GET /api/stock/products',
    fn: () => request('GET', `${BACKEND}/api/stock/products`, null, { Authorization: `Bearer ${token}` }),
  });
  tests.push({
    name: 'GET /api/sales/orders',
    fn: () => request('GET', `${BACKEND}/api/sales/orders`, null, { Authorization: `Bearer ${token}` }),
  });
  tests.push({
    name: 'GET /api/financial/entries',
    fn: () => request('GET', `${BACKEND}/api/financial/entries`, null, { Authorization: `Bearer ${token}` }),
  });
  tests.push({
    name: 'GET /api/work-orders',
    fn: () => request('GET', `${BACKEND}/api/work-orders`, null, { Authorization: `Bearer ${token}` }),
  });
  tests.push({
    name: 'GET /api/crm/leads',
    fn: () => request('GET', `${BACKEND}/api/crm/leads`, null, { Authorization: `Bearer ${token}` }),
  });

  console.log('\n=== SMOKE API TESTS ===\n');
  let passed = 0;
  const total = tests.length;

  for (const test of tests) {
    const response = await test.fn();
    const expected = test.name.includes('(inválido)') ? 401 : 200;
    const ok = await assertStatus(test.name, response, expected);
    if (ok) passed++;

    if (test.name === 'POST /api/auth/login (válido)' && response.status === 200 && !token) {
      try {
        const parsed = JSON.parse(response.body) as { accessToken?: string; token?: string };
        token = parsed.accessToken || parsed.token || null;
      } catch {
        token = null;
      }
    }
  }

  const result: TestResult = {
    name: 'smoke',
    passed: passed === total,
  };

  console.log(`\nResultado: ${passed}/${total} testes passaram\n`);
  process.exit(result.passed ? 0 : 1);
})();
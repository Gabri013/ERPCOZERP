import { test, expect, request as playwrightRequest } from '@playwright/test';

const BACKEND = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:3001';
const MASTER_EMAIL = process.env.DEFAULT_MASTER_EMAIL || 'master@Cozinha.com';
const MASTER_PASS = process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev';

test.describe('E2E HR flow (API)', () => {
  let api: any;
  let token: string;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({ baseURL: BACKEND });
    const res = await api.post('/api/auth/login', { data: { email: MASTER_EMAIL, password: MASTER_PASS } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    token = body.token;
    expect(token).toBeTruthy();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('Create employee, register time entry and run payroll', async () => {
    // 1) create employee
    const code = `E2E-EMP-${Date.now()}`;
    const empRes = await api.post('/api/hr/employees', {
      headers: { Authorization: `Bearer ${token}` },
      data: { code, fullName: 'Funcionario E2E Test', email: `e2e-${Date.now()}@example.com`, salaryBase: 3000 },
    });
    expect(empRes.status()).toBe(201);
    const empBody = await empRes.json();
    const employeeId = empBody.data?.id || empBody.id;
    expect(employeeId).toBeTruthy();

    // 2) register attendance
    const date = new Date().toISOString().slice(0, 10);
    const timeRes = await api.post('/api/hr/time-entries', {
      headers: { Authorization: `Bearer ${token}` },
      data: { employeeId, workDate: date, hours: 8 },
    });
    expect(timeRes.status()).toBe(201);

    // 3) run payroll for current month
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const payRes = await api.post('/api/hr/payroll/calculate', {
      headers: { Authorization: `Bearer ${token}` },
      data: { month },
    });
    expect(payRes.status()).toBe(200);
    const payBody = await payRes.json();
    expect(payBody).toHaveProperty('success', true);
    const run = payBody.data || payBody;
    expect(run.referenceMonth || run.referenceMonth).toBe(month);
    // 4) fetch payroll run and validate line exists
    const fetchRes = await api.get(`/api/hr/payroll/${month}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(fetchRes.status()).toBe(200);
    const fetchBody = await fetchRes.json();
    const found = (fetchBody.data?.lines || fetchBody.lines || []).find((l: any) => l.employeeId === employeeId || l.employee?.id === employeeId);
    expect(found).toBeTruthy();
    expect(found).toHaveProperty('gross');
    expect(found).toHaveProperty('net');
  });
});

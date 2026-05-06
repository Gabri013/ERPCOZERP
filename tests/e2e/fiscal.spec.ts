import { test, expect, request as playwrightRequest } from '@playwright/test';

const BACKEND = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:3001';
const MASTER_EMAIL = process.env.DEFAULT_MASTER_EMAIL || 'master@Cozinha.com';
const MASTER_PASS = process.env.DEFAULT_MASTER_PASSWORD || 'master123_dev';

test.describe('E2E Fiscal flow (API)', () => {
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

  test('Create sale order, emit NF-e and validate XML storage', async () => {
    // 1) create a product to sell
    const prodRes = await api.post('/api/stock/products', {
      headers: { Authorization: `Bearer ${token}` },
      data: { code: `TEST-PROD-${Date.now()}`, name: 'Produto Teste E2E', unit: 'UN', salePrice: 100 },
    });
    expect([201, 200]).toContain(prodRes.status());
    const prodBody = await prodRes.json();
    const productId = prodBody.data?.id || prodBody.id;
    expect(productId).toBeTruthy();

    // 2) create a customer
    const custRes = await api.post('/api/sales/customers', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: `Cliente Teste ${Date.now()}` },
    });
    expect(custRes.status()).toBe(201);
    const custBody = await custRes.json();
    const customerId = custBody.data?.id || custBody.id;
    expect(customerId).toBeTruthy();

    // 3) create sale order
    const orderRes = await api.post('/api/sales/sale-orders', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerId,
        items: [{ productId, quantity: 1, unitPrice: 100 }],
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderBody = await orderRes.json();
    const orderId = orderBody.data?.id || orderBody.id;
    expect(orderId).toBeTruthy();

    // 4) emit NF-e via fiscal endpoint (real Focus integration may respond differently in your env)
    const nota = {
      emitente: { cnpj: '12345678000123', razaoSocial: 'Emitente Teste' },
      destinatario: { cnpj: '98765432000198', nome: 'Cliente Teste', endereco: { uf: 'SP' } },
      items: [{ quantidade: 1, valor_unitario: 100 }],
      saleOrderId: orderId,
    };

    const nfeRes = await api.post('/api/fiscal/nfe', {
      headers: { Authorization: `Bearer ${token}` },
      data: nota,
    });

    // Accept 201 (created) or 200 depending on environment
    expect([200, 201]).toContain(nfeRes.status());
    const nfeBody = await nfeRes.json();
    expect(nfeBody).toHaveProperty('success', true);
    const result = nfeBody.data || nfeBody;
    expect(result.referencia || result.referencia).toBeTruthy();

    const referencia = result.referencia || result.referencia;

    // 5) validate XML can be downloaded
    const xmlRes = await api.get(`/api/fiscal/nfe/${referencia}/xml`, { headers: { Authorization: `Bearer ${token}` } });
    expect([200]).toContain(xmlRes.status());
    const ct = xmlRes.headers()['content-type'] || '';
    expect(ct).toContain('xml');
    const xmlText = await xmlRes.text();
    expect(xmlText.length).toBeGreaterThan(20);
  });
});

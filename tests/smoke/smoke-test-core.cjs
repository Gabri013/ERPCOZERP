// Smoke test do Backend Core (Postgres/Prisma) — API only
// Uso:
//   node smoke-test-core.cjs
//
// Config via env:
//   CORE_BASE_URL (default http://127.0.0.1:3001)
//   CORE_LOGIN_EMAIL / CORE_LOGIN_PASSWORD

const CORE_BASE_URL = process.env.CORE_BASE_URL || 'http://127.0.0.1:3001';
const LOGIN_EMAIL = process.env.CORE_LOGIN_EMAIL || 'master@Cozinha.com';
const LOGIN_PASSWORD = process.env.CORE_LOGIN_PASSWORD || 'master123_dev';

async function jfetch(path, opts = {}) {
  const res = await fetch(`${CORE_BASE_URL}${path}`, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { res, body };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  console.log('========================================');
  console.log('  SMOKE TEST - CORE (Postgres/Prisma)');
  console.log('========================================\n');

  // Health
  const h = await jfetch('/health');
  assert(h.res.ok, `/health status ${h.res.status}`);
  assert(h.body?.postgres === 'ok', 'postgres not ok');
  console.log('✓ health ok');

  // Login
  const login = await jfetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  assert(login.res.ok, `login status ${login.res.status}`);
  assert(login.body?.token, 'token missing');
  const token = login.body.token;
  console.log('✓ login ok');

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Clientes CRUD
  const create = await jfetch('/api/vendas/clientes', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ razao_social: `Cliente Smoke ${Date.now()}`, status: 'Ativo' }),
  });
  assert(create.res.status === 201, `clientes create status ${create.res.status}`);
  const id = create.body?.data?.id;
  assert(id, 'clientes create id missing');
  console.log('✓ clientes create ok');

  const update = await jfetch(`/api/vendas/clientes/${id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ razao_social: `Cliente Smoke ${Date.now()} (upd)`, status: 'Ativo' }),
  });
  assert(update.res.ok, `clientes update status ${update.res.status}`);
  console.log('✓ clientes update ok');

  const list = await jfetch('/api/vendas/clientes?limit=50', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(list.res.ok, `clientes list status ${list.res.status}`);
  assert(Array.isArray(list.body?.data), 'clientes list data not array');
  console.log('✓ clientes list ok');

  const del = await jfetch(`/api/vendas/clientes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(del.res.ok, `clientes delete status ${del.res.status}`);
  console.log('✓ clientes delete ok');

  // Ordens de Compra CRUD
  const ocCreate = await jfetch('/api/compras/ordens-compra', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fornecedor_nome: 'Fornecedor Smoke',
      status: 'Rascunho',
      data_emissao: new Date().toISOString().slice(0, 10),
      data_entrega_prevista: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      itens: [{ produto_id: 'PRD-001', produto_descricao: 'Item', quantidade: 2, unidade: 'UN', preco_unitario: 10 }],
      observacoes: 'ok',
    }),
  });
  assert(ocCreate.res.status === 201, `oc create status ${ocCreate.res.status}`);
  const ocId = ocCreate.body?.data?.id;
  assert(ocId, 'oc create id missing');
  console.log('✓ ordens-compra create ok');

  const ocUpdate = await jfetch(`/api/compras/ordens-compra/${ocId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ ...(ocCreate.body.data || {}), fornecedor_nome: 'Fornecedor Smoke (upd)' }),
  });
  assert(ocUpdate.res.ok, `oc update status ${ocUpdate.res.status}`);
  console.log('✓ ordens-compra update ok');

  const ocList = await jfetch('/api/compras/ordens-compra?limit=50', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(ocList.res.ok, `oc list status ${ocList.res.status}`);
  assert(Array.isArray(ocList.body?.data), 'oc list data not array');
  console.log('✓ ordens-compra list ok');

  const ocDel = await jfetch(`/api/compras/ordens-compra/${ocId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(ocDel.res.ok, `oc delete status ${ocDel.res.status}`);
  console.log('✓ ordens-compra delete ok');

  console.log('\n✅ CORE smoke passed');
})().catch((e) => {
  console.error('\n❌ CORE smoke failed:', e?.message || e);
  process.exit(1);
});


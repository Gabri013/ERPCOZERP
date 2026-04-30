const http = require('http');  // mudança: usar http

const FRONTEND = 'http://localhost:5173';

function request(url) {
  return new Promise(resolve => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? require('https') : require('http');  // adaptar
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET'
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, ok: res.statusCode === 200 && data.includes('<!DOCTYPE') });
      });
    });
    req.on('error', e => {
      resolve({ status: 0, error: e.message });
    });
    req.end();
  });
}

(async () => {
  console.log('\n=== TESTE DE ROTAS SPA ===\n');
  let passed = 0, failed = 0;
  
  for (const route of routes) {
    const url = FRONTEND + route;
    try {
      const res = await request(url);
      if (res.ok) {
        console.log(`✅ ${route}`);
        passed++;
      } else {
        console.log(`❌ ${route} — Status ${res.status} ou não HTML válido`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${route} — Erro: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== RESUMO: ${passed}/${routes.length} rotas OK ===\n`);
  process.exit(failed > 0 ? 1 : 0);
})();

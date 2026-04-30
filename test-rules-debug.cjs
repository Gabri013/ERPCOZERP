const http = require('http');
const loginData = JSON.stringify({ email: 'admin@Cozinha.com', password: 'admin123_dev' });
const req = http.request({
  hostname: 'localhost', port: 3001, path: '/api/test-login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', async () => {
    const tok = JSON.parse(d).accessToken;
    console.log('Novo token:', tok.substring(0, 20) + '...');
    // Testar /api/rules
    const r = http.request({
      hostname: 'localhost', port: 3001, path: '/api/rules', method: 'GET',
      headers: { 'Authorization': 'Bearer ' + tok }
    }, res2 => {
      let d2 = ''; res2.on('data', c => d2 += c); res2.on('end', () => {
        console.log('Rules status:', res2.statusCode, 'Body:', d2.substring(0, 200));
      });
    }).on('error', e => console.error(e)).end();
  });
}).on('error', e => console.error(e));
req.write(loginData);
req.end();

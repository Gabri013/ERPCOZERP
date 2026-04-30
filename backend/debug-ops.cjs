const http = require('http');

// 1. Login
const loginData = JSON.stringify({ email: 'admin@Cozinha.com', password: 'admin123_dev' });

const loginReq = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/test-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(body);
    const token = parsed.accessToken;
    console.log('Token:', token.substring(0, 30) + '...');

    // 2. Request ops
    const opsReq = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/production/ops',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, res2 => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('Ops Status:', res2.statusCode);
        console.log('Ops Body:', body2);
      });
    }).on('error', e => console.error(e));
    opsReq.end();
  });
});

loginReq.on('error', e => console.error(e));
loginReq.write(loginData);
loginReq.end();

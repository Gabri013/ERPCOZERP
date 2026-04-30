// Testa chamar o endpoint /api/test-login usando http
const http = require('http');

const postData = JSON.stringify({ email: 'admin@erpcoz.local', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/test-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();

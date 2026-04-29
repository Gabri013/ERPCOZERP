const http = require('http');

const data = JSON.stringify({ email: 'master@base44.com', password: 'master123_dev' });

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();
const http = require('http');
const token = 'USE_TOKEN_PLACEHOLDER'; // será substituído

// Primeiro, login
const loginData = JSON.stringify({ email: 'admin@Cozinha.com', password: 'admin123_dev' });
const loginReq = http.request({
  hostname: 'localhost', port: 3001, path: '/api/test-login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
}, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => {
    const tok = JSON.parse(d).accessToken;
    console.log('Token:', tok.substring(0,20)+'...');
    // Agora testa workflows
    const req = http.request({
      hostname: 'localhost', port:3001, path:'/api/workflows', method:'GET',
      headers: {'Authorization':'Bearer '+tok}
    }, res2 => {
      let d2=''; res2.on('data',c=>d2+=c); res2.on('end',()=>console.log('Workflows status:',res2.statusCode,'Body:',d2));
    }).on('e',e=>console.error(e)).end();
  });
}).on('error', e=>console.error(e));
loginReq.write(loginData);
loginReq.end();

const data = JSON.stringify({ email: 'master@base44.com', password: 'master123_dev' });

fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: data
})
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error(e));
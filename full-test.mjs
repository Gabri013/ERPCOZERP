// 1. Login
const loginRes = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'master@base44.com', password: 'master123_dev' })
});
const loginData = await loginRes.json();
console.log('Login status:', loginRes.status);
const token = loginData.accessToken;
console.log('Token:', token ? 'OK' : 'MISSING');

// 2. Get current user
const meRes = await fetch('http://localhost:3001/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
const meData = await meRes.json();
console.log('Me status:', meRes.status);
console.log('Me data:', JSON.stringify(meData, null, 2));

// 3. Test dashboard KPIs (requires master role)
const kpiRes = await fetch('http://localhost:3001/api/dashboard/kpis', {
  headers: { Authorization: `Bearer ${token}` }
});
console.log('KPIs status:', kpiRes.status);
const kpiData = await kpiRes.json();
console.log('KPIs:', JSON.stringify(kpiData, null, 2));
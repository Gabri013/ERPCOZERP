const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIzZWEyYzhhZGQ0MyIsInVzZXJJZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIzZWEyYzhhZGQ0MyIsImVtYWlsIjoibWFzdGVyQGJhc2U0NC5jb20iLCJyb2xlcyI6WyJtYXN0ZXIiXSwiaWF0IjoxNzc3NTA4NjIyLCJleHAiOjE3NzgxMTA0MjJ9.ldFWS1liAe2igjjzGp8ZDm_vgtu8mzB7Lnk5_sQpwo8';

const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
console.log('Status:', response.status);
console.log('Data:', JSON.stringify(data, null, 2));
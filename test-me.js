const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIzZWEyYzhhZGQ0MyIsInVzZXJJZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIzZWEyYzhhZGQ0MyIsImVtYWlsIjoibWFzdGVyQGJhc2U0NC5jb20iLCJyb2xlcyI6WyJtYXN0ZXIiXSwiaWF0IjoxNzc3NTA4NjIyLCJleHAiOjE3NzgxMTA0MjJ9.ldFWS1liAe2igjjzGp8ZDm_vgtu8mzB7Lnk5_sQpwo8';

const req = {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` }
};

fetch('http://localhost:3001/api/auth/me', req)
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => console.log('Data:', data))
  .catch(e => console.error('Error:', e));
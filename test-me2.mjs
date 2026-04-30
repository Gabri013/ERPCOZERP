const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIyZWEyYzhhZGQ0MyIsInVzZXJJZCI6ImU5ZmJlNWQ4LWE1MDgtNDFjYi05YjFjLWIyZWEyYzhhZGQ0MyIsImVtYWlsIjoibWFzdGVyQGJhc2U0NC5jb20iLCJyb2xlcyI6WyJtYXN0ZXIiXSwiaWF0IjoxNzc3NTM3NjQ3LCJleHAiOjE3NzgxNDI0NDd9.57aOi8btaF9KSXk9cudkyGf8E9mGjtN9YFhCYA9VfXQ';

const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
console.log('Status:', response.status);
console.log('Data:', JSON.stringify(data, null, 2));
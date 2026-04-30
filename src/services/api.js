// Camada de API centralizada
// Em produção, usa paths relativos — proxy da Vercel encaminha para backend
// Em desenvolvimento, usa mock data

const isDev = import.meta.env.DEV;

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }
  return null;
}

export const api = {
  get: async (url, mockData) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      return { success: true, data: mockData };
    }
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    return res.json();
  },
  post: async (url, data, mockReturn) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API POST] ${url}`, data);
      return { success: true, data: { ...data, id: Date.now(), ...mockReturn } };
    }
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  put: async (url, data) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API PUT] ${url}`, data);
      return { success: true, data };
    }
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (url) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API DELETE] ${url}`);
      return { success: true };
    }
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'DELETE', headers });
    return res.json();
  },
};


// Camada de API centralizada
// Em produção, usa paths relativos — proxy da Vercel encaminha para backend
// Em desenvolvimento, usa mock data

const isDev = import.meta.env.DEV;

export const api = {
  get: async (url, mockData) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      return { success: true, data: mockData };
    }
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },
  post: async (url, data, mockReturn) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API POST] ${url}`, data);
      return { success: true, data: { ...data, id: Date.now(), ...mockReturn } };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  put: async (url, data) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API PUT] ${url}`, data);
      return { success: true, data };
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (url) => {
    if (isDev) {
      await new Promise(r => setTimeout(r, 300));
      console.log(`[API DELETE] ${url}`);
      return { success: true };
    }
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },
};


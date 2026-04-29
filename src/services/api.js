// Camada de API centralizada — troque o conteúdo das funções por fetch real quando tiver backend
const DELAY = 300;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const isDev = true; // trocar por import.meta.env.DEV quando conectar backend

export const api = {
  get: async (url, mockData) => {
    await delay(DELAY);
    if (isDev) return { success: true, data: mockData };
    const res = await fetch(url);
    return res.json();
  },
  post: async (url, data, mockReturn) => {
    await delay(DELAY);
    if (isDev) {
      console.log(`[API POST] ${url}`, data);
      return { success: true, data: { ...data, id: Date.now(), ...mockReturn } };
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  put: async (url, data) => {
    await delay(DELAY);
    if (isDev) {
      console.log(`[API PUT] ${url}`, data);
      return { success: true, data };
    }
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (url) => {
    await delay(DELAY);
    if (isDev) {
      console.log(`[API DELETE] ${url}`);
      return { success: true };
    }
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },
};
// Camada de persistência via localStorage
// Troque por chamadas de API reais quando tiver backend

const PREFIX = 'nomus_erp_';

export const storage = {
  get: (key, fallback) => {
    try {
      const val = localStorage.getItem(PREFIX + key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('[storage] Falha ao salvar:', key, e);
    }
  },
  remove: (key) => localStorage.removeItem(PREFIX + key),
};
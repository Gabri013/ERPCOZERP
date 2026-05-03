import { api } from '@/services/api';

function items(res) {
  const v = res?.data?.data?.items ?? res?.data?.items;
  return Array.isArray(v) ? v : [];
}

export const metaCodeApi = {
  async listCategories() {
    const res = await api.get('/api/meta-code/categories', { silent403: true });
    return items(res);
  },

  async listCategoriesAll() {
    const res = await api.get('/api/meta-code/categories/all');
    return items(res);
  },

  async saveCategory(body) {
    const res = await api.put('/api/meta-code/categories', body);
    return res?.data?.data ?? res?.data;
  },

  async saveRule(body) {
    const res = await api.put('/api/meta-code/rules', body);
    return res?.data?.data ?? res?.data;
  },

  async getRule(entity) {
    try {
      const res = await api.get(`/api/meta-code/rules/${encodeURIComponent(entity)}`, { silent403: true });
      return res?.data?.data ?? res?.data;
    } catch {
      return null;
    }
  },
};

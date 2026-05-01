import { api } from '@/services/api';

function extractArray(resData) {
  const v = resData?.data ?? resData;
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  return [];
}

function mapRecordToRow(r) {
  if (!r) return null;
  const data = r.data || {};
  return { id: r.id, ...data };
}

export const movimentacoesServiceApi = {
  async getAll() {
    const res = await api.get('/api/records?entity=movimentacao_estoque');
    const rows = extractArray(res?.data).map(mapRecordToRow).filter(Boolean);
    return rows;
  },
  async create(payload) {
    const res = await api.post('/api/records', { entity: 'movimentacao_estoque', data: payload });
    return res?.data?.data;
  },
  async update(id, payload) {
    const res = await api.put(`/api/records/${id}`, { data: payload });
    return res?.data?.data;
  },
  async delete(id) {
    const res = await api.delete(`/api/records/${id}`);
    return res?.data;
  },
};


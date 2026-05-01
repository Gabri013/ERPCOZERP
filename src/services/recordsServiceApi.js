import { api } from '@/services/api';

function extractArray(resData) {
  const v = resData?.data ?? resData;
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  return [];
}

function mapRecordToRow(r) {
  const data = r?.data || {};
  return { id: r.id, ...data };
}

export const recordsServiceApi = {
  async list(entity) {
    const res = await api.get(`/api/records?entity=${encodeURIComponent(entity)}`);
    return extractArray(res?.data).map(mapRecordToRow);
  },
  async create(entity, payload) {
    const res = await api.post('/api/records', { entity, data: payload });
    return res?.data?.data;
  },
  async update(id, payload) {
    const res = await api.put(`/api/records/${id}`, { data: payload });
    return res?.data?.data;
  },
  async remove(id) {
    const res = await api.delete(`/api/records/${id}`);
    return res?.data;
  },
};


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
    try {
      const res = await api.get(`/api/records?entity=${encodeURIComponent(entity)}`, { silent403: true });
      return extractArray(res?.data).map(mapRecordToRow);
    } catch (e) {
      if (e?.status === 403) return [];
      throw e;
    }
  },
  async create(entity, payload) {
    try {
      const res = await api.post('/api/records', { entity, data: payload });
      return res?.data?.data;
    } catch (e) {
      if (e?.status === 403) return undefined;
      throw e;
    }
  },
  async update(id, payload) {
    try {
      const res = await api.put(`/api/records/${id}`, { data: payload });
      return res?.data?.data;
    } catch (e) {
      if (e?.status === 403) return undefined;
      throw e;
    }
  },
  async remove(id) {
    try {
      const res = await api.delete(`/api/records/${id}`);
      return res?.data;
    } catch (e) {
      if (e?.status === 403) return undefined;
      throw e;
    }
  },
};


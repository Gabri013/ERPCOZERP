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

function mapSavedPayload(body) {
  if (!body || typeof body !== 'object') return null;
  const d = body.data && typeof body.data === 'object' ? body.data : {};
  return { id: body.id, ...d };
}

export const recordsServiceApi = {
  /**
   * @param {string} entity
   * @param {{ search?: string; tipo?: string }} [params] — filtros client-side (lista core limita a 200 linhas)
   */
  async list(entity, params = {}) {
    try {
      const res = await api.get(`/api/records?entity=${encodeURIComponent(entity)}`, { silent403: true });
      let rows = extractArray(res?.data).map(mapRecordToRow);
      const search = typeof params.search === 'string' ? params.search.trim().toLowerCase() : '';
      if (search) {
        rows = rows.filter(
          (p) =>
            String(p.codigo || '')
              .toLowerCase()
              .includes(search) ||
            String(p.descricao || '')
              .toLowerCase()
              .includes(search),
        );
      }
      const tipo = typeof params.tipo === 'string' ? params.tipo.trim() : '';
      if (tipo) {
        rows = rows.filter((p) => String(p.tipo || '') === tipo);
      }
      return rows;
    } catch (e) {
      if (e?.status === 403) return [];
      throw e;
    }
  },

  /** Registro único; para `produto`, inclui bom_status/model3d_path quando existirem no backend. */
  async get(id) {
    const res = await api.get(`/api/records/${encodeURIComponent(id)}`);
    const d = res?.data?.data;
    if (!d) return null;
    const inner = d.data && typeof d.data === 'object' ? d.data : {};
    const flat = { id: d.id, ...inner };
    if (d.bom_status != null) flat.bom_status = d.bom_status;
    if (d.model3d_path != null) flat.model3d_path = d.model3d_path;
    return flat;
  },
  async create(entity, payload) {
    try {
      const res = await api.post('/api/records', { entity, data: payload });
      return mapSavedPayload(res?.data?.data);
    } catch (e) {
      if (e?.status === 403) return undefined;
      throw e;
    }
  },
  async update(id, payload) {
    try {
      const res = await api.put(`/api/records/${id}`, { data: payload });
      return mapSavedPayload(res?.data?.data);
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


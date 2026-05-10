import { api } from '@/services/api';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/crm-processes';

export async function listCrmProcesses(filters = {}) {
  const res = await api.get(`${BASE}${qs(filters)}`);
  return res.data ?? [];
}

export async function getCrmProcess(id) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
}

export async function createCrmProcess(data) {
  const res = await api.post(BASE, data);
  return res.data;
}

export async function updateCrmProcess(id, data) {
  const res = await api.put(`${BASE}/${id}`, data);
  return res.data;
}

export async function changeCrmProcessStage(id, stage) {
  const res = await api.patch(`${BASE}/${id}/stage`, { stage });
  return res.data;
}

export async function deleteCrmProcess(id) {
  await api.delete(`${BASE}/${id}`);
}

export async function addCrmNote(id, data) {
  const res = await api.post(`${BASE}/${id}/notes`, data);
  return res.data;
}

export async function addCrmAttachment(id, data) {
  const res = await api.post(`${BASE}/${id}/attachments`, data);
  return res.data;
}

export async function getCrmDashboard() {
  const res = await api.get(`${BASE}/dashboard`);
  return res.data;
}

import { api } from '@/services/api.js';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/projects';

export async function listProjects(filters = {}) {
  const res = await api.get(`${BASE}${qs(filters)}`);
  return res.data ?? [];
}

export async function getProject(id) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
}

export async function createProject(data) {
  const res = await api.post(BASE, data);
  return res.data;
}

export async function updateProject(id, data) {
  const res = await api.put(`${BASE}/${id}`, data);
  return res.data;
}

export async function deleteProject(id) {
  await api.delete(`${BASE}/${id}`);
}

export async function addProjectTask(id, data) {
  const res = await api.post(`${BASE}/${id}/tasks`, data);
  return res.data;
}

export async function updateProjectTask(id, taskId, data) {
  const res = await api.put(`${BASE}/${id}/tasks/${taskId}`, data);
  return res.data;
}

export async function deleteProjectTask(id, taskId) {
  await api.delete(`${BASE}/${id}/tasks/${taskId}`);
}

export async function addTimeEntry(id, data) {
  const res = await api.post(`${BASE}/${id}/time-entries`, data);
  return res.data;
}

export async function addCostEntry(id, data) {
  const res = await api.post(`${BASE}/${id}/cost-entries`, data);
  return res.data;
}

export async function addProjectNote(id, data) {
  const res = await api.post(`${BASE}/${id}/notes`, data);
  return res.data;
}

export async function getProjectStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}

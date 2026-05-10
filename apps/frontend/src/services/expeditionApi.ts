import { api } from '@/services/api';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/expedition';

// Orders
export async function listExpeditionOrders(filters = {}) {
  const res = await api.get(`${BASE}${qs(filters)}`);
  return res.data ?? [];
}
export async function getExpeditionOrder(id) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
}
export async function createExpeditionOrder(data) {
  const res = await api.post(BASE, data);
  return res.data;
}
export async function updateExpeditionOrder(id, data) {
  const res = await api.put(`${BASE}/${id}`, data);
  return res.data;
}
export async function deleteExpeditionOrder(id) {
  await api.delete(`${BASE}/${id}`);
}

// Loads
export async function addLoad(orderId, data) {
  const res = await api.post(`${BASE}/${orderId}/loads`, data);
  return res.data;
}
export async function updateLoad(orderId, loadId, data) {
  const res = await api.put(`${BASE}/${orderId}/loads/${loadId}`, data);
  return res.data;
}
export async function deleteLoad(orderId, loadId) {
  await api.delete(`${BASE}/${orderId}/loads/${loadId}`);
}

// Manifests
export async function listManifests(filters = {}) {
  const res = await api.get(`${BASE}/manifests/list${qs(filters)}`);
  return res.data ?? [];
}
export async function createManifest(orderId, data) {
  const res = await api.post(`${BASE}/${orderId}/manifests`, data);
  return res.data;
}
export async function updateManifest(manifestId, data) {
  const res = await api.put(`${BASE}/manifests/${manifestId}`, data);
  return res.data;
}

// Stats
export async function getExpeditionStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}

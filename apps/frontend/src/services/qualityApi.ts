import { api } from '@/services/api';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/quality';

// Inspection Plans
export async function listInspectionPlans(filters = {}) {
  const res = await api.get(`${BASE}/inspection-plans${qs(filters)}`);
  return res.data ?? [];
}
export async function createInspectionPlan(data) {
  const res = await api.post(`${BASE}/inspection-plans`, data);
  return res.data;
}
export async function updateInspectionPlan(id, data) {
  const res = await api.put(`${BASE}/inspection-plans/${id}`, data);
  return res.data;
}
export async function deleteInspectionPlan(id) {
  await api.delete(`${BASE}/inspection-plans/${id}`);
}

// Inspections
export async function listInspections(filters = {}) {
  const res = await api.get(`${BASE}/inspections${qs(filters)}`);
  return res.data ?? [];
}
export async function createInspection(data) {
  const res = await api.post(`${BASE}/inspections`, data);
  return res.data;
}
export async function updateInspection(id, data) {
  const res = await api.put(`${BASE}/inspections/${id}`, data);
  return res.data;
}
export async function deleteInspection(id) {
  await api.delete(`${BASE}/inspections/${id}`);
}

// Non-Conformities
export async function listNonConformities(filters = {}) {
  const res = await api.get(`${BASE}/nc${qs(filters)}`);
  return res.data ?? [];
}
export async function createNonConformity(data) {
  const res = await api.post(`${BASE}/nc`, data);
  return res.data;
}
export async function updateNonConformity(id, data) {
  const res = await api.put(`${BASE}/nc/${id}`, data);
  return res.data;
}
export async function deleteNonConformity(id) {
  await api.delete(`${BASE}/nc/${id}`);
}

// Instruments
export async function listInstruments(filters = {}) {
  const res = await api.get(`${BASE}/instruments${qs(filters)}`);
  return res.data ?? [];
}
export async function createInstrument(data) {
  const res = await api.post(`${BASE}/instruments`, data);
  return res.data;
}
export async function updateInstrument(id, data) {
  const res = await api.put(`${BASE}/instruments/${id}`, data);
  return res.data;
}
export async function deleteInstrument(id) {
  await api.delete(`${BASE}/instruments/${id}`);
}

// Documents
export async function listDocuments(filters = {}) {
  const res = await api.get(`${BASE}/documents${qs(filters)}`);
  return res.data ?? [];
}
export async function createDocument(data) {
  const res = await api.post(`${BASE}/documents`, data);
  return res.data;
}
export async function updateDocument(id, data) {
  const res = await api.put(`${BASE}/documents/${id}`, data);
  return res.data;
}
export async function deleteDocument(id) {
  await api.delete(`${BASE}/documents/${id}`);
}

// Databooks
export async function listDatabooks(filters = {}) {
  const res = await api.get(`${BASE}/databooks${qs(filters)}`);
  return res.data ?? [];
}
export async function createDatabook(data) {
  const res = await api.post(`${BASE}/databooks`, data);
  return res.data;
}
export async function updateDatabook(id, data) {
  const res = await api.put(`${BASE}/databooks/${id}`, data);
  return res.data;
}
export async function deleteDatabook(id) {
  await api.delete(`${BASE}/databooks/${id}`);
}
export async function addDatabookDocument(id, data) {
  const res = await api.post(`${BASE}/databooks/${id}/documents`, data);
  return res.data;
}
export async function updateDatabookDocument(id, docId, data) {
  const res = await api.put(`${BASE}/databooks/${id}/documents/${docId}`, data);
  return res.data;
}

// Stats
export async function getQualityStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}

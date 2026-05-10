import { api } from '@/services/api';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/accounting';

// Account Plan
export async function listAccountPlan(filters = {}) {
  const res = await api.get(`${BASE}/account-plan${qs(filters)}`);
  return res.data ?? [];
}
export async function createAccountPlan(data) {
  const res = await api.post(`${BASE}/account-plan`, data);
  return res.data;
}
export async function updateAccountPlan(id, data) {
  const res = await api.put(`${BASE}/account-plan/${id}`, data);
  return res.data;
}
export async function deleteAccountPlan(id) {
  await api.delete(`${BASE}/account-plan/${id}`);
}

// Entries
export async function listEntries(filters = {}) {
  const res = await api.get(`${BASE}/entries${qs(filters)}`);
  return res.data ?? [];
}
export async function createEntry(data) {
  const res = await api.post(`${BASE}/entries`, data);
  return res.data;
}
export async function deleteEntry(id) {
  await api.delete(`${BASE}/entries/${id}`);
}

// DRE
export async function getDRE(year) {
  const res = await api.get(`${BASE}/dre${year ? `?year=${year}` : ''}`);
  return res.data;
}

// Standard Costs
export async function listStandardCosts() {
  const res = await api.get(`${BASE}/standard-costs`);
  return res.data ?? [];
}
export async function upsertStandardCost(productId, data) {
  const res = await api.put(`${BASE}/standard-costs/${productId}`, data);
  return res.data;
}

// Stats
export async function getAccountingStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}

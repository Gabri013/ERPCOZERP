import { api } from '@/services/api.js';

function qs(p) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const BASE = '/api/knowledge';

// Categories
export async function listCategories() {
  const res = await api.get(`${BASE}/categories`);
  return res.data ?? [];
}

export async function createCategory(data) {
  const res = await api.post(`${BASE}/categories`, data);
  return res.data;
}

export async function updateCategory(id, data) {
  const res = await api.put(`${BASE}/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id) {
  await api.delete(`${BASE}/categories/${id}`);
}

// Articles
export async function listArticles(filters = {}) {
  const res = await api.get(`${BASE}/articles${qs(filters)}`);
  return res.data ?? [];
}

export async function getArticle(idOrSlug) {
  const res = await api.get(`${BASE}/articles/${idOrSlug}`);
  return res.data;
}

export async function createArticle(data) {
  const res = await api.post(`${BASE}/articles`, data);
  return res.data;
}

export async function updateArticle(id, data) {
  const res = await api.put(`${BASE}/articles/${id}`, data);
  return res.data;
}

export async function deleteArticle(id) {
  await api.delete(`${BASE}/articles/${id}`);
}

export async function likeArticle(id) {
  const res = await api.post(`${BASE}/articles/${id}/like`, {});
  return res.data;
}

export async function addRevision(id, data) {
  const res = await api.post(`${BASE}/articles/${id}/revisions`, data);
  return res.data;
}

export async function addAttachment(id, data) {
  const res = await api.post(`${BASE}/articles/${id}/attachments`, data);
  return res.data;
}

export async function getKnowledgeStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}

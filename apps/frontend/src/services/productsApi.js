import { api } from '@/services/api';

function unwrap(res) {
  return res?.data?.data ?? res?.data;
}

export const productsApi = {
  async importBom(recordId, { csvText, dryRun = false }) {
    const res = await api.post(`/api/products/${recordId}/bom/import`, { csvText, dryRun });
    return unwrap(res);
  },

  async putBomStatus(recordId, status) {
    const res = await api.put(`/api/products/${recordId}/bom-status`, { status });
    return unwrap(res);
  },

  async listBomLines(recordId) {
    const res = await api.get(`/api/products/${recordId}/bom/lines`);
    return unwrap(res);
  },

  async listFiles(recordId) {
    const res = await api.get(`/api/products/${recordId}/files`);
    return unwrap(res);
  },

  async uploadFiles(recordId, fileList) {
    const form = new FormData();
    for (let i = 0; i < fileList.length; i += 1) {
      form.append('files', fileList[i]);
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    const { resolveApiUrl } = await import('@/config/appConfig');
    const r = await fetch(resolveApiUrl(`/api/products/${recordId}/files`), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j.data;
  },

  async uploadModel3d(recordId, file) {
    const form = new FormData();
    form.append('file', file);
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    const { resolveApiUrl } = await import('@/config/appConfig');
    const r = await fetch(resolveApiUrl(`/api/products/${recordId}/model3d`), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j.data;
  },

  model3dUrl(recordId) {
    return `/api/products/${recordId}/model3d`;
  },

  fileRawUrl(fileId) {
    return `/api/products/files/${fileId}/raw`;
  },

  async pendingBom() {
    const res = await api.get('/api/products/pending-bom');
    return unwrap(res);
  },

  async filesForOp(opRecordId) {
    const res = await api.get(`/api/products/by-op/${opRecordId}/files`);
    return unwrap(res);
  },

  async openFileInNewTab(fileId) {
    const { resolveApiUrl } = await import('@/config/appConfig');
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
    const r = await fetch(resolveApiUrl(`/api/products/files/${fileId}/raw`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!r.ok) throw new Error('Falha ao abrir arquivo');
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    window.open(u, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  },
};

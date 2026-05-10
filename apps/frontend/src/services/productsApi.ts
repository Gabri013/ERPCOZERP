import { api } from '@/services/api';
import { resolveApiUrl } from '@/config/appConfig';

function unwrap(res) {
  return res?.data?.data ?? res?.data;
}

function authHeaders() {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const productsApi = {
  // ─── BOM import ────────────────────────────────────────────────────────────

  /** importBom — envia texto CSV/TSV para o backend e retorna prévia ou resultado. */
  async importBom(recordId, { csvText, dryRun = false }) {
    const res = await api.post(`/api/products/${recordId}/bom/import`, { csvText, dryRun });
    return unwrap(res);
  },

  // ─── BOM CRUD ──────────────────────────────────────────────────────────────

  /** getBom — retorna { lines, bomStatus, lineCount } */
  async getBom(recordId) {
    const res = await api.get(`/api/products/${recordId}/bom`);
    return unwrap(res);
  },

  /** listBomLines — retorna array de linhas (legado, mantido para compatibilidade) */
  async listBomLines(recordId) {
    const res = await api.get(`/api/products/${recordId}/bom/lines`);
    return unwrap(res);
  },

  /**
   * replaceBom — substitui toda a BOM por novas linhas.
   * @param {string} recordId
   * @param {Array<{componentCode, description?, materialSpec?, process?, xMm?, yMm?, quantity, totalQty?}>} lines
   */
  async replaceBom(recordId, lines) {
    const res = await api.put(`/api/products/${recordId}/bom`, { lines });
    return unwrap(res);
  },

  /** clearBom — apaga todas as linhas da BOM e seta status EMPTY */
  async clearBom(recordId) {
    const res = await api.delete(`/api/products/${recordId}/bom`);
    return unwrap(res);
  },

  // ─── BOM status ────────────────────────────────────────────────────────────

  async putBomStatus(recordId, status) {
    const res = await api.put(`/api/products/${recordId}/bom-status`, { status });
    return unwrap(res);
  },

  // ─── Files ─────────────────────────────────────────────────────────────────

  async listFiles(recordId) {
    const res = await api.get(`/api/products/${recordId}/files`);
    return unwrap(res);
  },

  async uploadFiles(recordId, fileList) {
    const form = new FormData();
    for (let i = 0; i < fileList.length; i += 1) {
      form.append('files', fileList[i]);
    }
    const r = await fetch(resolveApiUrl(`/api/products/${recordId}/files`), {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j.data;
  },

  fileRawUrl(fileId) {
    return `/api/products/files/${fileId}/raw`;
  },

  async openFileInNewTab(fileId) {
    const r = await fetch(resolveApiUrl(`/api/products/files/${fileId}/raw`), {
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error('Falha ao abrir arquivo');
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    window.open(u, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  },

  // ─── 3D model ──────────────────────────────────────────────────────────────

  async uploadModel3d(recordId, file) {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(resolveApiUrl(`/api/products/${recordId}/model3d`), {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j.data;
  },

  model3dUrl(recordId) {
    return `/api/products/${recordId}/model3d`;
  },

  // ─── Pending BOM ───────────────────────────────────────────────────────────

  async pendingBom() {
    const res = await api.get('/api/products/pending-bom');
    return unwrap(res);
  },

  // ─── OP files ──────────────────────────────────────────────────────────────

  async filesForOp(opRecordId) {
    const res = await api.get(`/api/products/by-op/${opRecordId}/files`);
    return unwrap(res);
  },

  /** bomForProductCode — carrega BOM pelo código do produto (ex: CABPD-PC01) */
  async bomForProductCode(code) {
    if (!code) return { lines: [], bomStatus: 'EMPTY', lineCount: 0 };
    const res = await api.get(`/api/products/by-code/${encodeURIComponent(code)}/bom`);
    return unwrap(res);
  },
};

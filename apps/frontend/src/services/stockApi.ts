import { api } from '@/services/api.js';

export type StockProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  productType: string | null;
  group: string | null;
  costPrice: number | null;
  salePrice: number | null;
  minStock: number;
  reorderPoint: number | null;
  status: string;
  photoUrl: string | null;
  techSheet: string | null;
  entityRecordId: string | null;
  totalQty: number;
  locations: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    quantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
};

/** UI legado / telas em PT-BR */
export type StockProductUi = {
  id: string;
  codigo: string;
  descricao: string;
  nome: string;
  grupo: string;
  tipo: string;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  ponto_pedido: number | string;
  status: string;
  foto_url: string;
  bom_json: string;
  roteiro_json: string;
  ficha_tecnica: string;
  locations?: StockProduct['locations'];
  entityRecordId: string | null;
};

export function qs(params: Record<string, string | number | undefined> | undefined) {
  if (!params || typeof params !== 'object') return '';
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

function unwrapResponse<T>(res: { data?: unknown }): T {
  const d = res?.data as Record<string, unknown> | undefined;
  if (d && typeof d === 'object' && 'success' in d && 'data' in d && d.data !== undefined) {
    return d.data as T;
  }
  if (d && typeof d === 'object' && 'data' in d && d.data !== undefined) {
    return d.data as T;
  }
  return (d ?? res?.data) as T;
}

function unwrapBody<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  if (body && typeof body === 'object' && 'data' in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function mapStockProductToUi(p: StockProduct | null): StockProductUi | null {
  if (!p) return null;
  let extra: Record<string, string> = {};
  if (p.techSheet && typeof p.techSheet === 'string') {
    try {
      const j = JSON.parse(p.techSheet) as Record<string, string>;
      if (j && typeof j === 'object') extra = j;
    } catch {
      extra = { ficha_tecnica: p.techSheet };
    }
  }
  return {
    id: p.id,
    codigo: p.code,
    descricao: p.name,
    nome: p.name,
    grupo: p.group ?? '',
    tipo: p.productType ?? 'Produto',
    unidade: p.unit ?? 'UN',
    preco_custo: p.costPrice ?? 0,
    preco_venda: p.salePrice ?? 0,
    estoque_atual: p.totalQty ?? 0,
    estoque_minimo: p.minStock ?? 0,
    ponto_pedido: p.reorderPoint ?? '',
    status: p.status ?? 'Ativo',
    foto_url: p.photoUrl ?? '',
    bom_json: extra.bom_json ?? '',
    roteiro_json: extra.roteiro_json ?? '',
    ficha_tecnica: extra.ficha_tecnica ?? '',
    locations: p.locations,
    entityRecordId: p.entityRecordId,
  };
}

export function packTechSheet(form: Record<string, unknown>) {
  const bom = String(form.bom_json || '').trim();
  const rot = String(form.roteiro_json || '').trim();
  const ficha = String(form.ficha_tecnica || '').trim();
  if (!bom && !rot && !ficha) return (form.techSheetRaw as string | null | undefined) || null;
  try {
    return JSON.stringify({
      bom_json: bom,
      roteiro_json: rot,
      ficha_tecnica: ficha,
    });
  } catch {
    return null;
  }
}

export function uiFormToStockPayload(form: Record<string, unknown>) {
  return {
    code: form.codigo ? String(form.codigo).trim() || undefined : undefined,
    name: String(form.descricao || form.nome || '').trim(),
    description: String(form.descricao || '').trim() || null,
    unit: String(form.unidade || 'UN'),
    productType: form.tipo ? String(form.tipo) : null,
    group: form.grupo ? String(form.grupo) : null,
    costPrice: form.preco_custo != null ? Number(form.preco_custo) : null,
    salePrice: form.preco_venda != null ? Number(form.preco_venda) : null,
    minStock: form.estoque_minimo != null ? Number(form.estoque_minimo) : 0,
    reorderPoint:
      form.ponto_pedido === '' || form.ponto_pedido == null ? null : Number(form.ponto_pedido),
    status: String(form.status || 'Ativo'),
    photoUrl: form.foto_url ? String(form.foto_url).trim() : null,
    techSheet: packTechSheet(form),
  };
}

export async function listStockProducts(params?: { search?: string; status?: string; take?: number }) {
  const res = await api.get(`/api/stock/products${qs(params as Record<string, string | number | undefined>)}`);
  return unwrapResponse<StockProduct[]>(res);
}

export async function getStockProduct(id: string) {
  const res = await api.get(`/api/stock/products/${encodeURIComponent(id)}`);
  return unwrapResponse<StockProduct>(res);
}

export async function createStockProduct(payload: Record<string, unknown>) {
  const res = await api.post('/api/stock/products', payload);
  return unwrapResponse<StockProduct>(res);
}

export async function updateStockProduct(id: string, payload: Record<string, unknown>) {
  const res = await api.patch(`/api/stock/products/${encodeURIComponent(id)}`, payload);
  return unwrapResponse<StockProduct>(res);
}

export async function deleteStockProduct(id: string) {
  const res = await api.delete(`/api/stock/products/${encodeURIComponent(id)}`);
  return unwrapResponse<StockProduct>(res);
}

export async function listStockMovements(params?: { productId?: string; take?: number }) {
  const res = await api.get(`/api/stock/movements${qs(params as Record<string, string | number | undefined>)}`);
  return unwrapResponse<unknown[]>(res);
}

export async function createStockMovement(payload: Record<string, unknown>) {
  const res = await api.post('/api/stock/movements', payload);
  return unwrapResponse<unknown>(res);
}

export async function listLocations() {
  const res = await api.get('/api/stock/locations');
  return unwrapResponse<
    Array<{
      id: string;
      code: string;
      name: string;
      warehouse: string | null;
      aisle: string | null;
      rack: string | null;
      bin: string | null;
      active: boolean;
    }>
  >(res);
}

export async function createLocation(payload: Record<string, unknown>) {
  const res = await api.post('/api/stock/locations', payload);
  return unwrapResponse<unknown>(res);
}

export async function updateLocation(id: string, payload: Record<string, unknown>) {
  const res = await api.patch(`/api/stock/locations/${encodeURIComponent(id)}`, payload);
  return unwrapResponse<unknown>(res);
}

export async function deleteLocation(id: string) {
  await api.delete(`/api/stock/locations/${encodeURIComponent(id)}`);
}

export async function listProductLocations(productId: string) {
  const res = await api.get(`/api/stock/product-locations${qs({ productId })}`);
  return unwrapResponse<
    Array<{ productId: string; locationId: string; quantity: number; locationCode: string; locationName: string }>
  >(res);
}

export async function listInventoryCounts() {
  const res = await api.get('/api/stock/inventory-counts');
  return unwrapResponse<unknown[]>(res);
}

export async function getInventoryCount(id: string) {
  const res = await api.get(`/api/stock/inventory-counts/${encodeURIComponent(id)}`);
  return unwrapResponse<unknown>(res);
}

export async function createInventoryCount(payload: Record<string, unknown>) {
  const res = await api.post('/api/stock/inventory-counts', payload);
  return unwrapResponse<unknown>(res);
}

export async function patchInventoryCount(id: string, payload: Record<string, unknown>) {
  const res = await api.patch(`/api/stock/inventory-counts/${encodeURIComponent(id)}`, payload);
  return unwrapResponse<unknown>(res);
}

export async function patchInventoryItem(itemId: string, payload: Record<string, unknown>) {
  const res = await api.patch(`/api/stock/inventory-counts/items/${encodeURIComponent(itemId)}`, payload);
  return unwrapResponse<unknown>(res);
}

export async function approveInventoryCount(id: string) {
  const res = await api.post(`/api/stock/inventory-counts/${encodeURIComponent(id)}/approve`, {});
  return unwrapResponse<unknown>(res);
}

/** Objeto único para páginas JS que esperam nomes em PT-BR nos produtos. */
export const stockApi = {
  async listProducts(params: Record<string, string | number | undefined> = {}) {
    const rows = await listStockProducts({
      search: params.search as string | undefined,
      status: params.status as string | undefined,
      take: params.take as number | undefined,
    });
    return rows.map((r) => mapStockProductToUi(r)!);
  },

  async getProduct(id: string) {
    const p = await getStockProduct(id);
    return mapStockProductToUi(p)!;
  },

  async createProduct(body: Record<string, unknown>) {
    const p = await createStockProduct(body);
    return mapStockProductToUi(p)!;
  },

  async patchProduct(id: string, body: Record<string, unknown>) {
    const p = await updateStockProduct(id, body);
    return mapStockProductToUi(p)!;
  },

  async inactivateProduct(id: string) {
    const p = await deleteStockProduct(id);
    return mapStockProductToUi(p)!;
  },

  listMovements: listStockMovements,
  createMovement: createStockMovement,
  listLocations,
  createLocation,
  patchLocation: updateLocation,
  deleteLocation,
  listProductLocations,
  listInventoryCounts,
  getInventoryCount,
  createInventoryCount,
  patchInventoryCount,
  patchInventoryItem,
  approveInventoryCount,
};

const TIPO_MOV_PT: Record<string, string> = { ENTRADA: 'Entrada', SAIDA: 'Saída', AJUSTE: 'Ajuste' };

export function mapMovementToUiRow(m: {
  id: string;
  type: string;
  quantity: number;
  reference?: string | null;
  notes?: string | null;
  createdAt?: string;
  product?: { name?: string; code?: string };
  location?: { code?: string };
  user?: { fullName?: string | null };
}) {
  const tipo = TIPO_MOV_PT[m.type] || m.type;
  const created = m.createdAt || '';
  return {
    id: m.id,
    numero: (m.id || '').slice(0, 8).toUpperCase(),
    tipo,
    tipoRaw: m.type,
    produto_descricao: m.product?.name || '—',
    produto_codigo: m.product?.code || '',
    quantidade: m.quantity,
    unidade: 'UN',
    custo_unitario: 0,
    custo_total: 0,
    data: created.includes('T') ? created.slice(0, 10) : created.slice(0, 10),
    origem: m.reference || '—',
    responsavel: m.user?.fullName || '—',
    observacoes: m.notes || '',
    local: m.location?.code ? `${m.location.code}` : '—',
  };
}

export function mapInventoryStatusUi(raw: string) {
  const map: Record<string, string> = { RASCUNHO: 'Rascunho', EM_CONTAGEM: 'Em contagem', APROVADO: 'Aprovado' };
  return map[raw] || raw;
}

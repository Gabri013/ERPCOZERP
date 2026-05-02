import { api } from '@/services/api.js';

function unwrap<T>(res: { data?: unknown }): T {
  const d = res?.data as Record<string, unknown> | undefined;
  if (d && 'success' in d && 'data' in d && d.data !== undefined) return d.data as T;
  if (d && 'data' in d && d.data !== undefined) return d.data as T;
  return (d ?? res?.data) as T;
}

function qs(p: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

export type Supplier = {
  id: string;
  code: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
};

export type PurchaseOrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number | null;
  receivedQty: number;
  product: { id: string; code: string; name: string };
};

export type PurchaseOrder = {
  id: string;
  number: string;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
  supplier: Supplier | null;
  items: PurchaseOrderItem[];
};

export function mapPoToUi(row: PurchaseOrder) {
  const totalAmount = (row.items ?? []).reduce((acc, it) => {
    const cost = it.unitCost ?? 0;
    return acc + Number(it.quantity) * cost;
  }, 0);
  return {
    id: row.id,
    numero: row.number,
    fornecedor_nome: row.supplier?.name ?? '—',
    fornecedorId: row.supplier?.id ?? '',
    data_emissao: row.createdAt?.slice(0, 10) ?? '',
    data_entrega_prevista: row.expectedDate?.slice(0, 10) ?? '',
    valor_total: totalAmount,
    status: ROW_STATUS[row.status] ?? row.status,
    statusRaw: row.status,
    itens: (row.items ?? []).map((it) => ({
      id: it.id,
      productId: it.productId,
      produto_descricao: it.product?.name ?? it.productId,
      produto_codigo: it.product?.code ?? '',
      quantidade: Number(it.quantity),
      quantidade_recebida: Number(it.receivedQty ?? 0),
      custo_unitario: Number(it.unitCost ?? 0),
    })),
    observacoes: row.notes ?? '',
    _raw: row,
  };
}

const ROW_STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  PARCIALMENTE_RECEBIDO: 'Parcialmente Recebido',
  RECEBIDO: 'Recebido',
  CANCELADO: 'Cancelado',
};

// ─── Fornecedores ─────────────────────────────────────────────────────────────

export async function listSuppliers() {
  const res = await api.get('/api/purchases/suppliers');
  return unwrap<Supplier[]>(res);
}

export async function createSupplier(data: {
  name: string;
  code?: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const res = await api.post('/api/purchases/suppliers', data);
  return unwrap<Supplier>(res);
}

export async function patchSupplier(id: string, data: Partial<Supplier>) {
  const res = await api.patch(`/api/purchases/suppliers/${id}`, data);
  return unwrap<Supplier>(res);
}

// ─── Ordens de Compra ─────────────────────────────────────────────────────────

export async function listPurchaseOrders(params?: { supplierId?: string; status?: string }) {
  const res = await api.get(`/api/purchases/orders${qs(params ?? {})}`);
  const rows = unwrap<PurchaseOrder[]>(res);
  return rows.map(mapPoToUi);
}

export async function getPurchaseOrder(id: string) {
  const res = await api.get(`/api/purchases/orders/${id}`);
  return mapPoToUi(unwrap<PurchaseOrder>(res));
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitCost?: number | null }>;
}) {
  const res = await api.post('/api/purchases/orders', data);
  return mapPoToUi(unwrap<PurchaseOrder>(res));
}

export async function sendPurchaseOrder(id: string) {
  const res = await api.post(`/api/purchases/orders/${id}/send`, {});
  return mapPoToUi(unwrap<PurchaseOrder>(res));
}

export async function receivePurchaseOrder(
  id: string,
  lines: Array<{ productId: string; quantity: number }>,
) {
  const res = await api.post(`/api/purchases/orders/${id}/receive`, { lines });
  return mapPoToUi(unwrap<PurchaseOrder>(res));
}

export const purchasesApi = {
  listSuppliers,
  createSupplier,
  patchSupplier,
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
};

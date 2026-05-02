import { api } from '@/services/api.js';

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export type SalesCustomer = {
  id: string;
  code: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
};

export type SaleOrderRow = {
  id: string;
  number: string;
  status: string;
  kanbanColumn: string;
  kanbanOrder: number;
  orderDate: string;
  deliveryDate: string | null;
  notes: string | null;
  totalAmount: unknown;
  customer: SalesCustomer | null;
  items: Array<{
    id: string;
    quantity: unknown;
    unitPrice: unknown;
    lineTotal: unknown;
    product: { id: string; code: string; name: string };
  }>;
  quote?: { id: string; number: string } | null;
};

export async function listSalesCustomers() {
  const res = await api.get('/api/sales/customers');
  return unwrap<SalesCustomer[]>(res.data);
}

export async function listSaleOrders(params?: { status?: string; customerId?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.customerId) qs.set('customerId', params.customerId);
  const q = qs.toString();
  const res = await api.get(`/api/sales/sale-orders${q ? `?${q}` : ''}`);
  return unwrap<SaleOrderRow[]>(res.data);
}

export async function getSaleOrder(id: string) {
  const res = await api.get(`/api/sales/sale-orders/${id}`);
  return unwrap<SaleOrderRow>(res.data);
}

export async function patchSaleOrderKanban(id: string, kanbanColumn: string, kanbanOrder?: number) {
  const res = await api.patch(`/api/sales/sale-orders/${id}/kanban`, { kanbanColumn, kanbanOrder });
  return unwrap<SaleOrderRow>(res.data);
}

export async function approveSaleOrder(id: string) {
  const res = await api.post(`/api/sales/sale-orders/${id}/approve`, {});
  return unwrap<SaleOrderRow>(res.data);
}

export async function generateWorkOrderFromSale(id: string) {
  const res = await api.post(`/api/sales/sale-orders/${id}/generate-work-order`, {});
  return unwrap<unknown>(res.data);
}

export type QuoteRow = {
  id: string;
  number: string;
  status: string;
  customer: SalesCustomer;
  items: Array<{
    id: string;
    quantity: unknown;
    unitPrice: unknown;
    product: { id: string; code: string; name: string };
  }>;
  totalAmount: unknown;
};

export async function listQuotes() {
  const res = await api.get('/api/sales/quotes');
  return unwrap<QuoteRow[]>(res.data);
}

export async function convertQuote(id: string) {
  const res = await api.post(`/api/sales/quotes/${id}/convert`, {});
  return unwrap<SaleOrderRow>(res.data);
}

export type PriceTableRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  active: boolean;
  items: Array<{
    id: string;
    price: unknown;
    minQty: unknown | null;
    product: { id: string; code: string; name: string };
  }>;
};

export async function listPriceTables() {
  const res = await api.get('/api/sales/price-tables');
  return unwrap<PriceTableRow[]>(res.data);
}

export async function salesReportSummary() {
  const res = await api.get('/api/sales/reports/summary');
  return unwrap<{
    totalRevenue: number;
    monthly: Array<{ month: string; value: number }>;
    byStatus: Record<string, number>;
    orderCount: number;
  }>(res.data);
}

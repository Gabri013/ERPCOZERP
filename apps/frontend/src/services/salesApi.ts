import { api } from '@/services/api';

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
  createdAt?: string;
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

export async function listSaleOrders(params?: { status?: string; customerId?: string; take?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.customerId) qs.set('customerId', params.customerId);
  if (params?.take != null) qs.set('take', String(params.take));
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

export async function patchSaleOrder(id: string, data: Record<string, unknown>) {
  const res = await api.patch(`/api/sales/sale-orders/${id}`, data);
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
  familyId: string;
  versionNumber: number;
  lockedAt?: string | null;
  technicalReview?: string;
  status: string;
  customer: SalesCustomer;
  opportunity?: { id: string; number: string; title: string } | null;
  saleOrder?: { id: string; number: string } | null;
  items: Array<{
    id: string;
    quantity: unknown;
    unitPrice: unknown;
    product: { id: string; code: string; name: string };
  }>;
  totalAmount: unknown;
};

export type QuoteDetail = QuoteRow & {
  validUntil?: string | null;
  notes?: string | null;
  activities?: SalesActivityRow[];
  saleOrder?: { id: string; number: string; status?: string } | null;
};

export type SalesActivityRow = {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  metadata?: unknown;
  user?: { fullName: string | null; email: string | null } | null;
};

export type SalesOpportunityRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  profileAbc?: string | null;
  projectType?: string | null;
  potential?: string | null;
  scopeNotes?: string | null;
  deliveryNotes?: string | null;
  lostReason?: string | null;
  customer: SalesCustomer;
  owner?: { id: string; fullName: string | null; email: string | null } | null;
  quotes: Array<{ id: string; number: string; status: string; versionNumber: number; totalAmount: unknown }>;
};

export async function listQuotes() {
  const res = await api.get('/api/sales/quotes');
  return unwrap<QuoteRow[]>(res.data);
}

export async function getQuote(id: string) {
  const res = await api.get(`/api/sales/quotes/${id}`);
  return unwrap<QuoteDetail>(res.data);
}

export async function patchQuote(
  id: string,
  body: Partial<{
    status: string;
    validUntil: string | null;
    notes: string | null;
    technicalReview: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discountPct?: number | null }>;
  }>,
) {
  const res = await api.patch(`/api/sales/quotes/${id}`, body);
  return unwrap<QuoteDetail>(res.data);
}

export async function convertQuote(id: string) {
  const res = await api.post(`/api/sales/quotes/${id}/convert`, {});
  return unwrap<SaleOrderRow>(res.data);
}

export async function createQuoteRevision(id: string) {
  const res = await api.post(`/api/sales/quotes/${id}/revision`, {});
  return unwrap<QuoteDetail>(res.data);
}

export async function listQuoteActivities(id: string) {
  const res = await api.get(`/api/sales/quotes/${id}/activities`);
  return unwrap<SalesActivityRow[]>(res.data);
}

export async function listOpportunities() {
  const res = await api.get('/api/sales/opportunities');
  return unwrap<SalesOpportunityRow[]>(res.data);
}

export async function getOpportunity(id: string) {
  const res = await api.get(`/api/sales/opportunities/${id}`);
  return unwrap<SalesOpportunityRow & { activities?: SalesActivityRow[] }>(res.data);
}

export async function createOpportunity(body: {
  customerId: string;
  title: string;
  ownerUserId?: string | null;
  status?: string;
  profileAbc?: string | null;
  projectType?: string | null;
  potential?: string | null;
  scopeNotes?: string | null;
  deliveryNotes?: string | null;
}) {
  const res = await api.post('/api/sales/opportunities', body);
  return unwrap<SalesOpportunityRow>(res.data);
}

export async function patchOpportunity(
  id: string,
  body: Partial<{
    title: string;
    status: string;
    ownerUserId: string | null;
    profileAbc: string | null;
    projectType: string | null;
    potential: string | null;
    scopeNotes: string | null;
    deliveryNotes: string | null;
    lostReason: string | null;
  }>,
) {
  const res = await api.patch(`/api/sales/opportunities/${id}`, body);
  return unwrap<SalesOpportunityRow>(res.data);
}

export async function addSalesActivity(body: {
  opportunityId?: string | null;
  quoteId?: string | null;
  type: string;
  body: string;
  metadata?: Record<string, unknown> | null;
}) {
  const res = await api.post('/api/sales/activities', body);
  return unwrap<SalesActivityRow>(res.data);
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

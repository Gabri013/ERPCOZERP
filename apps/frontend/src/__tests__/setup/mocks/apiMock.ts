import { vi } from 'vitest';

export const mockLoginResponse = {
  token: 'mock-jwt-token-xxx',
  user: {
    id: 'user-1',
    email: 'gerente@cozinha.com',
    full_name: 'Gerente Geral',
    sector: null,
    roles: ['gerente'],
  },
};

export const mockDashboardLayout = {
  widgets: ['kpi_vendas', 'kpi_producao', 'kpi_financeiro', 'alertas_estoque'],
};

export const mockProducts = [
  { id: 'prod-1', code: 'PA-EIX-032', name: 'Eixo Transmissão 32mm', unit: 'UN', salePrice: 380, status: 'Ativo' },
  { id: 'prod-2', code: 'PA-TAN-500', name: 'Tanque Inox 500L', unit: 'UN', salePrice: 4900, status: 'Ativo' },
];

export const mockSaleOrders = [
  { id: 'so-1', number: 'PV-D001', status: 'APPROVED', totalAmount: 10850 },
  { id: 'so-2', number: 'PV-D006', status: 'APPROVED', totalAmount: 8800 },
];

export function setupApiMocks() {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url.includes('/api/auth/login')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLoginResponse) });
    }
    if (url.includes('/api/dashboard/layout')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ widgets: mockDashboardLayout.widgets }) });
    }
    if (url.includes('/api/stock/products')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockProducts }) });
    }
    if (url.includes('/api/sales/sale-orders')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockSaleOrders }) });
    }
    if (url.includes('/api/permissions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, permissions: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
  }));
}

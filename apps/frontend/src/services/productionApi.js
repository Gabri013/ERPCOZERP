import { api } from '@/services/api';

function unwrap<T>(res: { data?: unknown }): T {
  const d = res?.data as Record<string, unknown> | undefined;
  if (d && 'success' in d && 'data' in d && d.data !== undefined) return d.data as T;
  if (d && 'data' in d && d.data !== undefined) return d.data as T;
  return (d ?? res?.data) as T;
}

export async function listProductionAppointments() {
  const res = await api.get('/api/production/appointments');
  return unwrap<any[]>(res.data);
}

export async function createProductionAppointment(data: {
  workOrderId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  quantityProduced: number;
  scrapQuantity?: number;
  notes?: string;
  status: string;
}) {
  const res = await api.post('/api/production/appointments', data);
  return unwrap<any>(res.data);
}

export async function updateProductionAppointment(id: string, data: Partial<{
  endTime: string;
  quantityProduced: number;
  scrapQuantity: number;
  notes: string;
  status: string;
}>) {
  const res = await api.patch(`/api/production/appointments/${id}`, data);
  return unwrap<any>(res.data);
}
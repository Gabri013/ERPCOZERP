import { api } from '@/services/api';

export async function getQualityGateReport() {
  const res = await api.get('/api/quality-gate/report');
  return res?.data;
}
